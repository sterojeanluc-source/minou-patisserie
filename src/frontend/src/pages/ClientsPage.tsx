import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useStore } from "@/hooks/useStore";
import type { AuditEntry, Client } from "@/types";
import {
  CreditCard,
  History,
  Mail,
  Pencil,
  Phone,
  Search,
  ShoppingBag,
  Trash2,
  User,
  UserPlus,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  `${n.toLocaleString("fr-FR", { minimumFractionDigits: 0 })} G`;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Client History Panel ─────────────────────────────────────────────────────

interface ClientHistoryProps {
  client: Client;
  onClose: () => void;
}

function ClientHistory({ client, onClose: _onClose }: ClientHistoryProps) {
  const { state, dispatch } = useStore();
  const { currentUser } = useAuth();
  const [payAmount, setPayAmount] = useState("");
  const [payError, setPayError] = useState("");
  const [paySuccess, setPaySuccess] = useState(false);

  const clientSales = useMemo(
    () =>
      [...state.sales]
        .filter((s) => s.clientId === client.id)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [state.sales, client.id],
  );

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setPayError("");
    setPaySuccess(false);
    const amount = Number.parseFloat(payAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      setPayError("Montant invalide.");
      return;
    }
    if (amount > client.creditBalance) {
      setPayError(`Maximum remboursable : ${fmt(client.creditBalance)}`);
      return;
    }
    const newBalance = Math.max(0, client.creditBalance - amount);
    dispatch({
      type: "UPDATE_CLIENT",
      payload: { ...client, creditBalance: newBalance },
    });
    const entry: AuditEntry = {
      id: newId("audit"),
      timestamp: new Date().toISOString(),
      userId: currentUser?.id ?? "unknown",
      action: "CREDIT_PAYMENT",
      details: `Paiement de ${fmt(amount)} enregistre pour ${client.name}. Solde restant: ${fmt(newBalance)}`,
    };
    dispatch({ type: "ADD_AUDIT", payload: entry });
    setPayAmount("");
    setPaySuccess(true);
    setTimeout(() => setPaySuccess(false), 3000);
  };

  return (
    <div className="space-y-5" data-ocid="clients.history_panel">
      {/* Client info */}
      <Card className="bg-muted/30">
        <CardContent className="pt-4 pb-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div className="flex items-center gap-2 min-w-0">
              <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="truncate font-medium text-foreground">
                {client.name}
              </span>
            </div>
            {client.phone && (
              <div className="flex items-center gap-2 min-w-0">
                <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="truncate text-muted-foreground">
                  {client.phone}
                </span>
              </div>
            )}
            {client.email && (
              <div className="flex items-center gap-2 min-w-0">
                <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="truncate text-muted-foreground">
                  {client.email}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">
                Total:{" "}
                <strong className="text-foreground">
                  {fmt(client.totalPurchases)}
                </strong>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Credit payment form (only if there's outstanding credit) */}
      {client.creditBalance > 0 && (
        <Card className="border-orange-500/30 bg-orange-500/5">
          <CardHeader className="pb-3 pt-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-orange-600 dark:text-orange-400">
              <CreditCard className="w-4 h-4" />
              Solde crédit : {fmt(client.creditBalance)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <form onSubmit={handlePayment} className="flex items-end gap-3">
              <div className="flex-1 space-y-1">
                <Label htmlFor="pay-amount" className="text-xs">
                  Montant à payer (G)
                </Label>
                <Input
                  id="pay-amount"
                  data-ocid="clients.history.pay_input"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Montant"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                data-ocid="clients.history.pay_button"
                className="flex-shrink-0"
              >
                Payer
              </Button>
            </form>
            {payError && (
              <p
                data-ocid="clients.history.pay_error_state"
                className="text-xs text-destructive mt-2"
              >
                {payError}
              </p>
            )}
            {paySuccess && (
              <p
                data-ocid="clients.history.pay_success_state"
                className="text-xs text-green-600 dark:text-green-400 mt-2"
              >
                Paiement enregistré avec succès.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sales history */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-3">
          Historique des achats ({clientSales.length})
        </h4>
        {clientSales.length === 0 ? (
          <div
            data-ocid="clients.history.sales_empty_state"
            className="text-center py-8 text-muted-foreground"
          >
            <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Aucun achat enregistré pour ce client.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {clientSales.map((sale, idx) => (
              <div
                key={sale.id}
                data-ocid={`clients.history.sale.item.${idx + 1}`}
                className="border border-border rounded-lg px-4 py-3 bg-card space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {fmtDate(sale.date)}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        sale.paymentMethod === "credit"
                          ? "secondary"
                          : "outline"
                      }
                      className="text-[10px]"
                    >
                      {sale.paymentMethod === "credit" ? "Crédit" : "Espèces"}
                    </Badge>
                    <span className="text-sm font-bold text-foreground">
                      {fmt(sale.total)}
                    </span>
                  </div>
                </div>
                <div className="space-y-0.5">
                  {sale.items.map((item, iIdx) => (
                    <div
                      key={`${sale.id}-item-${iIdx}`}
                      className="flex justify-between text-xs text-muted-foreground"
                    >
                      <span>
                        {item.name} × {item.qty}
                      </span>
                      <span>{fmt(item.unitPrice * item.qty)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Client Form ──────────────────────────────────────────────────────────────

interface ClientFormProps {
  initial?: Client;
  onSave: (
    data: Omit<Client, "id" | "creditBalance" | "totalPurchases">,
  ) => void;
  onCancel: () => void;
}

function ClientForm({ initial, onSave, onCancel }: ClientFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [nameError, setNameError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNameError("");
    if (!name.trim()) {
      setNameError("Le nom est requis.");
      return;
    }
    onSave({ name: name.trim(), phone: phone.trim(), email: email.trim() });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
      data-ocid="clients.form"
    >
      <div className="space-y-1.5">
        <Label htmlFor="client-name">
          Nom <span className="text-destructive">*</span>
        </Label>
        <Input
          id="client-name"
          data-ocid="clients.form.name_input"
          placeholder="Nom complet du client"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        {nameError && (
          <p
            data-ocid="clients.form.name_error_state"
            className="text-xs text-destructive"
          >
            {nameError}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="client-phone">Téléphone</Label>
        <Input
          id="client-phone"
          data-ocid="clients.form.phone_input"
          placeholder="509-XXXX-XXXX"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="client-email">Email</Label>
        <Input
          id="client-email"
          data-ocid="clients.form.email_input"
          type="email"
          placeholder="client@exemple.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          data-ocid="clients.form.submit_button"
          className="flex-1"
        >
          Enregistrer
        </Button>
        <Button
          type="button"
          variant="outline"
          data-ocid="clients.form.cancel_button"
          onClick={onCancel}
          className="flex-1"
        >
          Annuler
        </Button>
      </div>
    </form>
  );
}

// ─── Clients Page ─────────────────────────────────────────────────────────────

export function ClientsPage() {
  const { state, dispatch } = useStore();
  const { currentUser, verifyPin } = useAuth();
  const isAdmin = currentUser?.role === "admin";

  const [activeTab, setActiveTab] = useState<"liste" | "form">("liste");
  const [search, setSearch] = useState("");
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [historyClientId, setHistoryClientId] = useState<string | null>(null);

  // Delete flow
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");

  const filteredClients = useMemo(() => {
    const q = search.toLowerCase();
    return [...state.clients]
      .filter((c) => c.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name, "fr"));
  }, [state.clients, search]);

  const _historyClient = useMemo(
    () => state.clients.find((c) => c.id === historyClientId) ?? null,
    [state.clients, historyClientId],
  );

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleOpenAdd = () => {
    setEditingClient(null);
    setActiveTab("form");
  };

  const handleOpenEdit = (client: Client) => {
    setEditingClient(client);
    setActiveTab("form");
  };

  const handleSaveClient = (
    data: Omit<Client, "id" | "creditBalance" | "totalPurchases">,
  ) => {
    if (editingClient) {
      dispatch({
        type: "UPDATE_CLIENT",
        payload: { ...editingClient, ...data },
      });
      dispatch({
        type: "ADD_AUDIT",
        payload: {
          id: newId("audit"),
          timestamp: new Date().toISOString(),
          userId: currentUser?.id ?? "unknown",
          action: "UPDATE_CLIENT",
          details: `Client modifié: ${data.name}`,
        },
      });
    } else {
      const newClient: Client = {
        id: newId("c"),
        ...data,
        creditBalance: 0,
        totalPurchases: 0,
      };
      dispatch({ type: "ADD_CLIENT", payload: newClient });
      dispatch({
        type: "ADD_AUDIT",
        payload: {
          id: newId("audit"),
          timestamp: new Date().toISOString(),
          userId: currentUser?.id ?? "unknown",
          action: "ADD_CLIENT",
          details: `Nouveau client ajouté: ${data.name}`,
        },
      });
    }
    setEditingClient(null);
    setActiveTab("liste");
  };

  const handleCancelForm = () => {
    setEditingClient(null);
    setActiveTab("liste");
  };

  const handleRequestDelete = (client: Client) => {
    setDeleteTarget(client);
    setPinInput("");
    setPinError("");
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    if (!verifyPin(pinInput)) {
      setPinError("PIN incorrect.");
      return;
    }
    if (deleteTarget.creditBalance > 0) {
      setPinError(
        `Impossible: ce client a un solde crédit de ${fmt(deleteTarget.creditBalance)}.`,
      );
      return;
    }
    dispatch({ type: "DELETE_CLIENT", payload: deleteTarget.id });
    dispatch({
      type: "ADD_AUDIT",
      payload: {
        id: newId("audit"),
        timestamp: new Date().toISOString(),
        userId: currentUser?.id ?? "unknown",
        action: "DELETE_CLIENT",
        details: `Client supprimé: ${deleteTarget.name}`,
      },
    });
    if (historyClientId === deleteTarget.id) setHistoryClientId(null);
    setDeleteTarget(null);
    setPinInput("");
    setPinError("");
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5" data-ocid="clients.page">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-display font-bold text-foreground">
            Clients
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {state.clients.length} client{state.clients.length !== 1 ? "s" : ""}{" "}
            enregistré
            {state.clients.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          type="button"
          data-ocid="clients.add_button"
          onClick={handleOpenAdd}
          className="gap-2"
        >
          <UserPlus className="w-4 h-4" />
          <span className="hidden sm:inline">Nouveau client</span>
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "liste" | "form")}
        className="space-y-4"
      >
        <TabsList data-ocid="clients.tabs">
          <TabsTrigger value="liste" data-ocid="clients.tab.liste">
            Liste des Clients
          </TabsTrigger>
          <TabsTrigger value="form" data-ocid="clients.tab.form">
            {editingClient ? "Modifier Client" : "Ajouter Client"}
          </TabsTrigger>
        </TabsList>

        {/* ── TAB 1: LIST ──────────────────────────────────────────────────── */}
        <TabsContent value="liste" className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              data-ocid="clients.search_input"
              className="pl-9"
              placeholder="Rechercher un client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                aria-label="Effacer la recherche"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Table */}
          {filteredClients.length === 0 ? (
            <div
              data-ocid="clients.list.empty_state"
              className="text-center py-12 text-muted-foreground"
            >
              <User className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">
                {search ? "Aucun client trouvé." : "Aucun client enregistré."}
              </p>
              {!search && (
                <p className="text-sm mt-1">
                  Cliquez sur{" "}
                  <button
                    type="button"
                    onClick={handleOpenAdd}
                    className="underline underline-offset-2 hover:text-foreground transition-colors"
                  >
                    Nouveau client
                  </button>{" "}
                  pour commencer.
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                        Nom
                      </th>
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                        Téléphone
                      </th>
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                        Email
                      </th>
                      <th className="text-right px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                        Solde crédit
                      </th>
                      <th className="text-right px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                        Total achats
                      </th>
                      <th className="text-right px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredClients.map((client, idx) => (
                      <>
                        <tr
                          key={client.id}
                          data-ocid={`clients.list.item.${idx + 1}`}
                          className={[
                            "transition-colors hover:bg-accent/30",
                            client.creditBalance > 0
                              ? "bg-orange-500/5"
                              : "bg-card",
                          ].join(" ")}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-semibold text-primary uppercase">
                                  {client.name.charAt(0)}
                                </span>
                              </div>
                              <span className="font-medium text-foreground truncate max-w-[140px]">
                                {client.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {client.phone || (
                              <span className="opacity-40">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground max-w-[160px]">
                            <span className="truncate block">
                              {client.email || (
                                <span className="opacity-40">—</span>
                              )}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {client.creditBalance > 0 ? (
                              <Badge
                                variant="secondary"
                                className="bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/20"
                              >
                                {fmt(client.creditBalance)}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs">
                                0 G
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-foreground">
                            {fmt(client.totalPurchases)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                data-ocid={`clients.list.history_button.${idx + 1}`}
                                aria-label="Voir l'historique"
                                onClick={() =>
                                  setHistoryClientId(
                                    historyClientId === client.id
                                      ? null
                                      : client.id,
                                  )
                                }
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              >
                                <History className="w-4 h-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                data-ocid={`clients.list.edit_button.${idx + 1}`}
                                aria-label="Modifier le client"
                                onClick={() => handleOpenEdit(client)}
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              {isAdmin && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  data-ocid={`clients.list.delete_button.${idx + 1}`}
                                  aria-label="Supprimer le client"
                                  onClick={() => handleRequestDelete(client)}
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {/* Inline history panel */}
                        {historyClientId === client.id && (
                          <tr key={`history-${client.id}`}>
                            <td
                              colSpan={6}
                              className="bg-muted/20 border-t border-border px-4 py-4"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-semibold text-foreground">
                                  Dossier — {client.name}
                                </h3>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  data-ocid="clients.history.close_button"
                                  aria-label="Fermer l'historique"
                                  onClick={() => setHistoryClientId(null)}
                                  className="h-7 w-7"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                              <ClientHistory
                                client={
                                  state.clients.find(
                                    (c) => c.id === client.id,
                                  ) ?? client
                                }
                                onClose={() => setHistoryClientId(null)}
                              />
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile card list */}
              <div className="md:hidden divide-y divide-border">
                {filteredClients.map((client, idx) => (
                  <div
                    key={client.id}
                    data-ocid={`clients.list.item.${idx + 1}`}
                    className={[
                      "px-4 py-4",
                      client.creditBalance > 0 ? "bg-orange-500/5" : "bg-card",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-primary uppercase">
                            {client.name.charAt(0)}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate">
                            {client.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {client.phone || client.email || "Aucun contact"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          data-ocid={`clients.list.history_button.${idx + 1}`}
                          aria-label="Voir l'historique"
                          onClick={() =>
                            setHistoryClientId(
                              historyClientId === client.id ? null : client.id,
                            )
                          }
                          className="h-8 w-8"
                        >
                          <History className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          data-ocid={`clients.list.edit_button.${idx + 1}`}
                          aria-label="Modifier"
                          onClick={() => handleOpenEdit(client)}
                          className="h-8 w-8"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        {isAdmin && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            data-ocid={`clients.list.delete_button.${idx + 1}`}
                            aria-label="Supprimer"
                            onClick={() => handleRequestDelete(client)}
                            className="h-8 w-8 hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-2.5 text-xs">
                      <span className="text-muted-foreground">
                        Achats:{" "}
                        <span className="font-medium text-foreground">
                          {fmt(client.totalPurchases)}
                        </span>
                      </span>
                      {client.creditBalance > 0 && (
                        <Badge
                          variant="secondary"
                          className="bg-orange-500/15 text-orange-600 dark:text-orange-400 text-[10px]"
                        >
                          Crédit: {fmt(client.creditBalance)}
                        </Badge>
                      )}
                    </div>

                    {/* Mobile inline history */}
                    {historyClientId === client.id && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs font-semibold text-foreground uppercase tracking-wider">
                            Dossier client
                          </p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            data-ocid="clients.history.close_button"
                            onClick={() => setHistoryClientId(null)}
                            className="h-6 w-6"
                            aria-label="Fermer"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                        <ClientHistory
                          client={
                            state.clients.find((c) => c.id === client.id) ??
                            client
                          }
                          onClose={() => setHistoryClientId(null)}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── TAB 2: FORM ──────────────────────────────────────────────────── */}
        <TabsContent value="form">
          <Card className="max-w-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-display">
                {editingClient
                  ? `Modifier — ${editingClient.name}`
                  : "Nouveau client"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ClientForm
                initial={editingClient ?? undefined}
                onSave={handleSaveClient}
                onCancel={handleCancelForm}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Delete confirmation dialog (admin + PIN) ──────────────────────── */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            setPinInput("");
            setPinError("");
          }
        }}
      >
        <AlertDialogContent data-ocid="clients.delete.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le client</AlertDialogTitle>
            <AlertDialogDescription>
              Vous allez supprimer <strong>{deleteTarget?.name}</strong>. Cette
              action est irréversible. Saisissez votre PIN administrateur pour
              confirmer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-1">
            <Label htmlFor="delete-pin">PIN administrateur</Label>
            <Input
              id="delete-pin"
              data-ocid="clients.delete.pin_input"
              type="password"
              inputMode="numeric"
              maxLength={6}
              placeholder="••••"
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value);
                setPinError("");
              }}
            />
            {pinError && (
              <p
                data-ocid="clients.delete.error_state"
                className="text-xs text-destructive"
              >
                {pinError}
              </p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="clients.delete.cancel_button">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="clients.delete.confirm_button"
              onClick={(e) => {
                e.preventDefault();
                handleConfirmDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unused Dialog import kept for potential future modals — removed */}
    </div>
  );
}
