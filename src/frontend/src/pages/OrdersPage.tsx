import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/hooks/useStore";
import type { Order, OrderItem, OrderStatus } from "@/types";
import {
  Eye,
  FilePlus,
  FileText,
  Filter,
  Pencil,
  Plus,
  Printer,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "En attente",
  preparing: "En pr\u00e9paration",
  ready: "Pr\u00eate",
  delivered: "Livr\u00e9e",
  cancelled: "Annul\u00e9e",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  preparing: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  ready:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  delivered:
    "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

const STATUS_ORDER: OrderStatus[] = [
  "pending",
  "preparing",
  "ready",
  "delivered",
  "cancelled",
];

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${STATUS_COLORS[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function printOrder(order: Order, shopName: string) {
  const itemRows = order.items
    .map(
      (it) =>
        `<tr><td style="padding:4px 8px">${it.name}</td><td style="text-align:center;padding:4px 8px">${it.qty}</td><td style="text-align:right;padding:4px 8px">${it.unitPrice.toFixed(2)} G</td><td style="text-align:right;padding:4px 8px">${(it.qty * it.unitPrice).toFixed(2)} G</td></tr>`,
    )
    .join("");
  const parts: string[] = [
    '<!DOCTYPE html><html><head><meta charset="UTF-8">',
    `<title>Fiche Commande #${order.id.slice(-6).toUpperCase()}</title>`,
    "<style>body{font-family:sans-serif;font-size:14px;margin:24px}h1{font-size:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc}th{background:#f5f5f5}@media print{button{display:none}}</style>",
    "</head><body>",
    `<h1>${shopName}</h1>`,
    `<h2>Fiche Commande #${order.id.slice(-6).toUpperCase()}</h2>`,
    `<p><strong>Client :</strong> ${order.clientName || "\u2014"}</p>`,
    `<p><strong>Date de cr\u00e9ation :</strong> ${new Date(order.createdAt).toLocaleDateString("fr-HT")}</p>`,
    `<p><strong>Date de livraison :</strong> ${new Date(`${order.deliveryDate}T00:00`).toLocaleDateString("fr-HT")}</p>`,
    `<p><strong>Statut :</strong> ${STATUS_LABELS[order.status]}</p>`,
    "<table><thead><tr><th>Article</th><th>Qt\u00e9</th><th>Prix unit.</th><th>Sous-total</th></tr></thead>",
    `<tbody>${itemRows}</tbody></table>`,
    `<p style="margin-top:12px"><strong>Montant total :</strong> ${order.totalAmount.toFixed(2)} G</p>`,
    `<p><strong>Acompte vers\u00e9 :</strong> ${order.deposit.toFixed(2)} G</p>`,
    `<p><strong>Reste \u00e0 payer :</strong> ${(order.totalAmount - order.deposit).toFixed(2)} G</p>`,
    order.notes ? `<p><strong>Notes :</strong> ${order.notes}</p>` : "",
    '<br/><button onclick="window.print()">Imprimer</button>',
    "</body></html>",
  ];
  const win = window.open("", "_blank");
  if (win) {
    win.document.write(parts.join(""));
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  }
}

function exportCSV(orders: Order[]) {
  const header =
    "Num\u00e9ro,Client,Cr\u00e9\u00e9e le,Livraison,Articles,Total (G),Acompte (G),Statut\n";
  const rows = orders
    .map((o) =>
      [
        `"${o.id.slice(-6).toUpperCase()}"`,
        `"${o.clientName}"`,
        `"${o.createdAt.slice(0, 10)}"`,
        `"${o.deliveryDate}"`,
        `"${o.items.map((i) => `${i.qty}x${i.name}`).join(" / ")}"`,
        o.totalAmount.toFixed(2),
        o.deposit.toFixed(2),
        `"${STATUS_LABELS[o.status]}"`,
      ].join(","),
    )
    .join("\n");
  const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `commandes_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

interface FormState {
  clientId: string;
  clientName: string;
  deliveryDate: string;
  deposit: string;
  notes: string;
  items: OrderItem[];
}

const blankForm = (): FormState => ({
  clientId: "",
  clientName: "",
  deliveryDate: new Date().toISOString().slice(0, 10),
  deposit: "0",
  notes: "",
  items: [],
});

export function OrdersPage() {
  const { state, dispatch } = useStore();
  const { orders, clients, products, settings } = state;

  const [filterStatus, setFilterStatus] = useState<OrderStatus | "all">("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);

  const [form, setForm] = useState<FormState>(blankForm());
  const [newItem, setNewItem] = useState({
    productId: "",
    qty: "1",
    unitPrice: "0",
  });

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (filterStatus !== "all" && o.status !== filterStatus) return false;
      if (filterDateFrom && o.deliveryDate < filterDateFrom) return false;
      if (filterDateTo && o.deliveryDate > filterDateTo) return false;
      return true;
    });
  }, [orders, filterStatus, filterDateFrom, filterDateTo]);

  const totalAmount = useMemo(
    () => form.items.reduce((s, i) => s + i.qty * i.unitPrice, 0),
    [form.items],
  );

  const openCreate = useCallback(() => {
    setEditOrder(null);
    setForm(blankForm());
    setNewItem({ productId: "", qty: "1", unitPrice: "0" });
    setShowForm(true);
  }, []);

  const openEdit = useCallback((order: Order) => {
    setEditOrder(order);
    setForm({
      clientId: order.clientId ?? "",
      clientName: order.clientName,
      deliveryDate: order.deliveryDate,
      deposit: String(order.deposit),
      notes: order.notes,
      items: [...order.items],
    });
    setNewItem({ productId: "", qty: "1", unitPrice: "0" });
    setShowForm(true);
  }, []);

  const handleClientChange = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    setForm((f) => ({
      ...f,
      clientId,
      clientName: client ? client.name : clientId,
    }));
  };

  const handleProductSelect = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    setNewItem({
      productId,
      qty: "1",
      unitPrice: product ? String(product.price) : "0",
    });
  };

  const handleAddItem = () => {
    const product = products.find((p) => p.id === newItem.productId);
    if (!product) return;
    const qty = Math.max(1, Number(newItem.qty));
    const unitPrice = Number(newItem.unitPrice) || product.price;
    setForm((f) => ({
      ...f,
      items: [
        ...f.items,
        { productId: product.id, name: product.name, qty, unitPrice },
      ],
    }));
    setNewItem({ productId: "", qty: "1", unitPrice: "0" });
  };

  const handleRemoveItem = (idx: number) => {
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  };

  const handleSave = () => {
    if (!form.clientName.trim() || form.items.length === 0) return;
    if (editOrder) {
      const updated: Order = {
        ...editOrder,
        clientId: form.clientId || null,
        clientName: form.clientName.trim(),
        deliveryDate: form.deliveryDate,
        deposit: Number(form.deposit) || 0,
        notes: form.notes,
        items: form.items,
        totalAmount,
      };
      dispatch({ type: "UPDATE_ORDER", payload: updated });
    } else {
      const newOrder: Order = {
        id: `ord_${Date.now()}`,
        clientId: form.clientId || null,
        clientName: form.clientName.trim(),
        items: form.items,
        status: "pending",
        createdAt: new Date().toISOString(),
        deliveryDate: form.deliveryDate,
        deposit: Number(form.deposit) || 0,
        notes: form.notes,
        totalAmount,
      };
      dispatch({ type: "ADD_ORDER", payload: newOrder });
    }
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Supprimer cette commande ?")) {
      dispatch({ type: "DELETE_ORDER", payload: id });
    }
  };

  const handleStatusChange = (order: Order, status: OrderStatus) => {
    dispatch({ type: "UPDATE_ORDER", payload: { ...order, status } });
  };

  const hasFilters =
    filterStatus !== "all" || filterDateFrom !== "" || filterDateTo !== "";

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Commandes
          </h1>
          <p className="text-sm text-muted-foreground">
            {orders.length} commande(s) au total
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportCSV(filtered)}
            data-ocid="orders.export_csv_button"
          >
            <FileText className="w-4 h-4 mr-1" /> Exporter CSV
          </Button>
          <Button size="sm" onClick={openCreate} data-ocid="orders.add_button">
            <FilePlus className="w-4 h-4 mr-1" /> Nouvelle commande
          </Button>
        </div>
      </div>

      <Card className="bg-card">
        <CardContent className="pt-4 pb-3">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Filter className="w-4 h-4" /> Filtres :
            </div>
            <div>
              <Label className="text-xs mb-1 block">Statut</Label>
              <Select
                value={filterStatus}
                onValueChange={(v) => setFilterStatus(v as OrderStatus | "all")}
              >
                <SelectTrigger
                  className="w-40 h-8 text-sm"
                  data-ocid="orders.filter_status.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  {STATUS_ORDER.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Livraison du</Label>
              <Input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="h-8 text-sm w-36"
                data-ocid="orders.filter_date_from.input"
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">au</Label>
              <Input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="h-8 text-sm w-36"
                data-ocid="orders.filter_date_to.input"
              />
            </div>
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterStatus("all");
                  setFilterDateFrom("");
                  setFilterDateTo("");
                }}
                data-ocid="orders.clear_filters_button"
              >
                <X className="w-3 h-3 mr-1" /> Effacer
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 text-center"
          data-ocid="orders.empty_state"
        >
          <FilePlus className="w-12 h-12 text-muted-foreground mb-3" />
          <p className="text-lg font-semibold text-foreground">
            Aucune commande
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            {hasFilters
              ? "Aucune commande ne correspond aux filtres."
              : "Cr\u00e9ez votre premi\u00e8re commande pour commencer."}
          </p>
          {!hasFilters && (
            <Button onClick={openCreate} data-ocid="orders.empty_add_button">
              <Plus className="w-4 h-4 mr-1" /> Nouvelle commande
            </Button>
          )}
        </div>
      ) : (
        <Card className="bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40 text-muted-foreground text-left">
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium">Cr\u00e9\u00e9e</th>
                  <th className="px-4 py-3 font-medium">Livraison</th>
                  <th className="px-4 py-3 font-medium">Articles</th>
                  <th className="px-4 py-3 font-medium text-right">Total</th>
                  <th className="px-4 py-3 font-medium text-right">Acompte</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 font-medium text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((order, idx) => (
                  <tr
                    key={order.id}
                    className="hover:bg-muted/20 transition-colors"
                    data-ocid={`orders.item.${idx + 1}`}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {order.id.slice(-6).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 font-medium truncate max-w-[140px]">
                      {order.clientName || (
                        <span className="text-muted-foreground">\u2014</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleDateString("fr-HT")}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {new Date(
                        `${order.deliveryDate}T00:00`,
                      ).toLocaleDateString("fr-HT")}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {order.items.length} article(s)
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">
                      {order.totalAmount.toFixed(2)} G
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                      {order.deposit.toFixed(2)} G
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={order.status}
                        onValueChange={(v) =>
                          handleStatusChange(order, v as OrderStatus)
                        }
                      >
                        <SelectTrigger
                          className="h-auto w-auto border-0 p-0 shadow-none focus:ring-0 bg-transparent"
                          data-ocid={`orders.status_select.${idx + 1}`}
                        >
                          <StatusBadge status={order.status} />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_ORDER.map((s) => (
                            <SelectItem key={s} value={s}>
                              <StatusBadge status={s} />
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setDetailOrder(order)}
                          data-ocid={`orders.view_button.${idx + 1}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => printOrder(order, settings.shopName)}
                          data-ocid={`orders.print_button.${idx + 1}`}
                        >
                          <Printer className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openEdit(order)}
                          data-ocid={`orders.edit_button.${idx + 1}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(order.id)}
                          data-ocid={`orders.delete_button.${idx + 1}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Dialog
        open={showForm}
        onOpenChange={(v) => {
          if (!v) setShowForm(false);
        }}
      >
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          data-ocid="orders.dialog"
        >
          <DialogHeader>
            <DialogTitle>
              {editOrder ? "Modifier la commande" : "Nouvelle commande"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm mb-1 block">
                  Client enregistr\u00e9
                </Label>
                <Select
                  value={form.clientId}
                  onValueChange={handleClientChange}
                >
                  <SelectTrigger data-ocid="orders.form_client.select">
                    <SelectValue placeholder="S\u00e9lectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm mb-1 block">
                  Nom du client (libre)
                </Label>
                <Input
                  value={form.clientName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, clientName: e.target.value }))
                  }
                  placeholder="Nom du client"
                  data-ocid="orders.form_client_name.input"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm mb-1 block">Date de livraison</Label>
                <Input
                  type="date"
                  value={form.deliveryDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, deliveryDate: e.target.value }))
                  }
                  data-ocid="orders.form_delivery_date.input"
                />
              </div>
              <div>
                <Label className="text-sm mb-1 block">
                  Acompte vers\u00e9 (G)
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.deposit}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, deposit: e.target.value }))
                  }
                  data-ocid="orders.form_deposit.input"
                />
              </div>
            </div>

            <Card className="bg-muted/30">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-sm">Ajouter un article</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 space-y-2">
                <div className="flex flex-wrap gap-2 items-end">
                  <div className="flex-1 min-w-[160px]">
                    <Label className="text-xs mb-1 block">Produit</Label>
                    <Select
                      value={newItem.productId}
                      onValueChange={handleProductSelect}
                    >
                      <SelectTrigger
                        className="h-8 text-sm"
                        data-ocid="orders.form_product.select"
                      >
                        <SelectValue placeholder="Choisir un produit" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} \u2014 {p.price} G
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-20">
                    <Label className="text-xs mb-1 block">Qt\u00e9</Label>
                    <Input
                      type="number"
                      min="1"
                      value={newItem.qty}
                      onChange={(e) =>
                        setNewItem((n) => ({ ...n, qty: e.target.value }))
                      }
                      className="h-8 text-sm"
                      data-ocid="orders.form_qty.input"
                    />
                  </div>
                  <div className="w-28">
                    <Label className="text-xs mb-1 block">Prix unit. (G)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newItem.unitPrice}
                      onChange={(e) =>
                        setNewItem((n) => ({ ...n, unitPrice: e.target.value }))
                      }
                      className="h-8 text-sm"
                      data-ocid="orders.form_unit_price.input"
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddItem}
                    disabled={!newItem.productId}
                    data-ocid="orders.form_add_item_button"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Ajouter
                  </Button>
                </div>
                {form.items.length > 0 && (
                  <div className="space-y-1 mt-2">
                    {form.items.map((item, idx) => (
                      <div
                        key={`${item.productId}-${idx}`}
                        className="flex items-center justify-between bg-background rounded px-3 py-1.5 text-sm"
                      >
                        <span className="font-medium min-w-0 truncate">
                          {item.name}
                        </span>
                        <span className="text-muted-foreground mx-2 shrink-0">
                          {item.qty} \u00d7 {item.unitPrice} G
                        </span>
                        <span className="font-semibold tabular-nums shrink-0">
                          {(item.qty * item.unitPrice).toFixed(2)} G
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 ml-2 text-destructive shrink-0"
                          onClick={() => handleRemoveItem(idx)}
                          data-ocid={`orders.form_remove_item.${idx + 1}`}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 border-t border-border text-sm font-bold px-3">
                      <span>Total commande</span>
                      <span className="tabular-nums">
                        {totalAmount.toFixed(2)} G
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div>
              <Label className="text-sm mb-1 block">Notes sp\u00e9ciales</Label>
              <Textarea
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                placeholder="Instructions particuli\u00e8res, allergies, d\u00e9coration\u2026"
                rows={3}
                data-ocid="orders.form_notes.textarea"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
                data-ocid="orders.form_cancel_button"
              >
                Annuler
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={!form.clientName.trim() || form.items.length === 0}
                data-ocid="orders.form_submit_button"
              >
                {editOrder ? "Enregistrer" : "Cr\u00e9er la commande"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {detailOrder && (
        <Dialog
          open={!!detailOrder}
          onOpenChange={(v) => {
            if (!v) setDetailOrder(null);
          }}
        >
          <DialogContent className="max-w-xl" data-ocid="orders.detail_dialog">
            <DialogHeader>
              <DialogTitle>
                D\u00e9tail \u2014 Commande #
                {detailOrder.id.slice(-6).toUpperCase()}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground">Client : </span>
                  <span className="font-medium">
                    {detailOrder.clientName || "\u2014"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Statut : </span>
                  <StatusBadge status={detailOrder.status} />
                </div>
                <div>
                  <span className="text-muted-foreground">
                    Cr\u00e9\u00e9e le :{" "}
                  </span>
                  {new Date(detailOrder.createdAt).toLocaleDateString("fr-HT")}
                </div>
                <div>
                  <span className="text-muted-foreground">Livraison : </span>
                  {new Date(
                    `${detailOrder.deliveryDate}T00:00`,
                  ).toLocaleDateString("fr-HT")}
                </div>
              </div>
              <div className="border-t border-border pt-3">
                <p className="font-semibold mb-2">Articles</p>
                <table className="w-full">
                  <thead>
                    <tr className="text-muted-foreground text-xs">
                      <th className="text-left pb-1">Article</th>
                      <th className="text-center pb-1">Qt\u00e9</th>
                      <th className="text-right pb-1">Prix unit.</th>
                      <th className="text-right pb-1">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {detailOrder.items.map((item, idx) => (
                      <tr key={`${item.productId}-${item.name}-${idx}`}>
                        <td className="py-1">{item.name}</td>
                        <td className="py-1 text-center">{item.qty}</td>
                        <td className="py-1 text-right tabular-nums">
                          {item.unitPrice.toFixed(2)} G
                        </td>
                        <td className="py-1 text-right tabular-nums font-medium">
                          {(item.qty * item.unitPrice).toFixed(2)} G
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-border pt-3 space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Montant total</span>
                  <span className="font-bold tabular-nums">
                    {detailOrder.totalAmount.toFixed(2)} G
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Acompte vers\u00e9
                  </span>
                  <span className="tabular-nums">
                    {detailOrder.deposit.toFixed(2)} G
                  </span>
                </div>
                <div className="flex justify-between text-primary font-semibold">
                  <span>Reste \u00e0 payer</span>
                  <span className="tabular-nums">
                    {(detailOrder.totalAmount - detailOrder.deposit).toFixed(2)}{" "}
                    G
                  </span>
                </div>
              </div>
              {detailOrder.notes && (
                <div className="border-t border-border pt-3">
                  <p className="text-muted-foreground text-xs mb-1">Notes</p>
                  <p className="whitespace-pre-wrap">{detailOrder.notes}</p>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => printOrder(detailOrder, settings.shopName)}
                  data-ocid="orders.detail_print_button"
                >
                  <Printer className="w-4 h-4 mr-1" /> Imprimer la fiche
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const o = detailOrder;
                    setDetailOrder(null);
                    openEdit(o);
                  }}
                  data-ocid="orders.detail_edit_button"
                >
                  <Pencil className="w-4 h-4 mr-1" /> Modifier
                </Button>
                <Button
                  type="button"
                  onClick={() => setDetailOrder(null)}
                  data-ocid="orders.detail_close_button"
                >
                  Fermer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
