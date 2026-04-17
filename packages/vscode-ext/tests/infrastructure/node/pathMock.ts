import { basename, dirname, extname, join, relative, resolve } from 'node:path/posix';
import { mock } from '@t/mock';
import type { IPath } from '@/application/ports/node/IPath';

export const pathMock = mock<IPath>();
pathMock.join.mockImplementation(join);
pathMock.dirname.mockImplementation(dirname);
pathMock.basename.mockImplementation(basename);
pathMock.extname.mockImplementation(extname);
pathMock.resolve.mockImplementation(resolve);
pathMock.relative.mockImplementation(relative);
