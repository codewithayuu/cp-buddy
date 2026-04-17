import { mock } from '@t/mock';
import type { ISystem } from '@/application/ports/node/ISystem';

export const systemMock = mock<ISystem>();
systemMock.cwd.mockReturnValue('/working/directory');
systemMock.tmpdir.mockReturnValue('/tmp');
systemMock.homedir.mockReturnValue('/home');
systemMock.platform.mockReturnValue('linux');
systemMock.release.mockReturnValue('cpbuddy-mock');
