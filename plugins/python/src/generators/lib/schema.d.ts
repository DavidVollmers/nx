import { Linter } from '../../utils/linter';
import { UnitTestRunner } from '../../utils/unit-test-runner';

export interface LibGeneratorSchema {
  readonly directory: string;
  readonly name?: string;
  readonly publishable?: boolean;
  readonly importPath?: string;
  readonly linter?: Linter;
  readonly unitTestRunner?: UnitTestRunner;
}
