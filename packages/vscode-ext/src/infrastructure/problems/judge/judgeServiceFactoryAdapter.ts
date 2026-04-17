import { inject, injectable } from 'tsyringe';
import type { IJudgeService } from '@/application/ports/problems/judge/IJudgeService';
import type { IJudgeServiceFactory } from '@/application/ports/problems/judge/IJudgeServiceFactory';
import { InteractiveJudgeService } from '@/application/useCases/problems/judge/interactiveJudgeService';
import { TraditionalJudgeService } from '@/application/useCases/problems/judge/traditionalJudgeService';
import type { Problem } from '@/domain/entities/problem';

@injectable()
export class JudgeServiceFactory implements IJudgeServiceFactory {
  public constructor(
    @inject(TraditionalJudgeService) private standard: TraditionalJudgeService,
    @inject(InteractiveJudgeService) private interactive: InteractiveJudgeService,
  ) {}

  public create(problem: Problem): IJudgeService {
    if (problem.interactor) return this.interactive;
    return this.standard;
  }
}
