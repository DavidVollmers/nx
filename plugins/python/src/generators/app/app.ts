import {
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  OverwriteStrategy,
  ProjectConfiguration,
  runTasksInSerial,
  Tree,
} from '@nx/devkit';
import { AppGeneratorSchema } from './schema';
import {
  determineProjectNameAndRootOptions,
  ProjectNameAndRootOptions,
} from '../../utils/project-name-and-root-utils';
import { join } from 'path';
import { registerWorkspaceMember } from '../../utils/toml';
import { addDependency, sync } from '../../utils/uv';
import initGenerator from '../init/init';
import { PLUGIN_NAME, PRIVATE_CLASSIFIER } from '../../constants';
import { normalizeLinterOption } from '../../utils/linter';
import {
  normalizeUnitTestRunnerOption,
  UnitTestRunner,
} from '../../utils/unit-test-runner';
import { Framework, normalizeFrameworkOption } from '../../utils/framework';

function createFiles(
  tree: Tree,
  options: ProjectNameAndRootOptions,
  publishable: boolean,
  framework: Framework,
  unitTestRunner: UnitTestRunner,
) {
  generateFiles(
    tree,
    join(__dirname, 'files/app'),
    options.projectRoot,
    {
      name: options.projectName,
      description: 'My awesome Python application',
      classifiers: !publishable ? JSON.stringify(PRIVATE_CLASSIFIER) : '',
      framework,
      unitTestRunner,
      tmp: '',
    },
    {
      overwriteStrategy: OverwriteStrategy.ThrowIfExisting,
    },
  );

  if (unitTestRunner !== 'none') {
    generateFiles(
      tree,
      join(__dirname, 'files/' + unitTestRunner),
      options.projectRoot,
      {
        name: options.projectName,
        framework,
      },
    );
  }

  registerWorkspaceMember(tree, options.projectName, options.projectRoot);
}

export async function appGenerator(tree: Tree, options: AppGeneratorSchema) {
  await initGenerator(tree, { skipFormat: true });

  const result = await determineProjectNameAndRootOptions(tree, {
    name: options.name,
    projectType: 'application',
    directory: options.directory,
    // Applications have no import-path concept (flat main.py, nothing imports
    // them as a package), but determineProjectNameAndRootOptions always
    // derives and validates one from the project name, which would otherwise
    // reject perfectly valid hyphenated app names/directories. This
    // placeholder is never read anywhere below.
    importPath: 'app',
  });
  const framework = await normalizeFrameworkOption(tree, options.framework);
  const linter = await normalizeLinterOption(tree, options.linter);
  const unitTestRunner = await normalizeUnitTestRunnerOption(
    tree,
    options.unitTestRunner,
  );

  createFiles(tree, result, !!options.publishable, framework, unitTestRunner);

  // TODO handle dry run properly (https://github.com/nrwl/nx/discussions/33731)
  const dryRun =
    process.argv.includes('--dryRun') || process.argv.includes('-d');
  const tasks = [];
  if (!dryRun) {
    if (framework === 'fastapi') {
      tasks.push(() =>
        addDependency(
          tree,
          `${result.projectRoot}/pyproject.toml`,
          'fastapi[standard]',
        ),
      );
    }
    if (linter && linter !== 'none') {
      tasks.push(() => addDependency(tree, 'pyproject.toml', linter, 'dev'));
    }
    if (unitTestRunner && unitTestRunner !== 'none') {
      tasks.push(() =>
        addDependency(tree, 'pyproject.toml', unitTestRunner, 'dev'),
      );
    }
    tasks.push(() => sync(tree));
  }

  const command =
    framework === 'fastapi' ? 'fastapi dev main.py' : 'python main.py';
  const projectConfiguration: ProjectConfiguration = {
    root: result.projectRoot,
    projectType: 'application',
    targets: {
      serve: {
        executor: `${PLUGIN_NAME}:serve`,
        options: {
          command,
        },
      },
    },
    tags: [],
  };

  addProjectConfiguration(tree, result.projectName, projectConfiguration);

  await formatFiles(tree);

  if (tasks.length === 0) return;
  return runTasksInSerial(...tasks);
}

export default appGenerator;
