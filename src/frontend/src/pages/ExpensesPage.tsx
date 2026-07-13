import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useStore } from "@/hooks/useStore";
import type { Expense } from "@/types";
import {
  CheckCircle2,
  Download,
  PlusCircle,
  Printer,
  Receipt,
  Trash2,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";

const CATEGORIES = [
  "Loyer",
  "Services",
  "Fournitures",
  "Salaires",
  "Autre",
] as const;
type Category = (typeof CATEGORIES)[number];

const CATEGORY_COLORS: Record<string, string> = {
  Loyer: "bg-chart-1/15 text-chart-1 border-chart-1/30",
  Services: "bg-chart-2/15 text-chart-2 border-chart-2/30",
  Fournitures: "bg-chart-3/15 text-chart-3 border-chart-3/30",
  Salaires: "bg-chart-4/15 text-chart-4 border-chart-4/30",
  Autre: "bg-muted text-muted-foreground border-border",
};

function formatDate(iso: string): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function currentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

interface FormState {
  date: string;
  category: Category;
  amount: string;
  description: string;
}

const emptyForm: FormState = {
  date: todayISO(),
  category: "Loyer",
  amount: "",
  description: "",
};

// ─── Historique Tab ──────────────────────────────────────────────────────────
function HistoriqueTab() {
  const { state, dispatch } = useStore();
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === "admin";

  const [monthFilter, setMonthFilter] = useState<string>(currentYearMonth());
  const [categoryFilter, setCategoryFilter] = useState<string>("Toutes");

  const filtered = useMemo(() => {
    return state.expenses
      .filter((e) => {
        const matchMonth = !monthFilter || e.date.startsWith(monthFilter);
        const matchCat =
          categoryFilter === "Toutes" || e.category === categoryFilter;
        return matchMonth && matchCat;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [state.expenses, monthFilter, categoryFilter]);

  const total = useMemo(
    () => filtered.reduce((s, e) => s + e.amount, 0),
    [filtered],
  );

  const totByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const cat of CATEGORIES) map[cat] = 0;
    for (const e of filtered) {
      map[e.category] = (map[e.category] ?? 0) + e.amount;
    }
    return map;
  }, [filtered]);

  const handleDelete = (id: string) => {
    dispatch({ type: "DELETE_EXPENSE", payload: id });
  };

  const handleExportCSV = () => {
    const header = "Date,Catégorie,Montant,Description";
    const rows = filtered.map(
      (e) =>
        `"${formatDate(e.date)}","${e.category}",${e.amount},"${e.description.replace(/"/g, '""')}"`,
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `depenses-${monthFilter || "tous"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Filters + Actions */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="month-filter"
            className="text-xs text-muted-foreground"
          >
            Mois
          </Label>
          <Input
            id="month-filter"
            type="month"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="w-44"
            data-ocid="expenses.month_filter"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cat-filter" className="text-xs text-muted-foreground">
            Catégorie
          </Label>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger
              className="w-44"
              id="cat-filter"
              data-ocid="expenses.category_filter"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Toutes">Toutes</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto flex gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            data-ocid="expenses.export_csv_button"
          >
            <Download className="w-4 h-4 mr-1.5" />
            Exporter CSV
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            data-ocid="expenses.print_button"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Imprimer
          </Button>
        </div>
      </div>

      {/* Category summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {CATEGORIES.map((cat) => (
          <Card
            key={cat}
            className={`border transition-colors cursor-pointer ${
              categoryFilter === cat ? "ring-2 ring-primary" : ""
            }`}
            onClick={() =>
              setCategoryFilter(categoryFilter === cat ? "Toutes" : cat)
            }
            data-ocid={`expenses.category_card.${cat.toLowerCase()}`}
          >
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground mb-1 truncate">
                {cat}
              </p>
              <p className="font-semibold text-sm text-foreground">
                {totByCategory[cat].toLocaleString("fr-HT")} G
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card className="border">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">
            {filtered.length} dépense{filtered.length !== 1 ? "s" : ""}
          </CardTitle>
          <Badge variant="outline" className="font-mono text-sm">
            Total : {total.toLocaleString("fr-HT")} G
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16 text-center"
              data-ocid="expenses.empty_state"
            >
              <Receipt className="w-10 h-10 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground text-sm">
                Aucune dépense pour cette période.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="w-28">Date</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead className="text-right w-32">
                      Montant (G)
                    </TableHead>
                    <TableHead>Description</TableHead>
                    {isAdmin && (
                      <TableHead className="w-20 text-right">Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((expense, idx) => (
                    <ExpenseRow
                      key={expense.id}
                      expense={expense}
                      idx={idx + 1}
                      isAdmin={isAdmin}
                      onDelete={handleDelete}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {/* Summary row */}
          {filtered.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30 text-sm font-semibold">
              <span className="text-muted-foreground">
                Total des dépenses filtrées
              </span>
              <span className="text-foreground font-mono">
                {total.toLocaleString("fr-HT")} G
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface ExpenseRowProps {
  expense: Expense;
  idx: number;
  isAdmin: boolean;
  onDelete: (id: string) => void;
}

function ExpenseRow({ expense, idx, isAdmin, onDelete }: ExpenseRowProps) {
  const colorClass = CATEGORY_COLORS[expense.category] ?? CATEGORY_COLORS.Autre;
  return (
    <TableRow
      className="hover:bg-muted/20 transition-colors"
      data-ocid={`expenses.item.${idx}`}
    >
      <TableCell className="text-sm tabular-nums">
        {formatDate(expense.date)}
      </TableCell>
      <TableCell>
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}
        >
          {expense.category}
        </span>
      </TableCell>
      <TableCell className="text-right font-mono font-semibold tabular-nums">
        {expense.amount.toLocaleString("fr-HT")}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground max-w-[240px] truncate">
        {expense.description || "—"}
      </TableCell>
      {isAdmin && (
        <TableCell className="text-right">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(expense.id)}
            data-ocid={`expenses.delete_button.${idx}`}
            aria-label="Supprimer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </TableCell>
      )}
    </TableRow>
  );
}

// ─── Nouvelle Dépense Tab ────────────────────────────────────────────────────
function NouvelleDepenseTab({ onSaved }: { onSaved: () => void }) {
  const { dispatch } = useStore();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [success, setSuccess] = useState(false);
  const successRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSuccess(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number.parseFloat(form.amount);
    if (!form.date || !form.category || Number.isNaN(amount) || amount <= 0)
      return;

    const expense: Expense = {
      id: `exp-${Date.now()}`,
      date: form.date,
      category: form.category,
      amount,
      description: form.description.trim(),
    };
    dispatch({ type: "ADD_EXPENSE", payload: expense });
    setForm({ ...emptyForm, date: todayISO() });
    setSuccess(true);
    if (successRef.current) clearTimeout(successRef.current);
    successRef.current = setTimeout(() => setSuccess(false), 4000);
    onSaved();
  };

  return (
    <div className="max-w-lg">
      <Card className="border">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-primary" />
            Nouvelle Dépense
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Date */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="exp-date">Date</Label>
              <Input
                id="exp-date"
                type="date"
                value={form.date}
                onChange={(e) => setField("date", e.target.value)}
                required
                data-ocid="expenses.date_input"
              />
            </div>

            {/* Category */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="exp-category">Catégorie</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setField("category", v as Category)}
              >
                <SelectTrigger
                  id="exp-category"
                  data-ocid="expenses.category_select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="exp-amount">Montant (G)</Label>
              <div className="relative">
                <Input
                  id="exp-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => setField("amount", e.target.value)}
                  required
                  className="pr-8"
                  data-ocid="expenses.amount_input"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm select-none pointer-events-none">
                  G
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="exp-desc">Description</Label>
              <Input
                id="exp-desc"
                type="text"
                placeholder="Description optionnelle"
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                data-ocid="expenses.description_input"
              />
            </div>

            {/* Success message */}
            {success && (
              <div
                className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm font-medium"
                data-ocid="expenses.success_state"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Dépense enregistrée avec succès.
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              data-ocid="expenses.submit_button"
            >
              Enregistrer
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Page Root ───────────────────────────────────────────────────────────────
export function ExpensesPage() {
  const [activeTab, setActiveTab] = useState("historique");

  return (
    <div className="space-y-6" data-ocid="expenses.page">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Receipt className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-display font-semibold text-foreground leading-tight">
            Dépenses
          </h1>
          <p className="text-sm text-muted-foreground">
            Suivi et enregistrement des dépenses de la pâtisserie
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-2">
          <TabsTrigger value="historique" data-ocid="expenses.historique_tab">
            Historique des Dépenses
          </TabsTrigger>
          <TabsTrigger value="nouvelle" data-ocid="expenses.nouvelle_tab">
            Nouvelle Dépense
          </TabsTrigger>
        </TabsList>

        <TabsContent value="historique" className="mt-4">
          <HistoriqueTab />
        </TabsContent>

        <TabsContent value="nouvelle" className="mt-4">
          <NouvelleDepenseTab
            onSaved={() => {
              // Stay on tab 2 — do nothing with tab state
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Print-only styles */}
      <style>{`
        @media print {
          nav, aside, header, footer,
          [data-ocid="expenses.print_button"],
          [data-ocid="expenses.export_csv_button"],
          [data-ocid="expenses.delete_button"] { display: none !important; }
          body { background: white !important; color: black !important; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ccc; padding: 6px 10px; font-size: 12px; }
          th { background: #f0f0f0; }
        }
      `}</style>
    </div>
  );
}
