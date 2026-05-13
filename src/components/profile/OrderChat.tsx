import { useEffect, useMemo, useRef, useState } from "react";
import {
  Send,
  Loader2,
  MessageCircle,
  Paperclip,
  Mic,
  Star,
  Hash,
  Package,
  ShieldCheck,
  DollarSign,
  Calendar,
  CreditCard,
} from "lucide-react";
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

interface OrderItemLite {
  product_name: string;
  variation_name: string;
  quantity: number;
}

interface OrderInfo {
  id: string;
  orderNumber: string;
  total_amount: number;
  payment_method: string | null;
  created_at: string;
  items: OrderItemLite[];
}

interface Props {
  order: OrderInfo;
}

const OrderChat = ({ order }: Props) => {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const orderId = order.id;

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

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

  const formatPrice = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const firstItem = order.items[0];
  const userInitial = (user?.email?.[0] || "U").toUpperCase();

  const infoCells = useMemo(
    () => [
      { icon: Hash, label: "PEDIDO", value: `#${order.orderNumber}` },
      {
        icon: Package,
        label: "PRODUTO",
        value: firstItem?.product_name || "—",
      },
      {
        icon: ShieldCheck,
        label: "PLANO",
        value: firstItem?.variation_name || "—",
      },
      { icon: DollarSign, label: "VALOR", value: formatPrice(order.total_amount) },
      { icon: Calendar, label: "DATA", value: formatDate(order.created_at) },
      {
        icon: CreditCard,
        label: "PAGAMENTO",
        value: (order.payment_method || "—").toUpperCase(),
      },
    ],
    [order, firstItem]
  );

  return (
    <div className="space-y-4">
      {/* Order info bar */}
      <div className="bg-card/80 backdrop-blur rounded-2xl border border-purple-500/20 p-3 sm:p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {infoCells.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 shrink-0">
                <Icon className="h-3.5 w-3.5 text-purple-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] tracking-wider text-muted-foreground font-medium">{label}</p>
                <p className="text-xs font-semibold text-foreground truncate">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div className="flex flex-col h-[480px] bg-card rounded-2xl border border-purple-500/20 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/60 bg-gradient-to-r from-purple-500/5 to-fuchsia-500/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/15 border border-purple-500/20">
              <MessageCircle className="h-4 w-4 text-purple-400" />
            </div>
            <div>
              <p className="font-semibold text-sm">Chat do Pedido</p>
              <p className="text-[11px] text-muted-foreground">
                {messages.length} {messages.length === 1 ? "mensagem" : "mensagens"}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 border-purple-500/30 text-purple-300 hover:bg-purple-500/10 hover:text-purple-200"
          >
            <Star className="h-3.5 w-3.5" />
            <span className="text-xs">Gostaria de dar feedback?</span>
          </Button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/40">
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
              const alignRight = isStaff;
              const label = isStaff ? "Staff" : m.user_id === user?.id ? "Você" : "Cliente";
              const initial = isStaff ? "S" : (label[0] || "U").toUpperCase();
              return (
                <div
                  key={m.id}
                  className={`flex items-end gap-2 ${alignRight ? "justify-end" : "justify-start"}`}
                >
                  {!alignRight && (
                    <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center text-[11px] font-semibold text-muted-foreground shrink-0">
                      {initial}
                    </div>
                  )}
                  <div className={`flex flex-col max-w-[70%] ${alignRight ? "items-end" : "items-start"}`}>
                    <span
                      className={`text-[11px] font-medium mb-1 ${
                        isStaff ? "text-purple-400" : "text-muted-foreground"
                      }`}
                    >
                      {label}
                    </span>
                    <div
                      className={`rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                        isStaff
                          ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-100 rounded-br-sm"
                          : "bg-muted/70 border border-border/60 text-foreground rounded-bl-sm"
                      }`}
                    >
                      {m.message}
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-1">{formatTime(m.created_at)}</span>
                  </div>
                  {alignRight && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center text-[11px] font-semibold text-white shrink-0">
                      {initial}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Input */}
        <div className="p-3 border-t border-border/60 bg-card">
          <div className="flex items-center gap-2 bg-muted/50 border border-border/60 rounded-xl px-3 py-1.5 focus-within:border-purple-500/50 transition-colors">
            <button
              type="button"
              className="text-muted-foreground hover:text-purple-400 transition-colors shrink-0"
              aria-label="Anexar"
            >
              <Paperclip className="h-4 w-4" />
            </button>
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
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-1 h-9 text-sm"
            />
            <button
              type="button"
              className="text-muted-foreground hover:text-purple-400 transition-colors shrink-0"
              aria-label="Áudio"
            >
              <Mic className="h-4 w-4" />
            </button>
            <Button
              onClick={handleSend}
              disabled={sending || !input.trim()}
              size="icon"
              className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-fuchsia-500 hover:from-purple-600 hover:to-fuchsia-600 text-white shrink-0"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderChat;
