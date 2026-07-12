import { Tree } from '@nx/devkit';
import { normalizeDependencyOption } from './generator-prompts';

export const frameworks = ['none', 'fastapi'] as const;

export type Framework = (typeof frameworks)[number];

const defaultFramework = 'none' as const;

export function normalizeFrameworkOption(
  tree: Tree,
  framework: undefined | Framework,
): Promise<Framework> {
  return normalizeDependencyOption<Framework>(
    tree,
    'framework',
    framework,
    frameworks,
    defaultFramework,
    'Which web framework would you like to use?',
  );
}
