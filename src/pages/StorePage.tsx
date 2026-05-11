import { Link } from "react-router-dom";
import * as Icons from "lucide-react";
import { Loader2, Store as StoreIcon } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BackButton from "@/components/BackButton";
import { useCategories } from "@/hooks/useCategories";

const StorePage = () => {
  const { categories, loading } = useCategories();
  const visible = categories.filter((c) => c.is_active);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-10">
        <BackButton />
        <div className="text-center mb-10 mt-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 text-purple-400 text-sm mb-4">
            <StoreIcon className="h-4 w-4" /> Store
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gradient mb-3">
            Explore as categorias
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Escolha uma categoria para ver todos os produtos disponíveis.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          </div>
        ) : visible.length === 0 ? (
          <p className="text-center text-muted-foreground py-20">
            Nenhuma categoria disponível ainda.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {visible.map((cat) => {
              const Icon =
                (cat.icon && (Icons as any)[cat.icon]) || StoreIcon;
              return (
                <Link
                  key={cat.id}
                  to={`/store/${cat.slug}`}
                  className="group relative overflow-hidden bg-card border border-border rounded-2xl p-6 hover:border-purple-500/60 transition-all"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-fuchsia-500/0 group-hover:from-purple-500/10 group-hover:to-fuchsia-500/10 transition" />
                  <div className="relative">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-1">{cat.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {cat.description || "Confira os produtos desta categoria."}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default StorePage;
