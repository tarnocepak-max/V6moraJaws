import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useUIConfig } from '../../context/UIConfigContext';
import { MoraJawsLogo } from '../common/MoraJawsLogo';
import {
  LayoutDashboard,
  FileSpreadsheet,
  Ticket as TicketIcon,
  Users2,
  Wrench,
  MessageSquareQuote,
  GitBranch,
  Sliders,
  History,
  Settings as SettingsIcon,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Minus,
  X,
  Maximize2,
  Users,
  RefreshCw,
  Database,
  Server,
  KeyRound,
  LogOut,
  Zap,
  Calendar,
  ListFilter,
  Activity,
  MessageSquare,
  ShieldCheck,
  Building2,
  Layers,
  FileText,
  Radio,
  Smartphone
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
  sidebarState: 'expanded' | 'minimized' | 'closed';
  onChangeState: (state: 'expanded' | 'minimized' | 'closed') => void;
}

interface NavMenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  roles: string[];
  badge?: string | number;
  badgeColor?: 'purple' | 'amber' | 'emerald' | 'rose';
  highlight?: boolean;
}

interface NavGroup {
  id: string;
  title: string;
  icon: React.ElementType;
  items: NavMenuItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onNavigate,
  sidebarState,
  onChangeState
}) => {
  const { currentUser, tickets, logout, setIsSessionModalOpen } = useApp();
  const { isMobileView, config } = useUIConfig();

  const isMinimized = sidebarState === 'minimized';
  const totalActiveTickets = tickets.filter(t => !t.isArchived).length;
  const unassignedCount = tickets.filter(t => !t.installerName && !t.isArchived).length;
  const userRole = currentUser?.role || 'installer';

  // 6 Accordion Menu Groups defined strictly according to requirement
  const menuGroups: NavGroup[] = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: LayoutDashboard,
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard Monitoring',
          icon: LayoutDashboard,
          roles: ['super_admin', 'dispatch', 'leader', 'management_data']
        },
        {
          id: 'tickets',
          label: 'Ticket MyRepublic',
          icon: TicketIcon,
          badge: totalActiveTickets,
          badgeColor: 'purple',
          roles: ['super_admin', 'dispatch']
        }
      ]
    },
    {
      id: 'operasional',
      title: 'Operasional',
      icon: Layers,
      items: [
        {
          id: 'tickets',
          label: 'Work Order Management',
          icon: TicketIcon,
          badge: totalActiveTickets,
          badgeColor: 'purple',
          roles: ['super_admin', 'dispatch']
        },
        {
          id: 'schedule',
          label: 'Jadwal & Kalender',
          icon: Calendar,
          roles: ['super_admin', 'dispatch', 'leader']
        },
        {
          id: 'form_sameday',
          label: 'Form Sameday Express',
          icon: Zap,
          badge: 'Express',
          badgeColor: 'amber',
          roles: ['dispatch']
        },
        {
          id: 'import',
          label: 'Import Data WO',
          icon: FileSpreadsheet,
          roles: ['super_admin', 'dispatch', 'management_data']
        }
      ]
    },
    {
      id: 'teknisi',
      title: 'Teknisi',
      icon: Users2,
      items: [
        {
          id: 'leader_portal',
          label: 'Dashboard Leader',
          icon: Users2,
          badge: unassignedCount > 0 ? `${unassignedCount} Unassign` : undefined,
          badgeColor: 'amber',
          roles: ['super_admin', 'leader']
        },
        {
          id: 'installer_portal',
          label: 'Portal Teknisi Lapangan',
          icon: Wrench,
          roles: ['super_admin', 'leader', 'installer']
        },
        {
          id: 'location_basecamp',
          label: 'Kontraktor & Basecamp',
          icon: Building2,
          roles: ['super_admin', 'leader']
        }
      ]
    },
    {
      id: 'pelanggan',
      title: 'Pelanggan',
      icon: MessageSquare,
      items: [
        {
          id: 'contact_centre',
          label: 'Contact Centre',
          icon: MessageSquare,
          roles: ['super_admin', 'dispatch', 'leader', 'installer']
        },
        {
          id: 'templates',
          label: 'Template WhatsApp',
          icon: MessageSquareQuote,
          roles: ['super_admin', 'dispatch', 'leader']
        }
      ]
    },
    {
      id: 'laporan',
      title: 'Laporan',
      icon: FileText,
      items: [
        {
          id: 'report_data_wo',
          label: 'Report Data WO',
          icon: FileSpreadsheet,
          roles: ['super_admin', 'dispatch', 'management_data']
        },
        {
          id: 'audit_logs',
          label: 'Audit Trail Log',
          icon: History,
          roles: ['super_admin', 'it_support']
        },
        {
          id: 'login_logs',
          label: 'Riwayat Sesi Login',
          icon: KeyRound,
          roles: ['super_admin', 'dispatch', 'it_support']
        },
        {
          id: 'system_health',
          label: 'Kesehatan Sistem',
          icon: Activity,
          badge: 'OK',
          badgeColor: 'emerald',
          roles: ['super_admin', 'it_support']
        }
      ]
    },
    {
      id: 'setup',
      title: 'Setup',
      icon: Sliders,
      items: [
        {
          id: 'setup',
          label: 'Setup Terpusat MoraJaws',
          icon: Sliders,
          badge: 'Hub',
          badgeColor: 'purple',
          highlight: true,
          roles: ['super_admin', 'dispatch', 'leader', 'management_data', 'it_support']
        },
        {
          id: 'offline_sync',
          label: 'Sinkronisasi Offline',
          icon: Database,
          roles: ['super_admin', 'dispatch', 'leader', 'installer']
        }
      ]
    }
  ];

  // Filter groups and items by user role
  const accessibleGroups = menuGroups
    .map(group => ({
      ...group,
      items: group.items.filter(item => item.roles.includes(userRole))
    }))
    .filter(group => group.items.length > 0);

  // Accordion state: which groups are expanded
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    accessibleGroups.forEach(g => {
      // By default open the group containing activeTab, or first 2 groups
      const hasActive = g.items.some(it => it.id === activeTab || (activeTab.startsWith('setup') && g.id === 'setup'));
      initial[g.id] = hasActive || g.id === 'dashboard' || g.id === 'operasional';
    });
    return initial;
  });

  // Keep group open if activeTab changes
  useEffect(() => {
    accessibleGroups.forEach(g => {
      if (g.items.some(it => it.id === activeTab || (activeTab === 'setup' && g.id === 'setup'))) {
        setOpenGroups(prev => ({ ...prev, [g.id]: true }));
      }
    });
  }, [activeTab]);

  const toggleGroup = (groupId: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const handleItemClick = (id: string) => {
    onNavigate(id);
    // Auto close on mobile
    if (isMobileView || (typeof window !== 'undefined' && window.innerWidth < 768)) {
      if (config.device?.android?.autoCloseSidebarOnNavigate !== false) {
        onChangeState('closed');
      }
    }
  };

  if (sidebarState === 'closed') {
    return null;
  }

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-45 md:hidden animate-fadeIn"
        onClick={() => onChangeState('closed')}
      />

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 md:relative md:inset-auto md:z-auto bg-[#160D29] text-slate-200 border-r border-[#35105E] transition-all duration-300 ease-in-out flex flex-col shrink-0 shadow-2xl md:shadow-none h-full ${
          isMinimized ? 'w-18' : 'w-64'
        }`}
      >
        {/* Top Header */}
        <div className="px-3.5 py-3 border-b border-[#35105E] flex items-center justify-between">
          {!isMinimized ? (
            <>
              <div className="flex items-center gap-2">
                <MoraJawsLogo size="xs" animated={false} />
                <span className="font-bold text-[#D8B4FE] uppercase tracking-wider text-[11px]">
                  Menu Navigasi
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onChangeState('minimized')}
                  className="p-1.5 text-purple-300 hover:text-white hover:bg-[#35105E] rounded-lg transition-colors cursor-pointer"
                  title="Kecilkan ke Ikon"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onChangeState('closed')}
                  className="p-1.5 text-purple-300 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                  title="Tutup Menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="w-full flex items-center justify-center gap-1">
              <button
                type="button"
                onClick={() => onChangeState('expanded')}
                className="p-1.5 text-purple-300 hover:text-white hover:bg-[#35105E] rounded-lg transition-colors cursor-pointer"
                title="Perbesar Menu (Expand)"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onChangeState('closed')}
                className="p-1.5 text-purple-300 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                title="Tutup Menu"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Accordion Menu List */}
        <div className="flex-1 py-3 px-2 space-y-2 overflow-y-auto scrollbar-thin">
          {accessibleGroups.map(group => {
            const GroupIcon = group.icon;
            const isOpen = !!openGroups[group.id];
            const hasActiveChild = group.items.some(
              item => activeTab === item.id || (activeTab === 'setup' && group.id === 'setup')
            );

            return (
              <div
                key={group.id}
                className={`rounded-xl transition-all ${
                  !isMinimized && hasActiveChild ? 'bg-[#251545]/60 border border-[#7135B5]/40' : ''
                }`}
              >
                {/* Accordion Header (Only in expanded mode) */}
                {!isMinimized ? (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-purple-200 hover:text-white hover:bg-[#35105E]/60 rounded-xl transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <GroupIcon className={`w-4 h-4 ${hasActiveChild ? 'text-[#D8B4FE]' : 'text-purple-400'}`} />
                      <span className="tracking-wide uppercase text-[11px]">{group.title}</span>
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-purple-400 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-[#D8B4FE]' : ''
                      }`}
                    />
                  </button>
                ) : (
                  <div className="my-1 border-t border-[#35105E]/80" />
                )}

                {/* Submenu Items */}
                {(!isMinimized ? isOpen : true) && (
                  <div className={`space-y-1 ${!isMinimized ? 'pl-2 pr-1 pt-1 pb-1.5 animate-fadeIn' : ''}`}>
                    {group.items.map(item => {
                      const Icon = item.icon;
                      const isActive =
                        activeTab === item.id ||
                        (item.id === 'setup' &&
                          ['setup', 'users', 'management_role', 'setting_droplist', 'ui_builder', 'database_management', 'database_sync', 'sheets_sync', 'workflows'].includes(
                            activeTab
                          ));

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleItemClick(item.id)}
                          title={isMinimized ? `${group.title} > ${item.label}` : undefined}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                            isActive
                              ? 'bg-gradient-to-r from-[#5B35B1] to-[#7135B5] text-white font-bold shadow-md shadow-[#5B35B1]/40 border border-[#D8B4FE]/30'
                              : item.highlight
                              ? 'text-[#E9D5FF] bg-[#35105E]/80 hover:bg-[#5B35B1]/50'
                              : 'text-purple-200 hover:text-white hover:bg-[#35105E]/50'
                          } ${isMinimized ? 'justify-center p-2.5' : ''}`}
                        >
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#D8B4FE]' : 'text-purple-300'}`} />

                          {!isMinimized && (
                            <div className="flex-1 flex items-center justify-between text-left truncate">
                              <span className="truncate">{item.label}</span>
                              {item.badge !== undefined && (
                                <span
                                  className={`ml-2 px-1.5 py-0.2 text-[9.5px] font-bold rounded-full ${
                                    isActive
                                      ? 'bg-white text-[#35105E]'
                                      : item.badgeColor === 'amber'
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                      : item.badgeColor === 'emerald'
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                      : 'bg-[#5B35B1] text-purple-100'
                                  }`}
                                >
                                  {item.badge}
                                </span>
                              )}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer info & Logout */}
        <div className="p-2.5 border-t border-[#35105E] bg-[#100921] space-y-2">
          {!isMinimized ? (
            <div className="flex items-center justify-between px-2 text-[11px] text-purple-300">
              <span className="truncate">
                Role: <strong className="text-white capitalize">{userRole.replace('_', ' ')}</strong>
              </span>
              <button
                type="button"
                onClick={() => onChangeState('minimized')}
                className="p-1 text-purple-400 hover:text-white hover:bg-[#35105E] rounded transition-colors"
                title="Minimize Menu"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => onChangeState('expanded')}
                className="p-1.5 text-purple-400 hover:text-white hover:bg-[#35105E] rounded transition-colors"
                title="Expand Menu"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {userRole === 'super_admin' && (
            <button
              type="button"
              onClick={() => setIsSessionModalOpen(true)}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-purple-200 hover:text-white hover:bg-[#35105E] text-xs font-semibold transition-colors cursor-pointer ${
                isMinimized ? 'justify-center' : ''
              }`}
              title="Kelola Sesi Staf Aktif"
            >
              <KeyRound className="w-3.5 h-3.5 shrink-0 text-[#D8B4FE]" />
              {!isMinimized && <span className="truncate">Sesi Staf Aktif</span>}
            </button>
          )}

          <button
            type="button"
            onClick={logout}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-400 hover:text-rose-200 hover:bg-rose-950/40 text-xs font-semibold transition-colors cursor-pointer ${
              isMinimized ? 'justify-center' : ''
            }`}
            title="Keluar / Logout"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            {!isMinimized && <span>Keluar / Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
