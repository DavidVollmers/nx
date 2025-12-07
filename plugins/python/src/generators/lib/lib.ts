import { generateFiles, Tree } from '@nx/devkit';
import { LibGeneratorSchema } from './schema';
import { determineProjectNameAndRootOptions } from '../../utils/project-name-and-root-utils';
import { ProjectNameAndRootOptions } from '@nx/devkit/src/generators/project-name-and-root-utils';
import { join } from 'path';

function createFiles(
  tree: Tree,
  options: ProjectNameAndRootOptions,
  publishable: boolean,
) {
  generateFiles(
    tree,
    join(__dirname, 'files/pyproject/lib'),
    options.projectRoot,
    {
      name: options.projectName,
      description: 'My awesome Python library',
      classifiers: !publishable ? '"Private :: Do Not Upload"' : '',
    },
  );
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
