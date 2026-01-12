import { ShoppingCart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { products } from "@/data/products";

const ProductsSection = () => {
  const navigate = useNavigate();
  
  return (
    <section className="py-16 bg-gradient-to-b from-transparent via-muted/20 to-transparent">
      <div className="container mx-auto px-4">
        {/* Section Title */}
        <div className="mb-10 flex items-center justify-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
          <h2 className="text-2xl font-bold text-center sm:text-3xl">
            Produtos em <span className="text-gradient">Destaque</span>
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {products.map((product) => (
            <div
              key={product.id}
              onClick={() => navigate(`/produto/${product.slug}`)}
              className="group relative overflow-hidden rounded-xl bg-card border border-border card-hover cursor-pointer"
            >
              {/* Product Image */}
              <div className="relative aspect-square overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-60" />
                
                {/* Discount Badge */}
                {product.originalPrice && (
                  <div className="absolute top-2 left-2 rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-600 px-2 py-1 text-xs font-bold">
                    -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                  </div>
                )}
                
                {/* Category Badge */}
                <div className="absolute top-2 right-2 rounded-lg bg-background/80 backdrop-blur-sm px-2 py-1 text-xs font-medium text-muted-foreground">
                  {product.category}
                </div>
              </div>

              {/* Product Info */}
              <div className="p-4">
                {/* Rating */}
                <div className="mb-2 flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${
                        i < product.rating ? "fill-purple-500 text-purple-500" : "text-muted"
                      }`}
                    />
                  ))}
                </div>

                {/* Name */}
                <h3 className="mb-2 text-sm font-semibold line-clamp-2 min-h-[2.5rem]">
                  {product.name}
                </h3>

                {/* Price */}
                <div className="mb-3 flex items-baseline gap-2">
                  <span className="text-lg font-bold text-gradient">
                    R$ {product.price.toFixed(2).replace(".", ",")}
                  </span>
                  {product.originalPrice && (
                    <span className="text-xs text-muted-foreground line-through">
                      R$ {product.originalPrice.toFixed(2).replace(".", ",")}
                    </span>
                  )}
                </div>

                {/* Add to Cart Button */}
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
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductsSection;
