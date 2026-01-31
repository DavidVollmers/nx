import {
  joinPathFragments,
  normalizePath,
  Tree,
  workspaceRoot,
} from '@nx/devkit';
import {
  ProjectGenerationOptions,
  ProjectNameAndRootOptions,
} from '@nx/devkit/src/generators/project-name-and-root-utils';
import { getRelativeCwd } from '@nx/devkit/src/generators/artifact-name-and-directory-utils';

function validateOptions(
  providedName: string,
  derivedName: string,
  directory: string,
) {
  /**
   * Ensure valid package name according to PEP 508: https://peps.python.org/pep-0508/#names
   */
  const pattern = '^([A-Z0-9]|[A-Z0-9][A-Z0-9._-]*[A-Z0-9])$';
  const validationRegex = new RegExp(pattern, 'i');
  if (providedName) {
    if (!validationRegex.test(providedName)) {
      throw new Error(
        `The name should match the pattern "${pattern}". The provided value "${providedName}" does not match.`,
      );
    }
  } else if (!validationRegex.test(derivedName)) {
    throw new Error(
      `The derived name from the provided directory should match the pattern "${pattern}". The derived name "${derivedName}" from the provided value "${directory}" does not match.`,
    );
  }
}

// https://github.com/nrwl/nx/blob/60d019e0c72cfc8d6fc071af8cdb23af9056faef/packages/devkit/src/generators/project-name-and-root-utils.ts#L48
export async function determineProjectNameAndRootOptions(
  tree: Tree,
  options: ProjectGenerationOptions,
): Promise<ProjectNameAndRootOptions> {
  if (options.directory === '.' && !options.name) {
    throw new Error(
      `When generating a root project, you must also specify the name option.`,
    );
  }

  const directory = normalizePath(options.directory);
  const name =
    options.name ??
    directory.match(/(@[^@/]+(\/[^@/]+)+)/)?.[1] ??
    directory.substring(directory.lastIndexOf('/') + 1);

  validateOptions(options.name, name, options.directory);

  let projectRoot: string;
  const relativeCwd = getRelativeCwd();

  if (directory) {
    // append the directory to the current working directory if it doesn't start with it
    if (directory === relativeCwd || directory.startsWith(`${relativeCwd}/`)) {
      projectRoot = directory;
    } else {
      projectRoot = joinPathFragments(relativeCwd, directory);
    }
  } else if (options.rootProject) {
    projectRoot = '.';
  } else {
    projectRoot = relativeCwd;
    // append the project name to the current working directory if it doesn't end with it
    if (!relativeCwd.endsWith(name)) {
      projectRoot = joinPathFragments(relativeCwd, name);
    }
  }

  if (projectRoot.startsWith('..')) {
    throw new Error(
      `The resolved project root "${projectRoot}" is outside of the workspace root "${workspaceRoot}".`,
    );
  }

  const importPath = options.importPath ?? name;
  if (!importPath.match(/^[a-zA-Z0-9_]+$/)) {
    throw new Error(
      `The importPath must be a valid Python package name (consisting of letters, numbers or underscores). Please use the --importPath option to provide a valid name.`,
    );
  }

  return {
    projectName: name,
    names: {
      projectSimpleName: name,
      projectFileName: name,
    },
    importPath,
    projectRoot,
  };
}
