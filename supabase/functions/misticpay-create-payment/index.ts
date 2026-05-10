import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MISTICPAY_API_URL = 'https://api.misticpay.com/api';
const MIN_PAYMENT_VALUE = 1.00;

const RequestSchema = z.object({
  value: z.number().positive().max(999999),
  description: z.string().max(500).optional(),
  customerName: z.string().min(1).max(200),
  customerEmail: z.string().email().max(255).optional(),
  customerPhone: z.string().min(8).max(20).optional(),
  customerDocument: z.string().min(11).max(14).optional(),
  expiresIn: z.number().int().positive().max(86400).optional(),
  orderId: z.string().uuid().optional(),
  orderNsu: z.string().max(100).optional(),
  items: z.array(z.object({
    title: z.string().max(200),
    quantity: z.number().int().positive(),
    unitPrice: z.number().positive(),
  })).min(1).optional(),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const ci = Deno.env.get('MISTICPAY_CLIENT_ID');
    const cs = Deno.env.get('MISTICPAY_CLIENT_SECRET');
    if (!ci || !cs) {
      return new Response(JSON.stringify({ success: false, error: 'Credenciais MisticPay não configuradas' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    let raw: unknown;
    try { raw = await req.json(); } catch {
      return new Response(JSON.stringify({ success: false, error: 'JSON inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const parsed = RequestSchema.safeParse(raw);
    if (!parsed.success) {
      return new Response(JSON.stringify({ success: false, error: parsed.error.issues[0]?.message || 'Dados inválidos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = parsed.data;

    if (body.value < MIN_PAYMENT_VALUE) {
      return new Response(JSON.stringify({
        success: false,
        error: `Valor mínimo para PIX é R$ ${MIN_PAYMENT_VALUE.toFixed(2)}`,
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const cleanDoc = (body.customerDocument || '').replace(/\D/g, '') || '00000000000';
    const transactionId = body.orderNsu || body.orderId || `ORD-${Date.now()}`;

    const projectId = Deno.env.get('SUPABASE_URL')!.split('//')[1].split('.')[0];
    const projectWebhook = `https://${projectId}.supabase.co/functions/v1/misticpay-webhook`;

    const productNames = body.items?.map(i => i.title).join(', ') || '';
    const description = (body.description || `Pedido ${transactionId}${productNames ? ' - ' + productNames : ''}`).substring(0, 500);

    const payload = {
      amount: Number(body.value.toFixed(2)),
      payerName: body.customerName.substring(0, 200),
      payerDocument: cleanDoc,
      transactionId,
      description,
      projectWebhook,
    };

    console.log('Sending to MisticPay:', transactionId, payload.amount);

    const resp = await fetch(`${MISTICPAY_API_URL}/transactions/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ci': ci,
        'cs': cs,
      },
      body: JSON.stringify(payload),
    });

    const data = await resp.json();
    console.log('MisticPay status:', resp.status);

    if (!resp.ok || !data.data) {
      console.error('MisticPay error:', data);
      return new Response(JSON.stringify({ success: false, error: data.message || data.error || 'Erro ao criar pagamento' }),
        { status: resp.status || 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const tx = data.data;
    const emv: string = tx.copyPaste || '';
    const qrBase64: string | undefined = tx.qrCodeBase64;
    const qrcodeUrl: string | undefined = tx.qrcodeUrl;

    const qrImage = qrBase64 && qrBase64.startsWith('data:')
      ? qrBase64
      : qrcodeUrl
        ? qrcodeUrl
        : (emv ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(emv)}` : '');

    const expiresIn = body.expiresIn || 3600;
    const txId = String(tx.transactionId);

    if (body.orderId) {
      await supabase.from('orders').update({ payment_id: txId }).eq('id', body.orderId);
    }

    return new Response(JSON.stringify({
      success: true,
      payment: {
        id: txId,
        value: body.value,
        status: tx.transactionState || 'PENDENTE',
        pixCode: emv,
        qrCodeImage: qrImage,
        qrCodeEmv: emv,
        publicPaymentUrl: '',
        expiresIn,
        expiresDate: new Date(Date.now() + expiresIn * 1000).toISOString(),
      },
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (e) {
    console.error('misticpay-create-payment error:', e);
    return new Response(JSON.stringify({ success: false, error: 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
