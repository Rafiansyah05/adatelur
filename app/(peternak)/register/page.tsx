'use client';

import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { CameraCapture } from '@/components/CameraCapture';
import { createClient } from '@/lib/supabase/client';
import { PhoneCall, Eye, EyeOff, X, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { AddressAutocomplete } from '@/components/ui/AddressAutocomplete';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const codeLength = 6;

// --- Custom Toast Component ---
interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}
function CustomToast({ message, type, onClose }: ToastProps) {
  React.useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);

  const bgColor = type === 'error' ? 'bg-red-50 border-red-200 text-red-800'
    : type === 'success' ? 'bg-green-50 border-green-200 text-green-800'
      : 'bg-blue-50 border-blue-200 text-blue-800';
  const Icon = type === 'error' ? AlertCircle : type === 'success' ? CheckCircle2 : AlertCircle;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-5 fade-in duration-300 w-[90%] max-w-md">
      <div className={`flex items-start sm:items-center gap-3 px-4 py-3 rounded-sm border shadow-sm ${bgColor}`}>
        <Icon className="w-5 h-5 shrink-0 mt-0.5 sm:mt-0" />
        <span className="text-[14px] font-bold flex-1 leading-snug">{message}</span>
        <button onClick={onClose} className="shrink-0 text-inherit hover:opacity-70 focus:outline-none">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// --- Custom Modal Component (For Photo Warning) ---
function ConfirmModal({ isOpen, title, desc, onConfirm, onCancel, confirmText = 'Lanjut' }: any) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-sm p-6 w-full max-w-md shadow-xl animate-in zoom-in-95 duration-200">
        <h3 className="text-[18px] font-bold text-neutral-900 mb-2">{title}</h3>
        <p className="text-[14px] text-neutral-500 mb-6 leading-relaxed">{desc}</p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={onCancel} className="rounded-sm bg-neutral-100 border-transparent hover:bg-neutral-200 font-bold">
            Batal
          </Button>
          <Button onClick={onConfirm} className="rounded-sm bg-primary-400 hover:bg-primary-500 text-neutral-900 font-bold">
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPeternakPage() {
  const router = useRouter();

  // Toast State
  const [toast, setToast] = React.useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'error') => setToast({ message, type });

  const [step, setStep] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [timeLeft, setTimeLeft] = React.useState(300);

  // Check if user is already logged in and pending
  React.useEffect(() => {
    const checkExistingSession = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: details } = await supabase
          .from('peternak_details')
          .select('*')
          .eq('profile_id', user.id)
          .single();

        if (details) {
          if (details.verification_status === 'verified' || details.registration_method === 'video_call_cs') {
            router.push('/dashboard');
          } else if (details.verification_status === 'pending') {
            // Restore step
            if (details.chicken_count > 0 || details.feed_type !== '-') {
              // Jika data operasional sudah ada (pernah update), bisa ke step 4.
              // Tapi untuk mempermudah (karena file foto tidak bisa di-prefill di browser), 
              // kita arahkan ulang ke Step 3 atau 4 tergantung kebutuhan. 
              // Kita set ke 3 saja agar mereka bisa review ulang atau lanjut ke 4.
            }
            setStep(3);
          }
        }
      }
    };
    checkExistingSession();
  }, [router]);

  // Timer for OTP
  React.useEffect(() => {
    if (step !== 2) return;
    if (timeLeft <= 0) {
      showToast('Waktu verifikasi telah habis. Silakan coba mendaftar kembali.', 'error');
      setTimeout(() => window.location.reload(), 2000);
      return;
    }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // State Tahap 1 (Akun)
  const [nama, setNama] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [birthDate, setBirthDate] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [lat, setLat] = React.useState<number | null>(null);
  const [lng, setLng] = React.useState<number | null>(null);

  // State OTP (Tahap 2)
  const [otpToken, setOtpToken] = React.useState('');

  // State Tahap 3 (Operasional)
  const [registrationMethod, setRegistrationMethod] = React.useState<'self_form' | 'video_call_cs' | null>(null);
  const [videoCallAgreed, setVideoCallAgreed] = React.useState(false);
  const [chickenCount, setChickenCount] = React.useState('');
  const [eggProd, setEggProd] = React.useState('');
  const [eggBroken, setEggBroken] = React.useState('');
  const [eggClean, setEggClean] = React.useState('');
  const [feedType, setFeedType] = React.useState('');
  const [cleanliness, setCleanliness] = React.useState('');
  const [hasVehicle, setHasVehicle] = React.useState(false);
  const [vehicleType, setVehicleType] = React.useState('');
  const [experience, setExperience] = React.useState('');

  // State Tahap 4 (Foto - Sub Steps)
  const [photoStep, setPhotoStep] = React.useState(1);
  const [fotoLuar, setFotoLuar] = React.useState<string | null>(null);
  const [fotoDalam, setFotoDalam] = React.useState<string | null>(null);
  const [fotoAyam, setFotoAyam] = React.useState<string | null>(null);
  const [fotoTelur, setFotoTelur] = React.useState<string | null>(null);

  // Confirm Modal State
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [confirmAction, setConfirmAction] = React.useState<(() => void) | null>(null);

  // --- Actions ---

  const handleNextStep1 = async () => {
    if (!nama || !phone || !email || !password || !birthDate || !address || lat === null || lng === null) {
      showToast('Mohon lengkapi semua data Tahap 1 termasuk email, password, dan lokasi.');
      return;
    }

    const cleanedPhone = phone.replace(/\D/g, '');
    if (cleanedPhone.startsWith('0')) {
      showToast('Nomor telepon tidak boleh diawali dengan angka 0.');
      return;
    }
    if (cleanedPhone.length !== 11) {
      showToast('Nomor telepon harus tepat 11 digit (setelah +62).');
      return;
    }
    if (password.length < 6) {
      showToast('Password minimal 6 karakter.');
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = `62${cleanedPhone}`;
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email, password, nama, phone: formattedPhone, role: 'peternak',
          birthDate, address, lat, lng
        })
      });
      const result = await response.json();
      if (!response.ok) {
        setLoading(false);
        showToast(result.error || 'Gagal mendaftarkan akun.');
        return;
      }
      setLoading(false);
      showToast('Email verifikasi telah dikirim.', 'success');
      setStep(2);
    } catch (err) {
      setLoading(false);
      showToast('Terjadi kesalahan sistem.');
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpToken || otpToken.length !== 6) {
      showToast('Masukkan 6 digit kode OTP');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token: otpToken }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Verifikasi OTP gagal.');

      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw new Error('OTP valid, tetapi gagal login otomatis: ' + signInError.message);

      setStep(3);
      setTimeLeft(300);
      showToast('Verifikasi Berhasil!', 'success');
    } catch (err) {
      showToast((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const sendOtpEmail = async () => {
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      if (!response.ok) return { error: { message: result.error } };
      return { error: null, data: result };
    } catch (e) {
      return { error: { message: 'Network error' } };
    }
  };

  const handleNextStep3 = async () => {
    if (registrationMethod === 'self_form') {
      if (!chickenCount || !eggProd || !eggBroken || !eggClean || !feedType || !cleanliness || !experience || (hasVehicle && !vehicleType)) {
        showToast('Mohon lengkapi semua data operasional.');
        return;
      }
      setStep(4);
      setPhotoStep(1); // Mulai dari foto pertama
    } else if (registrationMethod === 'video_call_cs') {
      if (!videoCallAgreed) {
        showToast('Anda harus menyetujui panduan Video Call terlebih dahulu.');
        return;
      }
      setLoading(true);
      try {
        const response = await fetch('/api/auth/update-peternak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            birthDate: new Date().toISOString(), address: '-', lat: 0, lng: 0,
            registrationMethod: 'video_call_cs', chickenCount: 0, eggProd: 0, eggBroken: 0, eggClean: 0, feedType: '-', experience: 0,
            hasVehicle: false, vehicleType: ''
          }),
        });
        if (!response.ok) throw new Error('Gagal memperbarui metode registrasi.');
        showToast('Metode Video Call berhasil disimpan. Silakan hubungi CS.', 'success');
        router.push('/dashboard');
      } catch (err) {
        showToast((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleNextPhoto = () => {
    // Check if current photo is taken
    if (photoStep === 1 && !fotoLuar) return showToast('Ambil foto luar kandang terlebih dahulu.');
    if (photoStep === 2 && !fotoDalam) return showToast('Ambil foto dalam kandang terlebih dahulu.');
    if (photoStep === 3 && !fotoAyam) return showToast('Ambil foto ayam terlebih dahulu.');
    if (photoStep === 4 && !fotoTelur) return showToast('Ambil foto telur terlebih dahulu.');

    // Warning confirmation
    setConfirmAction(() => () => {
      setIsConfirmOpen(false);
      if (photoStep < 4) {
        setPhotoStep(prev => prev + 1);
      } else {
        handleFinalSubmit(); // Trigger final submit after last photo
      }
    });
    setIsConfirmOpen(true);
  };

  const dataUrlToFile = async (dataUrl: string, filename: string): Promise<File> => {
    const res = await fetch(dataUrl);
    const buf = await res.arrayBuffer();
    return new File([buf], filename, { type: 'image/jpeg' });
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/update-peternak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birthDate, address, lat, lng,
          registrationMethod, chickenCount, eggProd, eggBroken, eggClean, feedType, experience,
          hasVehicle, vehicleType
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Gagal memperbarui data peternak.');
      }

      const { peternakId } = await response.json();

      const supabase = createClient();

      const photos = [
        { type: 'kandang_luar', src: fotoLuar },
        { type: 'kandang_dalam', src: fotoDalam },
        { type: 'ayam', src: fotoAyam },
        { type: 'telur', src: fotoTelur },
      ].filter(p => p.src);

      if (photos.length > 0) {
        const photoRes = await fetch('/api/auth/complete-peternak-photos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ peternakId, photos }),
        });
        
        if (!photoRes.ok) {
           console.warn('Gagal mengunggah foto');
        }
      }

      setStep(5);
    } catch (err) {
      showToast((err as Error).message || 'Terjadi kesalahan saat menyimpan data.');
    } finally {
      setLoading(false);
    }
  };

  // --- UI Layout ---

  const steps = [
    { num: 1, label: 'Data Akun' },
    { num: 2, label: 'Verifikasi' },
    { num: 3, label: 'Kandang' },
    { num: 4, label: 'Foto' },
    { num: 5, label: 'Selesai' }
  ];

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col font-sans relative">
      {toast && <CustomToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Unggah Foto?"
        desc="Pastikan foto terlihat jelas. Foto yang telah diambil tidak dapat ditarik/dihapus setelah melanjutkan. Lanjutkan ke langkah berikutnya?"
        confirmText="Unggah & Lanjut"
        onConfirm={() => confirmAction?.()}
        onCancel={() => setIsConfirmOpen(false)}
      />

      {/* Header Bar */}
      <header className="w-full bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Image src="/icons/icon-512x512.png" alt="adatelur" width={36} height={36} className="rounded-sm object-contain" />
          <span className="text-[20px] font-extrabold text-neutral-900 tracking-tight hidden sm:block">adatelur.</span>
        </div>

        {/* Stepper Desktop */}
        <div className="hidden md:flex items-center gap-6 text-[13px] font-bold">
          {steps.map((s, i) => (
            <React.Fragment key={s.num}>
              <div className={`flex items-center gap-2 ${step >= s.num ? 'text-primary-600' : 'text-neutral-400'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${step >= s.num ? 'bg-primary-100' : 'bg-neutral-100'}`}>
                  {step > s.num ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                </div>
                <span>{s.label}</span>
              </div>
              {i < steps.length - 1 && <div className="w-8 h-[1px] bg-neutral-200" />}
            </React.Fragment>
          ))}
        </div>

        {/* Stepper Mobile */}
        <div className="md:hidden text-[13px] font-bold text-neutral-500">
          Tahap {step} dari 5
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto p-4 sm:p-8 flex flex-col items-center">

        <div className="w-full bg-white rounded-sm border border-neutral-200 shadow-sm p-6 sm:p-10 mb-10 relative">

          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-6 mb-8">
                <div>
                  <h1 className="text-[28px] font-extrabold text-neutral-900 tracking-tight">Data Akun Anda</h1>
                  <p className="text-[14px] text-neutral-500 font-medium mt-1">Lengkapi informasi dasar untuk bergabung sebagai mitra.</p>
                </div>
              </div>

              <div className="space-y-10">
                {/* Section 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12">
                  <div className="lg:col-span-4">
                    <h3 className="text-[16px] font-bold text-neutral-900">Informasi Personal</h3>
                    <p className="text-[13px] text-neutral-500 mt-1">Masukkan nama sesuai KTP dan nomor telepon aktif Anda.</p>
                  </div>
                  <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-neutral-700 font-bold mb-1.5 block">Nama Lengkap Pemilik*</Label>
                      <Input
                        value={nama} onChange={(e) => setNama(e.target.value)}
                        placeholder="Misal: Budi Santoso"
                        className="min-h-[48px] border-neutral-200 bg-neutral-50 focus:bg-white text-[14px] font-medium rounded-sm shadow-none"
                      />
                    </div>
                    <div>
                      <Label className="text-neutral-700 font-bold mb-1.5 block">Nomor HP*</Label>
                      <div className="relative flex items-center">
                        <span className="absolute left-4 font-bold text-neutral-500 text-[14px]">+62</span>
                        <Input
                          type="tel" value={phone} maxLength={11}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                          placeholder="81234567890"
                          className="min-h-[48px] border-neutral-200 bg-neutral-50 focus:bg-white text-[14px] font-medium rounded-sm pl-12 shadow-none w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2 */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 pt-8 border-t border-neutral-100">
                  <div className="lg:col-span-4">
                    <h3 className="text-[16px] font-bold text-neutral-900">Akses Masuk</h3>
                    <p className="text-[13px] text-neutral-500 mt-1">Email dan password akan digunakan untuk masuk ke dashboard.</p>
                  </div>
                  <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-neutral-700 font-bold mb-1.5 block">Email Aktif*</Label>
                      <Input
                        type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                        placeholder="email@contoh.com"
                        className="min-h-[48px] border-neutral-200 bg-neutral-50 focus:bg-white text-[14px] font-medium rounded-sm shadow-none"
                      />
                    </div>
                    <div>
                      <Label className="text-neutral-700 font-bold mb-1.5 block">Password*</Label>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                          placeholder="Minimal 6 karakter"
                          className="min-h-[48px] border-neutral-200 bg-neutral-50 focus:bg-white text-[14px] font-medium rounded-sm shadow-none pr-10"
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3 */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 pt-8 border-t border-neutral-100">
                  <div className="lg:col-span-4">
                    <h3 className="text-[16px] font-bold text-neutral-900">Informasi Tambahan</h3>
                    <p className="text-[13px] text-neutral-500 mt-1">Tanggal lahir dan titik koordinat peternakan Anda.</p>
                  </div>
                  <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    <div>
                      <Label className="text-neutral-700 font-bold mb-1.5 block">Tanggal Lahir*</Label>
                      <Input
                        type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)}
                        className="min-h-[48px] border-neutral-200 bg-neutral-50 focus:bg-white text-[14px] font-medium rounded-sm shadow-none block w-full relative [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-4 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                      />
                    </div>
                    <div>
                      <Label className="text-neutral-700 font-bold mb-1.5 block">Alamat Peternakan*</Label>
                      <AddressAutocomplete
                        defaultValue={address}
                        onLocationSelect={(addr, latitude, longitude) => {
                          setAddress(addr); setLat(latitude); setLng(longitude);
                        }}
                      />
                      {lat && lng && (
                        <p className="text-[12px] text-green-600 font-bold mt-2 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Lokasi berhasil ditandai
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-10 border-t border-neutral-100 mt-10">
                <Button onClick={handleNextStep1} disabled={loading} className="min-h-[48px] min-w-[200px] bg-primary-400 hover:bg-primary-500 text-neutral-900 font-bold rounded-sm border-transparent transition-none">
                  {loading ? 'Memproses...' : 'Simpan & Lanjut'}
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="max-w-md mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300 py-10">
              <div className="text-center mb-8">
                <h1 className="text-[28px] font-extrabold text-neutral-900 tracking-tight mb-2">Verifikasi Email</h1>
                <p className="text-[14px] text-neutral-500 font-medium leading-relaxed">
                  Kami telah mengirim 6 digit kode OTP ke <br /><span className="font-bold text-neutral-800">{email}</span>
                </p>
                <br />
                <p className="text-[13px] text-neutral-400 font-medium">
                  Mohon periksa folder <span className="font-semibold text-neutral-500">Inbox</span>, <span className="font-semibold text-neutral-500">Spam</span>, atau <span className="font-semibold text-neutral-500">Draft</span> Anda.
                </p>
              </div>

              <div className="relative mb-6">
                <input
                  type="text" inputMode="numeric" autoComplete="one-time-code" autoFocus
                  value={otpToken} onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, '').slice(0, codeLength))}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
                <div className="pointer-events-none flex justify-center gap-3">
                  {Array.from({ length: codeLength }).map((_, i) => (
                    <div key={i} className={`flex h-16 flex-1 items-center justify-center rounded-sm text-[24px] font-bold ${i === otpToken.length
                      ? 'border-2 border-primary-400 bg-white text-neutral-900 shadow-sm'
                      : 'border border-neutral-200 bg-neutral-50 text-neutral-900'
                      }`}>
                      {otpToken[i] ?? ''}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-center mb-8 text-[13px] font-medium text-neutral-500">
                Waktu tersisa:&nbsp;<span className="font-bold text-neutral-800 font-mono">{formatTime(timeLeft)}</span>
              </div>

              <Button onClick={handleVerifyOtp} disabled={loading || otpToken.length !== 6} className="w-full min-h-[52px] bg-primary-400 hover:bg-primary-500 text-neutral-900 font-bold rounded-sm transition-none">
                {loading ? 'Verifikasi...' : 'Verifikasi Sekarang'}
              </Button>

              <div className="mt-8 text-center text-[13px] text-neutral-500 font-medium">
                Belum menerima kode?{' '}
                <button type="button" onClick={async () => {
                  setLoading(true);
                  const resend = await sendOtpEmail();
                  setLoading(false);
                  if (resend.error) showToast('Gagal mengirim ulang OTP');
                  else { showToast('Kode OTP baru telah dikirim!', 'success'); setTimeLeft(300); }
                }} className="font-bold text-primary-600 hover:underline">
                  Kirim ulang
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="border-b border-neutral-100 pb-6 mb-8">
                <h1 className="text-[28px] font-extrabold text-neutral-900 tracking-tight">Data Operasional Kandang</h1>
                <p className="text-[14px] text-neutral-500 font-medium mt-1">Lengkapi informasi untuk estimasi kapasitas produksi Anda.</p>
              </div>

              {!registrationMethod && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto py-10">
                  <Button onClick={() => setRegistrationMethod('video_call_cs')} className="py-12 flex flex-col gap-3 h-auto bg-white border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 text-neutral-700 font-bold rounded-sm transition-none">
                    <PhoneCall className="w-10 h-10 text-primary-600" />
                    <span className="text-[16px]">Video Call dengan CS</span>
                    <span className="text-[12px] text-neutral-400 font-normal">CS kami akan memandu Anda</span>
                  </Button>
                  <Button onClick={() => setRegistrationMethod('self_form')} className="py-12 flex flex-col gap-3 h-auto bg-white border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 text-neutral-700 font-bold rounded-sm transition-none">
                    <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center mb-1"><FileText className="w-5 h-5 text-neutral-600" /></div>
                    <span className="text-[16px]">Isi Form Sendiri</span>
                    <span className="text-[12px] text-neutral-400 font-normal">Lengkapi formulir secara mandiri</span>
                  </Button>
                </div>
              )}

              {registrationMethod === 'video_call_cs' && (
                <div className="max-w-md mx-auto text-center py-6 space-y-6">
                  <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-2">
                    <PhoneCall className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-[15px] text-neutral-700 font-medium leading-relaxed">
                    Silakan hubungi Customer Service kami via WhatsApp untuk dibantu mengisi data operasional.
                  </p>

                  <div className="flex items-start text-left gap-3 bg-neutral-50 p-4 rounded-sm border border-neutral-200">
                    <input
                      type="checkbox"
                      id="agree-vc"
                      checked={videoCallAgreed}
                      onChange={(e) => setVideoCallAgreed(e.target.checked)}
                      className="mt-1 w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500 cursor-pointer"
                    />
                    <label htmlFor="agree-vc" className="text-[13px] text-neutral-600 cursor-pointer">
                      Saya setuju untuk dibantu registrasi dengan melalui panduan Video Call bersama CS Adatelur, dan data saya akan diinputkan oleh Admin.
                    </label>
                  </div>

                  <Button
                    disabled={!videoCallAgreed}
                    onClick={(e) => {
                      e.preventDefault();
                      window.open(`https://wa.me/6281243205089?text=${encodeURIComponent(`Halo CS Adatelur,\n\nSaya ingin dibantu melakukan registrasi peternak via Video Call.\n\nNama: ${nama}\nEmail: ${email}\nNo HP: ${phone}`)}`, '_blank');
                      handleNextStep3();
                    }}
                    className="w-full min-h-[52px] bg-[#25D366] text-white hover:bg-[#128C7E] font-bold rounded-sm border-transparent"
                  >
                    Hubungi CS via WhatsApp
                  </Button>
                  <p className="text-[12px] text-neutral-500 font-medium">Setelah menghubungi CS, Anda akan dialihkan ke Dashboard.</p>
                  <div className="flex gap-3">
                    <Button onClick={() => setRegistrationMethod(null)} className="flex-1 min-h-[48px] bg-neutral-100 border-transparent hover:bg-neutral-200 text-neutral-700 font-bold rounded-sm">
                      Kembali
                    </Button>
                  </div>
                </div>
              )}

              {registrationMethod === 'self_form' && (
                <div className="space-y-10">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12">
                    <div className="lg:col-span-4">
                      <h3 className="text-[16px] font-bold text-neutral-900">Kapasitas & Produksi</h3>
                      <p className="text-[13px] text-neutral-500 mt-1">Data estimasi produksi telur harian Anda.</p>
                    </div>
                    <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-neutral-700 font-bold mb-1.5 block">Jumlah Ayam (ekor)*</Label>
                        <Input type="number" value={chickenCount} onChange={(e) => setChickenCount(e.target.value)} className="min-h-[48px] rounded-sm bg-neutral-50 border-neutral-200 shadow-none text-[14px]" />
                      </div>
                      <div>
                        <Label className="text-neutral-700 font-bold mb-1.5 block">Produksi Telur Harian*</Label>
                        <Input type="number" value={eggProd} onChange={(e) => setEggProd(e.target.value)} className="min-h-[48px] rounded-sm bg-neutral-50 border-neutral-200 shadow-none text-[14px]" />
                      </div>
                      <div>
                        <Label className="text-neutral-700 font-bold mb-1.5 block">Telur Bersih/Hari*</Label>
                        <Input type="number" value={eggClean} onChange={(e) => setEggClean(e.target.value)} className="min-h-[48px] rounded-sm bg-neutral-50 border-neutral-200 shadow-none text-[14px]" />
                      </div>
                      <div>
                        <Label className="text-neutral-700 font-bold mb-1.5 block">Telur Rusak/Hari*</Label>
                        <Input type="number" value={eggBroken} onChange={(e) => setEggBroken(e.target.value)} className="min-h-[48px] rounded-sm bg-neutral-50 border-neutral-200 shadow-none text-[14px]" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 pt-8 border-t border-neutral-100">
                    <div className="lg:col-span-4">
                      <h3 className="text-[16px] font-bold text-neutral-900">Manajemen & Logistik</h3>
                      <p className="text-[13px] text-neutral-500 mt-1">Pengalaman beternak dan ketersediaan armada distribusi.</p>
                    </div>
                    <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <Label className="text-neutral-700 font-bold mb-1.5 block">Jenis Pakan*</Label>
                        <textarea
                          value={feedType}
                          onChange={(e) => setFeedType(e.target.value)}
                          placeholder="Contoh: Pakan Pabrikan PAR-L, Campuran (Konsentrat + Jagung + Dedak), dll."
                          className="w-full min-h-[80px] p-3 rounded-sm bg-neutral-50 border border-neutral-200 shadow-none text-[14px] focus:outline-none focus:border-primary-400 resize-y"
                        />
                        <p className="text-[12px] text-neutral-500 mt-1.5">
                          Isi dengan nama/merek pakan pabrikan atau komposisi racikan pakan yang diberikan kepada ayam saat ini. Anda bisa menginput lebih dari satu jenis (pisahkan dengan koma).
                        </p>
                      </div>
                      <div>
                        <Label className="text-neutral-700 font-bold mb-1.5 block">Kebersihan Kandang*</Label>
                        <Input value={cleanliness} onChange={(e) => setCleanliness(e.target.value)} placeholder="Contoh: Dibersihkan 2x sehari" className="min-h-[48px] rounded-sm bg-neutral-50 border-neutral-200 shadow-none text-[14px]" />
                      </div>
                      <div>
                        <Label className="text-neutral-700 font-bold mb-1.5 block">Pengalaman (tahun)*</Label>
                        <Input type="number" value={experience} onChange={(e) => setExperience(e.target.value)} className="min-h-[48px] rounded-sm bg-neutral-50 border-neutral-200 shadow-none text-[14px]" />
                      </div>
                      <div className="sm:col-span-2 mt-2">
                        <Label className="text-neutral-700 font-bold mb-3 block">Memiliki Kendaraan Operasional?*</Label>
                        <div className="flex gap-6">
                          <label className="flex items-center gap-2 cursor-pointer text-[14px] font-bold text-neutral-800">
                            <input type="radio" checked={hasVehicle} onChange={() => setHasVehicle(true)} className="w-4 h-4 accent-primary-600" />
                            Ya, Punya
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer text-[14px] font-bold text-neutral-800">
                            <input type="radio" checked={!hasVehicle} onChange={() => { setHasVehicle(false); setVehicleType(''); }} className="w-4 h-4 accent-primary-600" />
                            Tidak Punya
                          </label>
                        </div>
                      </div>
                      {hasVehicle && (
                        <div className="sm:col-span-2 mt-2 animate-in fade-in slide-in-from-top-2">
                          <Label className="text-neutral-700 font-bold mb-1.5 block">Jenis Kendaraan*</Label>
                          <div className="relative">
                            <select
                              value={vehicleType}
                              onChange={(e) => setVehicleType(e.target.value)}
                              className="w-full min-h-[48px] appearance-none rounded-sm bg-neutral-50 border border-neutral-200 px-3 text-[14px] text-neutral-900 focus:bg-white focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 transition-colors"
                            >
                              <option value="">Pilih Jenis Kendaraan</option>
                              <option value="Mobil">Mobil</option>
                              <option value="Motor">Motor</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end pt-10 border-t border-neutral-100 gap-3">
                    <Button onClick={() => setRegistrationMethod(null)} className="min-h-[48px] bg-neutral-100 border-transparent hover:bg-neutral-200 text-neutral-700 font-bold rounded-sm transition-none px-6">
                      Batal
                    </Button>
                    <Button onClick={handleNextStep3} className="min-h-[48px] min-w-[160px] bg-primary-400 hover:bg-primary-500 border-transparent text-neutral-900 font-bold rounded-sm transition-none">
                      Simpan & Lanjut
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center bg-primary-50 text-primary-700 text-[12px] font-bold px-3 py-1 rounded-sm mb-4">
                  FOTO {photoStep} DARI 4
                </div>
                <h1 className="text-[28px] font-extrabold text-neutral-900 tracking-tight">Dokumentasi Peternakan</h1>
                <p className="text-[14px] text-neutral-500 font-medium mt-1 leading-relaxed">
                  {photoStep === 1 ? 'Silakan ambil foto bagian luar kandang secara jelas.'
                    : photoStep === 2 ? 'Silakan ambil foto area dalam kandang tempat ayam berada.'
                      : photoStep === 3 ? 'Silakan ambil foto close-up ayam peternakan Anda.'
                        : 'Silakan ambil foto telur hasil panen Anda.'}
                </p>
              </div>

              <div className="bg-neutral-50 rounded-sm border border-neutral-200 p-4 sm:p-6 mb-8">
                {photoStep === 1 && <CameraCapture
                  label="1. Tampak Luar Kandang"
                  onCapture={setFotoLuar}
                  nextButton={
                    fotoLuar ? (
                      <Button onClick={handleNextPhoto} disabled={loading} className="w-full min-h-[52px] bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-lg border-transparent transition-colors shadow-md">
                        {loading ? 'Memproses...' : 'Lanjut'}
                      </Button>
                    ) : null
                  }
                />}
                {photoStep === 2 && <CameraCapture
                  label="2. Tampak Dalam Kandang"
                  onCapture={setFotoDalam}
                  nextButton={
                    fotoDalam ? (
                      <Button onClick={handleNextPhoto} disabled={loading} className="w-full min-h-[52px] bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-lg border-transparent transition-colors shadow-md">
                        {loading ? 'Memproses...' : 'Lanjut'}
                      </Button>
                    ) : null
                  }
                />}
                {photoStep === 3 && <CameraCapture
                  label="3. Foto Ayam"
                  onCapture={setFotoAyam}
                  nextButton={
                    fotoAyam ? (
                      <Button onClick={handleNextPhoto} disabled={loading} className="w-full min-h-[52px] bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-lg border-transparent transition-colors shadow-md">
                        {loading ? 'Memproses...' : 'Lanjut'}
                      </Button>
                    ) : null
                  }
                />}
                {photoStep === 4 && <CameraCapture
                  label="4. Foto Telur"
                  onCapture={setFotoTelur}
                  nextButton={
                    fotoTelur ? (
                      <Button onClick={handleNextPhoto} disabled={loading} className="w-full min-h-[52px] bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-lg border-transparent transition-colors shadow-md">
                        {loading ? 'Memproses...' : 'Kirim Pendaftaran'}
                      </Button>
                    ) : null
                  }
                />}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="text-center space-y-6 py-12 animate-in zoom-in-95 duration-500 max-w-md mx-auto">
              <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
              </div>
              <h1 className="text-[32px] font-extrabold text-neutral-900 tracking-tight">Pendaftaran Sukses!</h1>
              <p className="text-[15px] text-neutral-500 font-medium leading-relaxed">
                Data pendaftaran dan dokumen foto Anda berhasil dikirim dan tersimpan di sistem. Tim verifikasi kami akan meninjau data Anda dalam kurun waktu maksimal 2x24 jam kerja. <br /> Silahkan selalu mengecek email anda untuk menantikan pengunguman verifikasi akun anda!
              </p>
              <div className="pt-8">
                <Button
                  onClick={() => router.push('/dashboard')}
                  className="w-full min-h-[52px] bg-neutral-900 border border-transparent hover:bg-neutral-800 text-white font-bold rounded-sm transition-none shadow-md"
                >
                  Masuk ke Dashboard
                </Button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
