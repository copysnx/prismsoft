import productPrismAim from "@/assets/product-prism-aim.png";
import productAimcolor from "@/assets/product-aimcolor.png";
import productTpmBypass from "@/assets/product-tpm-bypass.png";
import productSpoofer1Click from "@/assets/product-spoofer-1click.png";
import productPrismSpoofer from "@/assets/product-prism-spoofer.png";

export interface ProductVariation {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  stock: number;
}

export interface Product {
  id: number;
  slug: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  rating: number;
  description: string;
  features: string[];
  variations?: ProductVariation[];
}

export const products: Product[] = [
  {
    id: 1,
    slug: "valorant-prism-aim",
    name: "Valorant Prism Aim",
    price: 49.90,
    originalPrice: 89.90,
    image: productPrismAim,
    category: "Valorant",
    rating: 5,
    description: "O melhor aim assist para Valorant. Melhore sua precisão com nosso sistema avançado de mira.",
    features: [
      "Aimbot suave e indetectável",
      "Configurações personalizáveis",
      "Atualizações constantes",
      "Suporte 24/7"
    ],
    variations: [
      { id: "diario", name: "Diário", price: 9.90, originalPrice: 14.90, stock: 100 },
      { id: "7-dias", name: "7 Dias", price: 29.90, originalPrice: 49.90, stock: 50 },
      { id: "30-dias", name: "30 Dias", price: 69.90, originalPrice: 89.90, stock: 50 },
      { id: "lifetime", name: "Lifetime", price: 149.90, originalPrice: 299.90, stock: 20 },
    ]
  },
  {
    id: 2,
    slug: "valorant-aimcolor",
    name: "Valorant AimColor",
    price: 39.90,
    originalPrice: 79.90,
    image: productAimcolor,
    category: "Valorant",
    rating: 5,
    description: "Sistema de detecção por cor para Valorant. Funciona em qualquer PC.",
    features: [
      "Detecção por cor RGB",
      "Baixo consumo de recursos",
      "Fácil configuração",
      "Anti-ban integrado"
    ],
    variations: [
      { id: "diario", name: "Diário", price: 7.90, originalPrice: 12.90, stock: 100 },
      { id: "7-dias", name: "7 Dias", price: 24.90, originalPrice: 39.90, stock: 50 },
      { id: "30-dias", name: "30 Dias", price: 39.90, originalPrice: 79.90, stock: 50 },
      { id: "lifetime", name: "Lifetime", price: 119.90, originalPrice: 199.90, stock: 20 },
    ]
  },
  {
    id: 3,
    slug: "valorant-tpm-bypass",
    name: "Valorant TPM Bypass",
    price: 29.90,
    originalPrice: 59.90,
    image: productTpmBypass,
    category: "Valorant",
    rating: 5,
    description: "Bypass de TPM para jogar Valorant em qualquer PC. Solução simples e eficaz.",
    features: [
      "Bypass completo de TPM",
      "Compatível com Windows 10/11",
      "Instalação automática",
      "Garantia de funcionamento"
    ],
    variations: [
      { id: "diario", name: "Diário", price: 5.90, originalPrice: 9.90, stock: 100 },
      { id: "single", name: "Licença Única", price: 29.90, originalPrice: 59.90, stock: 100 },
      { id: "lifetime", name: "Lifetime + Updates", price: 59.90, originalPrice: 99.90, stock: 50 },
    ]
  },
  {
    id: 4,
    slug: "valorant-spoofer-1click",
    name: "Valorant Spoofer 1 Click",
    price: 34.90,
    originalPrice: 69.90,
    image: productSpoofer1Click,
    category: "Valorant",
    rating: 5,
    description: "Spoofer com apenas 1 clique. Limpe seu HWID e volte a jogar.",
    features: [
      "Spoof com 1 clique",
      "Limpa todos os identificadores",
      "Interface simples",
      "Suporte técnico incluso"
    ],
    variations: [
      { id: "diario", name: "Diário", price: 6.90, originalPrice: 11.90, stock: 100 },
      { id: "7-dias", name: "7 Dias", price: 19.90, originalPrice: 34.90, stock: 50 },
      { id: "30-dias", name: "30 Dias", price: 34.90, originalPrice: 69.90, stock: 50 },
      { id: "lifetime", name: "Lifetime", price: 99.90, originalPrice: 149.90, stock: 20 },
    ]
  },
  {
    id: 5,
    slug: "prism-spoofer",
    name: "Prism Spoofer",
    price: 44.90,
    originalPrice: 99.90,
    image: productPrismSpoofer,
    category: "Spoofer",
    rating: 5,
    description: "O spoofer mais completo do mercado. Funciona com todos os jogos.",
    features: [
      "Compatível com todos os jogos",
      "Spoof de HWID completo",
      "Modo stealth avançado",
      "Atualizações gratuitas"
    ],
    variations: [
      { id: "diario", name: "Diário", price: 8.90, originalPrice: 14.90, stock: 100 },
      { id: "7-dias", name: "7 Dias", price: 29.90, originalPrice: 49.90, stock: 50 },
      { id: "30-dias", name: "30 Dias", price: 44.90, originalPrice: 99.90, stock: 50 },
      { id: "lifetime", name: "Lifetime", price: 129.90, originalPrice: 249.90, stock: 20 },
    ]
  },
];

export const getProductBySlug = (slug: string): Product | undefined => {
  return products.find(p => p.slug === slug);
};
