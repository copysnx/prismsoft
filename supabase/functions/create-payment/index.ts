import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FLOW_API_URL = 'https://flowapplications.com.br';

interface CreatePaymentRequest {
  value: number;
  description?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  expiresIn?: number;
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
    expiresIn: number;
    expiresDate: string;
    publicPaymentUrl?: string;
    createdAt: string;
    updatedAt: string;
  };
  error?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('Create payment request received');
  
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

    const body: CreatePaymentRequest = await req.json();
    console.log('Request body:', JSON.stringify(body));

    if (!body.value || body.value <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Valor inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare payment data
    const paymentData: Record<string, unknown> = {
      value: body.value,
    };

    if (body.description) {
      paymentData.description = body.description;
    }

    if (body.expiresIn) {
      paymentData.expiresIn = body.expiresIn;
    }

    if (body.customerName || body.customerEmail || body.customerPhone) {
      paymentData.customer = {
        name: body.customerName,
        email: body.customerEmail,
        phone: body.customerPhone,
      };
    }

    console.log('Sending request to Flow API:', JSON.stringify(paymentData));

    // Make request to Flow API
    const response = await fetch(`${FLOW_API_URL}/api/flow-api/charge`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FLOW_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    const data: FlowChargeResponse = await response.json();
    console.log('Flow API response:', JSON.stringify(data));

    if (!response.ok) {
      console.error('Flow API error:', data.error);
      return new Response(
        JSON.stringify({ success: false, error: data.error || 'Erro ao criar pagamento' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (data.success && data.charge) {
      console.log('Payment created successfully:', data.charge.id);
      return new Response(
        JSON.stringify({
          success: true,
          payment: {
            id: data.charge.id,
            value: data.charge.value,
            status: data.charge.status,
            pixCode: data.charge.pixCode,
            qrCodeImage: data.charge.qrCode.image,
            qrCodeEmv: data.charge.qrCode.emv,
            publicPaymentUrl: data.charge.publicPaymentUrl,
            expiresIn: data.charge.expiresIn,
            expiresDate: data.charge.expiresDate,
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ success: false, error: data.error || 'Erro desconhecido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error: unknown) {
    console.error('Error in create-payment function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
