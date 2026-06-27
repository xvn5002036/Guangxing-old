import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { DataProvider } from './context/DataContext';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("找不到 root 元素 (No root element)");
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <DataProvider>
      <App />
    </DataProvider>
  </React.StrictMode>
);