import { PromiseExecutor } from '@nx/devkit';
import { join } from 'path';
import { existsSync, readFileSync } from 'fs';
import TOML from 'smol-toml';
import { execSync, ExecSyncOptions } from 'child_process';
import { DEFAULT_EXEC_OPTIONS } from '../constants';
import { uvExecutor } from './uv';

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
    if (checkDependencies(dependencyGroups[groupName], regex)) {
      return true;
    }
  }

  return false;
}

export const dependencyExecutor: PromiseExecutor<{
  dependencies: string[];
  commands: {
    [dependency: string]: string;
  };
}> = async (options, context) => {
  const projectTomlPath = join(context.root, 'pyproject.toml');
  if (!existsSync(projectTomlPath)) {
    console.error(`Error: No pyproject.toml found at ${projectTomlPath}.`);
    return {
      success: false,
    };
  }

  const content = readFileSync(projectTomlPath, 'utf-8');
  const toml = TOML.parse(content);

  let foundDependency: string = null;
  for (const dependency of options.dependencies) {
    if (doesDependencyExist(toml, dependency)) {
      foundDependency = dependency;
      break;
    }
  }

  if (!foundDependency) {
    console.error(
      `Error: None of the specified dependencies (${options.dependencies.join(', ')}) are listed in ${projectTomlPath}.`,
    );
    return {
      success: false,
    };
  }

  return await uvExecutor(
    {
      command: 'run ' + options.commands[foundDependency],
    },
    context,
  );
};
