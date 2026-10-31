import React from 'react';
import { useApp } from '../../context/AppContext';
import { useUIConfig } from '../../context/UIConfigContext';
import {
  LayoutDashboard,
  Ticket as TicketIcon,
  FileSpreadsheet,
  MessageSquareQuote,
  Menu,
  Sliders,
  X
} from 'lucide-react';

interface AndroidBottomNavProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
  onToggleMenu: () => void;
  isMenuOpen: boolean;
}

export const AndroidBottomNav: React.FC<AndroidBottomNavProps> = ({
  activeTab,
  onNavigate,
  onToggleMenu,
  isMenuOpen
}) => {
  const { tickets, currentUser } = useApp();
  const { config } = useUIConfig();

  const totalActiveTickets = tickets.filter(t => !t.isArchived).length;
  const isSuperOrDispatch = currentUser.role === 'super_admin' || currentUser.role === 'dispatch';

  const touchSizeClass = 
    config.device?.android?.touchTargetSize === 'large'
      ? 'h-16 py-2.5 text-[11px]'
      : config.device?.android?.touchTargetSize === 'compact'
      ? 'h-13 py-1 text-[10px]'
      : 'h-14 py-1.5 text-[10.5px]';

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="fixed bottom-0 inset-x-0 z-35 bg-[#0E0720]/95 dark:bg-[#0E0720]/95 backdrop-blur-md border-t border-[#2C164D] shadow-[0_-4px_25px_rgba(14,7,32,0.6)] md:hidden transition-all duration-200"
    >
      <div className={`flex items-center justify-around px-2 ${touchSizeClass}`}>
        {/* Tab 1: Dashboard */}
        <button
          onClick={() => onNavigate('dashboard')}
          className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all min-w-[56px] min-h-[44px] rounded-xl cursor-pointer ${
            activeTab === 'dashboard'
              ? 'bg-[#5B35B1] text-white font-bold shadow-md shadow-[#5B35B1]/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <LayoutDashboard className={`w-5 h-5 shrink-0 ${activeTab === 'dashboard' ? 'text-[#D8B4FE]' : ''}`} />
          <span className="truncate text-[10px]">Dashboard</span>
        </button>

        {/* Tab 2: Tickets with Badge */}
        <button
          onClick={() => onNavigate('tickets')}
          className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all min-w-[56px] min-h-[44px] relative rounded-xl cursor-pointer ${
            activeTab === 'tickets'
              ? 'bg-[#5B35B1] text-white font-bold shadow-md shadow-[#5B35B1]/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <div className="relative">
            <TicketIcon className={`w-5 h-5 shrink-0 ${activeTab === 'tickets' ? 'text-[#D8B4FE]' : ''}`} />
            {totalActiveTickets > 0 && (
              <span className="absolute -top-1.5 -right-2 px-1 py-0.2 min-w-[16px] text-center bg-rose-500 text-white rounded-full text-[9px] font-bold leading-tight shadow-xs">
                {totalActiveTickets > 99 ? '99+' : totalActiveTickets}
              </span>
            )}
          </div>
          <span className="truncate text-[10px]">Tiket WO</span>
        </button>

        {/* Tab 3: Text To Table (or Leader/Teknisi depending on role) */}
        {isSuperOrDispatch ? (
          <button
            onClick={() => onNavigate('import')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all min-w-[56px] min-h-[44px] rounded-xl cursor-pointer ${
              activeTab === 'import'
                ? 'bg-[#5B35B1] text-white font-bold shadow-md shadow-[#5B35B1]/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileSpreadsheet className={`w-5 h-5 shrink-0 ${activeTab === 'import' ? 'text-[#D8B4FE]' : ''}`} />
            <span className="truncate text-[10px]">Import WO</span>
          </button>
        ) : currentUser.role === 'leader' ? (
          <button
            onClick={() => onNavigate('leader_portal')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all min-w-[56px] min-h-[44px] rounded-xl cursor-pointer ${
              activeTab === 'leader_portal'
                ? 'bg-[#5B35B1] text-white font-bold shadow-md shadow-[#5B35B1]/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TicketIcon className={`w-5 h-5 shrink-0 ${activeTab === 'leader_portal' ? 'text-[#D8B4FE]' : ''}`} />
            <span className="truncate text-[10px]">Dashboard</span>
          </button>
        ) : (
          <button
            onClick={() => onNavigate('installer_portal')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all min-w-[56px] min-h-[44px] rounded-xl cursor-pointer ${
              activeTab === 'installer_portal'
                ? 'bg-[#5B35B1] text-white font-bold shadow-md shadow-[#5B35B1]/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TicketIcon className={`w-5 h-5 shrink-0 ${activeTab === 'installer_portal' ? 'text-[#D8B4FE]' : ''}`} />
            <span className="truncate text-[10px]">Tugas Saya</span>
          </button>
        )}

        {/* Tab 4: WhatsApp Templates */}
        <button
          onClick={() => onNavigate('templates')}
          className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all min-w-[56px] min-h-[44px] rounded-xl cursor-pointer ${
            activeTab === 'templates'
              ? 'bg-[#5B35B1] text-white font-bold shadow-md shadow-[#5B35B1]/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <MessageSquareQuote className={`w-5 h-5 shrink-0 ${activeTab === 'templates' ? 'text-[#D8B4FE]' : ''}`} />
          <span className="truncate text-[10px]">WhatsApp</span>
        </button>

        {/* Tab 5: Menu Drawer Toggle */}
        <button
          onClick={onToggleMenu}
          className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all min-w-[56px] min-h-[44px] rounded-xl cursor-pointer ${
            isMenuOpen
              ? 'bg-rose-900/60 text-rose-300 font-bold border border-rose-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          {isMenuOpen ? <X className="w-5 h-5 shrink-0" /> : <Menu className="w-5 h-5 shrink-0" />}
          <span className="truncate text-[10px]">{isMenuOpen ? 'Tutup' : 'Menu'}</span>
        </button>
      </div>
    </nav>
  );
};
