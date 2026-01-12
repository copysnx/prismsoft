import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Package, Key, Copy, Check, Calendar, CreditCard, Loader2, ShoppingBag, BookOpen, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
interface OrderItem {
  id: string;
  product_name: string;
  variation_name: string;
  quantity: number;
  price: number;
}

interface DeliveredKey {
  id: string;
  key_value: string;
  delivered_at: string;
  order_item_id: string;
}

interface Order {
  id: string;
  order_nsu: string | null;
  status: string;
  total_amount: number;
  discount_amount: number | null;
  payment_method: string | null;
  created_at: string;
  paid_at: string | null;
  items: OrderItem[];
  delivered_keys: DeliveredKey[];
}

const PurchasesPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;

      try {
        // Fetch orders
        const { data: ordersData, error: ordersError } = await supabase
          .from("orders")
          .select("*")
          .or(`user_id.eq.${user.id},email.eq.${user.email}`)
          .order("created_at", { ascending: false });

        if (ordersError) {
          console.error("Error fetching orders:", ordersError);
          return;
        }

        if (!ordersData || ordersData.length === 0) {
          setOrders([]);
          setIsLoading(false);
          return;
        }

        // Fetch order items and delivered keys for each order
        const ordersWithDetails = await Promise.all(
          ordersData.map(async (order) => {
            const { data: itemsData } = await supabase
              .from("order_items")
              .select("*")
              .eq("order_id", order.id);

            const { data: keysData } = await supabase
              .from("delivered_keys")
              .select("*")
              .eq("order_id", order.id);

            return {
              ...order,
              items: itemsData || [],
              delivered_keys: keysData || [],
            };
          })
        );

        setOrders(ordersWithDetails);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchOrders();
    }
  }, [user]);

  const handleCopyKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedKey(key);
      toast.success("Key copiada!");
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (error) {
      toast.error("Erro ao copiar key");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "text-green-500 bg-green-500/10 border-green-500/30";
      case "paid":
        return "text-blue-500 bg-blue-500/10 border-blue-500/30";
      case "pending":
        return "text-yellow-500 bg-yellow-500/10 border-yellow-500/30";
      case "cancelled":
        return "text-red-500 bg-red-500/10 border-red-500/30";
      default:
        return "text-muted-foreground bg-muted/10 border-border";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "delivered":
        return "Entregue";
      case "paid":
        return "Pago";
      case "pending":
        return "Pendente";
      case "cancelled":
        return "Cancelado";
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Back Button */}
          <button
            onClick={() => navigate("/profile")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground hover:border-purple-500/50 transition-all mb-6"
          >
            <ArrowLeft className="h-5 w-5" />
            Voltar ao Perfil
          </button>

          {/* Title */}
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 border border-purple-500/30">
              <ShoppingBag className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gradient">Suas Compras</h1>
              <p className="text-muted-foreground text-sm">
                Histórico de pedidos e keys entregues
              </p>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="purchases" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="purchases" className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                Minhas Compras
              </TabsTrigger>
              <TabsTrigger value="tutorial" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Tutorial
              </TabsTrigger>
            </TabsList>

            {/* Purchases Tab */}
            <TabsContent value="purchases">
              {orders.length === 0 ? (
                <div className="bg-card rounded-2xl border border-border p-12 text-center">
                  <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma compra ainda</h3>
                  <p className="text-muted-foreground mb-6">
                    Você ainda não realizou nenhuma compra.
                  </p>
                  <Button variant="hero" onClick={() => navigate("/")}>
                    Ver Produtos
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-card rounded-2xl border border-border overflow-hidden"
                    >
                      {/* Order Header */}
                      <div className="p-4 sm:p-6 border-b border-border bg-muted/30">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-500/20">
                              <Package className="h-5 w-5 text-purple-400" />
                            </div>
                            <div>
                              <p className="font-semibold text-sm sm:text-base">
                                Pedido #{order.order_nsu || order.id.slice(0, 8)}
                              </p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(order.created_at)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                                order.status
                              )}`}
                            >
                              {getStatusText(order.status)}
                            </span>
                            <span className="text-lg font-bold text-gradient">
                              {formatPrice(order.total_amount)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="p-4 sm:p-6">
                        <h4 className="text-sm font-medium text-muted-foreground mb-3">
                          Produtos
                        </h4>
                        <div className="space-y-3">
                          {order.items.map((item) => {
                            const itemKeys = order.delivered_keys.filter(
                              (k) => k.order_item_id === item.id
                            );

                            return (
                              <div
                                key={item.id}
                                className="bg-muted/30 rounded-xl p-4 border border-border/50"
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <p className="font-medium">{item.product_name}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {item.variation_name} x{item.quantity}
                                    </p>
                                  </div>
                                  <span className="text-sm font-medium">
                                    {formatPrice(item.price * item.quantity)}
                                  </span>
                                </div>

                                {/* Delivered Keys */}
                                {itemKeys.length > 0 && (
                                  <div className="mt-3 pt-3 border-t border-border/50">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Key className="h-4 w-4 text-green-500" />
                                      <span className="text-xs font-medium text-green-500">
                                        Keys Entregues
                                      </span>
                                    </div>
                                    <div className="space-y-2">
                                      {itemKeys.map((key) => (
                                        <div
                                          key={key.id}
                                          className="flex items-center gap-2 bg-background/50 rounded-lg p-2 border border-border/30"
                                        >
                                          <code className="flex-1 text-sm font-mono text-foreground break-all">
                                            {key.key_value}
                                          </code>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 shrink-0"
                                            onClick={() => handleCopyKey(key.key_value)}
                                          >
                                            {copiedKey === key.key_value ? (
                                              <Check className="h-4 w-4 text-green-500" />
                                            ) : (
                                              <Copy className="h-4 w-4" />
                                            )}
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Payment Info */}
                        {order.payment_method && (
                          <div className="mt-4 pt-4 border-t border-border/50 flex items-center gap-2 text-sm text-muted-foreground">
                            <CreditCard className="h-4 w-4" />
                            <span>
                              Pago via{" "}
                              {order.payment_method === "pix"
                                ? "PIX"
                                : order.payment_method === "card"
                                ? "Cartão"
                                : order.payment_method}
                            </span>
                            {order.paid_at && (
                              <span className="text-xs">
                                em {formatDate(order.paid_at)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Tutorial Tab */}
            <TabsContent value="tutorial">
              <div className="bg-card rounded-2xl border border-border p-8">
                <div className="text-center mb-8">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 border border-purple-500/30 inline-block mb-4">
                    <BookOpen className="h-12 w-12 text-purple-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-gradient mb-2">Tutorial de Uso</h2>
                  <p className="text-muted-foreground">
                    Aprenda como utilizar nossos produtos de forma correta e segura
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="bg-muted/30 rounded-xl p-6 border border-border/50">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 text-sm font-bold">1</span>
                      Acesse o Tutorial Completo
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      Clique no botão abaixo para acessar nosso site oficial com todos os tutoriais detalhados para cada produto.
                    </p>
                    <Button
                      variant="hero"
                      className="w-full sm:w-auto"
                      onClick={() => window.open("https://prismcheats.shop/", "_blank")}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Acessar Tutorial
                    </Button>
                  </div>

                  <div className="bg-muted/30 rounded-xl p-6 border border-border/50">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 text-sm font-bold">2</span>
                      Suporte
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Se tiver dúvidas após seguir o tutorial, entre em contato com nosso suporte através do Discord ou pelo site oficial.
                    </p>
                  </div>

                  <div className="bg-muted/30 rounded-xl p-6 border border-border/50">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 text-sm font-bold">3</span>
                      Dicas Importantes
                    </h3>
                    <ul className="text-muted-foreground text-sm space-y-2">
                      <li>• Sempre baixe os arquivos apenas do site oficial</li>
                      <li>• Desative o antivírus temporariamente durante a instalação</li>
                      <li>• Execute como administrador quando solicitado</li>
                      <li>• Mantenha suas keys em segurança e não compartilhe</li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PurchasesPage;
