const { mockNormalizeDependencyOption } = vi.hoisted(() => ({
  mockNormalizeDependencyOption: vi.fn(),
}));
vi.mock('./generator-prompts', () => ({
  normalizeDependencyOption: mockNormalizeDependencyOption,
}));

import { Tree } from '@nx/devkit';
import { normalizeFrameworkOption } from './framework';

describe('normalizeFrameworkOption', () => {
  beforeEach(() => {
    mockNormalizeDependencyOption.mockReset();
  });

  it('delegates to normalizeDependencyOption with the framework choice list, default and custom message', async () => {
    mockNormalizeDependencyOption.mockResolvedValue('fastapi');
    const tree = {} as Tree;

    const result = await normalizeFrameworkOption(tree, undefined);

    expect(result).toBe('fastapi');
    expect(mockNormalizeDependencyOption).toHaveBeenCalledWith(
      tree,
      'framework',
      undefined,
      ['none', 'fastapi'],
      'none',
      'Which web framework would you like to use?',
    );
  });
});
