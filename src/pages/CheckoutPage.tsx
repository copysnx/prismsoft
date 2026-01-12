import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronRight, Shield, Zap, CreditCard, User, Mail, Phone, Trash2, Plus, Minus, Tag, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, subtotal, discount, total, couponCode, applyCoupon, removeCoupon, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');
  const [couponInput, setCouponInput] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [contactInfo, setContactInfo] = useState({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    phone: ''
  });

  const handleApplyCoupon = () => {
    if (!couponInput.trim()) return;
    
    const success = applyCoupon(couponInput);
    if (success) {
      toast({
        title: "Cupom aplicado!",
        description: "Desconto de 10% aplicado ao seu pedido.",
      });
      setCouponInput('');
    } else {
      toast({
        title: "Cupom inválido",
        description: "O código inserido não é válido.",
        variant: "destructive"
      });
    }
  };

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione produtos ao carrinho antes de finalizar.",
        variant: "destructive"
      });
      return;
    }

    if (!acceptTerms) {
      toast({
        title: "Aceite os termos",
        description: "Você precisa aceitar os termos e condições.",
        variant: "destructive"
      });
      return;
    }

    if (!contactInfo.email) {
      toast({
        title: "Email obrigatório",
        description: "Por favor, insira seu email.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast({
      title: "Pedido realizado!",
      description: paymentMethod === 'pix' 
        ? "Você receberá o QR Code do PIX por email." 
        : "Você será redirecionado para o Mercado Pago.",
    });
    
    clearCart();
    setIsProcessing(false);
    navigate('/');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-foreground transition-colors">Início</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">Checkout</span>
        </div>

        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-[1fr,400px] gap-8">
          {/* Left Column - Payment & Contact */}
          <div className="space-y-6">
            {/* Payment Methods */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">Formas de pagamento</h2>
              
              <div className="space-y-3">
                {/* PIX Option */}
                <button
                  onClick={() => setPaymentMethod('pix')}
                  className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-all ${
                    paymentMethod === 'pix'
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-muted-foreground'
                  }`}
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                    <Zap className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Pix</span>
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        Mais rápido
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">Aprovação imediata</p>
                  </div>
                </button>

                {/* Card Option */}
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-all ${
                    paymentMethod === 'card'
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-muted-foreground'
                  }`}
                >
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 text-left">
                    <span className="font-semibold">Cartão Crédito/Débito</span>
                    <p className="text-sm text-muted-foreground">Pagamento seguro com Mercado Pago</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">Informações de contato</h2>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Nome"
                    value={contactInfo.firstName}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, firstName: e.target.value }))}
                    className="pl-10 bg-muted/50 border-border"
                  />
                </div>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Sobrenome"
                    value={contactInfo.lastName}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, lastName: e.target.value }))}
                    className="pl-10 bg-muted/50 border-border"
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={contactInfo.email}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, email: e.target.value }))}
                    className="pl-10 bg-muted/50 border-border"
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="tel"
                    placeholder="Telefone"
                    value={contactInfo.phone}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, phone: e.target.value }))}
                    className="pl-10 bg-muted/50 border-border"
                  />
                </div>
              </div>
            </div>

            {/* Terms & Pay Button */}
            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={acceptTerms}
                  onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                  className="mt-0.5"
                />
                <span className="text-sm text-muted-foreground">
                  Eu aceito os{' '}
                  <a href="https://prismcheats.shop/termos" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    termos e condições
                  </a>
                  {' '}desta compra.
                </span>
              </label>

              <Button
                onClick={handleCheckout}
                disabled={isProcessing || items.length === 0}
                className="w-full h-14 text-lg bg-primary hover:bg-primary/90"
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <div className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Processando...
                  </span>
                ) : (
                  <>Pagar {formatPrice(total)}</>
                )}
              </Button>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Resumo do pedido</h2>
                <span className="flex items-center gap-1.5 text-xs text-primary bg-primary/10 px-3 py-1.5 rounded-full">
                  <Shield className="h-3.5 w-3.5" />
                  Pagamento seguro
                </span>
              </div>

              {items.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Seu carrinho está vazio.</p>
              ) : (
                <div className="space-y-4">
                  {/* Cart Items */}
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                    {items.map((item) => (
                      <div
                        key={`${item.productId}-${item.variationId}`}
                        className="flex gap-3 p-3 bg-muted/30 rounded-lg"
                      >
                        <img
                          src={item.productImage}
                          alt={item.productName}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{item.productName}</h4>
                          <p className="text-xs text-muted-foreground">{item.variationName}</p>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2">
                              {item.originalPrice && (
                                <span className="text-xs text-muted-foreground line-through">
                                  {formatPrice(item.originalPrice)}
                                </span>
                              )}
                              <span className="text-sm font-semibold text-primary">
                                {formatPrice(item.price)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => updateQuantity(item.productId, item.variationId, item.quantity - 1)}
                                className="p-1 hover:bg-muted rounded"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="text-sm w-6 text-center">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.productId, item.variationId, item.quantity + 1)}
                                className="p-1 hover:bg-muted rounded"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => removeItem(item.productId, item.variationId)}
                                className="p-1 hover:bg-destructive/20 hover:text-destructive rounded ml-1"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Coupon */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Digite seu cupom de desconto"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        className="pl-10 bg-muted/50 border-border"
                        disabled={!!couponCode}
                      />
                    </div>
                    {couponCode ? (
                      <Button
                        variant="outline"
                        onClick={removeCoupon}
                        className="gap-2"
                      >
                        <X className="h-4 w-4" />
                        Remover
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={handleApplyCoupon}
                        className="gap-2"
                      >
                        <Tag className="h-4 w-4" />
                        Aplicar
                      </Button>
                    )}
                  </div>

                  {couponCode && (
                    <div className="flex items-center gap-2 text-sm text-primary bg-primary/10 px-3 py-2 rounded-lg">
                      <Tag className="h-4 w-4" />
                      Cupom <strong>{couponCode}</strong> aplicado!
                    </div>
                  )}

                  {/* Totals */}
                  <div className="border-t border-border pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Descontos</span>
                      <span className={discount > 0 ? 'text-primary' : ''}>
                        {discount > 0 ? `-${formatPrice(discount)}` : formatPrice(0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2">
                      <span>Total</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CheckoutPage;
