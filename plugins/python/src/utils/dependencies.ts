function checkDependencies(scope: any, regex: RegExp): boolean {
  if (!scope) {
    return false;
  }

  return scope.some((dep: string) => regex.test(dep));
}

export function doesDependencyExist(
  toml: any,
  dependencyName: string,
): boolean {
  const regex = new RegExp(`^${dependencyName}([\\s<>=!~].*)?$`, 'i');

  if (checkDependencies(toml.project?.dependencies, regex)) {
    return true;
  }

  const dependencyGroups = toml['dependency-groups'];
  if (!dependencyGroups) return false;

  for (const groupName in dependencyGroups) {
    if (checkDependencies(dependencyGroups[groupName]?.dependencies, regex)) {
      return true;
    }
  }

  return false;
}
