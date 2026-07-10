import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree } from '@nx/devkit';
import { extendGitignore } from './gitignore';

describe('extendGitignore', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('throws when the gitignore file does not exist', () => {
    expect(() => extendGitignore(tree, '.gitignore', ['.venv'])).toThrow(
      'Cannot find .gitignore',
    );
  });

  it('appends the given entries to an existing file', () => {
    tree.write('.gitignore', 'node_modules');

    extendGitignore(tree, '.gitignore', ['.venv', '__pycache__']);

    expect(tree.read('.gitignore', 'utf-8')).toBe(
      'node_modules\n\n.venv\n__pycache__\n',
    );
  });

  it('does not duplicate an entry that is already present', () => {
    tree.write('.gitignore', 'node_modules\n\n.venv\n');

    extendGitignore(tree, '.gitignore', ['.venv', '__pycache__']);

    const lines = tree.read('.gitignore', 'utf-8').split('\n');
    expect(lines.filter((line) => line === '.venv')).toHaveLength(1);
    expect(lines).toContain('__pycache__');
  });

  it('does not write to the tree when every entry is already present', () => {
    tree.write('.gitignore', '.venv\n__pycache__\n');
    const writeSpy = vi.spyOn(tree, 'write');

    extendGitignore(tree, '.gitignore', ['.venv', '__pycache__']);

    expect(writeSpy).not.toHaveBeenCalled();
  });

  it('trims whitespace around new entries', () => {
    tree.write('.gitignore', '');

    extendGitignore(tree, '.gitignore', [' .venv ', '\t__pycache__\t']);

    expect(tree.read('.gitignore', 'utf-8')).toBe('\n\n.venv\n__pycache__\n');
  });
});
