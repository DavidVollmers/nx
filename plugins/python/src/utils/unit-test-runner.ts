import { Tree } from '@nx/devkit';
import { normalizeDependencyOption } from './generator-prompts';

export const unitTestRunners = ['none', 'pytest'] as const;

export type UnitTestRunner = (typeof unitTestRunners)[number];

const defaultUnitTestRunner = 'none' as const;

export function normalizeUnitTestRunnerOption(
  tree: Tree,
  unitTestRunner: undefined | UnitTestRunner,
): Promise<UnitTestRunner> {
  return normalizeDependencyOption<UnitTestRunner>(
    tree,
    'unitTestRunner',
    unitTestRunner,
    unitTestRunners,
    defaultUnitTestRunner,
    'Which unit test runner would you like to use?',
  );
}
