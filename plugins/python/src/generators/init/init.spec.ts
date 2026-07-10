const { mockFormatFiles } = vi.hoisted(() => ({ mockFormatFiles: vi.fn() }));
vi.mock('@nx/devkit', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@nx/devkit')>()),
  formatFiles: mockFormatFiles,
}));

import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { readJson, Tree } from '@nx/devkit';
import { initGenerator } from './init';
import { PLUGIN_NAME, PRIVATE_CLASSIFIER } from '../../constants';

describe('init generator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    // Real workspaces always have a .gitignore; the generator extends it but
    // doesn't create it from scratch.
    tree.write('.gitignore', 'node_modules\n');
    mockFormatFiles.mockReset();
  });

  it('registers the plugin in nx.json when absent', async () => {
    await initGenerator(tree, { skipFormat: true });

    expect(readJson(tree, 'nx.json').plugins).toContain(PLUGIN_NAME);
  });

  it('does not duplicate the plugin when already registered as a string', async () => {
    const nxJson = readJson(tree, 'nx.json');
    nxJson.plugins = [PLUGIN_NAME];
    tree.write('nx.json', JSON.stringify(nxJson));

    await initGenerator(tree, { skipFormat: true });

    expect(readJson(tree, 'nx.json').plugins).toEqual([PLUGIN_NAME]);
  });

  it('does not duplicate the plugin when already registered in object form', async () => {
    const nxJson = readJson(tree, 'nx.json');
    nxJson.plugins = [{ plugin: PLUGIN_NAME, options: {} }];
    tree.write('nx.json', JSON.stringify(nxJson));

    await initGenerator(tree, { skipFormat: true });

    expect(readJson(tree, 'nx.json').plugins).toEqual([
      { plugin: PLUGIN_NAME, options: {} },
    ]);
  });

  it('generates a root pyproject.toml from the root package.json name', async () => {
    await initGenerator(tree, { skipFormat: true });

    expect(tree.exists('pyproject.toml')).toBe(true);
    const content = tree.read('pyproject.toml', 'utf-8');
    expect(content).toContain('name = "@proj/source"');
    expect(content).toContain(`classifiers = ["${PRIVATE_CLASSIFIER}"]`);
  });

  it('keeps an existing root pyproject.toml untouched', async () => {
    tree.write('pyproject.toml', '[project]\nname = "custom"\n');

    await initGenerator(tree, { skipFormat: true });

    expect(tree.read('pyproject.toml', 'utf-8')).toBe(
      '[project]\nname = "custom"\n',
    );
  });

  it('extends .gitignore with the python-specific entries', async () => {
    await initGenerator(tree, { skipFormat: true });

    const content = tree.read('.gitignore', 'utf-8');
    expect(content).toContain('.venv');
    expect(content).toContain('__pycache__');
    expect(content).toContain('*.egg-info');
  });

  it('does not run formatFiles when skipFormat is true', async () => {
    await initGenerator(tree, { skipFormat: true });

    expect(mockFormatFiles).not.toHaveBeenCalled();
  });

  it('runs formatFiles when skipFormat is false', async () => {
    await initGenerator(tree, { skipFormat: false });

    expect(mockFormatFiles).toHaveBeenCalledWith(tree);
  });
});
