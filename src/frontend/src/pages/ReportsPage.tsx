import { useStore } from "@/hooks/useStore";
import type { Expense, Order, Sale } from "@/types";
import { useMemo, useState } from "react";

const MONTHS_FR = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

const ORDER_STATUS_FR: Record<string, string> = {
  pending: "En attente",
  preparing: "En préparation",
  ready: "Prêt",
  delivered: "Livré",
  cancelled: "Annulé",
};

function fmt(n: number, currency = "G") {
  return `${n.toLocaleString("fr-HT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

function pct(part: number, total: number) {
  if (total === 0) return "0%";
  return `${((part / total) * 100).toFixed(1)}%`;
}

function inMonth(dateStr: string, year: number, month: number) {
  const d = new Date(dateStr);
  return d.getFullYear() === year && d.getMonth() === month;
}

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}
function StatCard({ label, value, sub, accent }: StatCardProps) {
  return (
    <div
      className={`rounded-xl p-4 border ${
        accent
          ? "bg-primary/10 border-primary/30 dark:bg-primary/20"
          : "bg-card border-border"
      } shadow-sm`}
    >
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

interface SectionProps {
  title: string;
  icon: string;
  children: React.ReactNode;
}
function Section({ title, icon, children }: SectionProps) {
  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden print:break-inside-avoid">
      <div className="px-5 py-3 border-b border-border bg-muted/40 flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <h2 className="font-semibold text-foreground">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Th({
  children,
  right,
}: { children: React.ReactNode; right?: boolean }) {
  return (
    <th
      className={`px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground bg-muted/30 ${
        right ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}
function Td({
  children,
  right,
  bold,
}: { children: React.ReactNode; right?: boolean; bold?: boolean }) {
  return (
    <td
      className={`px-3 py-2 text-sm border-t border-border/50 ${
        right ? "text-right" : "text-left"
      } ${bold ? "font-semibold" : ""}`}
    >
      {children}
    </td>
  );
}

export function ReportsPage() {
  const { state } = useStore();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const currency = state.settings.currency || "G";

  // --- Filtered data for selected month ---
  const monthSales = useMemo<Sale[]>(
    () => state.sales.filter((s) => inMonth(s.date, year, month)),
    [state.sales, year, month],
  );
  const monthExpenses = useMemo<Expense[]>(
    () => state.expenses.filter((e) => inMonth(e.date, year, month)),
    [state.expenses, year, month],
  );
  const monthOrders = useMemo<Order[]>(
    () => state.orders.filter((o) => inMonth(o.createdAt, year, month)),
    [state.orders, year, month],
  );
  const monthPayroll = useMemo(
    () =>
      state.payrollRecords.filter((p) => {
        const d = new Date(p.paidAt);
        return d.getFullYear() === year && d.getMonth() === month;
      }),
    [state.payrollRecords, year, month],
  );

  // --- Summary ---
  const totalSales = monthSales.reduce((s, v) => s + v.total, 0);
  const totalExpenses = monthExpenses.reduce((s, v) => s + v.amount, 0);
  const netProfit = totalSales - totalExpenses;
  const uniqueClients = new Set(
    monthSales.filter((s) => s.clientId).map((s) => s.clientId),
  ).size;
  const creditSales = monthSales.filter((s) => s.paymentMethod === "credit");
  const cashSales = monthSales.filter((s) => s.paymentMethod === "cash");
  const totalCredit = creditSales.reduce((s, v) => s + v.total, 0);
  const totalCash = cashSales.reduce((s, v) => s + v.total, 0);

  // --- Top 5 Products ---
  const productStats = useMemo(() => {
    const map: Record<string, { name: string; qty: number; amount: number }> =
      {};
    for (const sale of monthSales) {
      for (const item of sale.items) {
        if (!map[item.productId])
          map[item.productId] = { name: item.name, qty: 0, amount: 0 };
        map[item.productId].qty += item.qty;
        map[item.productId].amount += item.qty * item.unitPrice;
      }
    }
    return Object.values(map)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [monthSales]);

  // --- Top 5 Clients ---
  const clientStats = useMemo(() => {
    const map: Record<string, { name: string; count: number; amount: number }> =
      {};
    for (const sale of monthSales) {
      if (!sale.clientId) continue;
      if (!map[sale.clientId]) {
        const client = state.clients.find((c) => c.id === sale.clientId);
        map[sale.clientId] = {
          name: client?.name ?? "Inconnu",
          count: 0,
          amount: 0,
        };
      }
      map[sale.clientId].count += 1;
      map[sale.clientId].amount += sale.total;
    }
    return Object.entries(map)
      .map(([id, v]) => ({
        ...v,
        id,
        creditBalance:
          state.clients.find((c) => c.id === id)?.creditBalance ?? 0,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [monthSales, state.clients]);

  // --- Expenses by category ---
  const expenseByCategory = useMemo(() => {
    const map: Record<string, { count: number; amount: number }> = {};
    for (const e of monthExpenses) {
      if (!map[e.category]) map[e.category] = { count: 0, amount: 0 };
      map[e.category].count += 1;
      map[e.category].amount += e.amount;
    }
    return Object.entries(map)
      .map(([cat, v]) => ({ cat, ...v }))
      .sort((a, b) => b.amount - a.amount);
  }, [monthExpenses]);

  // --- Orders by status ---
  const orderByStatus = useMemo(() => {
    const map: Record<string, number> = {};
    for (const o of monthOrders) {
      map[o.status] = (map[o.status] ?? 0) + 1;
    }
    return Object.entries(map).map(([status, count]) => ({ status, count }));
  }, [monthOrders]);

  const totalOrderAmount = monthOrders.reduce((s, o) => s + o.totalAmount, 0);

  // --- Low stock products ---
  const lowStockProducts = state.products.filter(
    (p) => p.stock <= p.lowStockThreshold,
  );

  // --- Total payroll ---
  const totalPayroll = monthPayroll.reduce((s, p) => s + p.totalPay, 0);

  // --- Export CSV ---
  function exportCSV() {
    const rows: string[][] = [];
    rows.push([`Rapport Mensuel — ${MONTHS_FR[month]} ${year}`]);
    rows.push([]);
    rows.push(["=== RÉSUMÉ GÉNÉRAL ==="]);
    rows.push(["Indicateur", "Valeur"]);
    rows.push(["Total ventes", totalSales.toString()]);
    rows.push(["Nombre de transactions", monthSales.length.toString()]);
    rows.push(["Total dépenses", totalExpenses.toString()]);
    rows.push(["Bénéfice net", netProfit.toString()]);
    rows.push(["Clients servis", uniqueClients.toString()]);
    rows.push(["Ventes en crédit", totalCredit.toString()]);
    rows.push([]);
    rows.push(["=== TOP 5 PRODUITS ==="]);
    rows.push(["Produit", "Quantité", "Montant", "% CA"]);
    for (const p of productStats) {
      rows.push([
        p.name,
        p.qty.toString(),
        p.amount.toString(),
        pct(p.amount, totalSales),
      ]);
    }
    rows.push([]);
    rows.push(["=== TOP 5 CLIENTS ==="]);
    rows.push(["Client", "Achats", "Montant", "Crédit en cours"]);
    for (const c of clientStats) {
      rows.push([
        c.name,
        c.count.toString(),
        c.amount.toString(),
        c.creditBalance.toString(),
      ]);
    }
    rows.push([]);
    rows.push(["=== DÉPENSES PAR CATÉGORIE ==="]);
    rows.push(["Catégorie", "Nombre", "Montant", "%"]);
    for (const e of expenseByCategory) {
      rows.push([
        e.cat,
        e.count.toString(),
        e.amount.toString(),
        pct(e.amount, totalExpenses),
      ]);
    }
    rows.push([]);
    rows.push(["=== COMMANDES DU MOIS ==="]);
    rows.push(["Statut", "Nombre"]);
    for (const o of orderByStatus) {
      rows.push([ORDER_STATUS_FR[o.status] ?? o.status, o.count.toString()]);
    }
    rows.push(["Total commandes", monthOrders.length.toString()]);
    rows.push(["Montant total commandes", totalOrderAmount.toString()]);
    rows.push([]);
    rows.push(["=== PAIE EMPLOYÉS ==="]);
    rows.push([
      "Employé",
      "Salaire base",
      "Heures sup.",
      "Total payé",
      "Date paiement",
    ]);
    for (const p of monthPayroll) {
      rows.push([
        p.employeeName,
        p.basePay.toString(),
        p.overtimePay.toString(),
        p.totalPay.toString(),
        p.paidAt,
      ]);
    }

    const csv = rows
      .map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([`\uFEFF${csv}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rapport_${year}_${String(month + 1).padStart(2, "0")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const yearOptions = Array.from(
    { length: 5 },
    (_, i) => now.getFullYear() - i,
  );

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #report-root, #report-root * { visibility: visible !important; }
          #report-root { position: absolute; top: 0; left: 0; width: 100%; }
          .no-print { display: none !important; }
          .print\\:break-inside-avoid { break-inside: avoid; }
        }
      `}</style>

      <div
        id="report-root"
        className="max-w-5xl mx-auto px-4 py-6 space-y-6"
        data-ocid="reports.page"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              📊 Rapport Mensuel
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Analyse détaillée de votre activité
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="rounded-lg border border-input bg-background text-foreground px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              data-ocid="reports.month.select"
            >
              {MONTHS_FR.map((m, i) => (
                <option key={m} value={i}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="rounded-lg border border-input bg-background text-foreground px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              data-ocid="reports.year.select"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-muted border border-border text-foreground text-sm font-medium hover:bg-accent transition-colors"
              data-ocid="reports.print_button"
            >
              🖨️ Imprimer
            </button>
            <button
              type="button"
              onClick={exportCSV}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
              data-ocid="reports.export_button"
            >
              📥 Exporter CSV
            </button>
          </div>
        </div>

        {/* Print title */}
        <div className="hidden print:block text-center pb-4 border-b border-border">
          <h1 className="text-2xl font-bold">{state.settings.shopName}</h1>
          <p className="text-lg text-muted-foreground">
            Rapport Mensuel — {MONTHS_FR[month]} {year}
          </p>
        </div>

        {/* Résumé général */}
        <Section
          title={`Résumé Général — ${MONTHS_FR[month]} ${year}`}
          icon="📋"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard
              label="Total Ventes"
              value={fmt(totalSales, currency)}
              sub={`${monthSales.length} transactions`}
              accent
            />
            <StatCard
              label="Total Dépenses"
              value={fmt(totalExpenses, currency)}
              sub={`${monthExpenses.length} entrées`}
            />
            <StatCard
              label="Bénéfice Net"
              value={fmt(netProfit, currency)}
              sub={netProfit >= 0 ? "▲ Positif" : "▼ Déficit"}
              accent={netProfit >= 0}
            />
            <StatCard
              label="Clients Servis"
              value={uniqueClients.toString()}
              sub="clients uniques"
            />
            <StatCard
              label="Ventes en Crédit"
              value={fmt(totalCredit, currency)}
              sub={pct(totalCredit, totalSales)}
            />
            <StatCard
              label="Ventes en Espèces"
              value={fmt(totalCash, currency)}
              sub={pct(totalCash, totalSales)}
            />
          </div>
        </Section>

        {/* Top 5 Produits */}
        <Section title="Top 5 Produits" icon="🏆">
          {productStats.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucune vente ce mois-ci.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <Th>#</Th>
                    <Th>Produit</Th>
                    <Th right>Quantité</Th>
                    <Th right>Montant Total</Th>
                    <Th right>% du CA</Th>
                  </tr>
                </thead>
                <tbody>
                  {productStats.map((p, i) => (
                    <tr
                      key={p.name}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <Td>
                        <span className="font-bold text-primary">{i + 1}</span>
                      </Td>
                      <Td>
                        <span className="font-medium text-foreground">
                          {p.name}
                        </span>
                      </Td>
                      <Td right>{p.qty}</Td>
                      <Td right bold>
                        {fmt(p.amount, currency)}
                      </Td>
                      <Td right>
                        <span className="inline-flex items-center gap-1">
                          <span
                            className="inline-block h-2 rounded-full bg-primary/60"
                            style={{
                              width: `${Math.max(8, (p.amount / totalSales) * 80)}px`,
                            }}
                          />
                          {pct(p.amount, totalSales)}
                        </span>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* Top 5 Clients */}
        <Section title="Top 5 Clients" icon="👥">
          {clientStats.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucun client enregistré ce mois-ci.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <Th>#</Th>
                    <Th>Client</Th>
                    <Th right>Nb Achats</Th>
                    <Th right>Montant Total</Th>
                    <Th right>Crédit en Cours</Th>
                  </tr>
                </thead>
                <tbody>
                  {clientStats.map((c, i) => (
                    <tr
                      key={c.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <Td>
                        <span className="font-bold text-primary">{i + 1}</span>
                      </Td>
                      <Td>
                        <span className="font-medium text-foreground">
                          {c.name}
                        </span>
                      </Td>
                      <Td right>{c.count}</Td>
                      <Td right bold>
                        {fmt(c.amount, currency)}
                      </Td>
                      <Td right>
                        <span
                          className={
                            c.creditBalance > 0
                              ? "text-destructive font-semibold"
                              : "text-muted-foreground"
                          }
                        >
                          {fmt(c.creditBalance, currency)}
                        </span>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* Paiements */}
        <Section title="Ventes par Mode de Paiement" icon="💳">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-border p-4 bg-muted/20">
              <p className="text-sm font-medium text-muted-foreground">
                💵 Espèces
              </p>
              <p className="text-xl font-bold text-foreground mt-1">
                {fmt(totalCash, currency)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {cashSales.length} transactions · {pct(totalCash, totalSales)}
              </p>
            </div>
            <div className="rounded-lg border border-border p-4 bg-muted/20">
              <p className="text-sm font-medium text-muted-foreground">
                📝 Crédit
              </p>
              <p className="text-xl font-bold text-foreground mt-1">
                {fmt(totalCredit, currency)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {creditSales.length} transactions ·{" "}
                {pct(totalCredit, totalSales)}
              </p>
            </div>
          </div>
          {/* Bar */}
          {totalSales > 0 && (
            <div className="mt-4">
              <div className="flex rounded-full overflow-hidden h-3">
                <div
                  className="bg-primary transition-all"
                  style={{ width: pct(totalCash, totalSales) }}
                />
                <div className="bg-destructive/60 flex-1" />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Espèces {pct(totalCash, totalSales)}</span>
                <span>Crédit {pct(totalCredit, totalSales)}</span>
              </div>
            </div>
          )}
        </Section>

        {/* Dépenses par catégorie */}
        <Section title="Dépenses par Catégorie" icon="📂">
          {expenseByCategory.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucune dépense ce mois-ci.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <Th>Catégorie</Th>
                    <Th right>Nb Entrées</Th>
                    <Th right>Montant</Th>
                    <Th right>% Total</Th>
                  </tr>
                </thead>
                <tbody>
                  {expenseByCategory.map((e) => (
                    <tr
                      key={e.cat}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <Td>
                        <span className="font-medium text-foreground">
                          {e.cat}
                        </span>
                      </Td>
                      <Td right>{e.count}</Td>
                      <Td right bold>
                        {fmt(e.amount, currency)}
                      </Td>
                      <Td right>{pct(e.amount, totalExpenses)}</Td>
                    </tr>
                  ))}
                  <tr className="bg-muted/30">
                    <Td bold>TOTAL</Td>
                    <Td right bold>
                      {monthExpenses.length}
                    </Td>
                    <Td right bold>
                      {fmt(totalExpenses, currency)}
                    </Td>
                    <Td right bold>
                      100%
                    </Td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* Commandes */}
        <Section title="Commandes du Mois" icon="📦">
          <div className="flex flex-wrap gap-3 mb-4">
            <StatCard
              label="Total Commandes"
              value={monthOrders.length.toString()}
            />
            <StatCard
              label="Montant Total"
              value={fmt(totalOrderAmount, currency)}
            />
          </div>
          {orderByStatus.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">
              Aucune commande ce mois-ci.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <Th>Statut</Th>
                    <Th right>Nombre</Th>
                    <Th right>% du Total</Th>
                  </tr>
                </thead>
                <tbody>
                  {orderByStatus.map((o) => (
                    <tr
                      key={o.status}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <Td>
                        <span className="font-medium text-foreground">
                          {ORDER_STATUS_FR[o.status] ?? o.status}
                        </span>
                      </Td>
                      <Td right>{o.count}</Td>
                      <Td right>{pct(o.count, monthOrders.length)}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* Paie Employés */}
        <Section title="Paie Employés du Mois" icon="💼">
          {monthPayroll.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucun paiement enregistré ce mois-ci.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <Th>Employé</Th>
                    <Th right>Salaire Base</Th>
                    <Th right>Heures Sup.</Th>
                    <Th right>Total Payé</Th>
                    <Th>Date Paiement</Th>
                  </tr>
                </thead>
                <tbody>
                  {monthPayroll.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <Td>
                        <span className="font-medium text-foreground">
                          {p.employeeName}
                        </span>
                      </Td>
                      <Td right>{fmt(p.basePay, currency)}</Td>
                      <Td right>{fmt(p.overtimePay, currency)}</Td>
                      <Td right bold>
                        {fmt(p.totalPay, currency)}
                      </Td>
                      <Td>{new Date(p.paidAt).toLocaleDateString("fr-FR")}</Td>
                    </tr>
                  ))}
                  <tr className="bg-muted/30">
                    <Td bold>TOTAL</Td>
                    <Td right bold>
                      {fmt(
                        monthPayroll.reduce((s, p) => s + p.basePay, 0),
                        currency,
                      )}
                    </Td>
                    <Td right bold>
                      {fmt(
                        monthPayroll.reduce((s, p) => s + p.overtimePay, 0),
                        currency,
                      )}
                    </Td>
                    <Td right bold>
                      {fmt(totalPayroll, currency)}
                    </Td>
                    <Td>{""}</Td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* Produits en alerte stock */}
        <Section title="Produits en Alerte Stock" icon="⚠️">
          {lowStockProducts.length === 0 ? (
            <p className="text-sm text-green-600 dark:text-green-400 text-center py-4">
              ✅ Tous les stocks sont suffisants.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <Th>Produit</Th>
                    <Th>Catégorie</Th>
                    <Th right>Stock Actuel</Th>
                    <Th right>Seuil Minimum</Th>
                    <Th right>Manque</Th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockProducts.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <Td>
                        <span className="font-medium text-foreground flex items-center gap-1.5">
                          {p.stock === 0 && (
                            <span className="inline-block w-2 h-2 rounded-full bg-destructive" />
                          )}
                          {p.stock > 0 && (
                            <span className="inline-block w-2 h-2 rounded-full bg-yellow-500" />
                          )}
                          {p.name}
                        </span>
                      </Td>
                      <Td>{p.category}</Td>
                      <Td right>
                        <span
                          className={
                            p.stock === 0
                              ? "text-destructive font-bold"
                              : "text-yellow-600 dark:text-yellow-400 font-semibold"
                          }
                        >
                          {p.stock}
                        </span>
                      </Td>
                      <Td right>{p.lowStockThreshold}</Td>
                      <Td right bold>
                        {Math.max(0, p.lowStockThreshold - p.stock)}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* Footer print */}
        <div className="hidden print:block text-center text-xs text-muted-foreground pt-4 border-t border-border">
          Rapport généré le{" "}
          {new Date().toLocaleDateString("fr-FR", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}{" "}
          — {state.settings.shopName}
        </div>
      </div>
    </>
  );
}
