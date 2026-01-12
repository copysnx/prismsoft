import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookPayload {
  invoice_slug: string;
  amount: number;
  paid_amount: number;
  installments: number;
  capture_method: 'credit_card' | 'pix';
  transaction_nsu: string;
  order_nsu: string;
  receipt_url: string;
  items: Array<{
    quantity: number;
    price: number;
    description: string;
  }>;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('InfinitePay webhook received');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: WebhookPayload = await req.json();
    console.log('Webhook payload:', JSON.stringify(payload));

    // Log the payment confirmation
    console.log(`Payment confirmed for order ${payload.order_nsu}`);
    console.log(`Amount: ${payload.paid_amount / 100} BRL`);
    console.log(`Method: ${payload.capture_method}`);
    console.log(`Transaction NSU: ${payload.transaction_nsu}`);
    console.log(`Receipt URL: ${payload.receipt_url}`);

    // Here you could:
    // 1. Update order status in database
    // 2. Send confirmation email
    // 3. Deliver digital products (keys)
    // 4. Update inventory

    // For now, we just acknowledge the webhook
    // You can expand this to handle the actual order fulfillment

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook processed' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in infinitepay-webhook function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno';
    
    // Return 400 to trigger InfinitePay retry
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
