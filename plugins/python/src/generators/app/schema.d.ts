import { Framework } from '../../utils/framework';
import { Linter } from '../../utils/linter';
import { UnitTestRunner } from '../../utils/unit-test-runner';

export interface AppGeneratorSchema {
  readonly directory: string;
  readonly name?: string;
  readonly publishable?: boolean;
  readonly framework?: Framework;
  readonly linter?: Linter;
  readonly unitTestRunner?: UnitTestRunner;
}
