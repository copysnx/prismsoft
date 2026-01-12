import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const INFINITEPAY_API_URL = 'https://api.infinitepay.io/invoices/public/checkout/links';
const INFINITEPAY_HANDLE = 'italo-alexandre-660';

interface CartItem {
  productName: string;
  variationName: string;
  price: number;
  quantity: number;
}

interface CheckoutRequest {
  items: CartItem[];
  orderNsu: string;
  redirectUrl: string;
  webhookUrl?: string;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
  };
}

interface InfinitePayItem {
  quantity: number;
  price: number;
  description: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('InfinitePay checkout request received');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: CheckoutRequest = await req.json();
    console.log('Request body:', JSON.stringify(body));

    if (!body.items || body.items.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Nenhum item no carrinho' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Convert cart items to InfinitePay format
    // Price must be in cents (R$ 10,00 = 1000)
    const infinitePayItems: InfinitePayItem[] = body.items.map(item => ({
      quantity: item.quantity,
      price: Math.round(item.price * 100), // Convert to cents
      description: `${item.productName} - ${item.variationName}`,
    }));

    // Build the payload
    const payload: Record<string, unknown> = {
      handle: INFINITEPAY_HANDLE,
      items: infinitePayItems,
    };

    // Add optional order NSU
    if (body.orderNsu) {
      payload.order_nsu = body.orderNsu;
    }

    // Add redirect URL
    if (body.redirectUrl) {
      payload.redirect_url = body.redirectUrl;
    }

    // Add webhook URL if provided
    if (body.webhookUrl) {
      payload.webhook_url = body.webhookUrl;
    }

    // Add customer data if provided
    if (body.customer) {
      payload.customer = {
        name: body.customer.name,
        email: body.customer.email,
        phone_number: body.customer.phone,
      };
    }

    console.log('Sending request to InfinitePay:', JSON.stringify(payload));

    // Make request to InfinitePay API
    const response = await fetch(INFINITEPAY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log('InfinitePay response status:', response.status);
    console.log('InfinitePay response:', JSON.stringify(data));

    if (!response.ok) {
      console.error('InfinitePay API error:', data);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: data.message || data.error || 'Erro ao criar checkout' 
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // InfinitePay returns the checkout URL directly
    // The response format may vary, so we handle multiple cases
    const checkoutUrl = data.url || data.checkout_url || data.link;
    
    if (checkoutUrl) {
      console.log('Checkout URL created:', checkoutUrl);
      return new Response(
        JSON.stringify({
          success: true,
          checkoutUrl: checkoutUrl,
          orderNsu: body.orderNsu,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // If we got a success but no URL, return the full response for debugging
      console.log('Unexpected response format, returning full data');
      return new Response(
        JSON.stringify({
          success: true,
          data: data,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error: unknown) {
    console.error('Error in infinitepay-checkout function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
