import {
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  OverwriteStrategy,
  ProjectConfiguration,
  runTasksInSerial,
  Tree,
} from '@nx/devkit';
import { LibGeneratorSchema } from './schema';
import { determineProjectNameAndRootOptions } from '../../utils/project-name-and-root-utils';
import { ProjectNameAndRootOptions } from '@nx/devkit/src/generators/project-name-and-root-utils';
import { join } from 'path';
import { updateToml } from '../../utils/toml';
import { sync } from '../../utils/uv';
import { normalizeLinterOption } from '../../utils/generator-prompts';
import initGenerator from '../init/init';

function createFiles(
  tree: Tree,
  options: ProjectNameAndRootOptions,
  publishable: boolean,
) {
  generateFiles(
    tree,
    join(__dirname, 'files/pyproject'),
    options.projectRoot,
    {
      name: options.projectName,
      description: 'My awesome Python library',
      classifiers: !publishable ? JSON.stringify(PRIVATE_CLASSIFIER) : '',
    },
    {
      overwriteStrategy: OverwriteStrategy.ThrowIfExisting,
    },
  );
  updateToml(tree, 'pyproject.toml', (toml) => {
    if (!toml.project.dependencies) toml.dependencies = [];
    if (!toml.project.dependencies.includes(options.projectName)) {
      toml.project.dependencies.push(options.projectName);
    }
    if (!toml.tool) toml.tool = {};
    const tool = toml.tool;
    if (!tool.uv) tool.uv = {};
    const uv = tool.uv;
    if (!uv.workspace) uv.workspace = {};
    if (!uv.workspace.members) uv.workspace.members = [];
    if (!uv.workspace.members.includes(options.projectRoot)) {
      uv.workspace.members.push(options.projectRoot);
    }
    if (!uv.sources) uv.sources = {};
    if (!uv.sources[options.projectName]) uv.sources[options.projectName] = {};
    uv.sources[options.projectName].workspace = true;
    return toml;
  });
}

export async function libGenerator(tree: Tree, options: LibGeneratorSchema) {
  await initGenerator(tree, { skipFormat: true });

  const result = await determineProjectNameAndRootOptions(tree, {
    name: options.name,
    projectType: 'library',
    directory: options.directory,
    importPath: options.importPath,
  });
  const linter = await normalizeLinterOption(tree, options.linter);

  createFiles(tree, result, !!options.publishable);

  // TODO handle dry run properly (https://github.com/nrwl/nx/discussions/33731)
  const dryRun =
    process.argv.includes('--dryRun') || process.argv.includes('-d');
  const tasks = [];
  if (!dryRun) tasks.push(() => sync(tree));

  // TODO add linter dependency & target

  const projectConfiguration: ProjectConfiguration = {
    root: result.projectRoot,
    projectType: 'library',
    targets: {},
    tags: [],
  };

  addProjectConfiguration(tree, result.projectName, projectConfiguration);

  await formatFiles(tree);

  if (tasks.length === 0) return;
  return runTasksInSerial(...tasks);
}

export default libGenerator;
