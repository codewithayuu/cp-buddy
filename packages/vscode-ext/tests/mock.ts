import type { DeepPartial } from 'ts-essentials';
import { mock as baseMock, type MockProxy } from 'vitest-mock-extended';

export const mock = <T>(defaultValue: DeepPartial<T> = {} as DeepPartial<T>): MockProxy<T> & T => {
  return baseMock<T>(defaultValue, {
    fallbackMockImplementation: () => {
      throw new Error('Mock method called but no implementation was provided.');
    },
  });
};
