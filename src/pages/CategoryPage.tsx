import { useParams, useNavigate, Link } from "react-router-dom";
import { ShoppingCart, Star, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BackButton from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";

const CategoryPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { products, loading: pLoading } = useProducts();
  const { categories, loading: cLoading } = useCategories();

  const category = categories.find((c) => c.slug === slug);
  const items = products.filter(
    (p) => p.is_active && category && p.category_id === category.id,
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-10">
        <BackButton />
        <div className="mt-4 mb-8">
          <Link
            to="/store"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Todas as categorias
          </Link>
          <h1 className="mt-2 text-4xl font-bold text-gradient">
            {cLoading ? "Carregando..." : category?.name || "Categoria"}
          </h1>
          {category?.description && (
            <p className="text-muted-foreground mt-2">{category.description}</p>
          )}
        </div>

        {pLoading || cLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          </div>
        ) : !category ? (
          <p className="text-center text-muted-foreground py-20">
            Categoria não encontrada.
          </p>
        ) : items.length === 0 ? (
          <p className="text-center text-muted-foreground py-20">
            Nenhum produto cadastrado nesta categoria ainda.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {items.map((product) => {
              const v = product.variations?.[0];
              const price = v?.price || 0;
              const originalPrice = v?.originalPrice;
              return (
                <div
                  key={product.id}
                  onClick={() => navigate(`/produto/${product.slug}`)}
                  className="group relative overflow-hidden rounded-xl bg-card border border-border card-hover cursor-pointer"
                >
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={product.image_url || "/placeholder.svg"}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-60" />
                    {originalPrice && originalPrice > price && (
                      <div className="absolute top-2 left-2 rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-600 px-2 py-1 text-xs font-bold">
                        -{Math.round((1 - price / originalPrice) * 100)}%
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="mb-2 flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < (product.rating || 5)
                              ? "fill-purple-500 text-purple-500"
                              : "text-muted"
                          }`}
                        />
                      ))}
                    </div>
                    <h3 className="mb-2 text-sm font-semibold line-clamp-2 min-h-[2.5rem]">
                      {product.name}
                    </h3>
                    <div className="mb-3 flex items-baseline gap-2">
                      <span className="text-lg font-bold text-gradient">
                        R$ {price.toFixed(2).replace(".", ",")}
                      </span>
                      {originalPrice && originalPrice > price && (
                        <span className="text-xs text-muted-foreground line-through">
                          R$ {originalPrice.toFixed(2).replace(".", ",")}
                        </span>
                      )}
                    </div>
                    <Button
                      variant="hero"
                      size="sm"
                      className="w-full gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/produto/${product.slug}`);
                      }}
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Comprar
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default CategoryPage;
