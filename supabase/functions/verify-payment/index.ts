import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FLOW_API_URL = 'https://flowapplications.com.br';

interface VerifyPaymentRequest {
  chargeId: string;
}

interface FlowChargeResponse {
  success: boolean;
  charge?: {
    id: string;
    value: number;
    status: string;
    pixCode: string;
    qrCode: {
      emv: string;
      image: string;
    };
    globalID: string;
    transactionID: string | null;
    paymentMethods?: {
      pix?: {
        status: string;
      };
    };
    expiresIn: number;
    expiresDate: string;
    createdAt: string;
    updatedAt: string;
  };
  error?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('Verify payment request received');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FLOW_API_KEY = Deno.env.get('FLOW_API_KEY');
    
    if (!FLOW_API_KEY) {
      console.error('FLOW_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'API Key não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: VerifyPaymentRequest = await req.json();
    console.log('Request body:', JSON.stringify(body));

    if (!body.chargeId) {
      return new Response(
        JSON.stringify({ success: false, error: 'ID do pagamento não informado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Verifying payment:', body.chargeId);

    // Make request to Flow API
    const response = await fetch(`${FLOW_API_URL}/api/flow-api/charge/${body.chargeId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${FLOW_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const data: FlowChargeResponse = await response.json();
    console.log('Flow API response:', JSON.stringify(data));

    if (!response.ok) {
      console.error('Flow API error:', data.error);
      return new Response(
        JSON.stringify({ success: false, error: data.error || 'Erro ao verificar pagamento' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (data.success && data.charge) {
      // Check payment status from multiple possible fields
      const status = data.charge.status || data.charge.paymentMethods?.pix?.status;
      const isPaid = status === 'PAID' || status === 'CONFIRMED' || status === 'COMPLETED';
      const isExpired = status === 'EXPIRED';
      const isPending = status === 'ACTIVE' || status === 'PENDING';

      console.log('Payment status:', status, '- isPaid:', isPaid);

      return new Response(
        JSON.stringify({
          success: true,
          payment: {
            id: data.charge.id,
            value: data.charge.value,
            status: status,
            isPaid: isPaid,
            isExpired: isExpired,
            isPending: isPending,
            transactionID: data.charge.transactionID,
            expiresDate: data.charge.expiresDate,
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ success: false, error: data.error || 'Pagamento não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error: unknown) {
    console.error('Error in verify-payment function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
