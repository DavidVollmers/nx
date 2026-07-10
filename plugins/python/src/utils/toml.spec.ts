import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree } from '@nx/devkit';
import { readToml, updateToml, writeToml } from './toml';

describe('readToml', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('throws when the file does not exist', () => {
    expect(() => readToml(tree, 'pyproject.toml')).toThrow(
      'Cannot find pyproject.toml',
    );
  });

  it('throws a wrapped error when the file is not valid TOML', () => {
    tree.write('pyproject.toml', 'not = [valid toml');

    expect(() => readToml(tree, 'pyproject.toml')).toThrow(
      /^Cannot parse pyproject\.toml: /,
    );
  });

  it('parses the file into an object', () => {
    tree.write(
      'pyproject.toml',
      '[project]\nname = "app"\ndependencies = ["flake8"]\n',
    );

    expect(readToml(tree, 'pyproject.toml')).toEqual({
      project: { name: 'app', dependencies: ['flake8'] },
    });
  });
});

describe('writeToml', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('serializes the value with a trailing newline', () => {
    writeToml(tree, 'pyproject.toml', { project: { name: 'app' } });

    const content = tree.read('pyproject.toml', 'utf-8');
    expect(content.endsWith('\n')).toBe(true);
    expect(content).toContain('name = "app"');
  });

  it('round-trips through readToml', () => {
    const value = { project: { name: 'app', dependencies: ['flake8'] } };

    writeToml(tree, 'pyproject.toml', value);

    expect(readToml(tree, 'pyproject.toml')).toEqual(value);
  });
});

describe('updateToml', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    tree.write(
      'pyproject.toml',
      '[project]\nname = "app"\ndependencies = []\n',
    );
  });

  it('passes the parsed existing content to the updater', () => {
    const updater = vi.fn((value) => value);

    updateToml(tree, 'pyproject.toml', updater);

    expect(updater).toHaveBeenCalledWith({
      project: { name: 'app', dependencies: [] },
    });
  });

  it('writes back only the updater result, preserving untouched fields', () => {
    updateToml(tree, 'pyproject.toml', (value) => {
      value.project.dependencies.push('flake8');
      return value;
    });

    expect(readToml(tree, 'pyproject.toml')).toEqual({
      project: { name: 'app', dependencies: ['flake8'] },
    });
  });
});
