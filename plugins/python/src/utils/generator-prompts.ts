import { Tree } from '@nx/devkit';
import { doesDependencyExist } from './dependencies';
import { promptWhenInteractive } from '@nx/devkit/src/generators/prompt';
import { linters, Linter } from './linter';
import { readToml } from './toml';

const defaultLinter = 'none' as const;

const linterChoices = linters.map((linter) => ({
  name: linter,
}));

export async function normalizeLinterOption(
  tree: Tree,
  linter: undefined | Linter,
): Promise<Linter> {
  if (linter) {
    return linter;
  }

  if (tree.exists('pyproject.toml')) {
    const toml = readToml(tree, 'pyproject.toml');
    return doesDependencyExist(toml, 'flake8') ? 'flake8' : 'none';
  }

  return await promptWhenInteractive<{
    linter: Linter;
  }>(
    {
      type: 'autocomplete',
      name: 'linter',
      message: `Which linter would you like to use?`,
      choices: linterChoices,
      initial: 0,
    },
    { linter: defaultLinter },
  ).then(({ linter }) => linter);
}
