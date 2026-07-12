[Nx](https://nx.dev/) plugin to generate and manage Python libraries and applications in a monorepo setup.

This plugin is heavily opinionated towards using [uv](https://docs.astral.sh/uv/) as the build system for Python
projects.

You can configure additional features like using [flake8](https://flake8.pycqa.org/en/latest/) for linting
or [pytest](https://docs.pytest.org/en/stable/) for testing.

## Usage

Add the plugin to your Nx workspace:

```bash
nx add @dev-tales/nx-python
```

Generate a new Python library:

```bash
nx g @dev-tales/nx-python:lib libs/my-python-lib
```

Now you can run tests, lint, and build your library using the following commands:

```bash
nx test my-python-lib
nx lint my-python-lib
nx build my-python-lib
```

Generate a new Python application:

```bash
nx g @dev-tales/nx-python:app apps/my-python-app
```

By default the application just prints a hello-world message from `main.py`. Pass
`--framework=fastapi` to scaffold a [FastAPI](https://fastapi.tiangolo.com/) app with a `GET /hello`
endpoint instead. Applications get the same `test`/`lint`/`build` targets as libraries, plus a
`serve` target to actually run them:

```bash
nx serve my-python-app
```
