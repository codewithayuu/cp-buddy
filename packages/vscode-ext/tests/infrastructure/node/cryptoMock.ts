import { createHash } from 'node:crypto';
import { mock } from '@t/mock';
import type { ICrypto } from '@/application/ports/node/ICrypto';

export const cryptoMock = mock<ICrypto>();
cryptoMock.randomUUID.mockImplementation(() => {
  const index = cryptoMock.randomUUID.mock.calls.length - 1;
  return `u-u-i-d-${index}`;
});
cryptoMock.md5.mockImplementation((data) => {
  return createHash('md5').update(data).digest('hex');
});
