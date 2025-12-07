import { Tree } from '@nx/devkit';
import { readToml } from './toml';

function checkDependencies(scope: any, dependencyName: string): boolean {
  if (!scope) {
    return false;
  }

  const regex = new RegExp(`^${dependencyName}([\\s<>=!~].*)?$`, 'i');
  return scope.some((dep: string) => regex.test(dep));
}

export function doesDependencyExist(
  tree: Tree,
  pyprojectPath: string,
  dependencyName: string,
): boolean {
  if (!tree.exists(pyprojectPath)) {
    return false;
  }

  const toml = readToml(tree, pyprojectPath);
  if (checkDependencies(toml.project?.dependencies, dependencyName)) {
    return true;
  }

  const dependencyGroups = toml['dependency-groups'];
  if (!dependencyGroups) return false;

  for (const groupName in dependencyGroups) {
    if (
      checkDependencies(
        dependencyGroups[groupName]?.dependencies,
        dependencyName,
      )
    ) {
      return true;
    }
  }

  return false;
}
