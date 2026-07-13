import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore } from "@/hooks/useStore";
import type { PageName } from "@/types";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Package,
  Receipt,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react";
import { useMemo } from "react";

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent = false,
  warning = false,
  "data-ocid": dataOcid,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  accent?: boolean;
  warning?: boolean;
  "data-ocid"?: string;
}) {
  const bgClass = warning
    ? "border-destructive/30 bg-destructive/5"
    : accent
      ? "border-primary/30 bg-primary/5"
      : "";
  const iconClass = warning
    ? "bg-destructive/15 text-destructive"
    : accent
      ? "bg-primary text-primary-foreground"
      : "bg-muted text-muted-foreground";
  const valueClass = warning ? "text-destructive" : "text-foreground";

  return (
    <Card className={bgClass} data-ocid={dataOcid}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {title}
            </p>
            <p
              className={`text-2xl font-display font-bold mt-1 truncate ${valueClass}`}
            >
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>
          <div
            className={[
              "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center",
              iconClass,
            ].join(" ")}
          >
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardPage({
  onNavigate,
}: { onNavigate?: (page: PageName) => void }) {
  const { state } = useStore();

  const today = new Date().toISOString().slice(0, 10);

  const todaySales = useMemo(
    () => state.sales.filter((s) => s.date.startsWith(today)),
    [state.sales, today],
  );

  const todayRevenue = useMemo(
    () => todaySales.reduce((sum, s) => sum + s.total, 0),
    [todaySales],
  );

  const todayItemCount = useMemo(
    () =>
      todaySales.reduce(
        (sum, s) => sum + s.items.reduce((qs, i) => qs + i.qty, 0),
        0,
      ),
    [todaySales],
  );

  const lowStockProducts = useMemo(
    () => state.products.filter((p) => p.stock <= p.lowStockThreshold),
    [state.products],
  );

  const totalCredit = useMemo(
    () =>
      state.clients
        .filter((c) => c.creditBalance > 0)
        .reduce((sum, c) => sum + c.creditBalance, 0),
    [state.clients],
  );

  const todayExpenses = useMemo(
    () =>
      state.expenses
        .filter((e) => e.date.startsWith(today))
        .reduce((sum, e) => sum + e.amount, 0),
    [state.expenses, today],
  );

  const recentSales = useMemo(
    () =>
      [...state.sales].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5),
    [state.sales],
  );

  const fmt = (n: number) => `${n.toLocaleString("fr-FR")} G`;

  const quickLinks: {
    page: PageName;
    icon: React.ElementType;
    title: string;
    description: string;
    color: string;
  }[] = [
    {
      page: "ventes",
      icon: ShoppingCart,
      title: "Ventes",
      description: "Enregistrer une nouvelle vente",
      color: "text-primary bg-primary/10",
    },
    {
      page: "inventaire",
      icon: Package,
      title: "Inventaire",
      description: "Gérer les produits et stocks",
      color: "text-accent-foreground bg-accent/20",
    },
    {
      page: "clients",
      icon: Users,
      title: "Clients",
      description: "Consulter les fiches clients",
      color: "text-emerald-600 bg-emerald-500/10",
    },
    {
      page: "depenses",
      icon: Receipt,
      title: "Dépenses",
      description: "Saisir une nouvelle dépense",
      color: "text-orange-600 bg-orange-500/10",
    },
  ];

  return (
    <div className="space-y-6" data-ocid="dashboard.page">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard
          title="Ventes du jour"
          value={fmt(todayRevenue)}
          subtitle={`${todaySales.length} transaction${todaySales.length !== 1 ? "s" : ""}`}
          icon={TrendingUp}
          accent
          data-ocid="dashboard.ventes_card"
        />
        <StatCard
          title="Articles vendus"
          value={todayItemCount.toString()}
          subtitle="Quantité vendue aujourd'hui"
          icon={ShoppingCart}
          data-ocid="dashboard.articles_card"
        />
        <StatCard
          title="Produits en rupture"
          value={lowStockProducts.length.toString()}
          subtitle={
            lowStockProducts.length > 0
              ? "Attention requise"
              : "Stocks suffisants"
          }
          icon={AlertTriangle}
          warning={lowStockProducts.length > 0}
          data-ocid="dashboard.rupture_card"
        />
        <StatCard
          title="Crédits en cours"
          value={fmt(totalCredit)}
          subtitle={`${state.clients.filter((c) => c.creditBalance > 0).length} client(s)`}
          icon={Users}
          data-ocid="dashboard.credits_card"
        />
        <StatCard
          title="Dépenses du jour"
          value={fmt(todayExpenses)}
          subtitle={`${state.expenses.filter((e) => e.date.startsWith(today)).length} entrée(s)`}
          icon={Receipt}
          data-ocid="dashboard.depenses_card"
        />
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 ? (
        <Card
          className="border-destructive/30 bg-destructive/5"
          data-ocid="dashboard.low_stock_card"
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-destructive flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Alerte stock bas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground border-b border-border">
                    <th className="text-left pb-2 pr-4 font-medium">Produit</th>
                    <th className="text-right pb-2 pr-4 font-medium">
                      Stock actuel
                    </th>
                    <th className="text-right pb-2 font-medium">
                      Seuil minimum
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockProducts.map((p, idx) => (
                    <tr
                      key={p.id}
                      data-ocid={`dashboard.low_stock.item.${idx + 1}`}
                      className="border-b border-border/50 last:border-0"
                    >
                      <td className="py-2 pr-4 font-medium text-foreground">
                        {p.name}
                      </td>
                      <td className="py-2 pr-4 text-right">
                        <Badge variant="destructive" className="text-xs">
                          {p.stock}
                        </Badge>
                      </td>
                      <td className="py-2 text-right text-muted-foreground">
                        {p.lowStockThreshold}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/50" data-ocid="dashboard.stock_ok_card">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Tous les stocks sont suffisants
                </p>
                <p className="text-xs text-muted-foreground">
                  {state.products.length} produit(s) au-dessus du seuil
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Access */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Accès rapide
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickLinks.map((item) => (
            <button
              key={item.page}
              type="button"
              data-ocid={`dashboard.quick_access.${item.page}`}
              onClick={() => onNavigate?.(item.page)}
              className="group text-left p-4 rounded-xl border border-border bg-card hover:shadow-md hover:border-primary/30 transition-all duration-200"
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${item.color}`}
              >
                <item.icon className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                {item.title}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {item.description}
              </p>
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground group-hover:text-primary transition-colors">
                <span>Ouvrir</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Sales */}
      <Card data-ocid="dashboard.recent_sales_card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">
            Ventes récentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentSales.length === 0 ? (
            <div
              data-ocid="dashboard.sales_empty_state"
              className="text-center py-8"
            >
              <ShoppingCart className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Aucune vente enregistrée pour l'instant.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Créez votre première vente dans le module Ventes.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentSales.map((sale, idx) => {
                const client = state.clients.find(
                  (c) => c.id === sale.clientId,
                );
                return (
                  <div
                    key={sale.id}
                    data-ocid={`dashboard.sale.item.${idx + 1}`}
                    className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {client ? client.name : "Vente comptoir"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(sale.date).toLocaleDateString("fr-FR")}{" "}
                        &middot; {sale.items.length} article
                        {sale.items.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge
                        variant={
                          sale.paymentMethod === "credit"
                            ? "secondary"
                            : "outline"
                        }
                        className="text-xs"
                      >
                        {sale.paymentMethod === "credit" ? "Crédit" : "Espèces"}
                      </Badge>
                      <span className="text-sm font-semibold text-foreground">
                        {fmt(sale.total)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
