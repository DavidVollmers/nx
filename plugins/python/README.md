[Nx](https://nx.dev/) plugin to generate and manage Python libraries in a monorepo setup.

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
