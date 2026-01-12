import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Copy, Check, Clock, RefreshCw, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface PaymentData {
  id: string;
  value: number;
  status: string;
  pixCode: string;
  qrCodeImage: string;
  expiresDate: string;
}

const PaymentPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'expired'>('pending');
  const [timeLeft, setTimeLeft] = useState<string>('');

  // Get payment data from URL params (stored in localStorage)
  useEffect(() => {
    const storedPayment = localStorage.getItem('current-payment');
    if (storedPayment) {
      try {
        const data = JSON.parse(storedPayment);
        setPaymentData(data);
        setLoading(false);
      } catch {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!paymentData?.expiresDate) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const expires = new Date(paymentData.expiresDate).getTime();
      const diff = expires - now;

      if (diff <= 0) {
        setTimeLeft('Expirado');
        setPaymentStatus('expired');
        return;
      }

      const minutes = Math.floor(diff / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [paymentData?.expiresDate]);

  // Auto-check payment status every 5 seconds
  useEffect(() => {
    if (!paymentData || paymentStatus !== 'pending') return;

    const checkPayment = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('verify-payment', {
          body: { chargeId: paymentData.id }
        });

        if (error) {
          console.error('Error checking payment:', error);
          return;
        }

        if (data.success && data.payment) {
          if (data.payment.isPaid) {
            setPaymentStatus('paid');
            const storedPayment = localStorage.getItem('current-payment');
            let orderNsu = '';
            if (storedPayment) {
              try {
                const parsed = JSON.parse(storedPayment);
                orderNsu = parsed.orderNsu || '';
              } catch {}
            }
            localStorage.removeItem('current-payment');
            
            // Redirect to success page with order info
            if (orderNsu) {
              navigate(`/pagamento/sucesso?order_nsu=${encodeURIComponent(orderNsu)}&capture_method=pix`);
            } else {
              toast({
                title: "Pagamento confirmado!",
                description: "Seu pagamento foi aprovado com sucesso.",
              });
            }
          } else if (data.payment.isExpired) {
            setPaymentStatus('expired');
          }
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    const interval = setInterval(checkPayment, 5000);
    return () => clearInterval(interval);
  }, [paymentData, paymentStatus, toast]);

  const handleCopyPixCode = async () => {
    if (!paymentData?.pixCode) return;
    
    try {
      await navigator.clipboard.writeText(paymentData.pixCode);
      setCopied(true);
      toast({
        title: "Código copiado!",
        description: "Cole no seu aplicativo de pagamento.",
      });
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast({
        title: "Erro ao copiar",
        description: "Tente copiar manualmente.",
        variant: "destructive"
      });
    }
  };

  const handleCheckPayment = async () => {
    if (!paymentData) return;
    
    setChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: { chargeId: paymentData.id }
      });

      if (error) throw error;

      if (data.success && data.payment) {
        if (data.payment.isPaid) {
          setPaymentStatus('paid');
          const storedPayment = localStorage.getItem('current-payment');
          let orderNsu = '';
          if (storedPayment) {
            try {
              const parsed = JSON.parse(storedPayment);
              orderNsu = parsed.orderNsu || '';
            } catch {}
          }
          localStorage.removeItem('current-payment');
          
          // Redirect to success page with order info
          if (orderNsu) {
            navigate(`/pagamento/sucesso?order_nsu=${encodeURIComponent(orderNsu)}&capture_method=pix`);
          } else {
            toast({
              title: "Pagamento confirmado!",
              description: "Seu pagamento foi aprovado com sucesso.",
            });
          }
        } else if (data.payment.isExpired) {
          setPaymentStatus('expired');
          toast({
            title: "Pagamento expirado",
            description: "O tempo para pagamento expirou.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Aguardando pagamento",
            description: "Ainda não identificamos seu pagamento.",
          });
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Erro ao verificar",
        description: "Tente novamente em alguns segundos.",
        variant: "destructive"
      });
    } finally {
      setChecking(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!paymentData) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 pt-24">
          <div className="max-w-md mx-auto text-center">
            <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4">Pagamento não encontrado</h1>
            <p className="text-muted-foreground mb-6">
              Não encontramos informações de pagamento. Tente novamente.
            </p>
            <Button onClick={() => navigate('/checkout')} variant="hero">
              Voltar ao checkout
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-lg mx-auto">
          {/* Back Button */}
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground hover:border-purple-500/50 transition-all mb-6"
          >
            <ArrowLeft className="h-5 w-5" />
            Voltar
          </button>

          {/* Payment Status - Paid */}
          {paymentStatus === 'paid' && (
            <div className="bg-card border border-green-500/30 rounded-2xl p-8 text-center">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
              <h1 className="text-2xl font-bold mb-2 text-green-500">Pagamento Confirmado!</h1>
              <p className="text-muted-foreground mb-6">
                Seu pagamento foi processado com sucesso. Você receberá seu produto por email.
              </p>
              <Button onClick={() => navigate('/')} variant="hero" size="lg">
                Voltar à loja
              </Button>
            </div>
          )}

          {/* Payment Status - Expired */}
          {paymentStatus === 'expired' && (
            <div className="bg-card border border-destructive/30 rounded-2xl p-8 text-center">
              <div className="w-20 h-20 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="h-10 w-10 text-destructive" />
              </div>
              <h1 className="text-2xl font-bold mb-2 text-destructive">Pagamento Expirado</h1>
              <p className="text-muted-foreground mb-6">
                O tempo para pagamento expirou. Por favor, tente novamente.
              </p>
              <Button onClick={() => navigate('/checkout')} variant="hero" size="lg">
                Tentar novamente
              </Button>
            </div>
          )}

          {/* Payment Status - Pending */}
          {paymentStatus === 'pending' && (
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-fuchsia-600 p-6 text-center">
                <h1 className="text-2xl font-bold text-white mb-2">Pagamento via PIX</h1>
                <p className="text-white/80">Escaneie o QR Code ou copie o código</p>
              </div>

              {/* Timer */}
              <div className="flex items-center justify-center gap-2 py-4 border-b border-border bg-muted/30">
                <Clock className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">Expira em:</span>
                <span className="font-mono font-bold text-lg">{timeLeft}</span>
              </div>

              {/* QR Code */}
              <div className="p-8 flex flex-col items-center">
                <div className="bg-white p-4 rounded-xl mb-6">
                  <img 
                    src={paymentData.qrCodeImage} 
                    alt="QR Code PIX" 
                    className="w-48 h-48"
                  />
                </div>

                {/* Value */}
                <div className="text-center mb-6">
                  <p className="text-sm text-muted-foreground mb-1">Valor a pagar</p>
                  <p className="text-3xl font-bold text-gradient">{formatPrice(paymentData.value)}</p>
                </div>

                {/* PIX Code */}
                <div className="w-full space-y-3">
                  <Button
                    onClick={handleCopyPixCode}
                    className="w-full h-12 gap-2"
                    variant={copied ? "secondary" : "hero"}
                  >
                    {copied ? (
                      <>
                        <Check className="h-5 w-5" />
                        Código copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="h-5 w-5" />
                        Copiar código PIX
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleCheckPayment}
                    disabled={checking}
                    variant="outline"
                    className="w-full h-12 gap-2"
                  >
                    {checking ? (
                      <>
                        <RefreshCw className="h-5 w-5 animate-spin" />
                        Verificando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-5 w-5" />
                        Já paguei, verificar
                      </>
                    )}
                  </Button>
                </div>

                {/* Instructions */}
                <div className="mt-6 text-center text-sm text-muted-foreground">
                  <p>1. Abra o app do seu banco</p>
                  <p>2. Escolha pagar com PIX</p>
                  <p>3. Escaneie o QR Code ou cole o código</p>
                  <p>4. Confirme o pagamento</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PaymentPage;
