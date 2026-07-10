import { join } from 'path';
import { DEFAULT_EXEC_OPTIONS } from '../../constants';
import { createExecutorContext } from '../../testing';
import { BuildExecutorSchema } from './schema';

const { mockExecSync } = vi.hoisted(() => ({ mockExecSync: vi.fn() }));
vi.mock('child_process', async (importOriginal) => ({
  ...(await importOriginal<typeof import('child_process')>()),
  execSync: mockExecSync,
}));

import executor from './build';

describe('Build Executor', () => {
  beforeEach(() => {
    mockExecSync.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('builds to dist/<projectRoot> for the current project', async () => {
    mockExecSync.mockReturnValue(Buffer.from(''));
    const context = createExecutorContext({
      root: '/workspace',
      projectName: 'app',
      projectRoot: 'libs/app',
    });

    const output = await executor({} as BuildExecutorSchema, context);

    expect(output.success).toBe(true);
    expect(mockExecSync).toHaveBeenCalledWith(
      `uv build --out-dir "${join('/workspace', 'dist', 'libs/app')}"`,
      expect.objectContaining({
        cwd: join('/workspace', 'libs/app'),
        stdio: DEFAULT_EXEC_OPTIONS.stdio,
        windowsHide: DEFAULT_EXEC_OPTIONS.windowsHide,
      }),
    );
  });

  it('derives the out-dir from the resolved project root, not a hardcoded value', async () => {
    mockExecSync.mockReturnValue(Buffer.from(''));
    const context = createExecutorContext({
      root: '/other-root',
      projectName: 'nested',
      projectRoot: 'packages/nested/deep',
    });

    await executor({} as BuildExecutorSchema, context);

    expect(mockExecSync).toHaveBeenCalledWith(
      `uv build --out-dir "${join('/other-root', 'dist', 'packages/nested/deep')}"`,
      expect.anything(),
    );
  });

  it('forwards unparsed CLI args after the built command', async () => {
    mockExecSync.mockReturnValue(Buffer.from(''));
    const context = createExecutorContext();

    await executor(
      { __unparsed__: ['--wheel', '--sdist'] } as BuildExecutorSchema,
      context,
    );

    expect(mockExecSync).toHaveBeenCalledWith(
      expect.stringMatching(/^uv build --out-dir ".*" --wheel --sdist$/),
      expect.anything(),
    );
  });

  it('returns success: false when uv fails', async () => {
    mockExecSync.mockImplementation(() => {
      throw new Error('uv: some failure');
    });
    const context = createExecutorContext();

    const output = await executor({} as BuildExecutorSchema, context);

    expect(output.success).toBe(false);
  });
});
