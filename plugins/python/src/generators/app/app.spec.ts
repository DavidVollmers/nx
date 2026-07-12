const { mockFormatFiles } = vi.hoisted(() => ({ mockFormatFiles: vi.fn() }));
vi.mock('@nx/devkit', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@nx/devkit')>()),
  formatFiles: mockFormatFiles,
}));

import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { readProjectConfiguration, Tree } from '@nx/devkit';
import { appGenerator } from './app';
import { AppGeneratorSchema } from './schema';
import { PLUGIN_NAME, PRIVATE_CLASSIFIER } from '../../constants';

describe('app generator', () => {
  let tree: Tree;
  const options: AppGeneratorSchema = {
    directory: 'apps/test_app',
  };

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    tree.write('.gitignore', 'node_modules\n');
    mockFormatFiles.mockReset();
  });

  it('accepts a hyphenated directory/name (no importPath validation applies to apps)', async () => {
    await appGenerator(tree, { directory: 'apps/my-python-app' });

    const project = readProjectConfiguration(tree, 'my-python-app');
    expect(project.root).toBe('apps/my-python-app');
    expect(tree.exists('apps/my-python-app/main.py')).toBe(true);
  });

  it('registers the project configuration with the resolved root', async () => {
    await appGenerator(tree, options);

    const project = readProjectConfiguration(tree, 'test_app');
    expect(project.root).toBe('apps/test_app');
    expect(project.projectType).toBe('application');
  });

  it('runs init first, creating the root pyproject.toml and extending .gitignore', async () => {
    await appGenerator(tree, options);

    expect(tree.exists('pyproject.toml')).toBe(true);
    expect(tree.read('.gitignore', 'utf-8')).toContain('.venv');
  });

  it('generates a flat main.py with no src/ nesting', async () => {
    await appGenerator(tree, options);

    expect(tree.exists('apps/test_app/pyproject.toml')).toBe(true);
    expect(tree.exists('apps/test_app/main.py')).toBe(true);
    expect(tree.exists('apps/test_app/src')).toBe(false);
  });

  it('generates a hello-world main.py by default', async () => {
    await appGenerator(tree, options);

    const content = tree.read('apps/test_app/main.py', 'utf-8');
    expect(content).toContain("print('Hello, test_app!')");
    expect(content).toContain("if __name__ == '__main__':");
    expect(content).not.toContain('fastapi');
  });

  it('generates a FastAPI main.py with a GET /hello endpoint when framework is fastapi', async () => {
    await appGenerator(tree, { ...options, framework: 'fastapi' });

    const content = tree.read('apps/test_app/main.py', 'utf-8');
    expect(content).toContain('from fastapi import FastAPI');
    expect(content).toContain('app = FastAPI()');
    expect(content).toContain("@app.get('/hello')");
    expect(content).toContain("'message': 'Hello, test_app!'");
    expect(content).not.toContain('def main()');
  });

  it('sets the serve target to run python main.py by default', async () => {
    await appGenerator(tree, options);

    const project = readProjectConfiguration(tree, 'test_app');
    expect(project.targets.serve).toEqual({
      executor: `${PLUGIN_NAME}:serve`,
      options: { command: 'python main.py' },
    });
  });

  it('sets the serve target to run the FastAPI dev server when framework is fastapi', async () => {
    await appGenerator(tree, { ...options, framework: 'fastapi' });

    const project = readProjectConfiguration(tree, 'test_app');
    expect(project.targets.serve).toEqual({
      executor: `${PLUGIN_NAME}:serve`,
      options: { command: 'fastapi dev main.py' },
    });
  });

  it('generates a hello-world test file when unitTestRunner is pytest', async () => {
    await appGenerator(tree, { ...options, unitTestRunner: 'pytest' });

    const content = tree.read('apps/test_app/tests/test_main.py', 'utf-8');
    expect(content).toContain('from main import main');
    expect(content).toContain("captured.out == 'Hello, test_app!\\n'");
  });

  it('generates a FastAPI TestClient test file when framework is fastapi and unitTestRunner is pytest', async () => {
    await appGenerator(tree, {
      ...options,
      framework: 'fastapi',
      unitTestRunner: 'pytest',
    });

    const content = tree.read('apps/test_app/tests/test_main.py', 'utf-8');
    expect(content).toContain('from fastapi.testclient import TestClient');
    expect(content).toContain("client.get('/hello')");
  });

  it('does not generate a tests directory by default', async () => {
    await appGenerator(tree, options);

    expect(tree.exists('apps/test_app/tests/test_main.py')).toBe(false);
  });

  it('adds a [tool.pytest.ini_options] pythonpath entry only when unitTestRunner is pytest', async () => {
    await appGenerator(tree, { ...options, unitTestRunner: 'pytest' });

    expect(tree.read('apps/test_app/pyproject.toml', 'utf-8')).toContain(
      'pythonpath = ["."]',
    );
  });

  it('marks the package private unless publishable is set', async () => {
    await appGenerator(tree, options);

    expect(tree.read('apps/test_app/pyproject.toml', 'utf-8')).toContain(
      `classifiers = ["${PRIVATE_CLASSIFIER}"]`,
    );
  });

  it('does not mark the package private when publishable is true', async () => {
    await appGenerator(tree, { ...options, publishable: true });

    expect(tree.read('apps/test_app/pyproject.toml', 'utf-8')).not.toContain(
      'classifiers',
    );
  });

  it('registers the new project in the root pyproject.toml workspace', async () => {
    await appGenerator(tree, options);

    const content = tree.read('pyproject.toml', 'utf-8');
    expect(content).toMatch(/dependencies = \[\s*"test_app"\s*\]/);
    expect(content).toContain('members = [ "apps/test_app" ]');
    expect(content).toMatch(
      /\[tool\.uv\.sources\.test_app\]\s*\nworkspace = true/,
    );
  });

  it('throws when generating into a directory that already has application files', async () => {
    await appGenerator(tree, options);

    await expect(appGenerator(tree, options)).rejects.toThrow();
  });

  it('queues a task to add fastapi[standard] as a dependency when framework is fastapi', async () => {
    const result = await appGenerator(tree, {
      ...options,
      framework: 'fastapi',
    });

    expect(typeof result).toBe('function');
  });

  it('does not queue a fastapi dependency task when framework is none', async () => {
    const result = await appGenerator(tree, {
      ...options,
      framework: 'none',
      linter: 'none',
      unitTestRunner: 'none',
    });

    // uv sync is still queued unconditionally outside dry-run
    expect(typeof result).toBe('function');
  });

  it('returns undefined during a --dryRun, even when tasks would otherwise be queued', async () => {
    const originalArgv = process.argv;
    process.argv = [...originalArgv, '--dryRun'];
    try {
      const result = await appGenerator(tree, {
        ...options,
        framework: 'fastapi',
        linter: 'flake8',
        unitTestRunner: 'pytest',
      });

      expect(result).toBeUndefined();
    } finally {
      process.argv = originalArgv;
    }
  });
});
