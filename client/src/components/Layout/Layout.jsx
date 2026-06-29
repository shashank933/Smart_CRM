import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import AIFloatBot from '../AIAssistant/AIFloatBot';
import { useStore } from '../../store/store';

export default function Layout() {
  const collapsed = useStore(s => s.sidebarCollapsed);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Header />
        <main style={{ flex: 1, padding: '28px 32px', maxWidth: '1400px', width: '100%', overflow: 'auto' }}>
          <Outlet />
        </main>
      </div>
      <AIFloatBot />
    </div>
  );
}
