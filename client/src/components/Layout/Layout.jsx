import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import AIFloatBot from '../AIAssistant/AIFloatBot';

export default function Layout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main-frame">
        <Header />
        <main className="app-main">
          <Outlet />
        </main>
      </div>
      <AIFloatBot />
    </div>
  );
}
