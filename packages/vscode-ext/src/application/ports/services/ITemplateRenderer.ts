import type { Problem } from '@/domain/entities/problem';

export interface ITemplateRenderer {
  /**
   * Render template for a problem's source file
   * @param problem The problem to render template for
   * @returns The generated header comments and the rendered template content
   */
  render(problem: Problem): Promise<{ header: string; template: string }>;
}
