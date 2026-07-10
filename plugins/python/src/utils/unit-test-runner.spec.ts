const { mockNormalizeDependencyOption } = vi.hoisted(() => ({
  mockNormalizeDependencyOption: vi.fn(),
}));
vi.mock('./generator-prompts', () => ({
  normalizeDependencyOption: mockNormalizeDependencyOption,
}));

import { Tree } from '@nx/devkit';
import { normalizeUnitTestRunnerOption } from './unit-test-runner';

describe('normalizeUnitTestRunnerOption', () => {
  beforeEach(() => {
    mockNormalizeDependencyOption.mockReset();
  });

  it('delegates to normalizeDependencyOption with the unit test runner choice list, default and custom message', async () => {
    mockNormalizeDependencyOption.mockResolvedValue('pytest');
    const tree = {} as Tree;

    const result = await normalizeUnitTestRunnerOption(tree, undefined);

    expect(result).toBe('pytest');
    expect(mockNormalizeDependencyOption).toHaveBeenCalledWith(
      tree,
      'unitTestRunner',
      undefined,
      ['none', 'pytest'],
      'none',
      'Which unit test runner would you like to use?',
    );
  });
});
