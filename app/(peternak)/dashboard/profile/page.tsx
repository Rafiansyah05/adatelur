'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { User, CreditCard, Lock, LogOut, Camera, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { BankAccountForm } from '@/components/peternak/BankAccountForm';

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

  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountHolder, setBankAccountHolder] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ text: '', isError: false });

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
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
        .select('bank_name, bank_account_number, bank_account_holder')
        .eq('profile_id', user.id)
        .maybeSingle();

      if (detail) {
        setBankName(detail.bank_name || '');
        setBankAccountNumber(detail.bank_account_number || '');
        setBankAccountHolder(detail.bank_account_holder || '');
      }

      setLoading(false);
    }
    loadData();
  }, [supabase, router]);

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

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profileId);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
    } catch (err: any) {
      alert('Gagal mengunggah foto: ' + err.message);
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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

      setPasswordMessage({ text: 'Password berhasil diperbarui.', isError: false });
      setNewPassword('');
      setConfirmPassword('');
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

            <h2 className="text-lg font-bold text-neutral-900 text-center">{profileName || 'Peternak'}</h2>
            <p className="text-sm text-neutral-500 font-medium mt-1">Peternak</p>
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
                    <Label className="text-sm font-medium text-neutral-500">Nama Lengkap</Label>
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
                  <div className="flex flex-col gap-2">
                    <Label className="text-sm font-medium text-neutral-500">Nomor WA</Label>
                    <Input
                      value={phoneNumber}
                      disabled
                      className="h-12 bg-neutral-100 border-transparent text-neutral-500 cursor-not-allowed font-medium"
                    />
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
                      <Lock className="h-6 w-6 text-neutral-400" />
                    </div>
                    <h4 className="text-lg font-bold text-neutral-900 mb-2">Login dengan Google</h4>
                    <p className="text-sm text-neutral-500 max-w-sm">
                      Anda masuk menggunakan akun Google, jadi pengaturan password dikelola langsung oleh Google.
                    </p>
                  </div>
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
                      <Input
                        type="password"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="Minimal 6 karakter"
                        required
                        className="h-12 bg-neutral-50 border-transparent focus:bg-white transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label className="text-sm font-medium text-neutral-500">Konfirmasi Password Baru</Label>
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Ulangi password baru"
                        required
                        className="h-12 bg-neutral-50 border-transparent focus:bg-white transition-colors"
                      />
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

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}
