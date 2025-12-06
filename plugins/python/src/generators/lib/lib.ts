import { Tree } from '@nx/devkit';
import { LibGeneratorSchema } from './schema';
import { determineProjectNameAndRootOptions } from '../../utils/project-name-and-root-utils';

async function prepare(tree: Tree, options: LibGeneratorSchema) {
  const result = await determineProjectNameAndRootOptions(tree, {
    name: options.name,
    projectType: 'library',
    directory: options.directory,
    importPath: options.importPath,
  });
  console.log(result);
}

export async function libGenerator(tree: Tree, options: LibGeneratorSchema) {}

export default libGenerator;
