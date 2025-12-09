import { Tree } from '@nx/devkit';
import { readToml } from './toml';
import { doesDependencyExist } from './dependencies';
import { promptWhenInteractive } from '@nx/devkit/src/generators/prompt';

export async function normalizeDependencyOption<T extends string>(
  tree: Tree,
  name: string,
  initialValue: T | undefined,
  choices: readonly T[],
  defaultValue: T,
  message: string = `Which ${name} would you like to use?`,
): Promise<T> {
  if (initialValue) {
    return initialValue;
  }

  if (tree.exists('pyproject.toml')) {
    const toml = readToml(tree, 'pyproject.toml');
    for (const choice of choices) {
      if (doesDependencyExist(toml, choice)) return choice;
    }
  }

  return await promptWhenInteractive<{
    [name]: T;
  }>(
    {
      type: 'autocomplete',
      name,
      message,
      choices: choices.map((c) => ({ name: c })),
      initial: 0,
    },
    { [name]: defaultValue },
  ).then((v) => v[name]);
}
