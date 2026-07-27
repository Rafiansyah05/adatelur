import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { BankAccountForm } from '@/components/peternak/BankAccountForm';

export const dynamic = 'force-dynamic';

export default async function PeternakProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: peternakDetail } = await supabase
    .from('peternak_details')
    .select('bank_name, bank_account_number, bank_account_holder')
    .eq('profile_id', user.id)
    .maybeSingle();

  if (!peternakDetail) {
    redirect('/peternak/register');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone_number')
    .eq('id', user.id)
    .maybeSingle();

  return (
    <div className="w-full max-w-2xl">
      <h1 className="text-h1 text-text-main mb-6">Akun</h1>

      <div className="bg-white border border-border rounded-lg shadow-md p-5 mb-4">
        <h2 className="text-h2 text-text-main mb-3">Informasi</h2>
        <div className="flex flex-col gap-2 text-body">
          <p className="text-text-desc">
            <span className="text-text-main">Nama:</span> {profile?.full_name || '-'}
          </p>
          <p className="text-text-desc">
            <span className="text-text-main">No. HP:</span> {profile?.phone_number || '-'}
          </p>
        </div>
      </div>

      <div className="bg-white border border-border rounded-lg shadow-md p-5">
        <h2 className="text-h2 text-text-main mb-1">Rekening Bank</h2>
        <p className="text-caption text-text-desc mb-4">
          Dipakai untuk pencairan saldo. Pastikan data benar.
        </p>
        <BankAccountForm
          initialBankName={peternakDetail.bank_name || ''}
          initialAccountNumber={peternakDetail.bank_account_number || ''}
          initialAccountHolder={peternakDetail.bank_account_holder || ''}
        />
      </div>
    </div>
  );
}
