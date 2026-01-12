import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: WebhookPayload = await req.json();
    console.log('Webhook payload:', JSON.stringify(payload));

    console.log(`Payment confirmed for order ${payload.order_nsu}`);
    console.log(`Amount: ${payload.paid_amount / 100} BRL`);
    console.log(`Method: ${payload.capture_method}`);
    console.log(`Transaction NSU: ${payload.transaction_nsu}`);
    console.log(`Receipt URL: ${payload.receipt_url}`);

    // Find the order by order_nsu
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('order_nsu', payload.order_nsu)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', payload.order_nsu, orderError);
      return new Response(
        JSON.stringify({ success: false, error: 'Pedido não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Order found:', order.id);

    // Update order status to paid
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'paid',
        transaction_nsu: payload.transaction_nsu,
        receipt_url: payload.receipt_url,
        paid_at: new Date().toISOString(),
      })
      .eq('id', order.id);

    if (updateError) {
      console.error('Error updating order:', updateError);
    }

    // Deliver keys automatically
    console.log('Delivering keys for order:', order.id);

    // Get order items
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', order.id);

    if (itemsError || !orderItems || orderItems.length === 0) {
      console.error('Order items not found:', itemsError);
      return new Response(
        JSON.stringify({ success: true, message: 'Order updated, no items to deliver' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let deliveredCount = 0;

    // Process each order item
    for (const item of orderItems) {
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

      if (!availableKeys || availableKeys.length === 0) {
        console.warn(`No keys available for ${item.product_name}`);
        continue;
      }

      for (const key of availableKeys) {
        // Mark key as sold
        const { error: updateKeyError } = await supabase
          .from('product_keys')
          .update({
            status: 'sold',
            sold_to: order.user_id || null,
            sold_at: new Date().toISOString()
          })
          .eq('id', key.id);

        if (updateKeyError) {
          console.error('Error updating key status:', updateKeyError);
          continue;
        }

        // Create delivered key record
        const { error: deliverError } = await supabase
          .from('delivered_keys')
          .insert({
            order_id: order.id,
            order_item_id: item.id,
            product_key_id: key.id,
            key_value: key.key_value
          });

        if (deliverError) {
          console.error('Error creating delivery record:', deliverError);
          continue;
        }

        deliveredCount++;
      }
    }

    // Update order status to delivered if keys were delivered
    if (deliveredCount > 0) {
      await supabase
        .from('orders')
        .update({ status: 'delivered' })
        .eq('id', order.id);
    }

    console.log(`Delivered ${deliveredCount} keys for order ${order.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Webhook processed, ${deliveredCount} keys delivered`,
        orderId: order.id,
        deliveredCount
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in infinitepay-webhook function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno';
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
