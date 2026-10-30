import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useUIConfig, NavigationMenuItem } from '../../context/UIConfigContext';
import { useToast } from '../../context/ToastContext';
import {
  Menu,
  ArrowUp,
  ArrowDown,
  Edit2,
  Check,
  RotateCcw,
  Save,
  ShieldAlert,
  ShieldCheck,
  Eye,
  Layers,
  Sparkles,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  FolderTree,
  Tag,
  ChevronDown,
  SlidersHorizontal,
  Sliders
} from 'lucide-react';

export const NavigationConfigView: React.FC = () => {
  const { currentUser, addAuditLog } = useApp();
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
    setRoleNavigationMode,
    setCategoryNavigationMode,
    updateNavigationSettings,
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

  // Handle Save to Firestore
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
          `Menyimpan struktur navigasi menu (${menuCategories.length} kategori, ${navigationItems.length} submenu) ke Cloud Firestore`
        );
        toast.success('Konfigurasi nama dan posisi menu berhasil disimpan ke Firebase Cloud Firestore secara global!', 'Tersimpan ke Cloud');
      } else {
        toast.error(`Gagal menyimpan: ${res.error}`, 'Error Simpan');
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
    setShowResetConfirm(false);

    try {
      await saveConfigToFirestore(currentUser.name || 'Superadmin');
      addAuditLog(
        'RESTORE_DEFAULT_NAVIGATION',
        'ui_config',
        'ui_configuration',
        'Memulihkan seluruh nama dan urutan menu navigasi ke pengaturan awal sistem'
      );
      toast.success('Seluruh susunan menu telah dipulihkan ke pengaturan default!', 'Default Dipulihkan');
    } catch {
      toast.info('Susunan menu lokal telah dipulihkan ke default.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#1E0F3D] via-[#35105E] to-[#4C1D95] rounded-2xl p-5 text-white shadow-lg border border-[#7135B5]/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#5B35B1]/50 border border-[#D8B4FE]/40 flex items-center justify-center text-[#D8B4FE] shadow-inner">
                <FolderTree className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  <span>KONFIGURASI MENU NAVIGASI</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#A855F7]/30 border border-[#D8B4FE]/40 text-[#E9D5FF]">
                    Menu Customizer
                  </span>
                </h1>
                <p className="text-xs text-[#D8B4FE]/90">
                  Ubah nama kategori, nama submenu, serta atur urutan posisi menu navigasi. Disimpan secara global ke Firebase Firestore.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons: Save & Reset */}
          <div className="flex items-center gap-2 shrink-0">
            {isSuperadmin && (
              <>
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  disabled={isSaving || isCloudSyncing}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  title="Kembalikan semua nama dan urutan menu ke pengaturan standar pabrikan"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Pulihkan Default</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveToFirestore}
                  disabled={isSaving || isCloudSyncing}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  title="Simpan susunan menu ke Firebase Firestore agar diterapkan ke semua pengguna"
                >
                  <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
                  <span>{isSaving ? 'Menyimpan...' : 'Simpan Konfigurasi'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Permission & Cloud Sync Status Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white dark:bg-[#1A0E2E] rounded-xl border border-slate-200 dark:border-purple-900/50 text-xs">
        <div className="flex items-center gap-2">
          {isSuperadmin ? (
            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Otoritas Superadmin: Anda memiliki hak penuh untuk mengubah nama, posisi, dan menyimpan susunan menu.</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-semibold">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Mode Lihat Saja: Hanya Superadmin yang memiliki izin mengedit susunan navigasi.</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
          <Cloud className={`w-3.5 h-3.5 ${cloudSyncStatus === 'synced' ? 'text-emerald-500' : 'text-slate-400'}`} />
          <span>
            {cloudSyncStatus === 'synced'
              ? `Tersinkronisasi Cloud ${lastCloudSyncTime ? `(${new Date(lastCloudSyncTime).toLocaleTimeString('id-ID')})` : ''}`
              : 'Penyimpanan Lokal Aktif'}
          </span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* PENGATURAN MODE NAVIGASI MENU (MENU DISPLAY MODE)            */}
      {/* ============================================================ */}
      <div className="bg-white dark:bg-[#1A0E2E] rounded-2xl border-2 border-[#D8CCF3] dark:border-purple-900/60 p-5 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-purple-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#5B35B1]/10 text-[#5B35B1] dark:text-purple-300 flex items-center justify-center font-bold">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-[#21183A] dark:text-white flex items-center gap-2">
                <span>PENGATURAN MODE NAVIGASI MENU</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#E9E1FF] dark:bg-purple-900/60 text-[#3B1D78] dark:text-purple-200">
                  Display Mode
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Tentukan apakah menu navigasi menggunakan model <strong>Accordion Submenu Collapse</strong> (buka/tutup dengan panah) atau <strong>Static Navigation</strong> (menu biasa, seluruh submenu langsung terlihat).
              </p>
            </div>
          </div>

          {isSuperadmin && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  resetNavigationSettings();
                  toast.info('Pengaturan mode navigasi dikembalikan ke default.', 'Mode Direset');
                }}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
              >
                Reset Default Mode
              </button>
            </div>
          )}
        </div>

        {/* 1. Pengaturan Mode Berdasarkan Role Pengguna */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#5B35B1] dark:text-purple-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>1. Mode Navigasi Berdasarkan Role Pengguna</span>
            </h3>
            <span className="text-[11px] text-slate-400">
              Konfigurasi tampilan sidebar untuk masing-masing hak akses
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { role: 'super_admin', label: 'Superadmin', defaultMode: 'accordion' },
              { role: 'dispatch', label: 'Dispatch', defaultMode: 'accordion' },
              { role: 'leader', label: 'Leader', defaultMode: 'static' },
              { role: 'installer', label: 'Installer / Teknisi', defaultMode: 'static' }
            ].map(item => {
              const currentMode = navigationSettings?.roleModes?.[item.role as keyof typeof navigationSettings.roleModes] || item.defaultMode;
              return (
                <div
                  key={item.role}
                  className="p-3.5 bg-[#F5F1FF] dark:bg-[#251545] rounded-xl border border-[#D8CCF3] dark:border-purple-800/60 flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#21183A] dark:text-white">
                      {item.label}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      currentMode === 'accordion'
                        ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                        : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                    }`}>
                      {currentMode === 'accordion' ? 'Accordion' : 'Static Menu'}
                    </span>
                  </div>

                  {/* Mode Selector Buttons */}
                  <div className="grid grid-cols-2 gap-1.5 bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      disabled={!isSuperadmin}
                      onClick={() => setRoleNavigationMode(item.role as any, 'accordion')}
                      className={`py-1.5 px-2 rounded-md text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1 ${
                        currentMode === 'accordion'
                          ? 'bg-[#5B35B1] text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      <ChevronDown className="w-3 h-3" />
                      <span>Accordion</span>
                    </button>
                    <button
                      type="button"
                      disabled={!isSuperadmin}
                      onClick={() => setRoleNavigationMode(item.role as any, 'static')}
                      className={`py-1.5 px-2 rounded-md text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1 ${
                        currentMode === 'static'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      <Layers className="w-3 h-3" />
                      <span>Static</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Pengaturan Mode Override per Kategori Menu */}
        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-purple-900/40">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#5B35B1] dark:text-purple-300 flex items-center gap-1.5">
              <FolderTree className="w-4 h-4" />
              <span>2. Pengaturan Khusus per Kategori Menu (Override)</span>
            </h3>
            <span className="text-[11px] text-slate-400">
              Opsional: Kategori dapat dipaksa selalu Accordion atau selalu Static
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {menuCategories.map(cat => {
              const catMode: string = ((navigationSettings?.categoryModes || {}) as any)[cat] || 'default';
              return (
                <div
                  key={cat}
                  className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-purple-900/40 space-y-2"
                >
                  <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                    <span className="truncate">{cat}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {catMode === 'default' ? 'Ikuti Role' : catMode}
                    </span>
                  </div>

                  <select
                    disabled={!isSuperadmin}
                    value={catMode}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === 'default') {
                        const updated = { ...(navigationSettings?.categoryModes || {}) };
                        delete updated[cat];
                        updateNavigationSettings({ categoryModes: updated });
                      } else {
                        setCategoryNavigationMode(cat, val as 'accordion' | 'static');
                      }
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  >
                    <option value="default">Ikuti Pengaturan Role</option>
                    <option value="accordion">Paksa Accordion (Collapse/Expand)</option>
                    <option value="static">Paksa Static (Semua Terlihat)</option>
                  </select>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Pengaturan Tambahan: Izinkan beberapa kategori terbuka bersamaan */}
        <div className="pt-2 border-t border-slate-100 dark:border-purple-900/40 flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-slate-800 dark:text-slate-200 block">
              Multi-Open Accordion: Izinkan beberapa kategori terbuka bersamaan
            </span>
            <span className="text-[11px] text-slate-500">
              Jika aktif: membuka satu kategori tidak otomatis menutup kategori lainnya.
            </span>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              disabled={!isSuperadmin}
              checked={navigationSettings?.allowMultipleOpenGroups !== false}
              onChange={e => updateNavigationSettings({ allowMultipleOpenGroups: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5B35B1]"></div>
          </label>
        </div>
      </div>

      {/* Categories & Submenus Configuration List */}
      <div className="space-y-4">
        {menuCategories.map((category, catIdx) => {
          // Get items in this category
          const categoryItems = navigationItems
            .filter(item => item.category === category)
            .sort((a, b) => a.order - b.order);

          const isEditingCat = editingCategory === category;

          return (
            <div
              key={category}
              className="bg-white dark:bg-[#1A0E2E] rounded-2xl border-2 border-[#D8CCF3] dark:border-purple-900/60 shadow-xs overflow-hidden"
            >
              {/* Category Header Row (A. Ubah Nama Kategori & B. Atur Posisi Kategori) */}
              <div className="bg-gradient-to-r from-[#21183A] to-[#35105E] px-4 py-3 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-[#5B35B1]/60 text-[#D8B4FE] flex items-center justify-center font-bold text-xs shrink-0">
                    {catIdx + 1}
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

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#5B35B1] text-purple-200 shrink-0">
                    {categoryItems.length} Submenu
                  </span>
                </div>

                {/* Category Reorder Controls (B. Posisi Kategori Naik / Turun) */}
                {isSuperadmin && (
                  <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto">
                    <button
                      type="button"
                      disabled={catIdx === 0}
                      onClick={() => moveCategory(category, 'up')}
                      className="p-1.5 text-purple-300 hover:text-white hover:bg-purple-800/60 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      title="Pindahkan Kategori ke Atas"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={catIdx === menuCategories.length - 1}
                      onClick={() => moveCategory(category, 'down')}
                      className="p-1.5 text-purple-300 hover:text-white hover:bg-purple-800/60 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      title="Pindahkan Kategori ke Bawah"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Submenu Items Table in this Category */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {categoryItems.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 italic">
                    Belum ada menu di kategori ini.
                  </div>
                ) : (
                  categoryItems.map((item, itemIdx) => {
                    const isEditingItem = editingItemId === item.id;

                    return (
                      <div
                        key={item.id}
                        className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-50 dark:hover:bg-purple-950/20 transition-colors"
                      >
                        {/* Left: ID & Label */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="w-6 text-center text-[11px] font-mono text-slate-400 shrink-0">
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
                                    className="p-1 text-slate-400 hover:text-purple-600 rounded transition-colors cursor-pointer"
                                    title="Ubah nama submenu"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Permanent ID & Roles */}
                            <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                              <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded text-slate-600 dark:text-slate-400">
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

                        {/* Right: Up / Down Position Controls (B. Atur Posisi Menu) */}
                        {isSuperadmin && (
                          <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto">
                            <button
                              type="button"
                              disabled={itemIdx === 0}
                              onClick={() => moveNavigationItem(item.id, 'up')}
                              className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-lg disabled:opacity-20 disabled:cursor-not-allowed transition-colors cursor-pointer"
                              title="Pindahkan Menu ke Atas"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={itemIdx === categoryItems.length - 1}
                              onClick={() => moveNavigationItem(item.id, 'down')}
                              className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-lg disabled:opacity-20 disabled:cursor-not-allowed transition-colors cursor-pointer"
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

      {/* Confirmation Modal for Restore Defaults */}
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
                <p className="text-xs text-slate-500">
                  Tindakan ini akan mengembalikan seluruh nama kategori, nama submenu, dan urutan posisi menu ke pengaturan standar sistem MoraJaws.
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
