import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase: number;
  max_uses: number | null;
  current_uses: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CouponValidationResult {
  valid: boolean;
  coupon?: Coupon;
  error?: string;
  discountAmount?: number;
}

export const useCoupons = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch all coupons (admin)
  const { data: coupons = [], isLoading, error, refetch } = useQuery({
    queryKey: ['coupons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Coupon[];
    },
  });

  // Validate a coupon code
  const validateCoupon = async (code: string, subtotal: number): Promise<CouponValidationResult> => {
    const upperCode = code.toUpperCase().trim();
    
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', upperCode)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return { valid: false, error: 'Cupom não encontrado ou inválido' };
    }

    const coupon = data as Coupon;
    const now = new Date();

    // Check validity period
    if (coupon.valid_from && new Date(coupon.valid_from) > now) {
      return { valid: false, error: 'Este cupom ainda não está válido' };
    }

    if (coupon.valid_until && new Date(coupon.valid_until) < now) {
      return { valid: false, error: 'Este cupom expirou' };
    }

    // Check usage limit
    if (coupon.max_uses !== null && coupon.current_uses >= coupon.max_uses) {
      return { valid: false, error: 'Este cupom atingiu o limite de uso' };
    }

    // Check minimum purchase
    if (subtotal < coupon.min_purchase) {
      return { 
        valid: false, 
        error: `Compra mínima de R$ ${coupon.min_purchase.toFixed(2)} necessária` 
      };
    }

    // Calculate discount
    let discountAmount: number;
    if (coupon.discount_type === 'percentage') {
      discountAmount = subtotal * (coupon.discount_value / 100);
    } else {
      discountAmount = Math.min(coupon.discount_value, subtotal);
    }

    return { valid: true, coupon, discountAmount };
  };

  // Create coupon
  const createCoupon = useMutation({
    mutationFn: async (couponData: Partial<Coupon>) => {
      const { data, error } = await supabase
        .from('coupons')
        .insert({
          code: couponData.code?.toUpperCase(),
          description: couponData.description,
          discount_type: couponData.discount_type,
          discount_value: couponData.discount_value,
          min_purchase: couponData.min_purchase || 0,
          max_uses: couponData.max_uses,
          valid_from: couponData.valid_from,
          valid_until: couponData.valid_until,
          is_active: couponData.is_active ?? true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast({ title: 'Cupom criado com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Erro ao criar cupom', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  // Update coupon
  const updateCoupon = useMutation({
    mutationFn: async ({ id, ...couponData }: Partial<Coupon> & { id: string }) => {
      const { data, error } = await supabase
        .from('coupons')
        .update({
          code: couponData.code?.toUpperCase(),
          description: couponData.description,
          discount_type: couponData.discount_type,
          discount_value: couponData.discount_value,
          min_purchase: couponData.min_purchase,
          max_uses: couponData.max_uses,
          valid_from: couponData.valid_from,
          valid_until: couponData.valid_until,
          is_active: couponData.is_active,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast({ title: 'Cupom atualizado com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Erro ao atualizar cupom', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  // Delete coupon
  const deleteCoupon = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast({ title: 'Cupom excluído com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Erro ao excluir cupom', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  // Increment coupon usage (simple update)
  const incrementUsage = async (couponId: string) => {
    // Get current usage and increment
    const { data: coupon } = await supabase
      .from('coupons')
      .select('current_uses')
      .eq('id', couponId)
      .single();
    
    if (coupon) {
      await supabase
        .from('coupons')
        .update({ current_uses: coupon.current_uses + 1 })
        .eq('id', couponId);
    }
  };

  return {
    coupons,
    isLoading,
    error,
    refetch,
    validateCoupon,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    incrementUsage,
  };
};
