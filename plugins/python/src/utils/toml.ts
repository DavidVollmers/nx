import { Tree } from '@nx/devkit';
import TOML from 'smol-toml';

// https://github.com/nrwl/nx/blob/60d019e0c72cfc8d6fc071af8cdb23af9056faef/packages/nx/src/generators/utils/json.ts#L1

// Callers freely traverse and mutate arbitrary nested TOML paths, so the
// default type can't be tightened beyond `object` without breaking them.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function updateToml<T extends object = any, U extends object = T>(
  tree: Tree,
  path: string,
  updater: (value: T) => U,
) {
  const updatedValue = updater(readToml<T>(tree, path));
  writeToml<U>(tree, path, updatedValue);
}

export function registerWorkspaceMember(
  tree: Tree,
  projectName: string,
  projectRoot: string,
) {
  updateToml(tree, 'pyproject.toml', (toml) => {
    if (!toml.project.dependencies) toml.project.dependencies = [];
    if (!toml.project.dependencies.includes(projectName)) {
      toml.project.dependencies.push(projectName);
    }
    if (!toml.tool) toml.tool = {};
    const tool = toml.tool;
    if (!tool.uv) tool.uv = {};
    const uv = tool.uv;
    if (!uv.workspace) uv.workspace = {};
    if (!uv.workspace.members) uv.workspace.members = [];
    if (!uv.workspace.members.includes(projectRoot)) {
      uv.workspace.members.push(projectRoot);
    }
    if (!uv.sources) uv.sources = {};
    if (!uv.sources[projectName]) uv.sources[projectName] = {};
    uv.sources[projectName].workspace = true;
    return toml;
  });
}
