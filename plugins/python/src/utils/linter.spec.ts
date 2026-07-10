const { mockNormalizeDependencyOption } = vi.hoisted(() => ({
  mockNormalizeDependencyOption: vi.fn(),
}));
vi.mock('./generator-prompts', () => ({
  normalizeDependencyOption: mockNormalizeDependencyOption,
}));

import { Tree } from '@nx/devkit';
import { normalizeLinterOption } from './linter';

describe('normalizeLinterOption', () => {
  beforeEach(() => {
    mockNormalizeDependencyOption.mockReset();
  });

  it('delegates to normalizeDependencyOption with the linter choice list and default', async () => {
    mockNormalizeDependencyOption.mockResolvedValue('flake8');
    const tree = {} as Tree;

    const result = await normalizeLinterOption(tree, undefined);

    expect(result).toBe('flake8');
    expect(mockNormalizeDependencyOption).toHaveBeenCalledWith(
      tree,
      'linter',
      undefined,
      ['none', 'flake8'],
      'none',
    );
  });
});
