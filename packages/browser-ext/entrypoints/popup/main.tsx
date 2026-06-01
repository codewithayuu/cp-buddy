import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Popup } from './App';

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <Popup />
    </StrictMode>,
  );
}
