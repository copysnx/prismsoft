import { useEffect, useRef, useState } from "react";
import { Send, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { toast } from "sonner";

interface Message {
  id: string;
  order_id: string;
  user_id: string | null;
  sender_role: "user" | "staff";
  message: string;
  created_at: string;
}

interface Props {
  orderId: string;
  orderNumber: string;
}

const OrderChat = ({ orderId, orderNumber }: Props) => {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("order_messages")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: true });
      if (!error) setMessages((data || []) as Message[]);
      setLoading(false);
    };
    load();

    const channel = supabase
      .channel(`order_chat_${orderId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "order_messages", filter: `order_id=eq.${orderId}` },
        (payload) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === (payload.new as Message).id)) return prev;
            return [...prev, payload.new as Message];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !user) return;
    setSending(true);
    try {
      const { error } = await supabase.from("order_messages").insert({
        order_id: orderId,
        user_id: user.id,
        sender_role: isAdmin ? "staff" : "user",
        message: text,
      });
      if (error) throw error;
      setInput("");
    } catch (e: any) {
      toast.error("Erro ao enviar mensagem");
    } finally {
      setSending(false);
    }
  };

  const formatTime = (d: string) =>
    new Date(d).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex flex-col h-[500px] bg-card rounded-2xl border border-border overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/20">
            <MessageCircle className="h-4 w-4 text-purple-400" />
          </div>
          <div>
            <p className="font-semibold text-sm">Chat do Pedido</p>
            <p className="text-xs text-muted-foreground">
              {messages.length} {messages.length === 1 ? "mensagem" : "mensagens"} • #{orderNumber}
            </p>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <MessageCircle className="h-10 w-10 mb-2 opacity-50" />
            <p className="text-sm">Nenhuma mensagem ainda.</p>
            <p className="text-xs">Envie uma mensagem para iniciar a conversa.</p>
          </div>
        ) : (
          messages.map((m) => {
            const isStaff = m.sender_role === "staff";
            const isMine = m.user_id === user?.id;
            return (
              <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] ${isMine ? "items-end" : "items-start"} flex flex-col`}>
                  <span className={`text-xs font-medium mb-1 ${isStaff ? "text-purple-400" : "text-muted-foreground"}`}>
                    {isStaff ? "Staff" : isMine ? "Você" : "Cliente"}
                  </span>
                  <div
                    className={`rounded-2xl px-4 py-2 text-sm ${
                      isStaff
                        ? "bg-green-500/10 border border-green-500/30 text-green-100"
                        : isMine
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {m.message}
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1">{formatTime(m.created_at)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-3 border-t border-border bg-muted/20">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Digite sua mensagem..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={sending}
          />
          <Button onClick={handleSend} disabled={sending || !input.trim()} size="icon">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrderChat;
