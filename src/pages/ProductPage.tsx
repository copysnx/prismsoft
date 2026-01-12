import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { ShoppingCart, Zap, Shield, CreditCard, MessageCircle, ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getProductBySlug, Product, ProductVariation } from "@/data/products";

const ProductPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const product = getProductBySlug(slug || "");
  
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null);

  useEffect(() => {
    if (product?.variations && product.variations.length > 0) {
      const variationParam = searchParams.get("variation");
      const found = product.variations.find(v => v.id === variationParam);
      setSelectedVariation(found || product.variations[0]);
    }
  }, [product, searchParams]);

  const handleVariationChange = (variation: ProductVariation) => {
    setSelectedVariation(variation);
    setSearchParams({ variation: variation.id });
  };

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Produto não encontrado</h1>
            <Button onClick={() => navigate("/")} variant="hero">
              Voltar à loja
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const currentPrice = selectedVariation?.price || product.price;
  const currentOriginalPrice = selectedVariation?.originalPrice || product.originalPrice;
  const discount = currentOriginalPrice 
    ? Math.round((1 - currentPrice / currentOriginalPrice) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          {/* Back Button */}
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground hover:border-purple-500/50 transition-all mb-6"
          >
            <ArrowLeft className="h-5 w-5" />
            Voltar
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Product Image */}
            <div className="lg:col-span-4">
              <div className="relative rounded-2xl overflow-hidden border border-border bg-card">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full aspect-square object-cover"
                />
                {discount > 0 && (
                  <div className="absolute top-4 left-4 rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-600 px-3 py-1.5 text-sm font-bold">
                    -{discount}% OFF
                  </div>
                )}
              </div>
            </div>

            {/* Product Info */}
            <div className="lg:col-span-5">
              <div className="bg-card rounded-2xl border border-border p-6">
                <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
                
                {selectedVariation && (
                  <span className="inline-block bg-muted px-3 py-1 rounded-lg text-sm text-muted-foreground mb-4">
                    {selectedVariation.stock} em estoque
                  </span>
                )}

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-3 mb-1">
                    {currentOriginalPrice && (
                      <span className="text-lg text-muted-foreground line-through">
                        R$ {currentOriginalPrice.toFixed(2).replace(".", ",")}
                      </span>
                    )}
                    {discount > 0 && (
                      <span className="text-sm text-purple-400">-{discount}% OFF</span>
                    )}
                  </div>
                  <div className="text-3xl font-bold text-gradient">
                    R$ {currentPrice.toFixed(2).replace(".", ",")}
                  </div>
                  <span className="text-sm text-muted-foreground">À vista no Pix</span>
                </div>

                {/* Variations */}
                {product.variations && product.variations.length > 0 && (
                  <div className="space-y-3 mb-6">
                    {product.variations.map((variation) => (
                      <button
                        key={variation.id}
                        onClick={() => handleVariationChange(variation)}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                          selectedVariation?.id === variation.id
                            ? "border-purple-500 bg-purple-500/10"
                            : "border-border hover:border-purple-500/50 bg-muted/30"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedVariation?.id === variation.id
                              ? "border-purple-500 bg-purple-500"
                              : "border-muted-foreground"
                          }`}>
                            {selectedVariation?.id === variation.id && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </div>
                          <div className="text-left">
                            <div className="font-medium">{variation.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {variation.stock} em estoque
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">
                            R$ {variation.price.toFixed(2).replace(".", ",")}
                          </div>
                          {variation.originalPrice && (
                            <div className="text-sm text-muted-foreground line-through">
                              R$ {variation.originalPrice.toFixed(2).replace(".", ",")}
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button variant="hero" size="lg" className="w-full gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Comprar agora
                  </Button>
                  <Button variant="heroOutline" size="lg" className="w-full gap-2">
                    Adicionar ao carrinho
                  </Button>
                </div>
              </div>

              {/* Description Section */}
              <div className="mt-6 bg-card rounded-2xl border border-border p-6">
                <h2 className="text-xl font-bold mb-4 text-gradient">{product.name}</h2>
                <p className="text-muted-foreground mb-6">{product.description}</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {product.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-600 flex items-center justify-center">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm font-medium">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-3 space-y-4">
              {/* Entrega */}
              <div className="bg-card rounded-2xl border border-border p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
                    <Zap className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Entrega imediata</h3>
                    <p className="text-sm text-muted-foreground">
                      Receba o seu pacote imediatamente após o pagamento.
                    </p>
                  </div>
                </div>
              </div>

              {/* Segurança */}
              <div className="bg-card rounded-2xl border border-border p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
                    <Shield className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Segurança total</h3>
                    <p className="text-sm text-muted-foreground">
                      Seus dados são criptografados de ponta-a-ponta durante todo o processo.
                    </p>
                  </div>
                </div>
              </div>

              {/* Pagamento */}
              <div className="bg-card rounded-2xl border border-border p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
                    <CreditCard className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Formas de pagamento</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Aceitamos os meios de pagamentos mais populares!
                    </p>
                    <div className="flex gap-2">
                      <div className="px-3 py-1.5 rounded-lg bg-muted text-xs font-medium">PIX</div>
                      <div className="px-3 py-1.5 rounded-lg bg-muted text-xs font-medium">Cartão</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ajuda */}
              <div className="bg-card rounded-2xl border border-border p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
                    <MessageCircle className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Precisa de ajuda?</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Entre em contato conosco pelos nossos canais oficiais.
                    </p>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full justify-start gap-2 bg-[#5865F2]/10 border-[#5865F2]/30 hover:bg-[#5865F2]/20">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                        </svg>
                        Discord
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start gap-2 bg-[#25D366]/10 border-[#25D366]/30 hover:bg-[#25D366]/20">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        WhatsApp
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductPage;
