import { loggerMock } from '@t/infrastructure/vscode/loggerMock';
import { settingsMock } from '@t/infrastructure/vscode/settingsMock';
import { translatorMock } from '@t/infrastructure/vscode/translatorMock';
import { mock } from '@t/mock';
import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import type { MockProxy } from 'vitest-mock-extended';
import type { IFileSystem } from '@/application/ports/node/IFileSystem';
import type { IPathResolver } from '@/application/ports/services/IPathResolver';
import type { IUi } from '@/application/ports/vscode/IUi';
import { TOKENS } from '@/composition/tokens';
import { Problem } from '@/domain/entities/problem';
import { TemplateRenderer } from '@/infrastructure/services/templateRenderer';

describe('TemplateRenderer', () => {
  let renderer: TemplateRenderer;
  let fsMock: MockProxy<IFileSystem>;
  let pathResolverMock: MockProxy<IPathResolver>;
  let uiMock: MockProxy<IUi>;

  beforeEach(() => {
    fsMock = mock<IFileSystem>();
    pathResolverMock = mock<IPathResolver>();
    uiMock = mock<IUi>();
    uiMock.alert.mockResolvedValue(undefined);

    container.registerInstance(TOKENS.fileSystem, fsMock);
    container.registerInstance(TOKENS.logger, loggerMock);
    container.registerInstance(TOKENS.pathResolver, pathResolverMock);
    container.registerInstance(TOKENS.settings, settingsMock);
    container.registerInstance(TOKENS.translator, translatorMock);
    container.registerInstance(TOKENS.ui, uiMock);

    renderer = container.resolve(TemplateRenderer);
  });

  const makeProblem = () => {
    const p = new Problem('A + B', '/src/main.cpp');
    p.url = 'https://codeforces.com/contest/1/problem/A';
    p.overrides = {
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      compiler: null,
      compilerArgs: null,
      runner: null,
      runnerArgs: null,
    };
    return p;
  };

  it('should return header string when no template file configured', async () => {
    settingsMock.problem.templateFile = '';
    const result = await renderer.render(makeProblem());
    expect(result).toEqual({ header: '// Problem Name: A + B\n// Problem URL: https://codeforces.com/contest/1/problem/A\n//\n', template: '' });
  });

  it('should return header string when path resolution fails', async () => {
    settingsMock.problem.templateFile = '/home/user/template.cpp';
    pathResolverMock.renderPathWithFile.mockReturnValue(null);

    const result = await renderer.render(makeProblem());
    expect(result).toEqual({ header: '// Problem Name: A + B\n// Problem URL: https://codeforces.com/contest/1/problem/A\n//\n', template: '' });
  });

  it('should render template with variable substitution and header', async () => {
    settingsMock.problem.templateFile = '/home/user/template.cpp';
    pathResolverMock.renderPathWithFile.mockReturnValue('/home/user/template.cpp');
    fsMock.readFile.mockResolvedValue(
      '// Title: ${title}\n// Time: ${timeLimit}ms\n// Memory: ${memoryLimit}MB\n// URL: ${url}\n',
    );

    const result = await renderer.render(makeProblem());

    expect(result).toEqual({
      header: '// Problem Name: A + B\n// Problem URL: https://codeforces.com/contest/1/problem/A\n//\n',
      template: '// Title: A + B\n// Time: 2000ms\n// Memory: 256MB\n// URL: https://codeforces.com/contest/1/problem/A\n'
    });
  });

  it('should use defaults when overrides are not set and include header', async () => {
    const p = new Problem('test', '/tmp/test.cpp');
    settingsMock.problem.templateFile = '/home/user/template.cpp';
    pathResolverMock.renderPathWithFile.mockReturnValue('/home/user/template.cpp');
    fsMock.readFile.mockResolvedValue('${timeLimit} ${memoryLimit}');

    const result = await renderer.render(p);

    expect(result).toEqual({ header: '// Problem Name: test\n// Problem URL: \n//\n', template: '0 0' });
  });

  it('should return header string and show alert when reading template fails', async () => {
    settingsMock.problem.templateFile = '/home/user/template.cpp';
    pathResolverMock.renderPathWithFile.mockReturnValue('/home/user/template.cpp');
    fsMock.readFile.mockRejectedValue(new Error('ENOENT'));

    const result = await renderer.render(makeProblem());

    expect(result).toEqual({ header: '// Problem Name: A + B\n// Problem URL: https://codeforces.com/contest/1/problem/A\n//\n', template: '' });
    expect(uiMock.alert).toHaveBeenCalledWith('warn', expect.stringContaining('ENOENT'));
  });
});
