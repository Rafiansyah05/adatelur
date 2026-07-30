'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Search, CheckCircle, XCircle, FileEdit, LogOut, UploadCloud, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { showToast } from '@/components/ui/toast';

type Peternak = {
  id: string; // profil id
  full_name: string;
  email: string;
  phone_number: string;
  peternak_id: string;
  registration_method: string;
  verification_status: string;
  chicken_count: number;
  feed_type: string;
  created_at: string;
  daily_egg_production?: number;
  daily_damaged_eggs?: number;
  daily_clean_eggs?: number;
  farming_experience_years?: number;
  has_vehicle?: boolean;
  farm_address?: string;
  photos?: { photo_type: string, photo_url: string }[];
  vehicles?: { vehicle_type: string }[];
};

export default function AdminDashboard() {
  const router = useRouter();
  const [peternaks, setPeternaks] = useState<Peternak[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'bantuan' | 'verifikasi' | 'aktif' | 'ditolak'>('bantuan');
  const [search, setSearch] = useState('');

  // Modals state
  const [activePeternak, setActivePeternak] = useState<Peternak | null>(null);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states for Data
  const [formData, setFormData] = useState({
    chickenCount: '', eggProd: '', eggBroken: '', eggClean: '', feedType: '', experience: '', hasVehicle: false, vehicleType: ''
  });

  // Form states for Photos
  const [photos, setPhotos] = useState<{ [key: string]: File | null }>({
    kandang_luar: null, kandang_dalam: null, ayam: null, telur: null
  });

  // Reject Reason
  const [rejectReason, setRejectReason] = useState('');

  const fetchPeternak = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/peternak', { cache: 'no-store' });
      const data = await response.json();
      if (data.success) {
        setPeternaks(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeternak();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  const filteredPeternak = peternaks.filter((p) => {
    const matchSearch = p.full_name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase()) ||
      p.phone_number.includes(search);

    const hasAllPhotos = p.photos && p.photos.length >= 4;
    const isDataIncomplete = p.chicken_count === 0 || p.feed_type === '-' || p.registration_method === 'video_call_cs' || !hasAllPhotos;

    if (activeTab === 'bantuan') {
      return p.verification_status === 'pending' && isDataIncomplete && matchSearch;
    } else if (activeTab === 'verifikasi') {
      return p.verification_status === 'pending' && !isDataIncomplete && matchSearch;
    } else if (activeTab === 'aktif') {
      return p.verification_status === 'approved' && matchSearch;
    } else {
      return p.verification_status === 'rejected' && matchSearch;
    }
  });

  // --- ACTIONS ---

  const handleUpdateData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePeternak) return;
    setActionLoading(true);
    try {
      const response = await fetch('/api/admin/update-peternak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ peternakId: activePeternak.peternak_id, ...formData }),
      });
      if (!response.ok) throw new Error('Gagal memperbarui data');
      showToast('Data operasional berhasil disimpan!', 'success');
      setIsDataModalOpen(false);
      fetchPeternak();
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUploadPhotos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePeternak) return;

    const types = ['kandang_luar', 'kandang_dalam', 'ayam', 'telur'];
    for (const t of types) {
      if (!photos[t]) {
        showToast(`Mohon unggah foto ${t.replace('_', ' ')}`, 'error');
        return;
      }
    }

    setActionLoading(true);
    try {
      for (const t of types) {
        const file = photos[t];
        if (file) {
          const form = new FormData();
          form.append('file', file);
          form.append('peternakId', activePeternak.peternak_id);
          form.append('type', t);

          const res = await fetch('/api/admin/upload-foto', {
            method: 'POST',
            body: form,
          });
          if (!res.ok) throw new Error('Gagal mengunggah foto ' + t.replace('_', ' '));
        }
      }
      showToast('Semua foto berhasil diunggah!', 'success');
      setIsPhotoModalOpen(false);
      fetchPeternak();
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerify = async (action: 'approve' | 'reject') => {
    if (!activePeternak) return;
    if (action === 'reject' && !rejectReason) {
      showToast('Mohon isi alasan penolakan', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch('/api/admin/verify-peternak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: activePeternak.id,
          peternakId: activePeternak.peternak_id,
          email: activePeternak.email,
          name: activePeternak.full_name,
          action,
          reason: rejectReason
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gagal memverifikasi');

      if (result.warning) {
        showToast(result.warning, 'error');
      } else {
        showToast(`Peternak berhasil di${action === 'approve' ? 'terima' : 'tolak'}!`, 'success');
      }
      setIsRejectModalOpen(false);
      fetchPeternak();
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Navbar */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-neutral-900 text-lg">Admin Panel</span>
          </div>
          <Button onClick={handleLogout} variant="secondary" className="h-9 gap-2 text-neutral-600">
            <LogOut className="w-4 h-4" /> Keluar
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Manajemen Peternak</h1>
            <p className="text-neutral-500 mt-1 text-sm">Kelola pendaftaran, bantu isi data, dan verifikasi akun.</p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder="Cari nama, email, hp..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
        </div>

        <div className="flex gap-4 border-b border-neutral-200 mb-6 overflow-x-auto whitespace-nowrap scrollbar-hide">
          <button
            onClick={() => setActiveTab('bantuan')}
            className={`pb-3 px-1 text-[15px] font-semibold border-b-2 transition-colors ${activeTab === 'bantuan' ? 'border-primary-500 text-primary-600' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}
          >
            Menunggu Bantuan CS / Lengkapi Data
          </button>
          <button
            onClick={() => setActiveTab('verifikasi')}
            className={`pb-3 px-1 text-[15px] font-semibold border-b-2 transition-colors ${activeTab === 'verifikasi' ? 'border-primary-500 text-primary-600' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}
          >
            Menunggu Verifikasi Akhir
          </button>
          <button
            onClick={() => setActiveTab('aktif')}
            className={`pb-3 px-1 text-[15px] font-semibold border-b-2 transition-colors ${activeTab === 'aktif' ? 'border-primary-500 text-primary-600' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}
          >
            Peternak Aktif
          </button>
          <button
            onClick={() => setActiveTab('ditolak')}
            className={`pb-3 px-1 text-[15px] font-semibold border-b-2 transition-colors ${activeTab === 'ditolak' ? 'border-primary-500 text-primary-600' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}
          >
            Ditolak
          </button>
        </div>

        {/* Table / Content */}
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 flex justify-center text-primary-500"><Loader2 className="w-8 h-8 animate-spin" /></div>
          ) : filteredPeternak.length === 0 ? (
            <div className="p-12 text-center text-neutral-500">Tidak ada data peternak yang sesuai.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200">
                    <th className="py-3 px-4 text-xs font-bold text-neutral-500 uppercase">Peternak</th>
                    <th className="py-3 px-4 text-xs font-bold text-neutral-500 uppercase">Kontak</th>
                    <th className="py-3 px-4 text-xs font-bold text-neutral-500 uppercase">Status Data</th>
                    <th className="py-3 px-4 text-xs font-bold text-neutral-500 uppercase text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredPeternak.map((p) => {
                    const hasAllPhotos = p.photos && p.photos.length >= 4;
                    const isDataIncomplete = p.chicken_count === 0 || p.feed_type === '-' || p.registration_method === 'video_call_cs' || !hasAllPhotos;
                    return (
                      <tr key={p.id} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="py-4 px-4">
                          <p className="font-bold text-neutral-900">{p.full_name}</p>
                          <p className="text-xs text-neutral-500">{new Date(p.created_at).toLocaleDateString('id-ID')}</p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-sm text-neutral-900">{p.email}</p>
                          <p className="text-sm text-neutral-500">{p.phone_number}</p>
                        </td>
                        <td className="py-4 px-4">
                          {p.verification_status === 'pending' && isDataIncomplete && (
                            <span className="inline-flex items-center px-2 py-1 rounded bg-yellow-50 text-yellow-700 border border-yellow-200 text-xs font-semibold">
                              Data Belum Lengkap
                            </span>
                          )}
                          {p.verification_status === 'pending' && !isDataIncomplete && (
                            <span className="inline-flex items-center px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold">
                              Siap Verifikasi
                            </span>
                          )}
                          {p.verification_status === 'approved' && (
                            <span className="inline-flex items-center px-2 py-1 rounded bg-green-50 text-green-700 border border-green-200 text-xs font-semibold">
                              Aktif
                            </span>
                          )}
                          {p.verification_status === 'rejected' && (
                            <span className="inline-flex items-center px-2 py-1 rounded bg-red-50 text-red-700 border border-red-200 text-xs font-semibold">
                              Ditolak
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right space-x-2">
                          <Button variant="outline" onClick={() => { setActivePeternak(p); setIsDetailModalOpen(true); }} className="h-8 px-3 text-xs gap-1.5 border-neutral-300 text-neutral-700 hover:bg-neutral-100">
                            Lihat Detail
                          </Button>

                          {activeTab === 'bantuan' && (
                            <>
                              <Button variant="outline" className="h-8 px-3 text-xs gap-1.5" onClick={() => { setActivePeternak(p); setIsDataModalOpen(true); }}>
                                <FileEdit className="w-3.5 h-3.5" /> Lengkapi Data
                              </Button>
                              <Button variant="outline" className="h-8 px-3 text-xs gap-1.5" onClick={() => { setActivePeternak(p); setIsPhotoModalOpen(true); }}>
                                <UploadCloud className="w-3.5 h-3.5" /> Unggah Foto
                              </Button>
                            </>
                          )}

                          {activeTab === 'verifikasi' && (
                            <>
                              <Button onClick={() => { setActivePeternak(p); handleVerify('approve'); }} className="h-8 px-3 text-xs bg-green-600 hover:bg-green-700 text-white border-transparent gap-1.5" disabled={actionLoading}>
                                <CheckCircle className="w-3.5 h-3.5" /> Terima
                              </Button>
                              <Button onClick={() => { setActivePeternak(p); setIsRejectModalOpen(true); }} className="h-8 px-3 text-xs bg-red-600 hover:bg-red-700 text-white border-transparent gap-1.5">
                                <XCircle className="w-3.5 h-3.5" /> Tolak
                              </Button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal Lengkapi Data */}
      {isDataModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-neutral-900">Lengkapi Data Operasional</h3>
              <button onClick={() => setIsDataModalOpen(false)}><X className="w-5 h-5 text-neutral-500" /></button>
            </div>
            <form onSubmit={handleUpdateData} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-neutral-700 block mb-1">Jumlah Ayam</label>
                <Input type="number" required value={formData.chickenCount} onChange={e => setFormData({ ...formData, chickenCount: e.target.value })} placeholder="Contoh: 1000" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium text-neutral-700 block mb-1">Produksi/Hari</label>
                  <Input type="number" required value={formData.eggProd} onChange={e => setFormData({ ...formData, eggProd: e.target.value })} placeholder="Butir" />
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-700 block mb-1">Rusak/Hari</label>
                  <Input type="number" required value={formData.eggBroken} onChange={e => setFormData({ ...formData, eggBroken: e.target.value })} placeholder="Butir" />
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-700 block mb-1">Bersih/Hari</label>
                  <Input type="number" required value={formData.eggClean} onChange={e => setFormData({ ...formData, eggClean: e.target.value })} placeholder="Butir" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700 block mb-1">Jenis Pakan</label>
                <Input required value={formData.feedType} onChange={e => setFormData({ ...formData, feedType: e.target.value })} placeholder="Contoh: Konsentrat PAR-L" />
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700 block mb-1">Pengalaman (Tahun)</label>
                <Input type="number" step="0.1" required value={formData.experience} onChange={e => setFormData({ ...formData, experience: e.target.value })} placeholder="Contoh: 2.5" />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" id="hasV" checked={formData.hasVehicle} onChange={e => setFormData({ ...formData, hasVehicle: e.target.checked })} className="w-4 h-4" />
                <label htmlFor="hasV" className="text-sm font-medium text-neutral-700">Punya Kendaraan Distribusi?</label>
              </div>
              {formData.hasVehicle && (
                <div>
                  <label className="text-sm font-medium text-neutral-700 block mb-1">Jenis Kendaraan</label>
                  <Input required value={formData.vehicleType} onChange={e => setFormData({ ...formData, vehicleType: e.target.value })} placeholder="Contoh: Mobil Grandmax" />
                </div>
              )}
              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
                <Button type="button" variant="outline" onClick={() => setIsDataModalOpen(false)}>Batal</Button>
                <Button type="submit" disabled={actionLoading} className="bg-primary-500 hover:bg-primary-600 text-white border-transparent">
                  {actionLoading ? 'Menyimpan...' : 'Simpan Data'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Unggah Foto */}
      {isPhotoModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-neutral-900">Unggah Foto Kandang</h3>
              <button onClick={() => setIsPhotoModalOpen(false)}><X className="w-5 h-5 text-neutral-500" /></button>
            </div>
            <form onSubmit={handleUploadPhotos} className="space-y-4">
              {['kandang_luar', 'kandang_dalam', 'ayam', 'telur'].map((type) => (
                <div key={type} className="border border-neutral-200 rounded p-3 bg-neutral-50">
                  <label className="text-sm font-bold text-neutral-700 block mb-2 capitalize">{type.replace('_', ' ')}</label>
                  <input type="file" accept="image/*" onChange={(e) => setPhotos({ ...photos, [type]: e.target.files?.[0] || null })} className="text-sm w-full" />
                </div>
              ))}
              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
                <Button type="button" variant="outline" onClick={() => setIsPhotoModalOpen(false)}>Batal</Button>
                <Button type="submit" disabled={actionLoading} className="bg-primary-500 hover:bg-primary-600 text-white border-transparent">
                  {actionLoading ? 'Mengunggah...' : 'Unggah Semua Foto'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tolak */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-bold text-neutral-900 mb-2">Tolak Peternak</h3>
            <p className="text-sm text-neutral-500 mb-4">Akun akan dihapus dari sistem dan email penolakan akan dikirimkan.</p>
            <textarea
              className="w-full border border-neutral-300 rounded p-3 text-sm focus:outline-none focus:border-primary-500 mb-4 h-24 resize-none"
              placeholder="Alasan penolakan..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsRejectModalOpen(false)}>Batal</Button>
              <Button onClick={() => handleVerify('reject')} disabled={actionLoading} className="bg-red-600 hover:bg-red-700 text-white border-transparent">
                {actionLoading ? 'Memproses...' : 'Kirim Penolakan'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail Data & Foto */}
      {isDetailModalOpen && activePeternak && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-neutral-900">Detail Pendaftar: {activePeternak.full_name}</h3>
              <button onClick={() => setIsDetailModalOpen(false)}><X className="w-6 h-6 text-neutral-500 hover:text-neutral-900" /></button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                <div>
                  <p className="text-xs text-neutral-500 font-bold uppercase mb-1">Email</p>
                  <p className="text-sm text-neutral-900 font-medium">{activePeternak.email}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 font-bold uppercase mb-1">Nomor HP</p>
                  <p className="text-sm text-neutral-900 font-medium">{activePeternak.phone_number}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 font-bold uppercase mb-1">Alamat Kandang</p>
                  <p className="text-sm text-neutral-900 font-medium">{activePeternak.farm_address || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 font-bold uppercase mb-1">Metode Pendaftaran</p>
                  <p className="text-sm text-neutral-900 font-medium">{activePeternak.registration_method === 'video_call_cs' ? 'Dibantu CS (Video Call)' : 'Mandiri (Self Form)'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white p-4 rounded-lg border border-neutral-200 shadow-sm">
                <div>
                  <p className="text-xs text-neutral-500 font-bold uppercase mb-1">Jml Ayam</p>
                  <p className="text-lg text-neutral-900 font-bold">{activePeternak.chicken_count}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 font-bold uppercase mb-1">Produksi/Hari</p>
                  <p className="text-lg text-neutral-900 font-bold">{activePeternak.daily_egg_production || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 font-bold uppercase mb-1">Telur Bersih</p>
                  <p className="text-lg text-neutral-900 font-bold">{activePeternak.daily_clean_eggs || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 font-bold uppercase mb-1">Telur Rusak</p>
                  <p className="text-lg text-neutral-900 font-bold">{activePeternak.daily_damaged_eggs || 0}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-neutral-200 rounded p-4">
                  <p className="text-xs text-neutral-500 font-bold uppercase mb-1">Jenis Pakan</p>
                  <p className="text-sm text-neutral-900">{activePeternak.feed_type}</p>
                </div>
                <div className="border border-neutral-200 rounded p-4">
                  <p className="text-xs text-neutral-500 font-bold uppercase mb-1">Logistik & Kendaraan</p>
                  <p className="text-sm text-neutral-900">Pengalaman: {activePeternak.farming_experience_years || 0} Tahun</p>
                  <p className="text-sm text-neutral-900 mt-1">
                    Kendaraan: {activePeternak.has_vehicle
                      ? (activePeternak.vehicles && activePeternak.vehicles.length > 0 ? activePeternak.vehicles[0].vehicle_type : 'Ya')
                      : 'Tidak Punya'}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-neutral-900 mb-3 border-b border-neutral-100 pb-2">Foto Dokumentasi</h4>
                <div className="grid grid-cols-2 gap-4">
                  {['kandang_luar', 'kandang_dalam', 'ayam', 'telur'].map((type) => {
                    const photoObj = activePeternak.photos?.find(p => p.photo_type === type);
                    return (
                      <div key={type} className="border border-neutral-200 rounded-lg overflow-hidden bg-neutral-50 flex flex-col">
                        <div className="p-2 bg-white border-b border-neutral-200 font-bold text-xs uppercase text-neutral-700 text-center">
                          {type.replace('_', ' ')}
                        </div>
                        <div className="flex-1 min-h-[150px] relative flex items-center justify-center bg-neutral-100 p-2">
                          {photoObj?.photo_url ? (
                            <img src={photoObj.photo_url} alt={type} className="max-w-full max-h-[200px] object-contain rounded" />
                          ) : (
                            <span className="text-neutral-400 text-sm font-medium italic">Tidak ada foto</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-neutral-200">
              <Button variant="outline" onClick={() => setIsDetailModalOpen(false)} className="px-6">Tutup</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
