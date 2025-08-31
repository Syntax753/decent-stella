import React from 'react';
import ReactDOM from 'react-dom/client';
import { initApp } from './init/init.ts';
import './index.css';
import HomeScreen from './homeScreen/HomeScreen.tsx';

initApp().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <HomeScreen />
    </React.StrictMode>
  );
});