CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  icon text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active categories" ON public.categories
  FOR SELECT USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage categories" ON public.categories
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_categories_updated
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.products
  ADD COLUMN category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;

CREATE INDEX idx_products_category_id ON public.products(category_id);

INSERT INTO public.categories (name, slug, icon, description, sort_order) VALUES
  ('Discord', 'discord', 'MessageCircle', 'Boosts, Nitro e serviços para Discord', 1),
  ('IA Code', 'ia-code', 'Code2', 'Acessos a ferramentas de IA para desenvolvimento', 2),
  ('Streamings', 'streamings', 'Tv', 'Contas e assinaturas de plataformas de streaming', 3),
  ('Contas', 'contas', 'UserRound', 'Contas premium para diversos serviços', 4),
  ('Emails', 'emails', 'Mail', 'Emails verificados e profissionais', 5);