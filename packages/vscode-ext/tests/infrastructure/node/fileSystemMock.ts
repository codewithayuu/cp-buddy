import { dirname, resolve } from 'node:path';
import { mock } from '@t/mock';
import { createFsFromVolume, Volume } from 'memfs';
import type { IFileSystem } from '@/application/ports/node/IFileSystem';

export function createFileSystemMock(vol: InstanceType<typeof Volume> = new Volume()) {
  const fs = createFsFromVolume(vol);
  const fileSystemMock = mock<IFileSystem>();
  fileSystemMock.readRawFile.mockImplementation(async (path) => {
    const result = await fs.promises.readFile(path);
    return Buffer.from(result);
  });
  fileSystemMock.readFile.mockImplementation(async (path, encoding = 'utf8') => {
    const result = await fs.promises.readFile(path, { encoding });
    return result as string;
  });
  fileSystemMock.safeWriteFile.mockImplementation(async (path, data) => {
    await fs.promises.mkdir(dirname(path), { recursive: true });
    await fs.promises.writeFile(path, data);
  });
  fileSystemMock.safeCreateFile.mockImplementation((path) => {
    fs.mkdirSync(dirname(path), { recursive: true });
    fs.writeFileSync(path, '');
  });
  fileSystemMock.exists.mockImplementation(async (path) => {
    try {
      await fs.promises.access(path);
      return true;
    } catch {
      return false;
    }
  });
  fileSystemMock.existsSync.mockImplementation((path) => {
    try {
      fs.accessSync(path);
      return true;
    } catch {
      return false;
    }
  });
  fileSystemMock.mkdir.mockImplementation(async (path) => {
    await fs.promises.mkdir(path, { recursive: true });
  });
  fileSystemMock.readdir.mockImplementation(async (path) => {
    const result = await fs.promises.readdir(path, { encoding: 'utf8' });
    return result as string[];
  });
  fileSystemMock.stat.mockImplementation(async (path) => {
    const stats = await fs.promises.stat(path);
    return {
      size: stats.size as number,
      isFile: () => stats.isFile(),
      isDirectory: () => stats.isDirectory(),
    };
  });
  fileSystemMock.copyFile.mockImplementation(async (src, dest) => {
    await fs.promises.mkdir(dirname(dest), { recursive: true });
    await fs.promises.copyFile(src, dest);
  });
  fileSystemMock.rm.mockImplementation(async (path, options?) => {
    await fs.promises.rm(path, options);
  });
  fileSystemMock.walk.mockImplementation(async (path) => {
    const result = fs.promises.readdir(path, { encoding: 'utf8', recursive: true });
    return (result as Promise<string[]>).then((files) => files.map((file) => resolve(path, file)));
  });
  fileSystemMock.createReadStream.mockImplementation((path) => {
    return fs.createReadStream(path);
  });
  fileSystemMock.safeCreateWriteStream.mockImplementation((path) => {
    fs.mkdirSync(dirname(path), { recursive: true });
    return fs.createWriteStream(path);
  });

  return { fileSystemMock, vol };
}
