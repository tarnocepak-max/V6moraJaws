import React, { useState, useEffect, useMemo } from 'react';
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
  Sliders,
  History,
  ChevronDown,
  X,
  RefreshCw,
  Database,
  KeyRound,
  LogOut,
  Zap,
  Calendar,
  Activity,
  MessageSquare,
  ShieldCheck,
  Building2,
  Layers,
  FileText,
  UserCheck,
  BarChart3,
  UserPlus,
  SlidersHorizontal,
  FolderTree,
  Bell,
  Settings as SettingsIcon,
  CheckCircle2,
  ListOrdered
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
  const { isMobileView, config, navigationSettings, navigationItems } = useUIConfig();

  const totalActiveTickets = tickets.filter(t => !t.isArchived && !t.isDeleted).length;
  const unassignedCount = tickets.filter(t => !t.installerName && !t.isArchived && !t.isDeleted).length;
  const userRole = currentUser?.role || 'installer';

  // Navigation mode determined by Role and Category Overrides from Firestore
  const roleDisplayMode = useMemo(() => {
    const rModes = navigationSettings?.roleModes || {
      super_admin: 'accordion',
      dispatch: 'accordion',
      leader: 'static',
      installer: 'static',
      management_data: 'accordion',
      it_support: 'accordion'
    };
    return rModes[userRole as keyof typeof rModes] || navigationSettings?.defaultMode || 'static';
  }, [navigationSettings, userRole]);

  // Master definition of 7 Navigation Groups aligned strictly with BAGIAN 2.2
  const baseMenuGroups: NavGroup[] = useMemo(() => [
    {
      id: 'dashboard',
      title: 'DASHBOARD',
      icon: LayoutDashboard,
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard Monitoring',
          icon: LayoutDashboard,
          roles: ['super_admin', 'dispatch', 'leader', 'management_data', 'it_support']
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
      title: 'OPERASIONAL',
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
          id: 'import',
          label: 'Import Data WO',
          icon: FileSpreadsheet,
          roles: ['super_admin', 'dispatch', 'management_data']
        },
        {
          id: 'form_sameday',
          label: 'Form Sameday Express',
          icon: Zap,
          badge: 'Express',
          badgeColor: 'amber',
          roles: ['dispatch']
        }
      ]
    },
    {
      id: 'wo_contractor',
      title: 'WO CONTRACTOR',
      icon: Building2,
      items: [
        {
          id: 'wo_assignment',
          label: 'Assign WO',
          icon: UserCheck,
          badge: unassignedCount > 0 ? `${unassignedCount} Belum` : undefined,
          badgeColor: 'amber',
          roles: ['super_admin', 'dispatch', 'leader']
        },
        {
          id: 'progress_dashboard',
          label: 'Dashboard Progress WO',
          icon: BarChart3,
          badge: 'Live',
          badgeColor: 'purple',
          roles: ['super_admin', 'dispatch', 'leader']
        },
        {
          id: 'installer_mgmt',
          label: 'Pendaftaran Akun Teknisi',
          icon: UserPlus,
          roles: ['super_admin', 'leader']
        },
        {
          id: 'quota_settings',
          label: 'Pengaturan Kuota & Kolom Visibilitas',
          icon: SlidersHorizontal,
          roles: ['super_admin', 'leader']
        },
        {
          id: 'contractor_recap',
          label: 'Rekap Total WO per Kontraktor',
          icon: FileText,
          roles: ['super_admin', 'dispatch', 'leader', 'management_data']
        },
        {
          id: 'location_basecamp',
          label: 'Kontraktor & Basecamp',
          icon: Building2,
          roles: ['super_admin', 'dispatch', 'leader']
        }
      ]
    },
    {
      id: 'task_installer',
      title: 'TASK INSTALLER',
      icon: Wrench,
      items: [
        {
          id: 'installer_portal',
          label: 'Portal Teknisi Lapangan',
          icon: Wrench,
          roles: ['super_admin', 'dispatch', 'installer']
        },
        {
          id: 'installer_tasks',
          label: 'Tugas Saya',
          icon: CheckCircle2,
          roles: ['super_admin', 'dispatch', 'installer']
        },
        {
          id: 'installer_progress',
          label: 'Dashboard Progress Teknisi',
          icon: BarChart3,
          roles: ['super_admin', 'dispatch', 'installer']
        },
        {
          id: 'installer_history',
          label: 'Riwayat Pekerjaan Teknisi',
          icon: History,
          roles: ['super_admin', 'dispatch', 'installer']
        }
      ]
    },
    {
      id: 'pelanggan',
      title: 'PELANGGAN',
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
      title: 'LAPORAN',
      icon: FileSpreadsheet,
      items: [
        {
          id: 'report_data_wo',
          label: 'Report Data WO',
          icon: FileSpreadsheet,
          roles: ['super_admin', 'dispatch', 'management_data']
        },
        {
          id: 'report_installer',
          label: 'Report Installer',
          icon: FileText,
          roles: ['super_admin', 'dispatch', 'management_data', 'leader']
        },
        {
          id: 'rekap_laporan',
          label: 'Rekap Laporan',
          icon: Layers,
          roles: ['super_admin', 'dispatch', 'leader', 'management_data']
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
      title: 'SETUP',
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
          id: 'nav_config',
          label: 'Konfigurasi Menu Navigasi',
          icon: FolderTree,
          roles: ['super_admin']
        },
        {
          id: 'users',
          label: 'Manajemen Pengguna',
          icon: Users2,
          roles: ['super_admin']
        },
        {
          id: 'management_role',
          label: 'Role & Permission',
          icon: ShieldCheck,
          roles: ['super_admin']
        },
        {
          id: 'database_management',
          label: 'Pengaturan Database',
          icon: Database,
          roles: ['super_admin']
        },
        {
          id: 'setting_droplist_status',
          label: 'Kategori Report',
          icon: ListOrdered,
          roles: ['super_admin', 'dispatch']
        },
        {
          id: 'setting_droplist_reason',
          label: 'Reason Report',
          icon: FileText,
          roles: ['super_admin', 'dispatch']
        },
        {
          id: 'setting_droplist_rootcause',
          label: 'Rootcause',
          icon: Activity,
          roles: ['super_admin', 'dispatch']
        },
        {
          id: 'sound_settings',
          label: 'Pengaturan Notifikasi',
          icon: Bell,
          roles: ['super_admin', 'dispatch', 'leader', 'installer']
        },
        {
          id: 'settings',
          label: 'Pengaturan Sistem',
          icon: SettingsIcon,
          roles: ['super_admin']
        },
        {
          id: 'offline_sync',
          label: 'Sinkronisasi Offline',
          icon: RefreshCw,
          roles: ['super_admin', 'dispatch', 'leader', 'installer']
        }
      ]
    }
  ], [totalActiveTickets, unassignedCount]);

  // Synchronize item labels with custom names defined in NavigationConfigView if any
  const customizedGroups = useMemo(() => {
    const labelMap = new Map<string, string>();
    if (Array.isArray(navigationItems)) {
      navigationItems.forEach(item => {
        if (item.id && item.label) {
          labelMap.set(item.id, item.label);
        }
      });
    }

    return baseMenuGroups.map(group => ({
      ...group,
      items: group.items.map(item => ({
        ...item,
        label: labelMap.get(item.id) || item.label
      }))
    }));
  }, [baseMenuGroups, navigationItems]);

  // Filter groups and items by current user role permission
  const accessibleGroups = useMemo(() => {
    return customizedGroups
      .map(group => ({
        ...group,
        items: group.items.filter(item => item.roles.includes(userRole))
      }))
      .filter(group => group.items.length > 0);
  }, [customizedGroups, userRole]);

  // Accordion state: which groups are currently open (only used when a group is in Accordion mode)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    accessibleGroups.forEach(g => {
      // By default open the group containing activeTab, or first 2 groups
      const hasActive = g.items.some(
        it => it.id === activeTab || (activeTab.startsWith('setup') && g.id === 'setup')
      );
      initial[g.id] = hasActive || g.id === 'dashboard' || g.id === 'operasional' || g.id === 'wo_contractor' || g.id === 'task_installer';
    });
    return initial;
  });

  // Ensure active category is open when activeTab changes
  useEffect(() => {
    accessibleGroups.forEach(g => {
      if (g.items.some(it => it.id === activeTab || (activeTab.startsWith('setup') && g.id === 'setup'))) {
        setOpenGroups(prev => ({ ...prev, [g.id]: true }));
      }
    });
  }, [activeTab, accessibleGroups]);

  // Toggle category group for Accordion mode
  const toggleGroup = (groupId: string) => {
    const allowMultiple = navigationSettings?.allowMultipleOpenGroups !== false;
    setOpenGroups(prev => {
      if (allowMultiple) {
        return { ...prev, [groupId]: !prev[groupId] };
      }
      // Single open group mode
      const next: Record<string, boolean> = {};
      Object.keys(prev).forEach(k => { next[k] = false; });
      next[groupId] = !prev[groupId];
      return next;
    });
  };

  const handleItemClick = (id: string) => {
    onNavigate(id);
    // Auto-close on mobile if configured
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
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-45 md:hidden animate-fadeIn"
        onClick={() => onChangeState('closed')}
      />

      {/* Sidebar Main Frame */}
      <aside
        className="fixed inset-y-0 left-0 z-50 md:relative md:inset-auto md:z-auto bg-[#160D29] text-slate-200 border-r border-[#35105E] transition-all duration-300 ease-in-out flex flex-col shrink-0 shadow-2xl md:shadow-none h-full w-64 select-none"
      >
        {/* Top Header */}
        <div className="px-4 py-3.5 border-b border-[#35105E] flex items-center justify-between bg-[#110A21]">
          <div className="flex items-center gap-2.5">
            <MoraJawsLogo size="xs" animated={false} />
            <div className="flex flex-col">
              <span className="font-extrabold text-[#D8B4FE] uppercase tracking-wider text-[11px] leading-tight">
                Menu Navigasi
              </span>
              <span className="text-[9.5px] text-purple-400 font-medium">
                Mode: <strong className="text-white capitalize">{roleDisplayMode}</strong>
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onChangeState('closed')}
            className="p-1.5 text-purple-300 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
            title="Tutup Menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Navigation Category Groups */}
        <div className="flex-1 py-3 px-2.5 space-y-2.5 overflow-y-auto scrollbar-thin">
          {accessibleGroups.map(group => {
            const GroupIcon = group.icon;

            // Determine if THIS category uses Accordion or Static
            const categoryOverride =
              navigationSettings?.categoryModes?.[group.id] ||
              navigationSettings?.categoryModes?.[group.title];
            const isAccordion = categoryOverride ? categoryOverride === 'accordion' : roleDisplayMode === 'accordion';

            const isOpen = isAccordion ? !!openGroups[group.id] : true;
            const hasActiveChild = group.items.some(
              item => activeTab === item.id || (activeTab === 'setup' && group.id === 'setup')
            );

            return (
              <div
                key={group.id}
                className={`rounded-xl transition-all duration-200 ${
                  hasActiveChild
                    ? 'bg-[#251545]/70 border border-[#7135B5]/40 shadow-xs'
                    : 'bg-[#1C1133]/40 border border-[#35105E]/40'
                }`}
              >
                {/* CATEGORY HEADER */}
                {isAccordion ? (
                  // ACCORDION MODE: Interactive Button with Chevron Arrow
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-purple-200 hover:text-white hover:bg-[#35105E]/60 rounded-xl transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <GroupIcon className={`w-4 h-4 ${hasActiveChild ? 'text-[#D8B4FE]' : 'text-purple-400'}`} />
                      <span className="tracking-wide uppercase text-[11px] font-bold">{group.title}</span>
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-purple-400 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-[#D8B4FE]' : ''
                      }`}
                    />
                  </button>
                ) : (
                  // STATIC NAVIGATION MODE: Clean Static Header, NO Arrow, Submenus ALWAYS Visible
                  <div className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-extrabold text-purple-300 border-b border-[#35105E]/40">
                    <GroupIcon className={`w-4 h-4 ${hasActiveChild ? 'text-[#D8B4FE]' : 'text-purple-400'}`} />
                    <span className="tracking-wider uppercase text-[11px]">{group.title}</span>
                  </div>
                )}

                {/* SUBMENU ITEMS */}
                {isOpen && (
                  <div className="space-y-1 pl-1.5 pr-1 py-1.5 animate-fadeIn">
                    {group.items.map(item => {
                      const Icon = item.icon;
                      const isActive =
                        activeTab === item.id ||
                        (item.id === 'tickets' && (activeTab === 'tickets' || activeTab === 'wo_management')) ||
                        (item.id === 'installer_portal' && (activeTab === 'installer_portal' || activeTab === 'installer_tasks' || activeTab === 'installer_progress' || activeTab === 'installer_history')) ||
                        (item.id === 'contractor_recap' && (activeTab === 'contractor_recap' || activeTab === 'rekap_laporan')) ||
                        (item.id === 'setup' &&
                          ['setup', 'ui_builder', 'workflows', 'database_sync', 'sheets_sync'].includes(activeTab));

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleItemClick(item.id)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                            isActive
                              ? 'bg-gradient-to-r from-[#5B35B1] to-[#7135B5] text-white font-bold shadow-md shadow-[#5B35B1]/40 border border-[#D8B4FE]/30'
                              : item.highlight
                              ? 'text-[#E9D5FF] bg-[#35105E]/80 hover:bg-[#5B35B1]/50'
                              : 'text-purple-200 hover:text-white hover:bg-[#35105E]/50'
                          }`}
                        >
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#D8B4FE]' : 'text-purple-300'}`} />
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
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer: Role Information & Logout */}
        <div className="p-3 border-t border-[#35105E] bg-[#100921] space-y-2 shrink-0">
          <div className="flex items-center justify-between px-2 text-[11px] text-purple-300">
            <span className="truncate">
              Role: <strong className="text-white capitalize">{userRole.replace('_', ' ')}</strong>
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-[#35105E] text-[#D8B4FE] border border-[#7135B5]/40 capitalize">
              {roleDisplayMode}
            </span>
          </div>

          {userRole === 'super_admin' && (
            <button
              type="button"
              onClick={() => setIsSessionModalOpen(true)}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-purple-200 hover:text-white hover:bg-[#35105E] text-xs font-semibold transition-colors cursor-pointer"
              title="Kelola Sesi Staf Aktif"
            >
              <KeyRound className="w-3.5 h-3.5 shrink-0 text-[#D8B4FE]" />
              <span className="truncate">Sesi Staf Aktif</span>
            </button>
          )}

          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-400 hover:text-rose-200 hover:bg-rose-950/40 text-xs font-semibold transition-colors cursor-pointer"
            title="Keluar / Logout"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            <span>Keluar / Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};
