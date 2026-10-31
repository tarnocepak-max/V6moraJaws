import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useUIConfig } from '../../context/UIConfigContext';
import { MoraJawsLogo } from '../common/MoraJawsLogo';
import { isCategoryAccordion } from '../../types';
import {
  LayoutDashboard,
  FileSpreadsheet,
  Ticket as TicketIcon,
  Users2,
  MessageSquareQuote,
  Sliders,
  History,
  ChevronDown,
  X,
  RefreshCw,
  Database,
  KeyRound,
  LogOut,
  Calendar,
  Activity,
  MessageSquare,
  ShieldCheck,
  Building2,
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
  const isInstaller = userRole === 'installer';

  // Customized label map from NavigationConfigView
  const customLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    if (Array.isArray(navigationItems)) {
      navigationItems.forEach(item => {
        if (item.id && item.label) {
          map.set(item.id, item.label);
        }
      });
    }
    return map;
  }, [navigationItems]);

  // =========================================================================
  // 1. MENU UTAMA STATIC MANDIRI (Positioned directly at top of Sidebar)
  // Ketentuan: Langsung di bawah logo, tanpa kategori induk, tanpa accordion,
  // tanpa chevron, klik langsung membuka route.
  // =========================================================================
  const staticMandiriMenus: NavMenuItem[] = useMemo(() => {
    // KHUSUS ROLE INSTALLER: Hanya 2 menu navigasi (Dashboard Installer & Tugas Saya)
    if (isInstaller) {
      return [
        {
          id: 'installer_portal',
          label: customLabelMap.get('installer_portal') || 'Dashboard Installer',
          icon: LayoutDashboard,
          roles: ['installer']
        },
        {
          id: 'installer_tasks',
          label: customLabelMap.get('installer_tasks') || 'Tugas Saya',
          icon: CheckCircle2,
          roles: ['installer']
        }
      ];
    }

    // Role Non-Installer: 6 Menu Mandiri (Tugas Saya khusus Installer)
    const allMandiri: NavMenuItem[] = [
      {
        id: 'dashboard',
        label: customLabelMap.get('dashboard') || 'Dashboard Monitoring',
        icon: LayoutDashboard,
        roles: ['super_admin', 'dispatch', 'leader', 'management_data', 'it_support']
      },
      {
        id: 'tickets',
        label: customLabelMap.get('tickets') || 'Work Order Management',
        icon: TicketIcon,
        badge: totalActiveTickets,
        badgeColor: 'purple',
        roles: ['super_admin', 'dispatch']
      },
      {
        id: 'schedule',
        label: customLabelMap.get('schedule') || 'Jadwal & Kalender',
        icon: Calendar,
        roles: ['super_admin', 'dispatch', 'leader']
      },
      {
        id: 'import',
        label: customLabelMap.get('import') || 'Import Data WO',
        icon: FileSpreadsheet,
        roles: ['super_admin', 'dispatch', 'management_data']
      },
      {
        id: 'users',
        label: customLabelMap.get('users') || 'Manajemen Akun',
        icon: Users2,
        roles: ['super_admin']
      },
      {
        id: 'database_management',
        label: customLabelMap.get('database_management') || 'Database Application',
        icon: Database,
        roles: ['super_admin']
      }
    ];

    return allMandiri.filter(item => item.roles.includes(userRole));
  }, [isInstaller, userRole, customLabelMap, totalActiveTickets]);

  // =========================================================================
  // 2. KATEGORI MENU (Positioned below the divider - Omitted for Installer)
  // A. WO CONTRACTOR — STATIC (Accordion OFF)
  // B. PELANGGAN — ACCORDION (Accordion ON)
  // C. LAPORAN — ACCORDION (Accordion ON)
  // D. SETUP — ACCORDION (Accordion ON)
  // =========================================================================
  const categoryGroups: NavGroup[] = useMemo(() => {
    if (isInstaller) return [];

    const rawGroups: NavGroup[] = [
      // A. WO CONTRACTOR — STATIC
      {
        id: 'wo_contractor',
        title: 'WO CONTRACTOR',
        icon: Building2,
        items: [
          {
            id: 'wo_assignment',
            label: customLabelMap.get('wo_assignment') || 'Assign WO',
            icon: UserCheck,
            badge: unassignedCount > 0 ? `${unassignedCount} Belum` : undefined,
            badgeColor: 'amber',
            roles: ['super_admin', 'dispatch', 'leader']
          },
          {
            id: 'progress_dashboard',
            label: customLabelMap.get('progress_dashboard') || 'Dashboard Progress WO',
            icon: BarChart3,
            badge: 'Live',
            badgeColor: 'purple',
            roles: ['super_admin', 'dispatch', 'leader']
          },
          {
            id: 'installer_mgmt',
            label: customLabelMap.get('installer_mgmt') || 'Pendaftaran Akun Teknisi',
            icon: UserPlus,
            roles: ['super_admin', 'leader']
          },
          {
            id: 'quota_settings',
            label: customLabelMap.get('quota_settings') || 'Pengaturan Kuota & Kolom Visibilitas',
            icon: SlidersHorizontal,
            roles: ['super_admin', 'leader']
          },
          {
            id: 'contractor_recap',
            label: customLabelMap.get('contractor_recap') || 'Rekap Total WO per Kontraktor',
            icon: FileText,
            roles: ['super_admin', 'dispatch', 'leader', 'management_data']
          }
        ]
      },
      // B. PELANGGAN — ACCORDION
      {
        id: 'pelanggan',
        title: 'PELANGGAN',
        icon: MessageSquare,
        items: [
          {
            id: 'contact_centre',
            label: customLabelMap.get('contact_centre') || 'Contact Centre',
            icon: MessageSquare,
            roles: ['super_admin', 'dispatch', 'leader']
          },
          {
            id: 'templates',
            label: customLabelMap.get('templates') || 'Template WhatsApp',
            icon: MessageSquareQuote,
            roles: ['super_admin', 'dispatch', 'leader']
          }
        ]
      },
      // C. LAPORAN — ACCORDION
      {
        id: 'laporan',
        title: 'LAPORAN',
        icon: FileSpreadsheet,
        items: [
          {
            id: 'report_data_wo',
            label: customLabelMap.get('report_data_wo') || 'Report Data WO',
            icon: FileSpreadsheet,
            roles: ['super_admin', 'dispatch', 'management_data']
          },
          {
            id: 'report_installer',
            label: customLabelMap.get('report_installer') || 'Report Installer',
            icon: FileText,
            roles: ['super_admin', 'dispatch', 'management_data', 'leader']
          },
          {
            id: 'audit_logs',
            label: customLabelMap.get('audit_logs') || 'Audit Trail Log',
            icon: History,
            roles: ['super_admin', 'it_support']
          },
          {
            id: 'login_logs',
            label: customLabelMap.get('login_logs') || 'Riwayat Sesi Login',
            icon: KeyRound,
            roles: ['super_admin', 'dispatch', 'it_support']
          },
          {
            id: 'system_health',
            label: customLabelMap.get('system_health') || 'Kesehatan Sistem',
            icon: Activity,
            badge: 'OK',
            badgeColor: 'emerald',
            roles: ['super_admin', 'it_support']
          }
        ]
      },
      // D. SETUP — ACCORDION
      {
        id: 'setup',
        title: 'SETUP',
        icon: Sliders,
        items: [
          {
            id: 'setup',
            label: customLabelMap.get('setup') || 'Setup Terpusat MoraJaws',
            icon: Sliders,
            badge: 'Hub',
            badgeColor: 'purple',
            highlight: true,
            roles: ['super_admin', 'dispatch', 'leader', 'management_data', 'it_support']
          },
          {
            id: 'nav_config',
            label: customLabelMap.get('nav_config') || 'Konfigurasi Menu Navigasi',
            icon: FolderTree,
            roles: ['super_admin']
          },
          {
            id: 'management_role',
            label: customLabelMap.get('management_role') || 'Role & Permission',
            icon: ShieldCheck,
            roles: ['super_admin']
          },
          {
            id: 'setting_droplist_status',
            label: customLabelMap.get('setting_droplist_status') || 'Kategori Report',
            icon: ListOrdered,
            roles: ['super_admin', 'dispatch']
          },
          {
            id: 'setting_droplist_reason',
            label: customLabelMap.get('setting_droplist_reason') || 'Reason Report',
            icon: FileText,
            roles: ['super_admin', 'dispatch']
          },
          {
            id: 'setting_droplist_rootcause',
            label: customLabelMap.get('setting_droplist_rootcause') || 'Rootcause',
            icon: Activity,
            roles: ['super_admin', 'dispatch']
          },
          {
            id: 'sound_settings',
            label: customLabelMap.get('sound_settings') || 'Pengaturan Notifikasi',
            icon: Bell,
            roles: ['super_admin', 'dispatch', 'leader']
          },
          {
            id: 'settings',
            label: customLabelMap.get('settings') || 'Pengaturan Sistem',
            icon: SettingsIcon,
            roles: ['super_admin']
          },
          {
            id: 'offline_sync',
            label: customLabelMap.get('offline_sync') || 'Sinkronisasi Offline',
            icon: RefreshCw,
            roles: ['super_admin', 'dispatch', 'leader']
          }
        ]
      }
    ];

    return rawGroups
      .map(group => ({
        ...group,
        items: group.items.filter(item => item.roles.includes(userRole))
      }))
      .filter(group => group.items.length > 0);
  }, [isInstaller, userRole, customLabelMap, unassignedCount]);

  // =========================================================================
  // 3. ACCORDION STATE (Single Open Group Mode per Bagian 8)
  // =========================================================================
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    categoryGroups.forEach(g => {
      const isAccordion = isCategoryAccordion(g.id, navigationSettings);
      if (isAccordion) {
        const hasActive = g.items.some(
          it => it.id === activeTab || (activeTab.startsWith('setup') && g.id === 'setup')
        );
        initial[g.id] = hasActive;
      } else {
        // Static categories are always fully open
        initial[g.id] = true;
      }
    });
    return initial;
  });

  // Ensure active category is open when activeTab changes (single open mode)
  useEffect(() => {
    categoryGroups.forEach(g => {
      const isAccordion = isCategoryAccordion(g.id, navigationSettings);
      if (isAccordion) {
        const hasActive = g.items.some(
          it => it.id === activeTab || (activeTab.startsWith('setup') && g.id === 'setup')
        );
        if (hasActive) {
          setOpenGroups(() => {
            const next: Record<string, boolean> = {};
            // Keep static groups open, set only active accordion group to true
            categoryGroups.forEach(cg => {
              if (!isCategoryAccordion(cg.id, navigationSettings)) {
                next[cg.id] = true;
              }
            });
            next[g.id] = true;
            return next;
          });
        }
      }
    });
  }, [activeTab, categoryGroups, navigationSettings]);

  // Toggle Accordion (Enforces Bagian 8: Hanya satu kategori Accordion terbuka pada satu waktu)
  const toggleGroup = (groupId: string) => {
    setOpenGroups(prev => {
      const isCurrentlyOpen = !!prev[groupId];
      const next: Record<string, boolean> = {};
      // Static categories always stay open
      categoryGroups.forEach(cg => {
        if (!isCategoryAccordion(cg.id, navigationSettings)) {
          next[cg.id] = true;
        }
      });
      next[groupId] = !isCurrentlyOpen;
      return next;
    });
  };

  const handleItemClick = (id: string) => {
    onNavigate(id);
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
        {/* Top Header with MoraJaws Logo */}
        <div className="px-4 py-3.5 border-b border-[#35105E] flex items-center justify-between bg-[#110A21]">
          <div className="flex items-center gap-2.5">
            <MoraJawsLogo size="xs" animated={false} />
            <div className="flex flex-col">
              <span className="font-extrabold text-[#D8B4FE] uppercase tracking-wider text-[11px] leading-tight">
                Menu Navigasi
              </span>
              <span className="text-[9.5px] text-purple-400 font-medium">
                MoraJaws Operations
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

        {/* Scrollable Navigation Body */}
        <div className="flex-1 py-3 px-2.5 space-y-2 overflow-y-auto scrollbar-thin">
          {/* ============================================================ */}
          {/* A. MENU UTAMA STATIC MANDIRI (DI POSISI PALING ATAS)         */}
          {/* Tanpa judul kelompok "MENU UTAMA" per Bagian 1 & 6           */}
          {/* ============================================================ */}
          <div className="space-y-1">
            {staticMandiriMenus.map(item => {
              const Icon = item.icon;
              const isActive =
                activeTab === item.id ||
                (item.id === 'tickets' && activeTab === 'wo_management') ||
                (item.id === 'installer_portal' && (activeTab === 'installer_portal' || activeTab === 'installer_dashboard'));

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleItemClick(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-[#5B35B1] to-[#7135B5] text-white font-bold shadow-md shadow-[#5B35B1]/40 border-l-4 border-l-[#D8B4FE] border-y border-r border-[#D8B4FE]/30'
                      : 'text-purple-200 hover:text-white hover:bg-[#35105E]/50 border-l-4 border-l-transparent'
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

          {/* ============================================================ */}
          {/* B. PEMISAH VISUAL RAPI (HANYA UNTUK NON-INSTALLER)           */}
          {/* Tanpa judul kelompok "KATEGORI MENU" per Bagian 1 & 6       */}
          {/* ============================================================ */}
          {categoryGroups.length > 0 && (
            <div className="my-2.5 border-t border-[#35105E]/60" />
          )}

          {/* ============================================================ */}
          {/* C. KATEGORI MENU (WO Contractor, Pelanggan, Laporan, Setup)  */}
          {/* ============================================================ */}
          {categoryGroups.map(group => {
            const GroupIcon = group.icon;
            const isAccordion = isCategoryAccordion(group.id, navigationSettings);
            const isOpen = isAccordion ? !!openGroups[group.id] : true;
            const hasActiveChild = group.items.some(
              item => activeTab === item.id || (activeTab === 'setup' && group.id === 'setup')
            );
            const hasSubmenus = group.items.length > 0;

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
                  // ACCORDION MODE: Tombol Interaktif dengan Chevron Arrow
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-purple-200 hover:text-white hover:bg-[#35105E]/60 rounded-xl transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <GroupIcon className={`w-4 h-4 ${hasActiveChild ? 'text-[#D8B4FE]' : 'text-purple-400 group-hover:text-purple-300'}`} />
                      <span className="tracking-wide uppercase text-[11px] font-bold">{group.title}</span>
                    </div>
                    {hasSubmenus && (
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-purple-400 transition-transform duration-300 ease-in-out ${
                          isOpen ? 'rotate-180 text-[#D8B4FE]' : 'rotate-0 text-purple-400 group-hover:text-purple-300'
                        }`}
                      />
                    )}
                  </button>
                ) : (
                  // STATIC MODE: Header Statis Bersih, TANPA Chevron, Submenu Selalu Terbuka
                  <div className="w-full flex items-center justify-between px-3 py-2 text-xs font-extrabold text-purple-300 border-b border-[#35105E]/40">
                    <div className="flex items-center gap-2.5">
                      <GroupIcon className={`w-4 h-4 ${hasActiveChild ? 'text-[#D8B4FE]' : 'text-purple-400'}`} />
                      <span className="tracking-wider uppercase text-[11px]">{group.title}</span>
                    </div>
                  </div>
                )}

                {/* SUBMENU ITEMS */}
                {isOpen && (
                  <div className="space-y-1 pl-1.5 pr-1 py-1.5 animate-fadeIn">
                    {group.items.map(item => {
                      const Icon = item.icon;
                      const isActive =
                        activeTab === item.id ||
                        (item.id === 'contractor_recap' && activeTab === 'rekap_laporan') ||
                        (item.id === 'setup' &&
                          ['ui_builder', 'workflows', 'database_sync', 'sheets_sync'].includes(activeTab));

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleItemClick(item.id)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                            isActive
                              ? 'bg-gradient-to-r from-[#5B35B1] to-[#7135B5] text-white font-bold shadow-md shadow-[#5B35B1]/40 border-l-4 border-l-[#D8B4FE] border-y border-r border-[#D8B4FE]/30'
                              : item.highlight
                              ? 'text-[#E9D5FF] bg-[#35105E]/80 hover:bg-[#5B35B1]/50 border-l-4 border-l-transparent'
                              : 'text-purple-200 hover:text-white hover:bg-[#35105E]/50 border-l-4 border-l-transparent'
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
            <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-[#35105E] text-[#D8B4FE] border border-[#7135B5]/40 uppercase tracking-wider">
              {currentUser?.username || 'user'}
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
