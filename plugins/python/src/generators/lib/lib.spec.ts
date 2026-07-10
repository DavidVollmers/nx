const { mockFormatFiles } = vi.hoisted(() => ({ mockFormatFiles: vi.fn() }));
vi.mock('@nx/devkit', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@nx/devkit')>()),
  formatFiles: mockFormatFiles,
}));

import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { readProjectConfiguration, Tree } from '@nx/devkit';
import { libGenerator } from './lib';
import { LibGeneratorSchema } from './schema';
import { PRIVATE_CLASSIFIER } from '../../constants';

describe('lib generator', () => {
  let tree: Tree;
  const options: LibGeneratorSchema = {
    directory: 'libs/test_lib',
  };

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    tree.write('.gitignore', 'node_modules\n');
    mockFormatFiles.mockReset();
  });

  it('registers the project configuration with the resolved root', async () => {
    await libGenerator(tree, options);

    expect(readProjectConfiguration(tree, 'test_lib').root).toBe(
      'libs/test_lib',
    );
  });

  it('runs init first, creating the root pyproject.toml and extending .gitignore', async () => {
    await libGenerator(tree, options);

    expect(tree.exists('pyproject.toml')).toBe(true);
    expect(tree.read('.gitignore', 'utf-8')).toContain('.venv');
  });

  it('generates the library source files', async () => {
    await libGenerator(tree, options);

    expect(tree.exists('libs/test_lib/pyproject.toml')).toBe(true);
    expect(tree.exists('libs/test_lib/src/test_lib/__init__.py')).toBe(true);
    expect(tree.exists('libs/test_lib/src/test_lib/my_class.py')).toBe(true);
    expect(tree.exists('libs/test_lib/tests/test_my_class.py')).toBe(false);
  });

  it('generates a tests directory when unitTestRunner is pytest', async () => {
    await libGenerator(tree, { ...options, unitTestRunner: 'pytest' });

    expect(tree.exists('libs/test_lib/tests/test_my_class.py')).toBe(true);
  });

  it('marks the package private unless publishable is set', async () => {
    await libGenerator(tree, options);

    expect(tree.read('libs/test_lib/pyproject.toml', 'utf-8')).toContain(
      `classifiers = ["${PRIVATE_CLASSIFIER}"]`,
    );
  });

  it('does not mark the package private when publishable is true', async () => {
    await libGenerator(tree, { ...options, publishable: true });

    expect(tree.read('libs/test_lib/pyproject.toml', 'utf-8')).not.toContain(
      'classifiers',
    );
  });

  it('registers the new project in the root pyproject.toml workspace', async () => {
    await libGenerator(tree, options);

    const rootToml = tree.read('pyproject.toml', 'utf-8');
    expect(rootToml).toContain('test_lib');

    const content = tree.read('pyproject.toml', 'utf-8');
    expect(content).toMatch(/dependencies = \[\s*"test_lib"\s*\]/);
    expect(content).toContain('members = [ "libs/test_lib" ]');
    expect(content).toMatch(
      /\[tool\.uv\.sources\.test_lib\]\s*\nworkspace = true/,
    );
  });

  it('throws when generating into a directory that already has library files', async () => {
    await libGenerator(tree, options);

    await expect(libGenerator(tree, options)).rejects.toThrow();
  });

  it('returns a task runner (without invoking it) even when linter/unitTestRunner are none, since uv sync is always queued outside dry-run', async () => {
    const result = await libGenerator(tree, {
      ...options,
      linter: 'none',
      unitTestRunner: 'none',
    });

    expect(typeof result).toBe('function');
  });

  it('returns a task runner (without invoking it) when linter is set', async () => {
    const result = await libGenerator(tree, {
      ...options,
      linter: 'flake8',
      unitTestRunner: 'none',
    });

    expect(typeof result).toBe('function');
  });

  it('returns a task runner (without invoking it) when unitTestRunner is set', async () => {
    const result = await libGenerator(tree, {
      ...options,
      linter: 'none',
      unitTestRunner: 'pytest',
    });

    expect(typeof result).toBe('function');
  });

  it('returns undefined during a --dryRun, even when tasks would otherwise be queued', async () => {
    const originalArgv = process.argv;
    process.argv = [...originalArgv, '--dryRun'];
    try {
      const result = await libGenerator(tree, {
        ...options,
        linter: 'flake8',
        unitTestRunner: 'pytest',
      });

      expect(result).toBeUndefined();
    } finally {
      process.argv = originalArgv;
    }
  });
});
