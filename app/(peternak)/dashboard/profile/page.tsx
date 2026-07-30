'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { User, CreditCard, Lock, LogOut, Camera, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { BankAccountForm } from '@/components/peternak/BankAccountForm';
import { showToast } from '@/components/ui/toast';

type Tab = 'informasi' | 'rekening' | 'password';

export default function PeternakProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<Tab>('informasi');
  const [loading, setLoading] = useState(true);

  const [profileId, setProfileId] = useState('');
  const [profileName, setProfileName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [provider, setProvider] = useState('');

  const [farmName, setFarmName] = useState('');
  const [isSavingFarmName, setIsSavingFarmName] = useState(false);
  const [farmNameMsg, setFarmNameMsg] = useState({ text: '', isError: false });

  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountHolder, setBankAccountHolder] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [isCurrentPasswordVerified, setIsCurrentPasswordVerified] = useState(false);
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ text: '', isError: false });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    async function loadData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      setProfileId(user.id);
      setEmail(user.email || '');
      setProvider(user.app_metadata.provider || 'email');

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone_number, avatar_url')
        .eq('id', user.id)
        .single();

      if (profile) {
        setProfileName(profile.full_name || '');
        setPhoneNumber(profile.phone_number || '');
        setAvatarUrl(profile.avatar_url);
      }

      const { data: detail } = await supabase
        .from('peternak_details')
        .select('farm_name, bank_name, bank_account_number, bank_account_holder')
        .eq('profile_id', user.id)
        .maybeSingle();

      if (detail) {
        setFarmName(detail.farm_name || 'Peternak Ada Telur');
        setBankName(detail.bank_name || '');
        setBankAccountNumber(detail.bank_account_number || '');
        setBankAccountHolder(detail.bank_account_holder || '');
      }

      setLoading(false);
    }
    loadData();
  }, [supabase, router]);

  const handleSaveFarmName = async () => {
    if (!farmName.trim()) {
      setFarmNameMsg({ text: 'Nama peternakan ayam tidak boleh kosong.', isError: true });
      return;
    }
    setIsSavingFarmName(true);
    setFarmNameMsg({ text: '', isError: false });
    try {
      const { error } = await supabase
        .from('peternak_details')
        .update({ farm_name: farmName.trim() })
        .eq('profile_id', profileId);

      if (error) throw error;
      setFarmNameMsg({ text: 'Nama peternakan berhasil diperbarui!', isError: false });
      setTimeout(() => setFarmNameMsg({ text: '', isError: false }), 4000);
    } catch (err: any) {
      setFarmNameMsg({ text: err.message || 'Gagal mengubah nama peternakan', isError: true });
    } finally {
      setIsSavingFarmName(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profileId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profileId);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
    } catch (err: any) {
      showToast('Gagal mengunggah foto: ' + err.message, 'error');
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleVerifyCurrentPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage({ text: '', isError: false });
    setIsVerifyingPassword(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: currentPassword,
      });

      if (error) {
        throw new Error('Password saat ini salah.');
      }

      setIsCurrentPasswordVerified(true);
      setPasswordMessage({ text: 'Password saat ini benar. Silakan masukkan password baru.', isError: false });
    } catch (err: any) {
      setPasswordMessage({ text: err.message, isError: true });
    } finally {
      setIsVerifyingPassword(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage({ text: '', isError: false });

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ text: 'Konfirmasi password tidak cocok.', isError: true });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage({ text: 'Password baru minimal 6 karakter.', isError: true });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setPasswordMessage({ text: 'Informasi password anda saat ini sudah berubah.', isError: false });
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
      setIsCurrentPasswordVerified(false);
    } catch (err: any) {
      setPasswordMessage({ text: err.message, isError: true });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-400 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-neutral-900 mb-8 hidden md:block">Akun</h1>

      <div className="flex flex-col md:flex-row gap-8 md:gap-0 md:bg-white md:border md:border-neutral-100 md:shadow-sm md:rounded-xl md:overflow-hidden">
        <div className="w-full md:w-72 flex flex-col gap-6 shrink-0 md:border-r md:border-neutral-100 md:p-6 md:bg-neutral-50/30">
          <Card className="flex flex-col items-center p-6 bg-white border border-neutral-100 shadow-sm rounded-xl md:border-none md:shadow-none md:bg-transparent md:p-0">
            <div className="relative mb-4 group">
              <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-white shadow-md bg-neutral-100 relative">
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="Avatar" fill className="object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-neutral-400">
                    <User className="h-10 w-10" />
                  </div>
                )}
                {isUploadingPhoto && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 h-8 w-8 bg-primary-400 hover:bg-primary-500 text-primary-950 rounded-full flex items-center justify-center shadow-sm transition-colors border-2 border-white"
                title="Ganti Foto"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                className="hidden"
              />
            </div>

            <h2 className="text-lg font-bold text-neutral-900 text-center">{farmName || profileName || 'Peternak'}</h2>
            <p className="text-sm text-neutral-500 font-medium mt-1">{profileName}</p>
          </Card>

          <Card className="flex-col bg-white border border-neutral-100 shadow-sm rounded-xl overflow-hidden p-2 gap-1 hidden md:flex md:border-none md:shadow-none md:bg-transparent md:p-0">
            <button
              onClick={() => setActiveTab('informasi')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === 'informasi' ? 'bg-primary-50 text-primary-900' : 'text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              <User className="h-4 w-4" /> Informasi Akun
            </button>
            <button
              onClick={() => setActiveTab('rekening')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === 'rekening' ? 'bg-primary-50 text-primary-900' : 'text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              <CreditCard className="h-4 w-4" /> Rekening Bank
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === 'password' ? 'bg-primary-50 text-primary-900' : 'text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              <Lock className="h-4 w-4" /> Reset Password
            </button>

            <div className="h-px bg-neutral-100 my-1 mx-2"></div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-4 w-4" /> Keluar
            </button>
          </Card>

          <div className="md:hidden flex overflow-x-auto hide-scrollbar gap-2 px-1">
            <button
              onClick={() => setActiveTab('informasi')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shrink-0 ${
                activeTab === 'informasi' ? 'bg-primary-50 text-primary-900' : 'bg-white border border-neutral-200 text-neutral-600'
              }`}
            >
              <User className="h-4 w-4" /> Informasi
            </button>
            <button
              onClick={() => setActiveTab('rekening')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shrink-0 ${
                activeTab === 'rekening' ? 'bg-primary-50 text-primary-900' : 'bg-white border border-neutral-200 text-neutral-600'
              }`}
            >
              <CreditCard className="h-4 w-4" /> Rekening
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shrink-0 ${
                activeTab === 'password' ? 'bg-primary-50 text-primary-900' : 'bg-white border border-neutral-200 text-neutral-600'
              }`}
            >
              <Lock className="h-4 w-4" /> Password
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-6 md:p-0">
          <Card className="bg-white border border-neutral-100 shadow-sm rounded-xl p-6 md:p-8 min-h-[400px] md:border-none md:shadow-none md:bg-transparent md:rounded-none">
            {activeTab === 'informasi' && (
              <div className="animate-in fade-in duration-300">
                <div className="border-b border-neutral-100 pb-4 mb-6">
                  <h3 className="text-xl font-bold text-neutral-900">Informasi Akun</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <Label className="text-sm font-medium text-neutral-500">Nama Lengkap Pemilik</Label>
                    <Input
                      value={profileName}
                      disabled
                      className="h-12 bg-neutral-100 border-transparent text-neutral-500 cursor-not-allowed font-medium"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-sm font-medium text-neutral-500">Email</Label>
                    <Input
                      value={email}
                      disabled
                      className="h-12 bg-neutral-100 border-transparent text-neutral-500 cursor-not-allowed font-medium"
                    />
                  </div>
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <Label className="text-sm font-medium text-neutral-500">Nomor WA</Label>
                    <Input
                      value={phoneNumber}
                      disabled
                      className="h-12 bg-neutral-100 border-transparent text-neutral-500 cursor-not-allowed font-medium"
                    />
                  </div>

                  <div className="flex flex-col gap-2 md:col-span-2 mt-2 pt-4 border-t border-neutral-100">
                    <Label className="text-sm font-bold text-neutral-900">Nama Peternakan Ayam</Label>
                    <p className="text-xs text-neutral-500">Nama ini akan dilihat oleh konsumen lain saat membeli produk Anda.</p>
                    <div className="flex flex-col sm:flex-row gap-3 mt-1">
                      <Input
                        value={farmName}
                        onChange={(e) => setFarmName(e.target.value)}
                        placeholder="Misal: Peternakan Ayam Berkah Jaya"
                        className="h-12 bg-white border-neutral-200 text-neutral-900 font-medium flex-1 focus:bg-white"
                      />
                      <Button
                        onClick={handleSaveFarmName}
                        disabled={isSavingFarmName || !farmName.trim()}
                        className="h-12 px-6 font-bold bg-primary-400 hover:bg-primary-500 text-neutral-900 shrink-0"
                      >
                        {isSavingFarmName ? 'Menyimpan...' : 'Simpan Nama Peternakan'}
                      </Button>
                    </div>
                    {farmNameMsg.text && (
                      <p className={`text-xs font-semibold mt-1 ${farmNameMsg.isError ? 'text-red-500' : 'text-green-600'}`}>
                        {farmNameMsg.text}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'rekening' && (
              <div className="animate-in fade-in duration-300">
                <div className="border-b border-neutral-100 pb-4 mb-6">
                  <h3 className="text-xl font-bold text-neutral-900">Rekening Bank</h3>
                  <p className="text-sm text-neutral-500 mt-1">Dipakai untuk pencairan saldo. Pastikan data benar.</p>
                </div>

                <BankAccountForm
                  initialBankName={bankName}
                  initialAccountNumber={bankAccountNumber}
                  initialAccountHolder={bankAccountHolder}
                />
              </div>
            )}

            {activeTab === 'password' && (
              <div className="animate-in fade-in duration-300">
                <div className="border-b border-neutral-100 pb-4 mb-6">
                  <h3 className="text-xl font-bold text-neutral-900">Reset Password</h3>
                </div>

                {provider === 'google' ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center bg-neutral-50 rounded-xl border border-neutral-100">
                    <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-neutral-100 mb-4">
                      <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      </svg>
                    </div>
                    <h4 className="text-lg font-bold text-neutral-900 mb-2">Login dengan Google</h4>
                    <p className="text-sm text-neutral-500 max-w-sm">
                      Anda sebelumnya masuk menggunakan akun Google, sehingga Anda tidak bisa mengganti password melalui aplikasi ini. Pengaturan keamanan dikelola langsung oleh Google.
                    </p>
                  </div>
                ) : !isCurrentPasswordVerified ? (
                  <form onSubmit={handleVerifyCurrentPassword} className="flex flex-col gap-5 max-w-md">
                    {passwordMessage.text && (
                      <div className={`p-3 rounded-lg text-sm font-medium flex items-center gap-2 ${passwordMessage.isError ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                        {passwordMessage.isError ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                        {passwordMessage.text}
                      </div>
                    )}
                    <div className="flex flex-col gap-2">
                      <Label className="text-sm font-medium text-neutral-500">Password Saat Ini</Label>
                      <div className="relative">
                        <Input
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Masukkan password Anda saat ini"
                          required
                          className="h-12 bg-neutral-50 border-transparent focus:bg-white transition-colors pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600 transition-colors"
                        >
                          {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={isVerifyingPassword || !currentPassword}
                      className="mt-2 h-12 font-bold max-w-fit px-8"
                    >
                      {isVerifyingPassword ? 'Memeriksa...' : 'Lanjutkan'}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleUpdatePassword} className="flex flex-col gap-5 max-w-md">
                    {passwordMessage.text && (
                      <div className={`p-3 rounded-lg text-sm font-medium flex items-center gap-2 ${passwordMessage.isError ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                        {passwordMessage.isError ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                        {passwordMessage.text}
                      </div>
                    )}

                    <div className="flex flex-col gap-2">
                      <Label className="text-sm font-medium text-neutral-500">Password Baru</Label>
                      <div className="relative">
                        <Input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Minimal 6 karakter"
                          required
                          className="h-12 bg-neutral-50 border-transparent focus:bg-white transition-colors pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600 transition-colors"
                        >
                          {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label className="text-sm font-medium text-neutral-500">Konfirmasi Password Baru</Label>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Ulangi password baru"
                          required
                          className="h-12 bg-neutral-50 border-transparent focus:bg-white transition-colors pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600 transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={isUpdatingPassword}
                      className="mt-2 h-12 font-bold max-w-fit px-8"
                    >
                      {isUpdatingPassword ? 'Memperbarui...' : 'Simpan Password'}
                    </Button>
                  </form>
                )}
              </div>
            )}
          </Card>

          <div className="md:hidden mt-4 pb-8">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-xl text-sm font-bold text-red-500 bg-white border border-red-100 shadow-sm transition-colors hover:bg-red-50"
            >
              <LogOut className="h-5 w-5" /> Keluar
            </button>
          </div>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `,
        }}
      />
    </div>
  );
}
