import type { IJudgeService } from '@/application/ports/problems/judge/IJudgeService';
import type { Problem } from '@/domain/entities/problem';

export interface IJudgeServiceFactory {
  create(problem: Problem): IJudgeService;
}
