import { NextResponse } from 'next/server';
import { recalculatePeternakScore } from '@/lib/scoring';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createAdminClient();
    const peternakId = params.id;
    
    // Check if peternak exists
    const { data: peternak, error } = await supabase
      .from('peternak_details')
      .select('id')
      .eq('id', peternakId)
      .single();
      
    if (error || !peternak) {
      return NextResponse.json({ error: 'Peternak tidak ditemukan' }, { status: 404 });
    }

    const result = await recalculatePeternakScore(peternakId);

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
