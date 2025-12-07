import { Tree } from '@nx/devkit';
import TOML from 'smol-toml';

// https://github.com/nrwl/nx/blob/60d019e0c72cfc8d6fc071af8cdb23af9056faef/packages/nx/src/generators/utils/json.ts#L1

export function readToml<T extends object = any>(tree: Tree, path: string): T {
  if (!tree.exists(path)) {
    throw new Error(`Cannot find ${path}`);
  }
  try {
    return TOML.parse(tree.read(path, 'utf-8')) as T;
  } catch (e) {
    throw new Error(`Cannot parse ${path}: ${e.message}`);
  }
}

export function writeToml<T extends object = object>(
  tree: Tree,
  path: string,
  value: T,
) {
  const serialized = TOML.stringify(value);
  tree.write(path, `${serialized}\n`);
}

export function updateToml<T extends object = any, U extends object = T>(
  tree: Tree,
  path: string,
  updater: (value: T) => U,
) {
  const updatedValue = updater(readToml<T>(tree, path));
  writeToml<U>(tree, path, updatedValue);
}
