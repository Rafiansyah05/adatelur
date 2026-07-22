'use client';

import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { CameraCapture } from '@/components/CameraCapture';
import { createClient } from '@/lib/supabase/client';
import { MapPin, PhoneCall } from 'lucide-react';

export default function RegisterPeternakPage() {
  const [step, setStep] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  
  // State Tahap 1
  const [nama, setNama] = React.useState('');
  const [phone, setPhone] = React.useState('');
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

  const getGeolocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLat(position.coords.latitude);
          setLng(position.coords.longitude);
        },
        () => {
          alert('Gagal mengambil lokasi. Pastikan izin lokasi diberikan.');
        }
      );
    } else {
      alert('Geolocation tidak didukung di browser ini.');
    }
  };

  const handleNextStep1 = () => {
    if (!nama || !phone || !birthDate || !address || lat === null || lng === null) {
      alert('Mohon lengkapi semua data Tahap 1 termasuk lokasi.');
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

  const urlToFile = async (url: string, filename: string, mimeType: string) => {
    const res = await fetch(url);
    const buf = await res.arrayBuffer();
    return new File([buf], filename, { type: mimeType });
  };

  const handleSubmit = async () => {
    if (!fotoLuar || !fotoDalam || !fotoAyam || !fotoTelur) {
      alert('Mohon lengkapi semua 4 foto verifikasi.');
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
// 1. Get current user (must be logged in)
      const { data: { user } } = await supabase.auth.getUser();
      const profileId = user?.id;

      if (!profileId) {
        alert('Anda belum masuk. Silakan login terlebih dahulu sebelum mengirim pendaftaran.');
        setLoading(false);
        return;
      }

      if (!profileId) throw new Error("Gagal mendapatkan/membuat user.");

      // 2. Insert Peternak Details
      const { data: peternakData, error: peternakError } = await supabase
        .from('peternak_details')
        .insert({
          profile_id: profileId,
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
          has_vehicle: hasVehicle,
          verification_status: 'pending',
        })
        .select()
        .single();

      if (peternakError) {
         console.error(peternakError);
         throw new Error("Gagal menyimpan data peternak: " + peternakError.message);
      }

      const peternakId = peternakData.id;

      // 3. Insert Vehicle if any
      if (hasVehicle && vehicleType) {
        await supabase.from('vehicles').insert({
          peternak_id: peternakId,
          vehicle_type: vehicleType,
        });
      }

      // 4. Upload Photos
      const photos = [
        { type: 'kandang_luar', src: fotoLuar },
        { type: 'kandang_dalam', src: fotoDalam },
        { type: 'ayam', src: fotoAyam },
        { type: 'telur', src: fotoTelur },
      ];

      for (const p of photos) {
        const file = await urlToFile(p.src!, `${peternakId}_${p.type}.jpg`, 'image/jpeg');
        const filePath = `${peternakId}/${p.type}_${Date.now()}.jpg`;
        
        const { error: uploadError } = await supabase.storage
          .from('verification-photos')
          .upload(filePath, file);

        if (uploadError) throw new Error(`Gagal upload foto ${p.type}: ` + uploadError.message);

        const { data: publicUrlData } = supabase.storage
          .from('verification-photos')
          .getPublicUrl(filePath);

        await supabase.from('peternak_verification_photos').insert({
          peternak_id: peternakId,
          photo_type: p.type,
          photo_url: publicUrlData.publicUrl,
        });
      }

      setStep(4); // Success step
    } catch (error) {
      const err = error as Error;
      alert(err.message || 'Terjadi kesalahan saat menyimpan data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream p-4 pb-24">
      <div className="max-w-md mx-auto">
        {step < 4 && (
          <div className="mb-6 flex justify-between items-center text-sm font-medium text-text-desc">
            <span className={step >= 1 ? "text-primary-600" : ""}>1. Dasar</span>
            <span className="flex-1 border-t border-border mx-2"></span>
            <span className={step >= 2 ? "text-primary-600" : ""}>2. Operasional</span>
            <span className="flex-1 border-t border-border mx-2"></span>
            <span className={step >= 3 ? "text-primary-600" : ""}>3. Foto</span>
          </div>
        )}

        {step === 1 && (
          <Card className="p-6">
            <h2 className="text-h2 text-text-main mb-6">Tahap 1: Data Dasar</h2>
            <div className="space-y-4">
              <div>
                <Label>Nama Pemilik</Label>
                <Input value={nama} onChange={e => setNama(e.target.value)} placeholder="Misal: Budi Santoso" />
              </div>
              <div>
                <Label>Nomor HP</Label>
                <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="0812..." />
              </div>
              <div>
                <Label>Tanggal Lahir</Label>
                <Input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
              </div>
              <div>
                <Label>Alamat Peternak</Label>
                <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Alamat lengkap kandang" />
              </div>
              <div>
                <Label>Koordinat Lokasi</Label>
                <Button type="button" variant="secondary" onClick={getGeolocation} className="w-full flex justify-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {lat && lng ? 'Lokasi Tersimpan' : 'Gunakan Lokasi Saya Saat Ini'}
                </Button>
                {lat && lng && (
                  <p className="text-caption text-text-desc mt-1">Lat: {lat.toFixed(5)}, Lng: {lng.toFixed(5)}</p>
                )}
              </div>
              <Button onClick={handleNextStep1} className="w-full mt-4">Lanjut ke Tahap 2</Button>
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
                  <Button className="w-full bg-[#25D366] text-white hover:bg-[#128C7E]">
                    Hubungi CS via WhatsApp
                  </Button>
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
              <Button onClick={handleSubmit} disabled={loading} className="flex-1">
                {loading ? 'Menyimpan...' : 'Kirim Pendaftaran'}
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <Card className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-success-bg text-success-text rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
              ✓
            </div>
            <h2 className="text-h2 text-text-main">Pendaftaran Berhasil Dikirim!</h2>
            <p className="text-body text-text-desc">
              Proses verifikasi berjalan maksimal 2x24 jam kerja, hasil akan dikirim lewat WhatsApp ke nomor yang didaftarkan.
            </p>
            <Button onClick={() => window.location.href = '/'} className="mt-4">
              Kembali ke Beranda
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
