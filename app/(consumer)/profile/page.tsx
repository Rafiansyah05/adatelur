'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User, MapPin, Lock, LogOut, Camera, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { AddressAutocomplete } from '@/components/ui/AddressAutocomplete';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

type Tab = 'data_diri' | 'lokasi' | 'password' | 'logout';

export default function ConsumerProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<Tab>('data_diri');
  const [loading, setLoading] = useState(true);
  
  // Profile Data
  const [profileId, setProfileId] = useState('');
  const [profileName, setProfileName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [provider, setProvider] = useState('');
  
  // Address Data
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  // States for actions
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ text: '', isError: false });

  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [addressMessage, setAddressMessage] = useState({ text: '', isError: false });

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

      const { data: addrData } = await supabase
        .from('consumer_addresses')
        .select('full_address, latitude, longitude')
        .eq('profile_id', user.id)
        .order('is_default', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (addrData) {
        setAddress(addrData.full_address);
        setLat(addrData.latitude);
        setLng(addrData.longitude);
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

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileMessage({ text: '', isError: false });

    try {
      const res = await fetch('/api/consumer/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: profileName,
          phone_number: phoneNumber,
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProfileMessage({ text: 'Data diri berhasil diperbarui.', isError: false });
    } catch (err: any) {
      setProfileMessage({ text: err.message, isError: true });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveAddress = async () => {
    if (!address.trim() || lat === null || lng === null) {
      setAddressMessage({ text: 'Alamat tidak boleh kosong dan lokasi harus dipilih.', isError: true });
      return;
    }
    setIsSavingAddress(true);
    setAddressMessage({ text: '', isError: false });
    try {
      const res = await fetch('/api/consumer/address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_address: address,
          latitude: lat,
          longitude: lng,
        })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setAddressMessage({ text: 'Alamat berhasil disimpan.', isError: false });
    } catch (err: any) {
      setAddressMessage({ text: 'Gagal menyimpan: ' + err.message, isError: true });
    } finally {
      setIsSavingAddress(false);
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
      // Very basic implementation: update password directly if signed in
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

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
    <div className="w-full max-w-5xl mx-auto px-4 py-8 md:py-12">
      <h1 className="text-3xl font-bold text-neutral-900 mb-8 ml-2 hidden md:block">Profile</h1>

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* SIDEBAR */}
        <div className="w-full md:w-72 flex flex-col gap-6 shrink-0">
          
          {/* User Info Card */}
          <Card className="flex flex-col items-center p-6 bg-white border border-neutral-100 shadow-sm rounded-xl">
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
            
            <h2 className="text-lg font-bold text-neutral-900 text-center">{profileName || 'Pengguna'}</h2>
            <p className="text-sm text-neutral-500 font-medium mt-1">Konsumen</p>
          </Card>

          {/* Navigation Tabs */}
          <Card className="flex flex-col bg-white border border-neutral-100 shadow-sm rounded-xl overflow-hidden p-2 gap-1 hidden md:flex">
            <button 
              onClick={() => setActiveTab('data_diri')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === 'data_diri' ? 'bg-primary-50 text-primary-900' : 'text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              <User className="h-4 w-4" /> Personal Information
            </button>
            <button 
              onClick={() => setActiveTab('lokasi')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === 'lokasi' ? 'bg-primary-50 text-primary-900' : 'text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              <MapPin className="h-4 w-4" /> Lokasi Pengiriman
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
              <LogOut className="h-4 w-4" /> Log Out
            </button>
          </Card>

          {/* Mobile Tabs Scrollable */}
          <div className="md:hidden flex overflow-x-auto hide-scrollbar gap-2 px-1">
            <button 
              onClick={() => setActiveTab('data_diri')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shrink-0 ${
                activeTab === 'data_diri' ? 'bg-primary-50 text-primary-900' : 'bg-white border border-neutral-200 text-neutral-600'
              }`}
            >
              <User className="h-4 w-4" /> Data Diri
            </button>
            <button 
              onClick={() => setActiveTab('lokasi')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shrink-0 ${
                activeTab === 'lokasi' ? 'bg-primary-50 text-primary-900' : 'bg-white border border-neutral-200 text-neutral-600'
              }`}
            >
              <MapPin className="h-4 w-4" /> Lokasi
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

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col gap-6">
          <Card className="bg-white border border-neutral-100 shadow-sm rounded-xl p-6 md:p-8 min-h-[400px]">
            
            {/* TAB: DATA DIRI */}
            {activeTab === 'data_diri' && (
              <div className="animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-100 pb-4 mb-6 gap-4">
                  <h3 className="text-xl font-bold text-neutral-900">Personal Information</h3>
                  <Button 
                    variant="primary" 
                    onClick={handleSaveProfile} 
                    disabled={isSavingProfile}
                    className="font-bold text-sm px-6 py-2"
                  >
                    {isSavingProfile ? 'Menyimpan...' : 'Edit'}
                  </Button>
                </div>

                {profileMessage.text && (
                  <div className={`mb-6 p-3 rounded-lg text-sm font-medium flex items-center gap-2 ${profileMessage.isError ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                    {profileMessage.isError ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                    {profileMessage.text}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <Label className="text-sm font-medium text-neutral-500">Nama Lengkap</Label>
                    <Input 
                      value={profileName} 
                      onChange={e => setProfileName(e.target.value)} 
                      className="h-12 bg-neutral-50 border-transparent focus:bg-white transition-colors text-neutral-900 font-medium"
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
                      onChange={e => setPhoneNumber(e.target.value)} 
                      className="h-12 bg-neutral-50 border-transparent focus:bg-white transition-colors text-neutral-900 font-medium"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB: LOKASI */}
            {activeTab === 'lokasi' && (
              <div className="animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-100 pb-4 mb-6 gap-4">
                  <h3 className="text-xl font-bold text-neutral-900">Lokasi Pengiriman</h3>
                  <Button 
                    variant="primary" 
                    onClick={handleSaveAddress} 
                    disabled={isSavingAddress}
                    className="font-bold text-sm px-6 py-2"
                  >
                    {isSavingAddress ? 'Menyimpan...' : 'Simpan'}
                  </Button>
                </div>

                {addressMessage.text && (
                  <div className={`mb-6 p-3 rounded-lg text-sm font-medium flex items-center gap-2 ${addressMessage.isError ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                    {addressMessage.isError ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                    {addressMessage.text}
                  </div>
                )}

                <div className="flex flex-col gap-4">
                  <Label className="text-sm font-medium text-neutral-500">Cari Alamat</Label>
                  <AddressAutocomplete
                    defaultValue={address}
                    onLocationSelect={(addr, latitude, longitude) => {
                      setAddress(addr); 
                      setLat(latitude); 
                      setLng(longitude);
                    }}
                  />
                  {lat && lng && (
                    <div className="mt-2 p-4 bg-green-50 rounded-lg flex items-start gap-3 border border-green-100">
                      <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-green-800">Koordinat Ditemukan</p>
                        <p className="text-xs text-green-700 mt-1">{lat.toFixed(5)}, {lng.toFixed(5)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: PASSWORD */}
            {activeTab === 'password' && (
              <div className="animate-in fade-in duration-300">
                <div className="border-b border-neutral-100 pb-4 mb-6">
                  <h3 className="text-xl font-bold text-neutral-900">Reset Password</h3>
                </div>

                {provider === 'google' ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center bg-neutral-50 rounded-xl border border-neutral-100">
                    <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-neutral-100 mb-4">
                      {/* Google G Logo SVG */}
                      <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      </svg>
                    </div>
                    <h4 className="text-lg font-bold text-neutral-900 mb-2">Login dengan Google</h4>
                    <p className="text-sm text-neutral-500 max-w-sm">
                      Anda mendaftar dan masuk menggunakan akun Google. Oleh karena itu, pengaturan password dikelola langsung oleh Google.
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

            {/* Logout Tab is handled via button click to logout */}
          </Card>

          {/* Mobile Logout Button (Bottom) */}
          <div className="md:hidden mt-4 pb-8">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-xl text-sm font-bold text-red-500 bg-white border border-red-100 shadow-sm transition-colors hover:bg-red-50"
            >
              <LogOut className="h-5 w-5" /> Log Out
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
