import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, Download, Home, Package, Clock, CreditCard, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const [paymentDetails, setPaymentDetails] = useState<{
    receiptUrl?: string;
    orderNsu?: string;
    transactionNsu?: string;
    captureMethod?: string;
    slug?: string;
  }>({});

  useEffect(() => {
    // Get payment details from URL parameters
    const details = {
      receiptUrl: searchParams.get('receipt_url') || undefined,
      orderNsu: searchParams.get('order_nsu') || undefined,
      transactionNsu: searchParams.get('transaction_nsu') || undefined,
      captureMethod: searchParams.get('capture_method') || undefined,
      slug: searchParams.get('slug') || undefined,
    };
    setPaymentDetails(details);

    // Clear any stored cart/payment data
    localStorage.removeItem('current-payment');
    localStorage.removeItem('prism-cart');
  }, [searchParams]);

  const getPaymentMethodIcon = () => {
    if (paymentDetails.captureMethod === 'pix') {
      return <Zap className="h-6 w-6" />;
    }
    return <CreditCard className="h-6 w-6" />;
  };

  const getPaymentMethodName = () => {
    if (paymentDetails.captureMethod === 'pix') {
      return 'PIX';
    }
    if (paymentDetails.captureMethod === 'credit_card') {
      return 'Cartão de Crédito';
    }
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
              Sua compra foi processada com sucesso. Obrigado por comprar conosco!
            </p>

            {/* Payment Details */}
            <div className="bg-muted/30 rounded-xl p-6 mb-8 text-left space-y-4">
              {paymentDetails.captureMethod && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    {getPaymentMethodIcon()}
                    Método de Pagamento
                  </span>
                  <span className="font-medium">{getPaymentMethodName()}</span>
                </div>
              )}
              
              {paymentDetails.orderNsu && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Número do Pedido
                  </span>
                  <span className="font-mono text-sm">{paymentDetails.orderNsu}</span>
                </div>
              )}

              {paymentDetails.transactionNsu && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    ID da Transação
                  </span>
                  <span className="font-mono text-xs truncate max-w-[200px]">
                    {paymentDetails.transactionNsu}
                  </span>
                </div>
              )}
            </div>

            {/* Next Steps */}
            <div className="bg-primary/10 rounded-xl p-6 mb-8 text-left">
              <h3 className="font-semibold text-primary mb-3">Próximos Passos</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Você receberá um email com os detalhes da sua compra
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Suas chaves de produto serão enviadas para o email cadastrado
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Em caso de dúvidas, entre em contato com nosso suporte
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {paymentDetails.receiptUrl && (
                <Button
                  variant="outline"
                  asChild
                  className="gap-2"
                >
                  <a href={paymentDetails.receiptUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4" />
                    Ver Comprovante
                  </a>
                </Button>
              )}
              
              <Button asChild className="gap-2">
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
