function readGitignore(tree: any, path: string): string[] {
  if (!tree.exists(path)) {
    throw new Error(`Cannot find ${path}`);
  }
  try {
    const content = tree.read(path, 'utf-8');
    return content
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0);
  } catch (e) {
    throw new Error(`Cannot read ${path}: ${e.message}`);
  }
}

export function extendGitignore(tree: any, path: string, entries: string[]) {
  const existingEntries = readGitignore(tree, path);
  const newEntries = entries.filter(
    (entry) => !existingEntries.includes(entry),
  );
  if (newEntries.length === 0) return;
  const content = tree.read(path, 'utf-8');
  const updatedContent =
    content +
    '\n\n' +
    newEntries.map((entry) => entry.trim()).join('\n') +
    '\n';
  tree.write(path, updatedContent);
}
