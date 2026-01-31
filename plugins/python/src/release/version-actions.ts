import { Tree, ProjectGraph } from '@nx/devkit';
import { VersionActions } from 'nx/src/command-line/release';
import { NxReleaseVersionConfiguration } from 'nx/src/config/nx-json';

export default class PythonReleaseVersionActions extends VersionActions {
  validManifestFilenames = ['pyproject.toml'];

  readCurrentVersionFromSourceManifest(
    tree: Tree,
  ): Promise<{ currentVersion: string; manifestPath: string } | null> {
    throw new Error('Method not implemented.');
  }

  readCurrentVersionFromRegistry(
    tree: Tree,
    currentVersionResolverMetadata: NxReleaseVersionConfiguration['currentVersionResolverMetadata'],
  ): Promise<{ currentVersion: string | null; logText: string } | null> {
    throw new Error('Method not implemented.');
  }

  readCurrentVersionOfDependency(
    tree: Tree,
    projectGraph: ProjectGraph,
    dependencyProjectName: string,
  ): Promise<{
    currentVersion: string | null;
    dependencyCollection: string | null;
  }> {
    throw new Error('Method not implemented.');
  }

  updateProjectVersion(tree: Tree, newVersion: string): Promise<string[]> {
    throw new Error('Method not implemented.');
  }

  updateProjectDependencies(
    tree: Tree,
    projectGraph: ProjectGraph,
    dependenciesToUpdate: Record<string, string>,
  ): Promise<string[]> {
    throw new Error('Method not implemented.');
  }
}
