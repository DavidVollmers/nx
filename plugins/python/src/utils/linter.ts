import { Tree } from '@nx/devkit';
import { normalizeDependencyOption } from './generator-prompts';

export const linters = ['none', 'flake8'] as const;

export type Linter = (typeof linters)[number];

const defaultLinter = 'none' as const;

export function normalizeLinterOption(
  tree: Tree,
  linter: undefined | Linter,
): Promise<Linter> {
  return normalizeDependencyOption<Linter>(
    tree,
    'linter',
    linter,
    linters,
    defaultLinter,
  );
}
