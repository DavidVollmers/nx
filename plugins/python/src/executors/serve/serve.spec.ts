import { join } from 'path';
import { DEFAULT_EXEC_OPTIONS } from '../../constants';
import { createExecutorContext } from '../../testing';
import { ServeExecutorSchema } from './schema';

const { mockExecSync } = vi.hoisted(() => ({ mockExecSync: vi.fn() }));
vi.mock('child_process', async (importOriginal) => ({
  ...(await importOriginal<typeof import('child_process')>()),
  execSync: mockExecSync,
}));

import executor from './serve';

describe('Serve Executor', () => {
  beforeEach(() => {
    mockExecSync.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('runs the configured command via uv run in the project root', async () => {
    mockExecSync.mockReturnValue(Buffer.from(''));
    const context = createExecutorContext({
      root: '/workspace',
      projectName: 'app',
      projectRoot: 'apps/app',
    });

    const output = await executor(
      { command: 'python main.py' } as ServeExecutorSchema,
      context,
    );

    expect(output.success).toBe(true);
    expect(mockExecSync).toHaveBeenCalledWith(
      'uv run python main.py',
      expect.objectContaining({
        cwd: join('/workspace', 'apps/app'),
        stdio: DEFAULT_EXEC_OPTIONS.stdio,
        windowsHide: DEFAULT_EXEC_OPTIONS.windowsHide,
      }),
    );
  });

  it('runs the FastAPI dev server command when configured', async () => {
    mockExecSync.mockReturnValue(Buffer.from(''));
    const context = createExecutorContext();

    await executor(
      { command: 'fastapi dev main.py' } as ServeExecutorSchema,
      context,
    );

    expect(mockExecSync).toHaveBeenCalledWith(
      'uv run fastapi dev main.py',
      expect.anything(),
    );
  });

  it('forwards unparsed CLI args after the command', async () => {
    mockExecSync.mockReturnValue(Buffer.from(''));
    const context = createExecutorContext();

    await executor(
      {
        command: 'fastapi dev main.py',
        __unparsed__: ['--port', '8080'],
      } as ServeExecutorSchema,
      context,
    );

    expect(mockExecSync).toHaveBeenCalledWith(
      'uv run fastapi dev main.py --port 8080',
      expect.anything(),
    );
  });

  it('returns success: false when uv fails', async () => {
    mockExecSync.mockImplementation(() => {
      throw new Error('uv: some failure');
    });
    const context = createExecutorContext();

    const output = await executor(
      { command: 'python main.py' } as ServeExecutorSchema,
      context,
    );

    expect(output.success).toBe(false);
  });
});
