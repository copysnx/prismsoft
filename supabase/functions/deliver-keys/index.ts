import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeliverKeysRequest {
  orderId: string;
}

interface OrderItem {
  id: string;
  product_id: string;
  variation_id: string;
  quantity: number;
  product_name: string;
  variation_name: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('Deliver keys request received');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: DeliverKeysRequest = await req.json();
    console.log('Request body:', JSON.stringify(body));

    if (!body.orderId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Order ID não informado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', body.orderId)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', orderError);
      return new Response(
        JSON.stringify({ success: false, error: 'Pedido não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if keys already delivered
    const { data: existingDelivery } = await supabase
      .from('delivered_keys')
      .select('id')
      .eq('order_id', body.orderId)
      .limit(1);

    if (existingDelivery && existingDelivery.length > 0) {
      console.log('Keys already delivered for order:', body.orderId);
      
      // Return existing delivered keys
      const { data: deliveredKeys } = await supabase
        .from('delivered_keys')
        .select('*')
        .eq('order_id', body.orderId);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Keys já foram entregues',
          deliveredKeys: deliveredKeys || []
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get order items
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', body.orderId);

    if (itemsError || !orderItems || orderItems.length === 0) {
      console.error('Order items not found:', itemsError);
      return new Response(
        JSON.stringify({ success: false, error: 'Itens do pedido não encontrados' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Order items:', JSON.stringify(orderItems));

    const deliveredKeys: Array<{
      order_item_id: string;
      product_name: string;
      variation_name: string;
      key_value: string;
    }> = [];

    // Process each order item
    for (const item of orderItems as OrderItem[]) {
      console.log(`Processing item: ${item.product_name} - ${item.variation_name}, qty: ${item.quantity}`);
      
      // Get available keys for this product/variation
      const { data: availableKeys, error: keysError } = await supabase
        .from('product_keys')
        .select('*')
        .eq('product_id', item.product_id)
        .eq('variation_id', item.variation_id)
        .eq('status', 'available')
        .limit(item.quantity);

      if (keysError) {
        console.error('Error fetching keys:', keysError);
        continue;
      }

      if (!availableKeys || availableKeys.length < item.quantity) {
        console.warn(`Not enough keys for ${item.product_name}. Available: ${availableKeys?.length || 0}, needed: ${item.quantity}`);
        // Continue with available keys
      }

      const keysToDeliver = availableKeys || [];
      
      for (const key of keysToDeliver) {
        // Mark key as sold
        const { error: updateError } = await supabase
          .from('product_keys')
          .update({
            status: 'sold',
            sold_to: order.user_id || null,
            sold_at: new Date().toISOString()
          })
          .eq('id', key.id);

        if (updateError) {
          console.error('Error updating key status:', updateError);
          continue;
        }

        // Create delivered key record
        const { error: deliverError } = await supabase
          .from('delivered_keys')
          .insert({
            order_id: body.orderId,
            order_item_id: item.id,
            product_key_id: key.id,
            key_value: key.key_value
          });

        if (deliverError) {
          console.error('Error creating delivery record:', deliverError);
          continue;
        }

        deliveredKeys.push({
          order_item_id: item.id,
          product_name: item.product_name,
          variation_name: item.variation_name,
          key_value: key.key_value
        });
      }
    }

    // Update order status to delivered
    await supabase
      .from('orders')
      .update({ status: 'delivered' })
      .eq('id', body.orderId);

    console.log(`Delivered ${deliveredKeys.length} keys for order ${body.orderId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${deliveredKeys.length} keys entregues`,
        deliveredKeys 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in deliver-keys function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
