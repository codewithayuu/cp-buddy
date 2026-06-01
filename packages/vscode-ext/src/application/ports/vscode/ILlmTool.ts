import type {
  CancellationToken,
  LanguageModelTool,
  LanguageModelToolInvocationOptions,
  LanguageModelToolInvocationPrepareOptions,
  LanguageModelToolResult,
  PreparedToolInvocation,
  ProviderResult,
} from 'vscode';

export interface LlmTool<T> extends LanguageModelTool<T> {
  invoke(
    options: LanguageModelToolInvocationOptions<T>,
    token: CancellationToken,
  ): ProviderResult<LanguageModelToolResult>;
  prepareInvocation(
    options: LanguageModelToolInvocationPrepareOptions<T>,
    token: CancellationToken,
  ): ProviderResult<PreparedToolInvocation>;
}
