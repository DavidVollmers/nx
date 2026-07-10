import { VersionActions } from 'nx/src/command-line/release';

export default class PythonReleaseVersionActions extends VersionActions {
  validManifestFilenames = ['pyproject.toml'];

  readCurrentVersionFromSourceManifest(): Promise<{
    currentVersion: string;
    manifestPath: string;
  } | null> {
    throw new Error('Method not implemented.');
  }

  readCurrentVersionFromRegistry(): Promise<{
    currentVersion: string | null;
    logText: string;
  } | null> {
    throw new Error('Method not implemented.');
  }

  readCurrentVersionOfDependency(): Promise<{
    currentVersion: string | null;
    dependencyCollection: string | null;
  }> {
    throw new Error('Method not implemented.');
  }

  updateProjectVersion(): Promise<string[]> {
    throw new Error('Method not implemented.');
  }

  updateProjectDependencies(): Promise<string[]> {
    throw new Error('Method not implemented.');
  }
}
