import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function deliverKeysForOrder(supabase: any, orderId: string) {
  const { data: existing } = await supabase.from('delivered_keys').select('id').eq('order_id', orderId).limit(1);
  if (existing?.length) return 0;

  const { data: items } = await supabase.from('order_items').select('*').eq('order_id', orderId);
  if (!items?.length) return 0;

  let delivered = 0;
  for (const item of items) {
    const { data: keys } = await supabase
      .from('product_keys')
      .select('*')
      .eq('product_id', item.product_id)
      .eq('variation_id', item.variation_id)
      .eq('status', 'available')
      .limit(item.quantity);

    if (!keys?.length) continue;

    for (const key of keys) {
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
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const payload = await req.json();
    console.log('MisticPay webhook payload:', JSON.stringify(payload));

    // MED webhook - ignore for now
    if (payload.event === 'INFRACTION') {
      return new Response(JSON.stringify({ success: true, ignored: 'med' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const status: string = payload.status || '';
    const transactionId = payload.transactionId ? String(payload.transactionId) : '';
    const txType = payload.transactionType;

    if (!transactionId) {
      return new Response(JSON.stringify({ success: false, error: 'Sem transactionId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Only process deposits (cash-in) for orders
    if (txType && txType !== 'DEPOSITO') {
      return new Response(JSON.stringify({ success: true, ignored: 'not_deposit' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Find order by payment_id (MisticPay transactionId)
    const { data: order } = await supabase
      .from('orders').select('*').eq('payment_id', transactionId).maybeSingle();

    if (!order) {
      console.error('Order not found for transactionId', transactionId);
      return new Response(JSON.stringify({ success: false, error: 'Pedido não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (status === 'COMPLETO') {
      if (order.status === 'paid' || order.status === 'delivered') {
        return new Response(JSON.stringify({ success: true, message: 'Já processado' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      await supabase.from('orders').update({
        status: 'paid',
        payment_id: transactionId,
        paid_at: new Date().toISOString(),
      }).eq('id', order.id);

      const delivered = await deliverKeysForOrder(supabase, order.id);
      if (delivered > 0) {
        await supabase.from('orders').update({ status: 'delivered' }).eq('id', order.id);
      }

      return new Response(JSON.stringify({ success: true, delivered }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (status === 'FALHA' || status === 'CANCELADO') {
      await supabase.from('orders').update({ status: 'cancelled' }).eq('id', order.id);
      return new Response(JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ success: true, ignored: true, status }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (e) {
    console.error('misticpay-webhook error:', e);
    return new Response(JSON.stringify({ success: false, error: 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
