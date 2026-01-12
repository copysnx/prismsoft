import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Package, AlertTriangle, Minus, Plus, Loader2, Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useProducts, Product, ProductVariation } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const AdminStock = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { products, loading: productsLoading, updateProduct } = useProducts();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [updatingStock, setUpdatingStock] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!adminLoading && !isAdmin && user) {
      navigate("/");
    }
  }, [isAdmin, adminLoading, user, navigate]);

  const handleStockChange = async (product: Product, variationIndex: number, change: number) => {
    const variation = product.variations[variationIndex];
    const newStock = Math.max(0, variation.stock + change);
    
    if (newStock === variation.stock) return;

    const stockKey = `${product.id}-${variationIndex}`;
    setUpdatingStock(stockKey);

    try {
      const newVariations = [...product.variations];
      newVariations[variationIndex] = { ...variation, stock: newStock };
      
      await updateProduct(product.id, { variations: newVariations });
      toast.success(`Estoque atualizado: ${variation.name} → ${newStock}`);
    } catch (error: any) {
      toast.error("Erro ao atualizar estoque");
    } finally {
      setUpdatingStock(null);
    }
  };

  const handleDirectStockInput = async (product: Product, variationIndex: number, value: string) => {
    const newStock = parseInt(value) || 0;
    if (newStock < 0) return;

    const variation = product.variations[variationIndex];
    if (newStock === variation.stock) return;

    const stockKey = `${product.id}-${variationIndex}`;
    setUpdatingStock(stockKey);

    try {
      const newVariations = [...product.variations];
      newVariations[variationIndex] = { ...variation, stock: newStock };
      
      await updateProduct(product.id, { variations: newVariations });
      toast.success(`Estoque atualizado: ${variation.name} → ${newStock}`);
    } catch (error: any) {
      toast.error("Erro ao atualizar estoque");
    } finally {
      setUpdatingStock(null);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalStock = products.reduce(
    (acc, p) => acc + p.variations.reduce((vAcc, v) => vAcc + v.stock, 0),
    0
  );

  const lowStockItems = products.flatMap(p =>
    p.variations
      .filter(v => v.stock <= 10)
      .map(v => ({ product: p, variation: v }))
  );

  const outOfStockItems = products.flatMap(p =>
    p.variations
      .filter(v => v.stock === 0)
      .map(v => ({ product: p, variation: v }))
  );

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/admin")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Estoque</h1>
              <p className="text-sm text-muted-foreground">Gerenciar níveis de estoque</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Package className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estoque Total</p>
                <p className="text-2xl font-bold">{totalStock}</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estoque Baixo (≤10)</p>
                <p className="text-2xl font-bold">{lowStockItems.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                <Package className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sem Estoque</p>
                <p className="text-2xl font-bold">{outOfStockItems.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        {lowStockItems.length > 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-8">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <h3 className="font-semibold text-yellow-500">Alertas de Estoque Baixo</h3>
            </div>
            <div className="grid gap-2">
              {lowStockItems.slice(0, 5).map(({ product, variation }, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span>
                    {product.name} - <span className="text-muted-foreground">{variation.name}</span>
                  </span>
                  <span className={variation.stock === 0 ? "text-red-500 font-medium" : "text-yellow-500"}>
                    {variation.stock} unidades
                  </span>
                </div>
              ))}
              {lowStockItems.length > 5 && (
                <p className="text-sm text-muted-foreground">
                  +{lowStockItems.length - 5} outros itens
                </p>
              )}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Products Stock List */}
        {productsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Nenhum produto encontrado</h3>
            <p className="text-muted-foreground">Tente buscar com outros termos</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-card rounded-xl border border-border overflow-hidden"
              >
                <div className="p-4 border-b border-border flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">{product.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="font-semibold">
                      {product.variations.reduce((acc, v) => acc + v.stock, 0)} un.
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-border">
                  {product.variations.map((variation, index) => {
                    const stockKey = `${product.id}-${index}`;
                    const isUpdating = updatingStock === stockKey;
                    const isLowStock = variation.stock <= 10;
                    const isOutOfStock = variation.stock === 0;

                    return (
                      <div
                        key={index}
                        className={`p-4 flex items-center justify-between ${
                          isOutOfStock ? "bg-red-500/5" : isLowStock ? "bg-yellow-500/5" : ""
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{variation.name}</span>
                          <span className="text-sm text-muted-foreground">
                            R$ {variation.price.toFixed(2)}
                          </span>
                          {isOutOfStock && (
                            <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-500 text-xs font-medium">
                              Sem estoque
                            </span>
                          )}
                          {isLowStock && !isOutOfStock && (
                            <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-500 text-xs font-medium">
                              Baixo
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleStockChange(product, index, -1)}
                            disabled={isUpdating || variation.stock === 0}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>

                          <Input
                            type="number"
                            value={variation.stock}
                            onChange={(e) => handleDirectStockInput(product, index, e.target.value)}
                            className="w-20 text-center h-8"
                            disabled={isUpdating}
                          />

                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleStockChange(product, index, 1)}
                            disabled={isUpdating}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>

                          {isUpdating && (
                            <Loader2 className="h-4 w-4 animate-spin text-purple-500 ml-2" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminStock;
