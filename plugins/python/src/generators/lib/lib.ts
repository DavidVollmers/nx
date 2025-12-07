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
  updateToml(tree, 'pyproject.toml', (pyproject) => {
    if (!pyproject.dependencies) pyproject.dependencies = [];
    pyproject.dependencies.push(options.projectName);
    console.log(pyproject);
    return pyproject;
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
