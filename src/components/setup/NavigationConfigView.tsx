import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useUIConfig, NavigationMenuItem } from '../../context/UIConfigContext';
import { useToast } from '../../context/ToastContext';
import {
  FolderTree,
  Save,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  Cloud,
  Edit2,
  Check,
  X,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  Layers,
  Eye,
  LayoutDashboard,
  Building2,
  Wrench,
  MessageSquare,
  FileSpreadsheet,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  SlidersHorizontal,
  Smartphone,
  Calendar,
  Ticket as TicketIcon,
  Zap,
  UserCheck,
  BarChart3,
  UserPlus,
  History,
  KeyRound,
  Activity,
  Bell,
  Settings as SettingsIcon,
  Database,
  Users2,
  ListOrdered
} from 'lucide-react';
import { getCategoryPermanentId, isCategoryAccordion } from '../../types';

// Category icon map helper
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  dashboard: LayoutDashboard,
  operasional: Layers,
  woContractor: Building2,
  taskInstaller: Wrench,
  pelanggan: MessageSquare,
  laporan: FileSpreadsheet,
  setup: Sliders
};

export const NavigationConfigView: React.FC = () => {
  const { currentUser, addAuditLog, tickets } = useApp();
  const {
    navigationItems,
    menuCategories,
    updateNavigationItem,
    moveNavigationItem,
    renameCategory,
    moveCategory,
    resetNavigationMenu,
    saveConfigToFirestore,
    isCloudSyncing,
    lastCloudSyncTime,
    cloudSyncStatus,
    navigationSettings,
    setCategoryAccordion,
    resetNavigationSettings
  } = useUIConfig();
  const { toast } = useToast();

  const isSuperadmin = currentUser?.role === 'super_admin';

  // Category rename inline state
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [categoryDraftName, setCategoryDraftName] = useState<string>('');

  // Item rename inline state
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemDraftLabel, setItemDraftLabel] = useState<string>('');

  // Confirmation modal for restoring defaults
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Saving state
  const [isSaving, setIsSaving] = useState(false);

  // Live Sidebar Preview Modal
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewRole, setPreviewRole] = useState<'super_admin' | 'dispatch' | 'leader' | 'installer'>('super_admin');
  const [previewOpenGroups, setPreviewOpenGroups] = useState<Record<string, boolean>>({
    dashboard: false,
    operasional: true,
    woContractor: false,
    taskInstaller: false,
    pelanggan: true,
    laporan: true,
    setup: false
  });

  // Handle Category rename
  const handleStartEditCategory = (cat: string) => {
    if (!isSuperadmin) return;
    setEditingCategory(cat);
    setCategoryDraftName(cat);
  };

  const handleSaveEditCategory = (oldCat: string) => {
    if (!categoryDraftName.trim() || categoryDraftName.trim() === oldCat) {
      setEditingCategory(null);
      return;
    }
    renameCategory(oldCat, categoryDraftName.trim());
    setEditingCategory(null);
    toast.success(`Kategori berhasil diubah menjadi "${categoryDraftName.trim()}".`, 'Kategori Diperbarui');
  };

  // Handle Item rename
  const handleStartEditItem = (item: NavigationMenuItem) => {
    if (!isSuperadmin) return;
    setEditingItemId(item.id);
    setItemDraftLabel(item.label);
  };

  const handleSaveEditItem = (item: NavigationMenuItem) => {
    if (!itemDraftLabel.trim() || itemDraftLabel.trim() === item.label) {
      setEditingItemId(null);
      return;
    }
    updateNavigationItem(item.id, { label: itemDraftLabel.trim() });
    setEditingItemId(null);
    toast.success(`Nama menu "${item.id}" diubah menjadi "${itemDraftLabel.trim()}".`, 'Menu Diperbarui');
  };

  // Handle Accordion Mode Toggle for a Category
  const handleToggleAccordion = (categoryNameOrId: string, enabled: boolean) => {
    if (!isSuperadmin) {
      toast.error('Hanya Superadmin yang berwenang mengubah konfigurasi Accordion menu navigasi.', 'Akses Ditolak');
      return;
    }
    setCategoryAccordion(categoryNameOrId, enabled);
    const permId = getCategoryPermanentId(categoryNameOrId);
    toast.info(
      `Kategori "${categoryNameOrId}" diatur ke mode ${enabled ? 'ACCORDION ON (Expand/Collapse)' : 'ACCORDION OFF (Static Menu)'}. Jangan lupa klik "Simpan Konfigurasi" untuk menyimpan ke Cloud Firestore.`,
      'Mode Navigasi Diperbarui'
    );
  };

  // Handle Save to Firestore (Permanent Cloud Sync)
  const handleSaveToFirestore = async () => {
    if (!isSuperadmin) {
      toast.error('Hanya Superadmin yang memiliki izin menyimpan susunan menu ke Firestore.', 'Akses Ditolak');
      return;
    }

    setIsSaving(true);
    try {
      const res = await saveConfigToFirestore(currentUser.name || 'Superadmin');
      if (res.success) {
        addAuditLog(
          'UPDATE_NAVIGATION_CONFIG',
          'ui_config',
          'ui_configuration',
          `Menyimpan struktur navigasi menu (${menuCategories.length} kategori, ${navigationItems.length} submenu) dan mode Accordion per kategori ke Cloud Firestore`
        );
        toast.success(
          'Konfigurasi Accordion per kategori dan struktur menu navigasi berhasil disimpan ke Firebase Cloud Firestore secara global!',
          'Tersimpan ke Cloud'
        );
      } else {
        toast.error(`Gagal menyimpan ke Firestore: ${res.error}`, 'Error Simpan');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Terjadi kesalahan saat menyimpan ke Firestore', 'Gagal Simpan');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Restore Defaults
  const handleRestoreDefaults = async () => {
    if (!isSuperadmin) return;
    resetNavigationMenu();
    resetNavigationSettings();
    setShowResetConfirm(false);

    try {
      await saveConfigToFirestore(currentUser.name || 'Superadmin');
      addAuditLog(
        'RESTORE_DEFAULT_NAVIGATION',
        'ui_config',
        'ui_configuration',
        'Memulihkan seluruh nama, urutan menu, dan konfigurasi Accordion default (Dashboard OFF, Operasional ON, WO Contractor OFF, Task Installer OFF, Pelanggan ON, Laporan ON, Setup OFF)'
      );
      toast.success(
        'Seluruh pengaturan navigasi dan mode Accordion telah dipulihkan ke pengaturan default!',
        'Default Dipulihkan'
      );
    } catch {
      toast.info('Pengaturan navigasi lokal telah dipulihkan ke default.');
    }
  };

  // Pre-calculated stats for active tickets in preview
  const totalActiveTickets = tickets.filter(t => !t.isArchived && !t.isDeleted).length;

  return (
    <div className="space-y-6">
      {/* ============================================================ */}
      {/* 1. HEADER BANNER: LUXURY PURPLE GLOSS & ACTIONS              */}
      {/* ============================================================ */}
      <div className="bg-gradient-to-r from-[#160D29] via-[#35105E] to-[#7135B5] rounded-2xl p-5 text-white shadow-xl border border-[#D8B4FE]/30 relative overflow-hidden">
        {/* Shimmer sweep effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#5B35B1]/60 border border-[#D8B4FE]/50 flex items-center justify-center text-[#D8B4FE] shadow-inner shrink-0">
                <FolderTree className="w-6 h-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-black tracking-tight text-white uppercase">
                    Konfigurasi Menu Navigasi
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-[#A855F7]/40 border border-[#D8B4FE]/50 text-[#E9D5FF] shadow-xs">
                    Category Accordion Controller
                  </span>
                </div>
                <p className="text-xs text-[#E9D5FF]/90 mt-0.5">
                  Atur mode tampilan <strong>ACCORDION ON (Expand/Collapse)</strong> atau <strong>ACCORDION OFF (Static Menu)</strong> langsung pada masing-masing kategori menu secara global.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons: Save, Reset, Preview */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Live Preview Button */}
            <button
              type="button"
              onClick={() => setShowPreviewModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#251545] hover:bg-[#35105E] text-[#D8B4FE] border border-[#7135B5] text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer shadow-md"
              title="Buka pratinjau tampilan sidebar langsung"
            >
              <Eye className="w-4 h-4 text-[#D8B4FE]" />
              <span>Preview Sidebar</span>
            </button>

            {isSuperadmin && (
              <>
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  disabled={isSaving || isCloudSyncing}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  title="Kembalikan semua mode Accordion dan urutan menu ke pengaturan standar"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Pulihkan Default</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveToFirestore}
                  disabled={isSaving || isCloudSyncing}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold rounded-xl shadow-lg border border-emerald-400/40 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  title="Simpan konfigurasi ke Cloud Firestore (berlaku untuk seluruh perangkat)"
                >
                  <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
                  <span>{isSaving ? 'Menyimpan...' : 'Simpan Konfigurasi'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* STATUS BAR: PERMISSION & CLOUD SYNC STATE                    */}
      {/* ============================================================ */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white dark:bg-[#1A0E2E] rounded-xl border border-slate-200 dark:border-[#35105E] text-xs shadow-xs">
        <div className="flex items-center gap-2">
          {isSuperadmin ? (
            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Otoritas Superadmin: Anda memiliki hak penuh mengatur mode Accordion ON/OFF, nama kategori, dan urutan submenu.</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-semibold">
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Mode Lihat Saja: Pengaturan mode navigasi Accordion hanya dapat diubah oleh Super Admin.</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-purple-300 font-mono">
          <Cloud className={`w-3.5 h-3.5 ${cloudSyncStatus === 'synced' ? 'text-emerald-500' : 'text-slate-400'}`} />
          <span>
            {cloudSyncStatus === 'synced'
              ? `Tersinkronisasi Cloud Firestore ${lastCloudSyncTime ? `(${new Date(lastCloudSyncTime).toLocaleTimeString('id-ID')})` : ''}`
              : 'Penyimpanan Lokal Aktif (Klik Simpan untuk Sync)'}
          </span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. PENGATURAN ACCORDION LANGSUNG PER KATEGORI MENU           */}
      {/* ============================================================ */}
      <div className="bg-white dark:bg-[#1A0E2E] rounded-2xl border-2 border-[#D8B4FE]/40 dark:border-[#35105E] p-5 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-[#35105E]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#5B35B1]/15 text-[#5B35B1] dark:text-[#D8B4FE] flex items-center justify-center font-bold">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-[#160D29] dark:text-white flex items-center gap-2">
                <span>STATUS ACCORDION PER KATEGORI NAVIGASI</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#F3E8FF] dark:bg-[#35105E] text-[#5B35B1] dark:text-[#E9D5FF]">
                  Category Control
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-purple-300/80 mt-0.5">
                Pilih mode untuk masing-masing kategori: <strong>ACCORDION ON</strong> (Expand/Collapse dengan panah) atau <strong>ACCORDION OFF</strong> (Static Menu, seluruh submenu langsung ditampilkan). Berlaku global untuk seluruh role.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-medium text-slate-500 dark:text-purple-300">
              Multi-Open: Aktif (Kategori dapat terbuka bersamaan)
            </span>
          </div>
        </div>

        {/* Categories Quick Switch Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {menuCategories.map(categoryName => {
            const permId = getCategoryPermanentId(categoryName);
            const isAccordion = isCategoryAccordion(categoryName, navigationSettings);
            const Icon = CATEGORY_ICONS[permId] || FolderTree;
            const subCount = navigationItems.filter(item => item.category === categoryName).length;

            return (
              <div
                key={categoryName}
                className={`p-4 rounded-xl border-2 transition-all flex flex-col justify-between space-y-3.5 ${
                  isAccordion
                    ? 'bg-purple-50/60 dark:bg-[#251545]/80 border-purple-300 dark:border-[#7135B5]/60 shadow-xs'
                    : 'bg-emerald-50/50 dark:bg-[#152329]/80 border-emerald-300 dark:border-emerald-700/50 shadow-xs'
                }`}
              >
                {/* Card Top: Icon, Name, Permanent ID */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isAccordion
                          ? 'bg-[#5B35B1] text-white shadow-xs'
                          : 'bg-emerald-600 text-white shadow-xs'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-white truncate">
                        {categoryName}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-purple-300 font-mono mt-0.5">
                        <span className="bg-white/80 dark:bg-slate-900/80 px-1.5 py-0.2 rounded border border-slate-200 dark:border-slate-800">
                          ID: {permId}
                        </span>
                        <span>• {subCount} Submenu</span>
                      </div>
                    </div>
                  </div>

                  {/* Badge Mode */}
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase shrink-0 ${
                      isAccordion
                        ? 'bg-purple-200 dark:bg-purple-900/90 text-purple-900 dark:text-purple-200'
                        : 'bg-emerald-200 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300'
                    }`}
                  >
                    {isAccordion ? 'Accordion ON' : 'Accordion OFF'}
                  </span>
                </div>

                {/* Mode Description Summary */}
                <div className="text-[11px] text-slate-600 dark:text-purple-200/80 leading-relaxed bg-white/70 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-200/60 dark:border-purple-900/40">
                  {isAccordion ? (
                    <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-300 font-medium">
                      <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                      <span>Memiliki tombol panah. Submenu dapat disembunyikan / dibuka.</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
                      <Layers className="w-3.5 h-3.5 shrink-0" />
                      <span>Static Menu. Seluruh {subCount} submenu langsung tampil terbuka.</span>
                    </div>
                  )}
                </div>

                {/* Direct Accordion Mode Toggle Buttons */}
                <div className="grid grid-cols-2 gap-1.5 bg-white dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-purple-900/60">
                  <button
                    type="button"
                    disabled={!isSuperadmin}
                    onClick={() => handleToggleAccordion(categoryName, true)}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 ${
                      isAccordion
                        ? 'bg-[#5B35B1] text-white shadow-md'
                        : 'text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300'
                    }`}
                    title="Aktifkan mode Accordion (Expand / Collapse)"
                  >
                    <ChevronDown className={`w-3.5 h-3.5 ${isAccordion ? 'text-purple-200' : ''}`} />
                    <span>ON</span>
                  </button>

                  <button
                    type="button"
                    disabled={!isSuperadmin}
                    onClick={() => handleToggleAccordion(categoryName, false)}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 ${
                      !isAccordion
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-300'
                    }`}
                    title="Nonaktifkan mode Accordion (Static Menu - Seluruh Submenu Tampil)"
                  >
                    <Layers className={`w-3.5 h-3.5 ${!isAccordion ? 'text-emerald-100' : ''}`} />
                    <span>OFF (Static)</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. DAFTAR DETAIL KATEGORI & URUTAN SUBMENU                   */}
      {/* ============================================================ */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-extrabold text-xs uppercase tracking-wider text-purple-900 dark:text-purple-200 flex items-center gap-2">
            <ListOrdered className="w-4 h-4 text-[#7135B5]" />
            <span>Daftar Kategori & Pengaturan Urutan Submenu ({menuCategories.length} Kategori)</span>
          </h2>
          <span className="text-[11px] text-slate-500 dark:text-purple-300">
            Ubah nama kategori, urutan posisi, status Accordion, dan urutan submenu
          </span>
        </div>

        {menuCategories.map((category, catIdx) => {
          const permId = getCategoryPermanentId(category);
          const isAccordion = isCategoryAccordion(category, navigationSettings);
          const CategoryIcon = CATEGORY_ICONS[permId] || FolderTree;

          // Get items in this category sorted by order
          const categoryItems = navigationItems
            .filter(item => item.category === category)
            .sort((a, b) => a.order - b.order);

          const isEditingCat = editingCategory === category;

          return (
            <div
              key={category}
              className="bg-white dark:bg-[#1A0E2E] rounded-2xl border-2 border-slate-200 dark:border-[#35105E] shadow-sm overflow-hidden"
            >
              {/* Category Header Row */}
              <div className="bg-gradient-to-r from-[#160D29] via-[#251545] to-[#35105E] px-4 py-3 text-white flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#35105E]">
                {/* Left: Category Number, Icon, Name (Editable) */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-[#5B35B1] text-[#D8B4FE] flex items-center justify-center font-black text-xs shrink-0 border border-[#D8B4FE]/30">
                    {catIdx + 1}
                  </div>

                  <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-[#D8B4FE] shrink-0">
                    <CategoryIcon className="w-4 h-4" />
                  </div>

                  {isEditingCat ? (
                    <div className="flex items-center gap-1.5 flex-1 max-w-sm">
                      <input
                        type="text"
                        value={categoryDraftName}
                        onChange={e => setCategoryDraftName(e.target.value)}
                        className="px-2.5 py-1 text-xs bg-slate-900 text-white rounded-lg border border-purple-400 focus:outline-hidden flex-1 font-bold"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEditCategory(category)}
                        className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer"
                        title="Simpan nama kategori"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-extrabold uppercase text-xs sm:text-sm tracking-wider text-purple-100 truncate">
                        {category}
                      </span>
                      {isSuperadmin && (
                        <button
                          type="button"
                          onClick={() => handleStartEditCategory(category)}
                          className="p-1 text-purple-300 hover:text-white hover:bg-purple-800/50 rounded-md transition-colors cursor-pointer"
                          title="Ubah nama kategori"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-900/60 text-purple-200 border border-purple-700/40 shrink-0">
                    ID: {permId}
                  </span>

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#5B35B1] text-purple-200 shrink-0">
                    {categoryItems.length} Submenu
                  </span>
                </div>

                {/* Right: Accordion Toggle + Reorder Category Up/Down */}
                <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
                  {/* Category Accordion ON/OFF Switch */}
                  <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-purple-700/50">
                    <span className="text-[10px] uppercase font-bold text-purple-300 px-1">
                      Accordion:
                    </span>
                    <button
                      type="button"
                      disabled={!isSuperadmin}
                      onClick={() => handleToggleAccordion(category, true)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer disabled:opacity-50 ${
                        isAccordion
                          ? 'bg-[#A855F7] text-white shadow-xs'
                          : 'text-purple-300 hover:text-white'
                      }`}
                      title="Setel ke mode Accordion (Expand/Collapse)"
                    >
                      ON
                    </button>
                    <button
                      type="button"
                      disabled={!isSuperadmin}
                      onClick={() => handleToggleAccordion(category, false)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer disabled:opacity-50 ${
                        !isAccordion
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-purple-300 hover:text-white'
                      }`}
                      title="Setel ke mode Static (Semua Submenu Terbuka)"
                    >
                      OFF (Static)
                    </button>
                  </div>

                  {/* Reorder Category Up / Down Buttons */}
                  {isSuperadmin && (
                    <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-purple-700/50">
                      <button
                        type="button"
                        disabled={catIdx === 0}
                        onClick={() => moveCategory(category, 'up')}
                        className="p-1 text-purple-300 hover:text-white hover:bg-purple-800/60 rounded-lg disabled:opacity-20 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        title="Pindahkan Kategori ke Atas"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={catIdx === menuCategories.length - 1}
                        onClick={() => moveCategory(category, 'down')}
                        className="p-1 text-purple-300 hover:text-white hover:bg-purple-800/60 rounded-lg disabled:opacity-20 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        title="Pindahkan Kategori ke Bawah"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Submenu Items List in this Category */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {categoryItems.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 italic">
                    Belum ada submenu di kategori ini.
                  </div>
                ) : (
                  categoryItems.map((item, itemIdx) => {
                    const isEditingItem = editingItemId === item.id;

                    return (
                      <div
                        key={item.id}
                        className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-purple-50/40 dark:hover:bg-[#251545]/30 transition-colors"
                      >
                        {/* Left: Item Index, Label, Permanent ID, Allowed Roles */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="w-6 text-center text-[11px] font-mono text-slate-400 dark:text-purple-400 shrink-0">
                            {itemIdx + 1}
                          </span>

                          <div className="min-w-0 flex-1">
                            {isEditingItem ? (
                              <div className="flex items-center gap-1.5 max-w-sm">
                                <input
                                  type="text"
                                  value={itemDraftLabel}
                                  onChange={e => setItemDraftLabel(e.target.value)}
                                  className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg border border-purple-500 focus:outline-hidden flex-1 font-semibold"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditItem(item)}
                                  className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer"
                                  title="Simpan nama submenu"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 truncate">
                                <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                  {item.label}
                                </span>
                                {isSuperadmin && (
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditItem(item)}
                                    className="p-1 text-slate-400 hover:text-purple-600 dark:hover:text-[#D8B4FE] rounded transition-colors cursor-pointer"
                                    title="Ubah nama submenu"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Permanent ID & Roles Permission Badges */}
                            <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500 dark:text-purple-300 mt-0.5">
                              <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                ID: {item.id}
                              </span>
                              {item.roles && item.roles.length > 0 && (
                                <span className="truncate">
                                  Akses: {item.roles.join(', ')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Up / Down Position Reorder Controls */}
                        {isSuperadmin && (
                          <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto">
                            <button
                              type="button"
                              disabled={itemIdx === 0}
                              onClick={() => moveNavigationItem(item.id, 'up')}
                              className="p-1.5 text-slate-500 dark:text-purple-300 hover:text-purple-600 dark:hover:text-white hover:bg-purple-100 dark:hover:bg-purple-900/40 rounded-lg disabled:opacity-20 disabled:cursor-not-allowed transition-colors cursor-pointer"
                              title="Pindahkan Menu ke Atas"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={itemIdx === categoryItems.length - 1}
                              onClick={() => moveNavigationItem(item.id, 'down')}
                              className="p-1.5 text-slate-500 dark:text-purple-300 hover:text-purple-600 dark:hover:text-white hover:bg-purple-100 dark:hover:bg-purple-900/40 rounded-lg disabled:opacity-20 disabled:cursor-not-allowed transition-colors cursor-pointer"
                              title="Pindahkan Menu ke Bawah"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ============================================================ */}
      {/* 4. MODAL: LIVE SIDEBAR PREVIEW                               */}
      {/* ============================================================ */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
          <div className="bg-[#160D29] border-2 border-[#D8B4FE]/40 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl text-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-[#35105E] bg-[#110A21] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#5B35B1] text-[#D8B4FE] flex items-center justify-center">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                    <span>Pratinjau Langsung Sidebar (Live Preview)</span>
                  </h3>
                  <p className="text-[11px] text-purple-300">
                    Uji coba navigasi Accordion (Expand/Collapse) dan Static Menu secara interaktif
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="p-1.5 text-purple-300 hover:text-white hover:bg-purple-900/40 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Role Switcher in Preview */}
            <div className="px-5 py-3 border-b border-[#35105E] bg-[#1C1133]/60 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="font-bold text-purple-300 flex items-center gap-1.5">
                <span>Simulasikan Peran Pengguna:</span>
              </span>
              <div className="flex items-center gap-1 bg-[#110A21] p-1 rounded-xl border border-[#35105E]">
                {[
                  { role: 'super_admin', label: 'Superadmin' },
                  { role: 'dispatch', label: 'Dispatch' },
                  { role: 'leader', label: 'Leader' },
                  { role: 'installer', label: 'Installer' }
                ].map(r => (
                  <button
                    key={r.role}
                    type="button"
                    onClick={() => setPreviewRole(r.role as any)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      previewRole === r.role
                        ? 'bg-[#5B35B1] text-white shadow-xs'
                        : 'text-purple-300 hover:text-white'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview Body: Render Mock Sidebar */}
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh] space-y-3 bg-[#110A21]/50">
              <div className="text-[11px] text-purple-300 bg-[#251545]/60 p-2.5 rounded-xl border border-[#7135B5]/40 flex items-center justify-between">
                <span>
                  Simulasi Tampilan untuk: <strong className="text-white uppercase">{previewRole}</strong>
                </span>
                <span className="text-emerald-400 font-bold">
                  Hak Akses RBAC Otomatis Diterapkan
                </span>
              </div>

              {/* Role: INSTALLER Preview (Strictly 2 Menus: Dashboard Installer & Tugas Saya) */}
              {previewRole === 'installer' ? (
                <div className="space-y-1">
                  <div className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-[#5B35B1] to-[#7135B5] text-white font-bold text-xs flex items-center justify-between border-l-4 border-l-[#D8B4FE] border-y border-r border-[#D8B4FE]/30 shadow-md">
                    <div className="flex items-center gap-2.5">
                      <LayoutDashboard className="w-4 h-4 text-[#D8B4FE]" />
                      <span>Dashboard Installer</span>
                    </div>
                    <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-white/20 text-white font-mono">Halaman Awal</span>
                  </div>
                  <div className="px-3.5 py-2.5 rounded-xl bg-[#1C1133]/60 text-purple-200 text-xs font-semibold flex items-center justify-between border-l-4 border-l-transparent hover:bg-[#35105E]/50">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-purple-300" />
                      <span>Tugas Saya</span>
                    </div>
                    <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/40 font-mono">Tugas WO</span>
                  </div>
                </div>
              ) : (
                <>
                  {/* Static Mandiri Menus for Non-Installer Roles (Top) */}
                  <div className="space-y-1">
                    {[
                      { id: 'dashboard', label: 'Dashboard Monitoring', icon: LayoutDashboard, roles: ['super_admin', 'dispatch', 'leader', 'management_data', 'it_support'] },
                      { id: 'tickets', label: 'Work Order Management', icon: TicketIcon, roles: ['super_admin', 'dispatch'] },
                      { id: 'schedule', label: 'Jadwal & Kalender', icon: Calendar, roles: ['super_admin', 'dispatch', 'leader'] },
                      { id: 'import', label: 'Import Data WO', icon: FileSpreadsheet, roles: ['super_admin', 'dispatch', 'management_data'] },
                      { id: 'users', label: 'Manajemen Akun', icon: Users2, roles: ['super_admin'] },
                      { id: 'database_management', label: 'Database Application', icon: Database, roles: ['super_admin'] }
                    ]
                      .filter(item => item.roles.includes(previewRole))
                      .map((item, idx) => {
                        const ItemIcon = item.icon;
                        const isFirst = idx === 0;
                        return (
                          <div
                            key={item.id}
                            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between ${
                              isFirst
                                ? 'bg-gradient-to-r from-[#5B35B1] to-[#7135B5] text-white font-bold border-l-4 border-l-[#D8B4FE] border-y border-r border-[#D8B4FE]/30 shadow-md'
                                : 'bg-[#1C1133]/60 text-purple-200 border-l-4 border-l-transparent hover:bg-[#35105E]/40'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <ItemIcon className={`w-4 h-4 ${isFirst ? 'text-[#D8B4FE]' : 'text-purple-300'}`} />
                              <span>{item.label}</span>
                            </div>
                            <span className="text-[9px] font-mono text-purple-400">Static Mandiri</span>
                          </div>
                        );
                      })}
                  </div>

                  {/* Clean Visual Divider (NO text "MENU UTAMA" / "KATEGORI MENU" per Bagian 1 & 6) */}
                  <div className="my-2 border-t border-[#35105E]/60" />

                  {/* Category Groups for Non-Installer Roles (Bottom) */}
                  {menuCategories.map(cat => {
                    const permId = getCategoryPermanentId(cat);
                    const isAccordion = isCategoryAccordion(cat, navigationSettings);
                    const CategoryIcon = CATEGORY_ICONS[permId] || FolderTree;

                    // Submenus filtered by simulated role
                    const submenus = navigationItems
                      .filter(item => item.category === cat && (!item.roles || item.roles.includes(previewRole)))
                      .sort((a, b) => a.order - b.order);

                    if (submenus.length === 0) return null;

                    const isOpen = isAccordion ? !!previewOpenGroups[cat] : true;

                    return (
                      <div
                        key={cat}
                        className="rounded-xl bg-[#1C1133]/60 border border-[#35105E] overflow-hidden"
                      >
                        {/* Category Header */}
                        {isAccordion ? (
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewOpenGroups(prev => {
                                const isCurrentlyOpen = !!prev[cat];
                                const next: Record<string, boolean> = {};
                                next[cat] = !isCurrentlyOpen;
                                return next;
                              })
                            }
                            className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-bold text-purple-200 hover:text-white hover:bg-[#35105E]/60 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5">
                              <CategoryIcon className="w-4 h-4 text-[#D8B4FE]" />
                              <span className="uppercase tracking-wider text-[11px] font-extrabold">{cat}</span>
                              <span className="px-1.5 py-0.2 rounded text-[9px] bg-purple-900/60 text-purple-300 border border-purple-700/40">
                                Accordion ON
                              </span>
                            </div>
                            <ChevronDown
                              className={`w-4 h-4 text-purple-400 transition-transform duration-300 ease-in-out ${
                                isOpen ? 'rotate-180 text-[#D8B4FE]' : 'rotate-0 text-purple-400'
                              }`}
                            />
                          </button>
                        ) : (
                          <div className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-extrabold text-purple-300 border-b border-[#35105E]/50 bg-[#160D29]">
                            <div className="flex items-center gap-2.5">
                              <CategoryIcon className="w-4 h-4 text-emerald-400" />
                              <span className="uppercase tracking-wider text-[11px]">{cat}</span>
                              <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-700/40">
                                Accordion OFF (Static)
                              </span>
                            </div>
                            <span className="text-[10px] text-emerald-400 font-mono">Seluruh Submenu Terbuka</span>
                          </div>
                        )}

                        {/* Submenu Items */}
                        {isOpen && (
                          <div className="p-2 space-y-1 bg-[#110A21]/30">
                            {submenus.map(sub => (
                              <div
                                key={sub.id}
                                className="px-3 py-1.5 rounded-lg text-xs text-purple-200 hover:bg-[#35105E]/40 flex items-center justify-between transition-colors cursor-default"
                              >
                                <span className="truncate">{sub.label}</span>
                                <span className="text-[9px] font-mono text-purple-400">ID: {sub.id}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#35105E] bg-[#110A21] flex justify-end">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 bg-[#5B35B1] hover:bg-[#7135B5] text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Tutup Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. MODAL: KONFIRMASI PULIHKAN DEFAULT                        */}
      {/* ============================================================ */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1A0E2E] rounded-2xl border-2 border-amber-500 max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/80 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Pulihkan Pengaturan Menu Default?
                </h3>
                <p className="text-xs text-slate-500 dark:text-purple-300">
                  Tindakan ini akan mengembalikan seluruh status Accordion (Dashboard OFF, Operasional ON, WO Contractor OFF, Task Installer OFF, Pelanggan ON, Laporan ON, Setup OFF) serta susunan nama dan urutan menu ke standar awal sistem MoraJaws.
                </p>
              </div>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-200">
              Perubahan akan langsung disimpan ke Cloud Firestore dan diterapkan ke seluruh pengguna.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleRestoreDefaults}
                className="px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-md transition-all cursor-pointer"
              >
                Ya, Pulihkan Default
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
