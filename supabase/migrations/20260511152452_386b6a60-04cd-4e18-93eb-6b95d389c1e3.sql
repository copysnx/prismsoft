ALTER TABLE public.delivered_keys ALTER COLUMN product_key_id DROP NOT NULL;
ALTER TABLE public.delivered_keys DROP CONSTRAINT delivered_keys_product_key_id_fkey;
ALTER TABLE public.delivered_keys ADD CONSTRAINT delivered_keys_product_key_id_fkey FOREIGN KEY (product_key_id) REFERENCES public.product_keys(id) ON DELETE SET NULL;