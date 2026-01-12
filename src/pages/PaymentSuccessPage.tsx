import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, Download, Home, Package, Clock, CreditCard, Zap, Key, Copy, Check, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface DeliveredKey {
  id: string;
  keyValue: string;
  productName: string;
  variationName: string;
  deliveredAt: string;
}

interface OrderData {
  id: string;
  orderNsu: string;
  status: string;
  email: string;
  totalAmount: number;
  paymentMethod: string;
  receiptUrl?: string;
}

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [deliveredKeys, setDeliveredKeys] = useState<DeliveredKey[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const orderNsu = searchParams.get('order_nsu');
  const receiptUrl = searchParams.get('receipt_url');
  const captureMethod = searchParams.get('capture_method');

  useEffect(() => {
    // Clear any stored cart/payment data
    localStorage.removeItem('current-payment');
    localStorage.removeItem('prism-cart');
    localStorage.removeItem('current-order');
  }, []);

  useEffect(() => {
    if (!orderNsu) {
      setLoading(false);
      return;
    }

    const fetchOrderKeys = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-order-keys', {
          body: { orderNsu }
        });

        if (error) {
          console.error('Error fetching order keys:', error);
          return;
        }

        if (data.success) {
          setOrderData(data.order);
          setDeliveredKeys(data.deliveredKeys || []);
          
          // If no keys yet and order is not delivered, retry in a few seconds
          if (data.deliveredKeys?.length === 0 && data.order?.status !== 'delivered' && retryCount < 10) {
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
            }, 3000);
          }
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderKeys();
  }, [orderNsu, retryCount]);

  const handleCopyKey = async (keyValue: string, keyId: string) => {
    try {
      await navigator.clipboard.writeText(keyValue);
      setCopiedKey(keyId);
      toast({
        title: "Key copiada!",
        description: "A chave foi copiada para a área de transferência.",
      });
      setTimeout(() => setCopiedKey(null), 3000);
    } catch {
      toast({
        title: "Erro ao copiar",
        description: "Tente copiar manualmente.",
        variant: "destructive"
      });
    }
  };

  const getPaymentMethodIcon = () => {
    if (captureMethod === 'pix' || orderData?.paymentMethod === 'pix') {
      return <Zap className="h-6 w-6" />;
    }
    return <CreditCard className="h-6 w-6" />;
  };

  const getPaymentMethodName = () => {
    const method = captureMethod || orderData?.paymentMethod;
    if (method === 'pix') return 'PIX';
    if (method === 'credit_card' || method === 'card') return 'Cartão de Crédito';
    return 'Cartão';
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-2xl mx-auto">
          {/* Success Card */}
          <div className="bg-card border border-border rounded-2xl p-8 text-center">
            {/* Success Icon */}
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>

            <h1 className="text-3xl font-bold text-foreground mb-2">
              Pagamento Confirmado!
            </h1>
            <p className="text-muted-foreground mb-8">
              Sua compra foi processada com sucesso. Suas chaves estão disponíveis abaixo.
            </p>

            {/* Payment Details */}
            <div className="bg-muted/30 rounded-xl p-6 mb-6 text-left space-y-4">
              {(captureMethod || orderData?.paymentMethod) && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    {getPaymentMethodIcon()}
                    Método de Pagamento
                  </span>
                  <span className="font-medium">{getPaymentMethodName()}</span>
                </div>
              )}
              
              {(orderNsu || orderData?.orderNsu) && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Número do Pedido
                  </span>
                  <span className="font-mono text-sm">{orderNsu || orderData?.orderNsu}</span>
                </div>
              )}

              {orderData?.email && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Email
                  </span>
                  <span className="text-sm">{orderData.email}</span>
                </div>
              )}
            </div>

            {/* Delivered Keys Section */}
            <div className="bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-xl p-6 mb-6 text-left">
              <div className="flex items-center gap-2 mb-4">
                <Key className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-primary">Suas Chaves de Produto</h3>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                  <span className="text-muted-foreground">Carregando suas chaves...</span>
                </div>
              ) : deliveredKeys.length > 0 ? (
                <div className="space-y-3">
                  {deliveredKeys.map((key) => (
                    <div 
                      key={key.id}
                      className="bg-card border border-border rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          {key.productName} - {key.variationName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 bg-muted/50 px-3 py-2 rounded-lg font-mono text-sm break-all">
                          {key.keyValue}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyKey(key.keyValue, key.id)}
                          className="shrink-0"
                        >
                          {copiedKey === key.id ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : retryCount > 0 && retryCount < 10 ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                  <span className="text-muted-foreground">Aguardando entrega das chaves...</span>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-2">
                    Suas chaves serão exibidas aqui após a confirmação do pagamento.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Você também receberá por email no endereço cadastrado.
                  </p>
                </div>
              )}
            </div>

            {/* Important Info */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6 text-left">
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                <strong>Importante:</strong> Guarde suas chaves em um local seguro. 
                Elas não poderão ser recuperadas após sair desta página.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="hero"
                asChild
                className="gap-2"
              >
                <a href="https://prismcheats.shop/" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Tutorial
                </a>
              </Button>

              {(receiptUrl || orderData?.receiptUrl) && (
                <Button
                  variant="outline"
                  asChild
                  className="gap-2"
                >
                  <a href={receiptUrl || orderData?.receiptUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4" />
                    Ver Comprovante
                  </a>
                </Button>
              )}
              
              <Button variant="outline" asChild className="gap-2">
                <Link to="/">
                  <Home className="h-4 w-4" />
                  Voltar ao Início
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PaymentSuccessPage;