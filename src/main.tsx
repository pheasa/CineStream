import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ConfigLoader } from './components/common/ConfigLoader.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigLoader>
      <App />
    </ConfigLoader>
  </StrictMode>,
);
