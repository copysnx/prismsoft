import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface StockInfo {
  productId: string;
  variationId: string;
  available: number;
}

export const useRealTimeStock = (productId?: string) => {
  const [stockData, setStockData] = useState<StockInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStock = async () => {
    try {
      let query = supabase
        .from('product_keys')
        .select('product_id, variation_id')
        .eq('status', 'available');

      if (productId) {
        query = query.eq('product_id', productId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Group by product_id and variation_id and count
      const stockMap = new Map<string, StockInfo>();
      
      (data || []).forEach(key => {
        const mapKey = `${key.product_id}-${key.variation_id}`;
        const existing = stockMap.get(mapKey);
        if (existing) {
          existing.available++;
        } else {
          stockMap.set(mapKey, {
            productId: key.product_id,
            variationId: key.variation_id,
            available: 1
          });
        }
      });

      setStockData(Array.from(stockMap.values()));
    } catch (error) {
      console.error('Error fetching stock:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Always fetch when productId changes (including from undefined to a value)
    fetchStock();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`stock-updates-${productId || 'all'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'product_keys',
          ...(productId ? { filter: `product_id=eq.${productId}` } : {})
        },
        () => {
          // Refetch stock on any change
          fetchStock();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [productId]);

  const getStock = (productId: string, variationId: string): number => {
    const stock = stockData.find(
      s => s.productId === productId && s.variationId === variationId
    );
    return stock?.available || 0;
  };

  return {
    stockData,
    loading,
    getStock,
    refetch: fetchStock
  };
};
