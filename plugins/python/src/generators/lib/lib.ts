import { generateFiles, Tree } from '@nx/devkit';
import { LibGeneratorSchema } from './schema';
import { determineProjectNameAndRootOptions } from '../../utils/project-name-and-root-utils';
import { ProjectNameAndRootOptions } from '@nx/devkit/src/generators/project-name-and-root-utils';
import { join } from 'path';
import { updateToml } from '../../utils/toml';

const privateClassifier = 'Private :: Do Not Upload';

function createFiles(
  tree: Tree,
  options: ProjectNameAndRootOptions,
  publishable: boolean,
) {
  const serializedClassifier = JSON.stringify(privateClassifier);
  generateFiles(tree, join(__dirname, 'files/pyproject/root'), '.', {
    name: options.projectName,
    classifiers: serializedClassifier,
  });
  generateFiles(
    tree,
    join(__dirname, 'files/pyproject/lib'),
    options.projectRoot,
    {
      name: options.projectName,
      description: 'My awesome Python library',
      classifiers: !publishable ? serializedClassifier : '',
    },
  );
  updateToml(tree, 'pyproject.toml', (toml) => {
    if (!toml.project.dependencies) toml.dependencies = [];
    toml.project.dependencies.push(options.projectName);
    if (!toml.tool) toml.tool = {};
    const tool = toml.tool;
    if (!tool.uv) tool.uv = {};
    const uv = tool.uv;
    if (!uv.workspace) uv.workspace = {};
    if (!uv.workspace.members) uv.workspace.members = [];
    uv.workspace.members.push(options.projectRoot);
    if (!uv.sources) uv.sources = {};
    if (!uv.sources[options.projectName]) uv.sources[options.projectName] = {};
    uv.sources[options.projectName].workspace = true;
    return toml;
  });
}

export async function libGenerator(tree: Tree, options: LibGeneratorSchema) {
  const result = await determineProjectNameAndRootOptions(tree, {
    name: options.name,
    projectType: 'library',
    directory: options.directory,
    importPath: options.importPath,
  });
  createFiles(tree, result, !!options.publishable);
}

export default libGenerator;
