import type { MouseEvent } from 'react';

export const getCompile = (e: MouseEvent) => {
  if (e.ctrlKey) {
    return true;
  }
  if (e.altKey) {
    return false;
  }
  return null;
};
