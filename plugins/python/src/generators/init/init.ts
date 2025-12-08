import {
  formatFiles,
  updateNxJson,
  Tree,
  writeJson,
  readNxJson,
  generateFiles,
  OverwriteStrategy,
  readJson,
} from '@nx/devkit';
import { InitGeneratorSchema } from './schema';
import { join } from 'path';

const pluginName = '@dev-tales/nx-python';

function createFiles(tree: Tree) {
  const nxJson = readNxJson(tree);
  if (!nxJson.plugins) nxJson.plugins = [];
  if (
    !nxJson.plugins.some(
      (p) =>
        p === pluginName || (typeof p !== 'string' && p.plugin === pluginName),
    )
  ) {
    nxJson.plugins.push(pluginName);
    writeJson(tree, 'nx.json', nxJson);
  }
  updateNxJson(tree, nxJson);

  const rootPackageJson = readJson(tree, 'package.json');
  generateFiles(
    tree,
    join(__dirname, 'files/pyproject'),
    '.',
    {
      name: rootPackageJson.name,
      classifiers: JSON.stringify(PRIVATE_CLASSIFIER),
    },
    {
      overwriteStrategy: OverwriteStrategy.KeepExisting,
    },
  );
}

export async function initGenerator(tree: Tree, options: InitGeneratorSchema) {
  createFiles(tree);

  if (!options.skipFormat) {
    await formatFiles(tree);
  }
}

export default initGenerator;
