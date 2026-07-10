import { join } from 'path';
import { DEFAULT_EXEC_OPTIONS } from '../../constants';
import { createExecutorContext } from '../../testing';
import { PublishExecutorSchema } from './schema';

const { mockExecSync } = vi.hoisted(() => ({ mockExecSync: vi.fn() }));
vi.mock('child_process', async (importOriginal) => ({
  ...(await importOriginal<typeof import('child_process')>()),
  execSync: mockExecSync,
}));

import executor from './publish';

describe('Publish Executor', () => {
  beforeEach(() => {
    mockExecSync.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('publishes the wheel from dist/<projectRoot>', async () => {
    mockExecSync.mockReturnValue(Buffer.from(''));
    const context = createExecutorContext({
      root: '/workspace',
      projectName: 'app',
      projectRoot: 'libs/app',
    });

    const output = await executor({} as PublishExecutorSchema, context);

    expect(output.success).toBe(true);
    expect(mockExecSync).toHaveBeenCalledWith(
      `uv publish "${join('/workspace', 'dist', 'libs/app', '*.whl')}"`,
      expect.objectContaining({
        cwd: join('/workspace', 'libs/app'),
        stdio: DEFAULT_EXEC_OPTIONS.stdio,
        windowsHide: DEFAULT_EXEC_OPTIONS.windowsHide,
      }),
    );
  });

  it('forwards unparsed CLI args after the built command', async () => {
    mockExecSync.mockReturnValue(Buffer.from(''));
    const context = createExecutorContext();

    await executor(
      { __unparsed__: ['--token', 'secret'] } as PublishExecutorSchema,
      context,
    );

    expect(mockExecSync).toHaveBeenCalledWith(
      expect.stringMatching(/^uv publish ".*\*\.whl" --token secret$/),
      expect.anything(),
    );
  });

  it('returns success: false when uv fails', async () => {
    mockExecSync.mockImplementation(() => {
      throw new Error('uv: some failure');
    });
    const context = createExecutorContext();

    const output = await executor({} as PublishExecutorSchema, context);

    expect(output.success).toBe(false);
  });
});
