import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CartItem {
  productId: string;
  productName: string;
  productImage: string;
  variationId: string;
  variationName: string;
  price: number;
  quantity: number;
}

interface CreateOrderRequest {
  items: CartItem[];
  email: string;
  customerName?: string;
  phone?: string;
  paymentMethod: 'pix' | 'card';
  paymentId?: string;
  orderNsu?: string;
  totalAmount: number;
  discountAmount?: number;
  couponCode?: string;
  userId?: string;
}

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const handler = async (req: Request): Promise<Response> => {
  console.log('Create order request received');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: CreateOrderRequest = await req.json();
    console.log('Request body:', JSON.stringify(body));

    if (!body.items || body.items.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Carrinho vazio' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!body.email) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check stock availability for all items
    for (const item of body.items) {
      if (!isUuid(item.productId)) {
        console.error('Invalid productId received:', item.productId);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Produto inválido no carrinho. Remova e adicione novamente.',
            invalidProductId: item.productId,
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: availableKeys, error } = await supabase
        .from('product_keys')
        .select('id')
        .eq('product_id', item.productId)
        .eq('variation_id', item.variationId)
        .eq('status', 'available');

      if (error) {
        console.error('Error checking stock:', error);
        return new Response(
          JSON.stringify({ success: false, error: 'Erro ao verificar estoque' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const availableCount = availableKeys?.length || 0;
      if (availableCount < item.quantity) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Estoque insuficiente para ${item.productName} - ${item.variationName}. Disponível: ${availableCount}`,
            stockError: true,
            productId: item.productId,
            variationId: item.variationId,
            available: availableCount,
            requested: item.quantity
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Create order
    const orderData = {
      email: body.email,
      customer_name: body.customerName || null,
      phone: body.phone || null,
      status: 'pending',
      payment_method: body.paymentMethod,
      payment_id: body.paymentId || null,
      order_nsu: body.orderNsu || `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      total_amount: body.totalAmount,
      discount_amount: body.discountAmount || 0,
      coupon_code: body.couponCode || null,
      user_id: body.userId || null,
    };

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao criar pedido' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Order created:', order.id);

    // Create order items
    const orderItems = body.items.map(item => ({
      order_id: order.id,
      product_id: item.productId,
      product_name: item.productName,
      variation_id: item.variationId,
      variation_name: item.variationName,
      quantity: item.quantity,
      price: item.price,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      // Rollback order
      await supabase.from('orders').delete().eq('id', order.id);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao criar itens do pedido' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Order items created');

    return new Response(
      JSON.stringify({ 
        success: true, 
        order: {
          id: order.id,
          orderNsu: order.order_nsu,
          status: order.status,
          totalAmount: order.total_amount,
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in create-order function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
