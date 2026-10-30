import React from 'react';
import { UserCheck, BarChart3, UserPlus, Sliders, Sparkles } from 'lucide-react';

export type LeaderTabType =
  | 'wo_assignment'
  | 'progress_dashboard'
  | 'installer_mgmt'
  | 'quota_settings'
  | 'contractor_recap';

interface LeaderBottomNavProps {
  activeTab: LeaderTabType;
  onTabChange: (tab: LeaderTabType) => void;
  unassignedCount?: number;
  installersCount?: number;
}

export const LeaderBottomNav: React.FC<LeaderBottomNavProps> = ({
  activeTab,
  onTabChange,
  unassignedCount = 0,
  installersCount = 0
}) => {
  const tabs = [
    {
      id: 'wo_assignment' as LeaderTabType,
      label: 'ASSIGN WO',
      shortLabel: 'Assign WO',
      icon: UserCheck,
      badge: unassignedCount > 0 ? unassignedCount : undefined,
      badgeColor: 'bg-amber-500 text-white font-bold animate-pulse'
    },
    {
      id: 'progress_dashboard' as LeaderTabType,
      label: 'DASHBOARD PROGRESS WO',
      shortLabel: 'Progress WO',
      icon: BarChart3,
      badge: 'Live',
      badgeColor: 'bg-[#5B35B1] text-[#E9D5FF]'
    },
    {
      id: 'installer_mgmt' as LeaderTabType,
      label: 'PENDAFTARAN AKUN TEKNISI',
      shortLabel: 'Akun Teknisi',
      icon: UserPlus,
      badge: installersCount > 0 ? installersCount : undefined,
      badgeColor: 'bg-emerald-600 text-white'
    },
    {
      id: 'quota_settings' as LeaderTabType,
      label: 'PENGATURAN KUOTA & KOLOM VISIBILITAS',
      shortLabel: 'Kuota & Kolom',
      icon: Sliders
    }
  ];

  return (
    <nav
      aria-label="Navigasi Utama Leader"
      className="fixed bottom-0 inset-x-0 z-40 bg-[#160D29]/95 backdrop-blur-md border-t-2 border-[#7135B5]/60 shadow-[0_-6px_25px_rgba(22,13,41,0.6)]"
    >
      <div className="max-w-5xl mx-auto grid grid-cols-4 items-center">
        {tabs.map((tab, idx) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center py-2.5 px-1 sm:px-2 min-h-[58px] transition-all cursor-pointer group select-none ${
                isActive
                  ? 'text-white'
                  : 'text-purple-300/70 hover:text-purple-100'
              }`}
            >
              {/* Active Glow Bar on top */}
              {isActive && (
                <div className="absolute top-0 inset-x-2 h-1 bg-gradient-to-r from-[#D8B4FE] via-[#A855F7] to-[#8064D9] rounded-b-full shadow-[0_0_10px_#D8B4FE]" />
              )}

              {/* Icon Container with subtle background badge */}
              <div
                className={`relative p-1 rounded-xl transition-transform ${
                  isActive
                    ? 'bg-[#35105E] text-[#D8B4FE] scale-110 shadow-[0_0_12px_rgba(216,180,254,0.35)]'
                    : 'group-hover:scale-105'
                }`}
              >
                <Icon className="w-5 h-5 sm:w-5.5 sm:h-5.5" />

                {/* Badge Indicator */}
                {tab.badge !== undefined && (
                  <span
                    className={`absolute -top-1.5 -right-2 px-1.5 py-0.2 rounded-full text-[9px] font-mono leading-tight shadow-xs ${
                      tab.badgeColor || 'bg-[#5B35B1] text-white'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={`text-[9.5px] sm:text-[11px] font-bold tracking-tight text-center mt-1 leading-tight line-clamp-1 uppercase ${
                  isActive
                    ? 'text-[#E9D5FF] font-black scale-100'
                    : 'text-purple-300/70'
                }`}
              >
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
