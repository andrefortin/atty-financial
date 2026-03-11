import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import App from './App';
import './styles/fonts.css';
import './styles/globals.css';
import './styles/theme.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
