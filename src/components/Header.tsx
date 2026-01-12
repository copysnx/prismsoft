import { Search, User, ShoppingCart, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
const Header = () => {
  const navigate = useNavigate();
  const {
    user,
    signOut,
    loading
  } = useAuth();
  const {
    isAdmin
  } = useAdmin();
  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };
  return <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="Logo" className="h-8 w-8" />
          <span className="text-lg font-bold text-foreground">Prism SysteM<span className="text-gradient">SysteM</span>
          </span>
        </Link>

        {/* Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="text" placeholder="Buscar produto" className="w-full pl-10 bg-muted border-border focus:border-primary focus:ring-primary" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {loading ? <div className="h-10 w-10 animate-pulse rounded-full bg-muted" /> : user ? <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500">
                    <span className="text-sm font-bold text-white">
                      {user.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-sm border-b border-border mb-1">
                  <p className="font-medium">{user.user_metadata?.full_name || "Usuário"}</p>
                  <p className="text-muted-foreground text-xs">{user.email}</p>
                </div>
                <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Meu Perfil
                </DropdownMenuItem>
                {isAdmin && <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/admin")} className="cursor-pointer text-purple-400">
                      <Shield className="mr-2 h-4 w-4" />
                      Painel Admin
                    </DropdownMenuItem>
                  </>}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-500 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu> : <Button variant="ghost" size="default" className="gap-2" onClick={() => navigate("/auth")}>
              <User className="h-5 w-5" />
              <span className="hidden sm:inline">Entrar</span>
            </Button>}
          <Button variant="hero" size="default" className="gap-2">
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Carrinho</span>
          </Button>
        </div>
      </div>
    </header>;
};
export default Header;