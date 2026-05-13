CREATE TABLE public.order_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  user_id uuid,
  sender_role text NOT NULL CHECK (sender_role IN ('user','staff')),
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_messages_order ON public.order_messages(order_id, created_at);

ALTER TABLE public.order_messages ENABLE ROW LEVEL SECURITY;

-- Order owners can view their order chat
CREATE POLICY "Owners view their order messages"
ON public.order_messages FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.orders o
  WHERE o.id = order_messages.order_id
    AND (o.user_id = auth.uid() OR o.email = (auth.jwt() ->> 'email'))
));

-- Admins view all
CREATE POLICY "Admins view all order messages"
ON public.order_messages FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Order owners insert as 'user'
CREATE POLICY "Owners send user messages"
ON public.order_messages FOR INSERT TO authenticated
WITH CHECK (
  sender_role = 'user'
  AND user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_messages.order_id
      AND (o.user_id = auth.uid() OR o.email = (auth.jwt() ->> 'email'))
  )
);

-- Admins insert as 'staff'
CREATE POLICY "Admins send staff messages"
ON public.order_messages FOR INSERT TO authenticated
WITH CHECK (
  sender_role = 'staff'
  AND has_role(auth.uid(), 'admin')
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.order_messages;
ALTER TABLE public.order_messages REPLICA IDENTITY FULL;