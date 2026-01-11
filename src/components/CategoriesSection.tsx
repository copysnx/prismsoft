import categoryStreaming from "@/assets/category-streaming.jpg";
import categoryGames from "@/assets/category-games.jpg";
import categoryPoints from "@/assets/category-points.jpg";
import categoryKeys from "@/assets/category-keys.jpg";
import categoryDiscord from "@/assets/category-discord.jpg";
import categoryAccounts from "@/assets/category-accounts.jpg";

const categories = [
  { name: "Streamings", image: categoryStreaming },
  { name: "Steam Offline", image: categoryGames },
  { name: "Pontos Steam", image: categoryPoints },
  { name: "Steam Keys", image: categoryKeys },
  { name: "Contas Jogo", image: categoryAccounts },
  { name: "Discord", image: categoryDiscord },
];

const CategoriesSection = () => {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        {/* Section Title */}
        <div className="mb-10 flex items-center justify-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
          <h2 className="text-2xl font-bold text-center sm:text-3xl">
            Nossas <span className="text-gradient">Categorias</span>
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((category) => (
            <a
              key={category.name}
              href="#"
              className="group relative aspect-square overflow-hidden rounded-xl border-gradient card-hover"
            >
              <img
                src={category.image}
                alt={category.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-center text-sm font-bold sm:text-base">
                  {category.name}
                </h3>
              </div>
              {/* Hover Glow Effect */}
              <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-purple-500/10" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;
