import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { PageName, Theme, User } from "@/types";
import {
  BarChart3,
  ChevronRight,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Package,
  Receipt,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Sun,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  id: PageName;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "dashboard",
    label: "Tableau de bord",
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
  { id: "ventes", label: "Ventes", icon: <ShoppingCart className="w-4 h-4" /> },
  {
    id: "inventaire",
    label: "Inventaire",
    icon: <Package className="w-4 h-4" />,
  },
  { id: "clients", label: "Clients", icon: <Users className="w-4 h-4" /> },
  { id: "depenses", label: "Dépenses", icon: <Receipt className="w-4 h-4" /> },
  {
    id: "commandes",
    label: "Commandes",
    icon: <ShoppingBag className="w-4 h-4" />,
  },
  { id: "employes", label: "Employés", icon: <Users className="w-4 h-4" /> },
  {
    id: "production",
    label: "Production",
    icon: <ClipboardList className="w-4 h-4" />,
  },
  {
    id: "rapports",
    label: "Rapports",
    icon: <BarChart3 className="w-4 h-4" />,
  },
  {
    id: "administration",
    label: "Administration",
    icon: <Settings className="w-4 h-4" />,
    adminOnly: true,
  },
];

interface AppLayoutProps {
  currentPage: PageName;
  onNavigate: (page: PageName) => void;
  currentUser: User;
  onLogout: () => void;
  theme: Theme;
  onToggleTheme: () => void;
  children: React.ReactNode;
}

export function AppLayout({
  currentPage,
  onNavigate,
  currentUser,
  onLogout,
  theme,
  onToggleTheme,
  children,
}: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setSidebarOpen(false)}
          role="button"
          tabIndex={-1}
          aria-label="Fermer le menu"
        />
      )}

      <aside
        className={[
          "fixed lg:static inset-y-0 left-0 z-30",
          "w-64 bg-card border-r border-border flex flex-col",
          "transition-transform duration-300",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >
        <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
          <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-lg">&#127838;</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-display font-semibold text-foreground truncate">
              Minou Patisserie
            </p>
            <p className="text-xs text-muted-foreground truncate">Gestion</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="ml-auto lg:hidden h-7 w-7"
            onClick={() => setSidebarOpen(false)}
            aria-label="Fermer le menu"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="px-4 py-3 bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-primary uppercase">
                {currentUser.username.charAt(0)}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground truncate">
                {currentUser.username}
              </p>
              <Badge
                variant="secondary"
                className="text-[10px] py-0 h-4 mt-0.5"
              >
                {currentUser.role === "admin" ? "Administrateur" : "Employé"}
              </Badge>
            </div>
          </div>
        </div>

        <Separator />

        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = currentPage === item.id;
            if (item.adminOnly && currentUser.role !== "admin") return null;
            return (
              <button
                type="button"
                key={item.id}
                data-ocid={`nav.${item.id}_link`}
                onClick={() => {
                  onNavigate(item.id);
                  setSidebarOpen(false);
                }}
                className={[
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-smooth",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                ].join(" ")}
              >
                {item.icon}
                <span className="flex-1 text-left">{item.label}</span>
                {isActive && <ChevronRight className="w-3 h-3 opacity-60" />}
              </button>
            );
          })}
        </nav>

        <Separator />

        <div className="p-3 space-y-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            data-ocid="nav.theme_toggle"
            onClick={onToggleTheme}
            className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
            {theme === "dark" ? "Mode clair" : "Mode sombre"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            data-ocid="nav.logout_button"
            onClick={onLogout}
            className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 shadow-sm sticky top-0 z-10">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="lg:hidden h-8 w-8"
            onClick={() => setSidebarOpen(true)}
            aria-label="Ouvrir le menu"
            data-ocid="nav.menu_button"
          >
            <Menu className="w-4 h-4" />
          </Button>
          <h2 className="text-base font-display font-semibold text-foreground truncate">
            {NAV_ITEMS.find((n) => n.id === currentPage)?.label ??
              "Minou Patisserie"}
          </h2>
          <div className="ml-auto flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              data-ocid="header.theme_toggle"
              onClick={onToggleTheme}
              className="h-8 w-8 hidden sm:flex"
              aria-label="Changer le theme"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>
            <div className="hidden sm:flex items-center gap-1.5 min-w-0">
              <span className="text-sm text-muted-foreground truncate max-w-[100px]">
                {currentUser.username}
              </span>
              <Badge
                className={[
                  "text-[10px] font-bold px-1.5 py-0 h-4 flex-shrink-0",
                  currentUser.role === "admin"
                    ? "bg-destructive text-destructive-foreground"
                    : "bg-primary text-primary-foreground",
                ].join(" ")}
              >
                {currentUser.role === "admin" ? "ADMIN" : "EMPLOYÉ"}
              </Badge>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-ocid="header.logout_button"
              onClick={onLogout}
              className="gap-1.5 text-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Déconnexion</span>
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>

        <footer className="bg-muted/40 border-t border-border px-4 py-2 text-center">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Minou Patisserie. Conçu avec amour
            par{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground transition-colors"
            >
              caffeine.ai
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
