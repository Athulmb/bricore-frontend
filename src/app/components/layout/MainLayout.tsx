import { Outlet } from 'react-router';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function MainLayout() {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0f0f10' }}>
      {/* Ambient light orbs — glassmorphic depth */}
      <div className="glass-orb-1" />
      <div className="glass-orb-2" />

      {/* Sidebar */}
      <div className="print-hidden flex-shrink-0 shadow-2xl shadow-black/40 z-20">
        <Sidebar />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 glass-bg relative z-10">
        {/* Header */}
        <div className="print-hidden flex-shrink-0 z-10">
          <Header />
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-5 md:p-6 min-h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}