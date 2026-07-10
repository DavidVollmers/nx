import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree } from '@nx/devkit';
import { normalizeDependencyOption } from './generator-prompts';

describe('normalizeDependencyOption', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('returns the initial value immediately, without inspecting the tree', async () => {
    const existsSpy = vi.spyOn(tree, 'exists');

    const result = await normalizeDependencyOption(
      tree,
      'linter',
      'flake8',
      ['none', 'flake8'] as const,
      'none',
    );

    expect(result).toBe('flake8');
    expect(existsSpy).not.toHaveBeenCalled();
  });

  it('detects a choice declared in project.dependencies', async () => {
    tree.write('pyproject.toml', '[project]\ndependencies = ["flake8"]\n');

    const result = await normalizeDependencyOption(
      tree,
      'linter',
      undefined,
      ['none', 'flake8'] as const,
      'none',
    );

    expect(result).toBe('flake8');
  });

  it('detects a choice declared inside a dependency-groups entry', async () => {
    tree.write(
      'pyproject.toml',
      '[dependency-groups]\ndev = ["pytest>=9.0.2"]\n',
    );

    const result = await normalizeDependencyOption(
      tree,
      'unitTestRunner',
      undefined,
      ['none', 'pytest'] as const,
      'none',
    );

    expect(result).toBe('pytest');
  });

  it('falls back to the default when pyproject.toml has no matching choice', async () => {
    tree.write('pyproject.toml', '[project]\ndependencies = []\n');

    const result = await normalizeDependencyOption(
      tree,
      'linter',
      undefined,
      ['none', 'flake8'] as const,
      'none',
    );

    expect(result).toBe('none');
  });

  it('falls back to the default when there is no pyproject.toml at all', async () => {
    const result = await normalizeDependencyOption(
      tree,
      'linter',
      undefined,
      ['none', 'flake8'] as const,
      'none',
    );

    expect(result).toBe('none');
  });

  it('prefers the first matching choice when multiple are present', async () => {
    tree.write(
      'pyproject.toml',
      '[project]\ndependencies = ["flake8", "ruff"]\n',
    );

    const result = await normalizeDependencyOption(
      tree,
      'linter',
      undefined,
      ['ruff', 'flake8', 'none'] as const,
      'none',
    );

    expect(result).toBe('ruff');
  });
});
