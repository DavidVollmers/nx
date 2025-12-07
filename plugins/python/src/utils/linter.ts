export const linters = ['none', 'flake8'] as const;

export type Linter = (typeof linters)[number];
