import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ReportDropdownCategory, DropdownCategoryType } from '../../types';
import { useMoraJawsSound } from '../../context/SoundContext';
import { useToast } from '../../context/ToastContext';
import {
  ListFilter,
  Plus,
  Trash2,
  Check,
  Edit2,
  Save,
  Layers,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Search,
  CheckCircle2,
  X,
  AlertCircle,
  Shield,
  HelpCircle,
  Database,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';

export const ReportDropdownManager: React.FC = () => {
  const {
    reportDropdownCategories,
    isDropdownCategoriesLoading,
    addReportDropdownCategory,
    updateReportDropdownCategory,
    deleteReportDropdownCategory,
    toggleReportDropdownCategoryActive
  } = useApp();

  const { playReportSavedSound, playErrorSound } = useMoraJawsSound();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<DropdownCategoryType>('report_status');
  const [searchQuery, setSearchQuery] = useState('');

  // Add category modal/form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newIsActive, setNewIsActive] = useState(true);

  // Edit category modal/form state
  const [editingCategory, setEditingCategory] = useState<ReportDropdownCategory | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);

  // Filtered and sorted list for active category type
  const activeItems = useMemo(() => {
    return reportDropdownCategories
      .filter(item => item.categoryType === activeTab && !item.isDeleted)
      .filter(item => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          (item.description && item.description.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [reportDropdownCategories, activeTab, searchQuery]);

  // Handle Add Item
  const handleSaveNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      playErrorSound();
      toast.error('Nama kategori tidak boleh kosong.', 'Validasi Gagal');
      return;
    }

    const currentCount = reportDropdownCategories.filter(
      item => item.categoryType === activeTab && !item.isDeleted
    ).length;

    try {
      await addReportDropdownCategory({
        name: newName.trim(),
        categoryType: activeTab,
        description: newDescription.trim() || undefined,
        isActive: newIsActive,
        sortOrder: currentCount + 1
      });

      playReportSavedSound();
      toast.success(
        `Kategori "${newName.trim()}" berhasil disimpan ke Cloud Firestore.`,
        'KATEGORI DITAMBAHKAN'
      );
      setNewName('');
      setNewDescription('');
      setNewIsActive(true);
      setShowAddModal(false);
    } catch (err: any) {
      playErrorSound();
      toast.error(err?.message || 'Gagal menyimpan kategori.', 'Kesalahan Firestore');
    }
  };

  // Open Edit Modal
  const handleStartEdit = (item: ReportDropdownCategory) => {
    setEditingCategory(item);
    setEditName(item.name);
    setEditDescription(item.description || '');
    setEditIsActive(item.isActive);
  };

  // Handle Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    if (!editName.trim()) {
      playErrorSound();
      toast.error('Nama kategori tidak boleh kosong.', 'Validasi Gagal');
      return;
    }

    try {
      await updateReportDropdownCategory(editingCategory.id, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        isActive: editIsActive
      });

      playReportSavedSound();
      toast.success(
        `Perubahan kategori "${editName.trim()}" berhasil disimpan ke Firestore.`,
        'KATEGORI DIPERBARUI'
      );
      setEditingCategory(null);
    } catch (err: any) {
      playErrorSound();
      toast.error(err?.message || 'Gagal memperbarui kategori.', 'Kesalahan Firestore');
    }
  };

  // Handle Delete (with confirmation and soft-delete protection)
  const handleDelete = async (item: ReportDropdownCategory) => {
    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus opsi "${item.name}" dari ${getTabLabel(activeTab)}?\n\nData historis Work Order yang sudah menggunakan opsi ini akan tetap aman tersimpan.`
    );
    if (!confirmed) return;

    try {
      await deleteReportDropdownCategory(item.id);
      playReportSavedSound();
      toast.info(`Opsi "${item.name}" telah dihapus dari sistem.`, 'Kategori Dihapus');
    } catch (err: any) {
      playErrorSound();
      toast.error(err?.message || 'Gagal menghapus kategori.', 'Kesalahan Firestore');
    }
  };

  // Handle Move Order
  const handleMoveOrder = async (item: ReportDropdownCategory, direction: 'up' | 'down') => {
    const list = [...activeItems];
    const currentIndex = list.findIndex(x => x.id === item.id);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const targetItem = list[targetIndex];

    try {
      await updateReportDropdownCategory(item.id, { sortOrder: targetItem.sortOrder });
      await updateReportDropdownCategory(targetItem.id, { sortOrder: item.sortOrder });
      playReportSavedSound();
      toast.sync('Urutan kategori diselaraskan.');
    } catch (err) {
      playErrorSound();
      console.error(err);
    }
  };

  function getTabLabel(type: DropdownCategoryType): string {
    switch (type) {
      case 'report_status':
        return 'Report Status WO';
      case 'reason_report':
        return 'Reason Report';
      case 'rootcause':
        return 'Rootcause';
      default:
        return 'Kategori Laporan';
    }
  }

  function getTabBadgeCount(type: DropdownCategoryType): number {
    return reportDropdownCategories.filter(x => x.categoryType === type && !x.isDeleted).length;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner with Dark Purple Gloss Identity */}
      <div className="bg-[#160D29] rounded-2xl border border-[#D8B4FE]/30 p-5 shadow-[0_4px_24px_rgba(22,13,41,0.6)] relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#D8B4FE]/60 to-transparent" />

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7135B5] to-[#35105E] border border-[#D8B4FE]/50 text-white flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(113,53,181,0.4)]">
            <ListFilter className="w-5 h-5 text-[#E9D5FF]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-white tracking-tight">
                Report Dropdown Management
              </h3>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-[#35105E] text-[#D8B4FE] border border-[#D8B4FE]/30">
                <Database className="w-3 h-3" />
                <span>Firestore Live Sync</span>
              </span>
            </div>
            <p className="text-xs text-[#D8B4FE]/80 mt-0.5">
              Konfigurasi dinamis pilihan Report Status, Reason Report, dan Rootcause untuk formulir teknisi Installer.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#7135B5] to-[#A855F7] hover:from-[#7E3CC7] hover:to-[#B666FE] rounded-xl flex items-center justify-center gap-1.5 shadow-[0_0_18px_rgba(168,85,247,0.4)] border border-[#E9D5FF]/30 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Opsi Baru</span>
        </button>
      </div>

      {/* 3 Main Management Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(['report_status', 'reason_report', 'rootcause'] as DropdownCategoryType[]).map(type => {
          const isActive = activeTab === type;
          const count = getTabBadgeCount(type);
          return (
            <button
              key={type}
              onClick={() => {
                setActiveTab(type);
                setSearchQuery('');
              }}
              className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden cursor-pointer ${
                isActive
                  ? 'bg-[#35105E]/85 border-[#A855F7] text-white shadow-[0_0_20px_rgba(168,85,247,0.35)]'
                  : 'bg-[#160D29]/70 border-[#D8B4FE]/20 text-[#D8B4FE]/70 hover:bg-[#35105E]/40 hover:text-white'
              }`}
            >
              {isActive && (
                <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-[#7135B5] via-[#D8B4FE] to-[#A855F7]" />
              )}
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm tracking-wide">
                  {type === 'report_status' && 'A. REPORT STATUS'}
                  {type === 'reason_report' && 'B. REASON REPORT'}
                  {type === 'rootcause' && 'C. ROOTCAUSE'}
                </span>
                <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
                  isActive
                    ? 'bg-[#7135B5] text-white border border-[#E9D5FF]/40'
                    : 'bg-[#35105E]/60 text-[#D8B4FE]/80'
                }`}>
                  {count} Opsi
                </span>
              </div>
              <p className="text-[11px] text-[#D8B4FE]/60 mt-1 line-clamp-1">
                {type === 'report_status' && 'Status penanganan WO teknisi di lapangan'}
                {type === 'reason_report' && 'Alasan status atau hasil pekerjaan teknisi'}
                {type === 'rootcause' && 'Penyebab teknis atau faktor kendala lapangan'}
              </p>
            </button>
          );
        })}
      </div>

      {/* Main Table / List Container */}
      <div className="bg-[#160D29] rounded-2xl border border-[#D8B4FE]/25 p-5 shadow-sm space-y-4">
        {/* Search & Counter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#D8B4FE]/15">
          <div className="flex items-center gap-2">
            <h4 className="font-extrabold text-white text-sm">
              Daftar Opsi: {getTabLabel(activeTab)}
            </h4>
            <span className="text-xs text-[#D8B4FE]/70">
              ({activeItems.length} item aktif)
            </span>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-[#D8B4FE]/60 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={`Cari dalam ${getTabLabel(activeTab)}...`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#35105E]/40 border border-[#D8B4FE]/25 rounded-xl text-white placeholder-[#D8B4FE]/40 focus:border-[#A855F7] focus:outline-none"
            />
          </div>
        </div>

        {/* Loading Indicator */}
        {isDropdownCategoriesLoading && (
          <div className="py-8 text-center text-xs text-[#D8B4FE] flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[#A855F7]" />
            <span>Memuat kategori laporan dari Cloud Firestore...</span>
          </div>
        )}

        {/* Empty State */}
        {!isDropdownCategoriesLoading && activeItems.length === 0 && (
          <div className="py-10 text-center text-xs text-[#D8B4FE]/70 space-y-2">
            <AlertCircle className="w-8 h-8 mx-auto text-[#D8B4FE]/50" />
            <p className="font-semibold text-white">Tidak ada opsi ditemukan.</p>
            <p className="text-[11px]">
              {searchQuery ? 'Coba ubah kata kunci pencarian.' : 'Klik "Tambah Opsi Baru" untuk membuat opsi pertama.'}
            </p>
          </div>
        )}

        {/* Items List */}
        {!isDropdownCategoriesLoading && activeItems.length > 0 && (
          <div className="space-y-2">
            {activeItems.map((item, index) => (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  item.isActive
                    ? 'bg-[#1E1138]/70 border-[#D8B4FE]/25 hover:border-[#A855F7]/60'
                    : 'bg-[#160D29]/50 border-white/10 opacity-60'
                }`}
              >
                {/* Left: Reorder & Name */}
                <div className="flex items-center gap-3">
                  {/* Reorder Buttons */}
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveOrder(item, 'up')}
                      className="p-1 rounded text-[#D8B4FE]/60 hover:text-white hover:bg-[#35105E] disabled:opacity-20 cursor-pointer"
                      title="Geser ke Atas"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={index === activeItems.length - 1}
                      onClick={() => handleMoveOrder(item, 'down')}
                      className="p-1 rounded text-[#D8B4FE]/60 hover:text-white hover:bg-[#35105E] disabled:opacity-20 cursor-pointer"
                      title="Geser ke Bawah"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs sm:text-sm">
                        {item.name}
                      </span>
                      {!item.isActive && (
                        <span className="text-[9.5px] px-2 py-0.2 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                          Nonaktif
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-[11px] text-[#D8B4FE]/65 mt-0.5">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  {/* Toggle Active Button */}
                  <button
                    type="button"
                    onClick={() => toggleReportDropdownCategoryActive(item.id)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-colors flex items-center gap-1 cursor-pointer ${
                      item.isActive
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30 hover:bg-emerald-500/25'
                        : 'bg-slate-500/15 text-slate-300 border-slate-400/30 hover:bg-slate-500/25'
                    }`}
                    title={item.isActive ? 'Nonaktifkan Opsi' : 'Aktifkan Opsi'}
                  >
                    {item.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    <span>{item.isActive ? 'Aktif' : 'Nonaktif'}</span>
                  </button>

                  {/* Edit Button */}
                  <button
                    type="button"
                    onClick={() => handleStartEdit(item)}
                    className="p-1.5 text-[#D8B4FE]/80 hover:text-white rounded-lg hover:bg-[#7135B5]/40 transition-colors cursor-pointer border border-[#D8B4FE]/20"
                    title="Edit Kategori"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    className="p-1.5 text-rose-400 hover:text-rose-200 rounded-lg hover:bg-rose-950/50 transition-colors cursor-pointer border border-rose-500/30"
                    title="Hapus Kategori"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================== */}
      {/* ADD NEW CATEGORY MODAL                                     */}
      {/* ========================================================== */}
      {showAddModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#160D29]/80 backdrop-blur-md animate-in fade-in duration-150"
        >
          <div className="w-full max-w-md bg-[#160D29] rounded-3xl border border-[#D8B4FE]/50 p-6 shadow-2xl relative overflow-hidden animate-in zoom-in-95">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#D8B4FE] to-transparent" />

            <div className="flex items-center justify-between pb-3 border-b border-[#D8B4FE]/20">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#D8B4FE]" />
                <h4 className="font-black text-white text-sm">
                  Tambah Opsi ke {getTabLabel(activeTab)}
                </h4>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-[#D8B4FE]/70 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNew} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#E9D5FF] mb-1.5">
                  Nama Opsi <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder={`misal: ${activeTab === 'report_status' ? 'Installed' : activeTab === 'reason_report' ? 'Instalasi Selesai Standar' : 'Dropcore Putus'}`}
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#35105E]/40 border border-[#D8B4FE]/30 rounded-xl text-white placeholder-[#D8B4FE]/40 focus:border-[#A855F7] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#E9D5FF] mb-1.5">
                  Deskripsi / Keterangan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Keterangan kondisi penggunaan opsi ini"
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#35105E]/40 border border-[#D8B4FE]/30 rounded-xl text-white placeholder-[#D8B4FE]/40 focus:border-[#A855F7] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="newIsActive"
                  checked={newIsActive}
                  onChange={e => setNewIsActive(e.target.checked)}
                  className="rounded border-[#D8B4FE]/40 text-[#A855F7] focus:ring-[#A855F7]"
                />
                <label htmlFor="newIsActive" className="text-[#E9D5FF] font-semibold cursor-pointer">
                  Aktifkan opsi ini untuk teknisi langsung
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#D8B4FE]/15">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 font-semibold text-[#D8B4FE] hover:bg-[#35105E]/50 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-gradient-to-r from-[#7135B5] to-[#A855F7] hover:from-[#7E3CC7] hover:to-[#B666FE] rounded-xl shadow-md border border-[#E9D5FF]/30 transition-all cursor-pointer"
                >
                  Simpan Opsi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* EDIT CATEGORY MODAL                                        */}
      {/* ========================================================== */}
      {editingCategory && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#160D29]/80 backdrop-blur-md animate-in fade-in duration-150"
        >
          <div className="w-full max-w-md bg-[#160D29] rounded-3xl border border-[#D8B4FE]/50 p-6 shadow-2xl relative overflow-hidden animate-in zoom-in-95">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#D8B4FE] to-transparent" />

            <div className="flex items-center justify-between pb-3 border-b border-[#D8B4FE]/20">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#D8B4FE]" />
                <h4 className="font-black text-white text-sm">
                  Edit Opsi: {editingCategory.name}
                </h4>
              </div>
              <button
                onClick={() => setEditingCategory(null)}
                className="p-1 text-[#D8B4FE]/70 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#E9D5FF] mb-1.5">
                  Nama Opsi <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#35105E]/40 border border-[#D8B4FE]/30 rounded-xl text-white placeholder-[#D8B4FE]/40 focus:border-[#A855F7] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#E9D5FF] mb-1.5">
                  Deskripsi / Keterangan
                </label>
                <input
                  type="text"
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#35105E]/40 border border-[#D8B4FE]/30 rounded-xl text-white placeholder-[#D8B4FE]/40 focus:border-[#A855F7] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={editIsActive}
                  onChange={e => setEditIsActive(e.target.checked)}
                  className="rounded border-[#D8B4FE]/40 text-[#A855F7] focus:ring-[#A855F7]"
                />
                <label htmlFor="editIsActive" className="text-[#E9D5FF] font-semibold cursor-pointer">
                  Aktifkan opsi ini untuk formulir teknisi
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#D8B4FE]/15">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 font-semibold text-[#D8B4FE] hover:bg-[#35105E]/50 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-gradient-to-r from-[#7135B5] to-[#A855F7] hover:from-[#7E3CC7] hover:to-[#B666FE] rounded-xl shadow-md border border-[#E9D5FF]/30 transition-all cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
