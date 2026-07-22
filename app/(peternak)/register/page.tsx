'use client';

import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { CameraCapture } from '@/components/CameraCapture';
import { createClient } from '@/lib/supabase/client';
import { PhoneCall } from 'lucide-react';
import { AddressAutocomplete } from '@/components/ui/AddressAutocomplete';

export default function RegisterPeternakPage() {
  const [step, setStep] = React.useState(1);
  const [loading, setLoading] = React.useState(false);

  // State Tahap 1
  const [nama, setNama] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [birthDate, setBirthDate] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [lat, setLat] = React.useState<number | null>(null);
  const [lng, setLng] = React.useState<number | null>(null);

  // State Tahap 2
  const [registrationMethod, setRegistrationMethod] = React.useState<'self_form' | 'video_call_cs' | null>(null);
  const [chickenCount, setChickenCount] = React.useState('');
  const [eggProd, setEggProd] = React.useState('');
  const [eggBroken, setEggBroken] = React.useState('');
  const [eggClean, setEggClean] = React.useState('');
  const [feedType, setFeedType] = React.useState('');
  const [cleanliness, setCleanliness] = React.useState('');
  const [hasVehicle, setHasVehicle] = React.useState(false);
  const [vehicleType, setVehicleType] = React.useState('');
  const [experience, setExperience] = React.useState('');

  // State Tahap 3
  const [fotoLuar, setFotoLuar] = React.useState<string | null>(null);
  const [fotoDalam, setFotoDalam] = React.useState<string | null>(null);
  const [fotoAyam, setFotoAyam] = React.useState<string | null>(null);
  const [fotoTelur, setFotoTelur] = React.useState<string | null>(null);

  // State Tahap 4 (OTP)
  const [otpToken, setOtpToken] = React.useState('');

  const handleNextStep1 = () => {
    if (!nama || !phone || !email || !password || !birthDate || !address || lat === null || lng === null) {
      alert('Mohon lengkapi semua data Tahap 1 termasuk email, password, dan lokasi.');
      return;
    }
    if (password.length < 6) {
      alert('Password minimal 6 karakter.');
      return;
    }
    setStep(2);
  };

  const handleNextStep2 = () => {
    if (registrationMethod === 'self_form') {
      if (!chickenCount || !eggProd || !eggBroken || !eggClean || !feedType || !cleanliness || !experience || (hasVehicle && !vehicleType)) {
        alert('Mohon lengkapi semua data operasional.');
        return;
      }
    }
    setStep(3);
  };

  const dataUrlToFile = async (dataUrl: string, filename: string): Promise<File> => {
    const res = await fetch(dataUrl);
    const buf = await res.arrayBuffer();
    return new File([buf], filename, { type: 'image/jpeg' });
  };

  // Tahap 3: Sign Up untuk mendapatkan OTP via Email
  const handleSignUp = async () => {
    if (!fotoLuar || !fotoDalam || !fotoAyam || !fotoTelur) {
      alert('Mohon lengkapi semua 4 foto verifikasi.');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      alert('Gagal mendaftarkan akun: ' + error.message);
      return;
    }

    // Jika berhasil, lanjut ke form OTP
    setStep(4);
  };

  // Tahap 4: Verifikasi OTP lalu Insert Data (tanpa bypass admin)
  const handleVerifyOtpAndSubmit = async () => {
    if (!otpToken || otpToken.length !== 6) {
      alert('Masukkan 6 digit kode OTP');
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      
      // 1. Verifikasi OTP
      const { data: otpData, error: otpError } = await supabase.auth.verifyOtp({
        email,
        token: otpToken,
        type: 'signup'
      });

      if (otpError || !otpData.user) {
        throw new Error(otpError?.message || 'Verifikasi OTP gagal.');
      }

      const userId = otpData.user.id;

      // 2. Insert Profile
      const { error: profileError } = await supabase.from('profiles').insert({
        id: userId,
        role: 'peternak',
        full_name: nama,
        phone_number: phone,
        email: email
      });
      if (profileError) throw new Error('Gagal menyimpan profil: ' + profileError.message);

      // 3. Insert Peternak Details
      const { data: pData, error: pError } = await supabase.from('peternak_details').insert({
        profile_id: userId,
        birth_date: birthDate,
        farm_address: address,
        farm_latitude: lat,
        farm_longitude: lng,
        registration_method: registrationMethod || 'self_form',
        chicken_count: parseInt(chickenCount) || 0,
        daily_egg_production: parseInt(eggProd) || 0,
        daily_damaged_eggs: parseInt(eggBroken) || 0,
        daily_clean_eggs: parseInt(eggClean) || 0,
        feed_type: feedType || '-',
        farming_experience_years: parseFloat(experience) || 0,
        has_vehicle: hasVehicle || false,
        verification_status: 'pending',
      }).select().single();
      if (pError) throw new Error('Gagal menyimpan data peternak: ' + pError.message);

      const peternakId = pData.id;

      // 4. Insert Kendaraan
      if (hasVehicle && vehicleType) {
        const { error: vError } = await supabase.from('vehicles').insert({ peternak_id: peternakId, vehicle_type: vehicleType });
        if (vError) console.warn("Kendaraan gagal disimpan", vError);
      }

      // 5. Upload Foto & Insert Verification Photos
      const photos = [
        { type: 'kandang_luar', src: fotoLuar },
        { type: 'kandang_dalam', src: fotoDalam },
        { type: 'ayam', src: fotoAyam },
        { type: 'telur', src: fotoTelur },
      ];

      for (const p of photos) {
        const file = await dataUrlToFile(p.src!, `${peternakId}_${p.type}.jpg`);
        const filePath = `${peternakId}/${p.type}_${Date.now()}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from('verification-photos')
          .upload(filePath, file);

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from('verification-photos')
            .getPublicUrl(filePath);

          await supabase.from('peternak_verification_photos').insert({
            peternak_id: peternakId,
            photo_type: p.type,
            photo_url: publicUrlData.publicUrl,
          });
        } else {
          console.warn(`Gagal upload foto ${p.type}`, uploadError);
        }
      }

      // Berhasil, lanjut ke success screen
      setStep(5);
    } catch (err) {
      alert((err as Error).message || 'Terjadi kesalahan saat menyimpan data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-cream p-4">
      <div className="max-w-md mx-auto">
        {step < 4 && (
          <div className="mb-6 flex justify-between items-center text-[12px] font-medium text-text-desc">
            <span className={step >= 1 ? 'text-primary-600' : ''}>1. Akun</span>
            <span className="flex-1 border-t border-border mx-2"></span>
            <span className={step >= 2 ? 'text-primary-600' : ''}>2. Kandang</span>
            <span className="flex-1 border-t border-border mx-2"></span>
            <span className={step >= 3 ? 'text-primary-600' : ''}>3. Foto</span>
          </div>
        )}

        {step === 1 && (
          <Card className="p-6">
            <h2 className="text-h2 text-text-main mb-6">Tahap 1: Data &amp; Akun</h2>
            <div className="space-y-4">
              <div>
                <Label>Nama Lengkap Pemilik</Label>
                <Input value={nama} onChange={e => setNama(e.target.value)} placeholder="Misal: Budi Santoso" />
              </div>
              <div>
                <Label>Nomor HP</Label>
                <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="0812..." />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@contoh.com" />
              </div>
              <div>
                <Label>Password (min. 6 karakter)</Label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <div>
                <Label>Tanggal Lahir</Label>
                <Input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
              </div>
              <div>
                <Label className="mb-2 block">Alamat &amp; Lokasi Peternakan</Label>
                <AddressAutocomplete
                  defaultValue={address}
                  onLocationSelect={(addr, latitude, longitude) => {
                    setAddress(addr);
                    setLat(latitude);
                    setLng(longitude);
                  }}
                />
                {lat && lng && (
                  <p className="text-caption text-text-desc mt-2">
                    Koordinat tersimpan: Lat {lat.toFixed(5)}, Lng {lng.toFixed(5)}
                  </p>
                )}
              </div>
              <Button onClick={handleNextStep1} className="w-full mt-6">Lanjut ke Tahap 2</Button>
            </div>
          </Card>
        )}

        {step === 2 && (
          <Card className="p-6">
            <h2 className="text-h2 text-text-main mb-2">Tahap 2: Data Operasional</h2>
            <p className="text-body text-text-desc mb-6">Pilih metode pengisian data operasional peternakan Anda.</p>

            {!registrationMethod && (
              <div className="space-y-4">
                <Button variant="secondary" onClick={() => setRegistrationMethod('video_call_cs')} className="w-full py-8 flex flex-col gap-2 h-auto">
                  <PhoneCall className="w-8 h-8 text-primary-600" />
                  <span>Video Call dengan CS</span>
                </Button>
                <Button variant="secondary" onClick={() => setRegistrationMethod('self_form')} className="w-full py-8 h-auto">
                  Isi Form Sendiri
                </Button>
              </div>
            )}

            {registrationMethod === 'video_call_cs' && (
              <div className="space-y-6 text-center">
                <p className="text-body text-text-main">
                  Silakan hubungi Customer Service kami via WhatsApp untuk dibantu mengisi data operasional.
                </p>
                <a href="https://wa.me/628123456789" target="_blank" rel="noopener noreferrer" className="block">
                  <Button className="w-full bg-[#25D366] text-white hover:bg-[#128C7E]">Hubungi CS via WhatsApp</Button>
                </a>
                <p className="text-caption text-text-desc">Setelah CS mengonfirmasi, Anda dapat melanjutkan ke Tahap 3.</p>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setRegistrationMethod(null)} className="flex-1">Kembali</Button>
                  <Button onClick={handleNextStep2} className="flex-1">Lanjut Tahap 3</Button>
                </div>
              </div>
            )}

            {registrationMethod === 'self_form' && (
              <div className="space-y-4">
                <div>
                  <Label>Jumlah Ayam (ekor)</Label>
                  <Input type="number" value={chickenCount} onChange={e => setChickenCount(e.target.value)} />
                </div>
                <div>
                  <Label>Produksi Telur Per Hari (butir)</Label>
                  <Input type="number" value={eggProd} onChange={e => setEggProd(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Telur Bersih/Hari</Label>
                    <Input type="number" value={eggClean} onChange={e => setEggClean(e.target.value)} />
                  </div>
                  <div>
                    <Label>Telur Rusak/Hari</Label>
                    <Input type="number" value={eggBroken} onChange={e => setEggBroken(e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label>Jenis Pakan</Label>
                  <Input value={feedType} onChange={e => setFeedType(e.target.value)} />
                </div>
                <div>
                  <Label>Kebersihan Kandang</Label>
                  <Input value={cleanliness} onChange={e => setCleanliness(e.target.value)} placeholder="Deskripsi singkat" />
                </div>
                <div>
                  <Label>Lama Pengalaman Beternak (tahun)</Label>
                  <Input type="number" value={experience} onChange={e => setExperience(e.target.value)} />
                </div>
                <div>
                  <Label>Punya Kendaraan Operasional?</Label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2">
                      <input type="radio" checked={hasVehicle} onChange={() => setHasVehicle(true)} />
                      <span className="text-body text-text-main">Ya</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" checked={!hasVehicle} onChange={() => { setHasVehicle(false); setVehicleType(''); }} />
                      <span className="text-body text-text-main">Tidak</span>
                    </label>
                  </div>
                </div>
                {hasVehicle && (
                  <div>
                    <Label>Jenis Kendaraan</Label>
                    <Input value={vehicleType} onChange={e => setVehicleType(e.target.value)} placeholder="Misal: Mobil Pickup, Motor" />
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button variant="secondary" onClick={() => setRegistrationMethod(null)} className="flex-1">Ganti Metode</Button>
                  <Button onClick={handleNextStep2} className="flex-1">Lanjut Tahap 3</Button>
                </div>
              </div>
            )}
          </Card>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-h2 text-text-main">Tahap 3: Verifikasi Foto</h2>
            <p className="text-body text-text-desc">Ambil foto dokumentasi langsung dari kamera perangkat Anda.</p>

            <CameraCapture label="1. Tampak Luar Kandang" onCapture={setFotoLuar} />
            <CameraCapture label="2. Tampak Dalam Kandang" onCapture={setFotoDalam} />
            <CameraCapture label="3. Foto Ayam" onCapture={setFotoAyam} />
            <CameraCapture label="4. Foto Telur" onCapture={setFotoTelur} />
            <div className="flex gap-4 mt-8">
              <Button variant="secondary" onClick={() => setStep(2)} className="flex-1">Kembali</Button>
              <Button onClick={handleSignUp} disabled={loading} className="flex-1">
                {loading ? 'Memproses...' : 'Kirim & Dapatkan OTP'}
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <Card className="p-6 text-center">
            <h2 className="text-h2 text-text-main mb-2">Tahap 4: Verifikasi Email</h2>
            <p className="text-body text-text-desc mb-6">
              Kami telah mengirimkan 6 digit kode OTP ke email <strong>{email}</strong>
            </p>
            <div className="space-y-4">
              <div>
                <Input 
                  type="text" 
                  value={otpToken} 
                  onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Kode OTP (6 Digit)"
                  className="text-center text-[24px] tracking-[0.5em]"
                />
              </div>
              <Button onClick={handleVerifyOtpAndSubmit} disabled={loading || otpToken.length !== 6} className="w-full">
                {loading ? 'Menyimpan Semua Data...' : 'Verifikasi & Selesai'}
              </Button>
            </div>
          </Card>
        )}

        {step === 5 && (
          <Card className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-success-bg text-success-text rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
              ✓
            </div>
            <h2 className="text-h2 text-text-main">Pendaftaran Selesai!</h2>
            <p className="text-body text-text-desc">
              Data pendaftaran dan foto Anda berhasil dikirim. Proses verifikasi internal membutuhkan waktu maksimal 2x24 jam kerja.
            </p>
            <Button onClick={() => window.location.href = '/dashboard'} className="mt-4">
              Masuk ke Dashboard
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
