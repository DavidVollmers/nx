import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree } from '@nx/devkit';
import { determineProjectNameAndRootOptions } from './project-name-and-root-utils';

describe('determineProjectNameAndRootOptions', () => {
  let tree: Tree;

  // createTreeWithEmptyWorkspace() sets process.env.INIT_CWD to the workspace
  // root as a side effect, which makes the internal getRelativeCwd() helper
  // (used by determineProjectNameAndRootOptions) deterministically resolve to
  // '' instead of depending on wherever the test process actually runs from.
  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('throws when generating a root project without a name', async () => {
    await expect(
      determineProjectNameAndRootOptions(tree, {
        directory: '.',
        projectType: 'library',
      }),
    ).rejects.toThrow('must also specify the name option');
  });

  it('throws when the provided name fails the PEP 508 pattern', async () => {
    await expect(
      determineProjectNameAndRootOptions(tree, {
        directory: 'libs/my_lib',
        name: 'not a valid name',
        projectType: 'library',
      }),
    ).rejects.toThrow(/The provided value "not a valid name" does not match/);
  });

  it('throws when the derived name fails the PEP 508 pattern', async () => {
    await expect(
      determineProjectNameAndRootOptions(tree, {
        directory: 'libs/bad!name',
        projectType: 'library',
      }),
    ).rejects.toThrow(/derived name .* does not match/);
  });

  it('resolves name, root and importPath for a simple directory', async () => {
    const result = await determineProjectNameAndRootOptions(tree, {
      directory: 'libs/my_lib',
      projectType: 'library',
    });

    expect(result).toEqual({
      projectName: 'my_lib',
      projectRoot: 'libs/my_lib',
      names: { projectSimpleName: 'my_lib', projectFileName: 'my_lib' },
      importPath: 'my_lib',
    });
  });

  it('throws when the default importPath (derived from a hyphenated name) is invalid', async () => {
    await expect(
      determineProjectNameAndRootOptions(tree, {
        directory: 'libs/my-lib',
        projectType: 'library',
      }),
    ).rejects.toThrow('must be a valid Python package name');
  });

  it('accepts an explicit importPath even when the derived name would fail', async () => {
    const result = await determineProjectNameAndRootOptions(tree, {
      directory: 'libs/my-lib',
      projectType: 'library',
      importPath: 'my_lib',
    });

    expect(result.importPath).toBe('my_lib');
  });

  it('throws when an explicit importPath is invalid, even with a valid name', async () => {
    await expect(
      determineProjectNameAndRootOptions(tree, {
        directory: 'libs/my_lib',
        projectType: 'library',
        importPath: 'not-valid',
      }),
    ).rejects.toThrow('must be a valid Python package name');
  });

  it('resolves the root project to "."', async () => {
    const result = await determineProjectNameAndRootOptions(tree, {
      directory: '',
      rootProject: true,
      name: 'root_lib',
      projectType: 'library',
    });

    expect(result.projectRoot).toBe('.');
    expect(result.projectName).toBe('root_lib');
  });

  it('throws when the resolved project root escapes the workspace root', async () => {
    await expect(
      determineProjectNameAndRootOptions(tree, {
        directory: '../outside',
        projectType: 'library',
      }),
    ).rejects.toThrow(
      /The resolved project root "\.\.\/outside" is outside of the workspace root/,
    );
  });

  it('falls back to the project name as root when no directory is given', async () => {
    const result = await determineProjectNameAndRootOptions(tree, {
      directory: '',
      name: 'foo_lib',
      projectType: 'library',
    });

    expect(result.projectRoot).toBe('foo_lib');
  });

  it('keeps names.projectSimpleName and names.projectFileName equal to projectName', async () => {
    const result = await determineProjectNameAndRootOptions(tree, {
      directory: 'libs/my_lib',
      projectType: 'library',
    });

    expect(result.names.projectSimpleName).toBe(result.projectName);
    expect(result.names.projectFileName).toBe(result.projectName);
  });
});
