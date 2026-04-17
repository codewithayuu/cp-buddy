import type { Problem } from '@/domain/entities/problem';

export interface ITemplateRenderer {
  /**
   * Render template for a problem's source file
   * @param problem The problem to render template for
   * @returns The rendered template content, or empty string if no template configured
   */
  render(problem: Problem): Promise<string>;
}
