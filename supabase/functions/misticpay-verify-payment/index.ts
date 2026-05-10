import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MISTICPAY_API_URL = 'https://api.misticpay.com/api';

const Schema = z.object({
  chargeId: z.string().min(1).max(100),
  orderId: z.string().uuid().optional(),
});

async function deliverKeysForOrder(supabase: any, orderId: string) {
  const { data: existing } = await supabase.from('delivered_keys').select('id').eq('order_id', orderId).limit(1);
  if (existing?.length) return 0;

  const { data: items } = await supabase.from('order_items').select('*').eq('order_id', orderId);
  if (!items?.length) return 0;

  let delivered = 0;
  for (const item of items) {
    const { data: keys } = await supabase
      .from('product_keys').select('*')
      .eq('product_id', item.product_id)
      .eq('variation_id', item.variation_id)
      .eq('status', 'available')
      .limit(item.quantity);

    for (const key of keys || []) {
      const { error: u } = await supabase.from('product_keys')
        .update({ status: 'sold', sold_at: new Date().toISOString() })
        .eq('id', key.id);
      if (u) continue;
      const { error: d } = await supabase.from('delivered_keys').insert({
        order_id: orderId,
        order_item_id: item.id,
        product_key_id: key.id,
        key_value: key.key_value,
      });
      if (!d) delivered++;
    }
  }
  return delivered;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const ci = Deno.env.get('MISTICPAY_CLIENT_ID');
    const cs = Deno.env.get('MISTICPAY_CLIENT_SECRET');
    if (!ci || !cs) {
      return new Response(JSON.stringify({ success: false, error: 'Credenciais não configuradas' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const raw = await req.json();
    const parsed = Schema.safeParse(raw);
    if (!parsed.success) {
      return new Response(JSON.stringify({ success: false, error: 'Dados inválidos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { chargeId, orderId } = parsed.data;

    const resp = await fetch(`${MISTICPAY_API_URL}/transactions/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'ci': ci, 'cs': cs },
      body: JSON.stringify({ transactionId: chargeId }),
    });
    const data = await resp.json();

    if (!resp.ok || !data.transaction) {
      return new Response(JSON.stringify({ success: false, error: data.message || 'Erro ao consultar' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const status = data.transaction.transactionState;
    const isPaid = status === 'COMPLETO';
    const isExpired = status === 'FALHA' || status === 'CANCELADO';

    if (isPaid && orderId) {
      const { data: order } = await supabase.from('orders').select('status').eq('id', orderId).single();
      if (order && order.status !== 'paid' && order.status !== 'delivered') {
        await supabase.from('orders').update({
          status: 'paid',
          payment_id: chargeId,
          paid_at: new Date().toISOString(),
        }).eq('id', orderId);

        const delivered = await deliverKeysForOrder(supabase, orderId);
        if (delivered > 0) {
          await supabase.from('orders').update({ status: 'delivered' }).eq('id', orderId);
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      payment: { status, isPaid, isExpired },
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (e) {
    console.error('misticpay-verify-payment error:', e);
    return new Response(JSON.stringify({ success: false, error: 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
