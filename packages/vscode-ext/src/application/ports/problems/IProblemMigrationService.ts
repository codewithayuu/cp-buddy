import type { IProblem } from '@cpbuddy/core';
import type * as History from '@/application/ports/problems/history';

export type OldProblem =
  | History.IProblem_0_4_8
  | History.IProblem_0_4_3
  | History.IProblem_0_3_6
  | History.IProblem_0_2_4
  | History.IProblem_0_2_3
  | History.IProblem_0_2_1
  | History.IProblem_0_1_1
  | History.IProblem_0_1_0
  | History.IProblem_0_0_5
  | History.IProblem_0_0_4
  | History.IProblem_0_0_3
  | History.IProblem_0_0_1;

export interface IProblemMigrationService {
  migrate(rawData: OldProblem): IProblem;
}
