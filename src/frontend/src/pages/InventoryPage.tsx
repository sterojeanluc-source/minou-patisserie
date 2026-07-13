import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import type { AuditEntry, Product } from "@/types";
import {
  AlertTriangle,
  ArrowUpDown,
  Package,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProductFormData {
  name: string;
  category: string;
  price: string;
  stock: string;
  lowStockThreshold: string;
}

const EMPTY_FORM: ProductFormData = {
  name: "",
  category: "",
  price: "",
  stock: "",
  lowStockThreshold: "",
};

// ─── Stock Adjustment Modal ───────────────────────────────────────────────────

interface StockAdjustModalProps {
  product: Product | null;
  onClose: () => void;
  onConfirm: (productId: string, delta: number) => void;
}

function StockAdjustModal({
  product,
  onClose,
  onConfirm,
}: StockAdjustModalProps) {
  const [delta, setDelta] = useState("");

  if (!product) return null;

  const handleConfirm = () => {
    const num = Number.parseInt(delta, 10);
    if (Number.isNaN(num) || num === 0) return;
    onConfirm(product.id, num);
    setDelta("");
    onClose();
  };

  const parsed = Number.parseInt(delta, 10);
  const newStock = Number.isNaN(parsed)
    ? product.stock
    : Math.max(0, product.stock + parsed);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm" data-ocid="stock_adjust.dialog">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">
            Ajuster le stock
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-lg bg-muted/60 px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Produit</span>
            <span className="font-medium text-foreground">{product.name}</span>
          </div>
          <div className="rounded-lg bg-muted/60 px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Stock actuel</span>
            <span className="font-semibold text-foreground">
              {product.stock}
            </span>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="delta-input">
              Variation (+ pour ajouter, − pour retirer)
            </Label>
            <Input
              id="delta-input"
              type="number"
              placeholder="ex: 10 ou -5"
              value={delta}
              onChange={(e) => setDelta(e.target.value)}
              data-ocid="stock_adjust.input"
              autoFocus
            />
          </div>

          {delta && !Number.isNaN(parsed) && parsed !== 0 && (
            <div className="rounded-lg bg-accent/40 px-4 py-2.5 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Nouveau stock
              </span>
              <span className="font-semibold text-accent-foreground">
                {newStock}
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            data-ocid="stock_adjust.cancel_button"
          >
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!delta || Number.isNaN(parsed) || parsed === 0}
            data-ocid="stock_adjust.confirm_button"
          >
            Confirmer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── PIN Confirm Modal ────────────────────────────────────────────────────────

interface PinModalProps {
  productName: string;
  onClose: () => void;
  onConfirm: (pin: string) => void;
}

function PinModal({ productName, onClose, onConfirm }: PinModalProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  const handleConfirm = () => {
    if (!pin.trim()) return;
    onConfirm(pin);
    setPin("");
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm" data-ocid="pin_confirm.dialog">
        <DialogHeader>
          <DialogTitle className="font-display text-lg text-destructive">
            Supprimer le produit
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Entrez le PIN administrateur pour supprimer{" "}
            <span className="font-semibold text-foreground">
              «{productName}»
            </span>
            .
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="pin-input">PIN administrateur</Label>
            <Input
              id="pin-input"
              type="password"
              inputMode="numeric"
              maxLength={6}
              placeholder="• • • •"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError(false);
              }}
              data-ocid="pin_confirm.input"
              autoFocus
            />
            {error && (
              <p
                className="text-xs text-destructive"
                data-ocid="pin_confirm.error_state"
              >
                PIN incorrect. Réessayez.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            data-ocid="pin_confirm.cancel_button"
          >
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!pin.trim()}
            data-ocid="pin_confirm.confirm_button"
          >
            Supprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Product Form ─────────────────────────────────────────────────────────────

interface ProductFormProps {
  form: ProductFormData;
  editingId: string | null;
  onChange: (field: keyof ProductFormData, value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

function ProductForm({
  form,
  editingId,
  onChange,
  onSubmit,
  onCancel,
}: ProductFormProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-5 max-w-lg">
      <h3 className="font-display font-semibold text-foreground text-base">
        {editingId ? "Modifier le produit" : "Ajouter un produit"}
      </h3>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="prod-name">Nom du produit</Label>
          <Input
            id="prod-name"
            placeholder="ex: Tarte Citron Meringuée"
            value={form.name}
            onChange={(e) => onChange("name", e.target.value)}
            data-ocid="product_form.name_input"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="prod-category">Catégorie</Label>
          <Input
            id="prod-category"
            placeholder="ex: Tartes"
            value={form.category}
            onChange={(e) => onChange("category", e.target.value)}
            data-ocid="product_form.category_input"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="prod-price">Prix unitaire (G)</Label>
          <Input
            id="prod-price"
            type="number"
            min="0"
            step="1"
            placeholder="0"
            value={form.price}
            onChange={(e) => onChange("price", e.target.value)}
            data-ocid="product_form.price_input"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="prod-stock">Stock initial</Label>
          <Input
            id="prod-stock"
            type="number"
            min="0"
            step="1"
            placeholder="0"
            value={form.stock}
            onChange={(e) => onChange("stock", e.target.value)}
            data-ocid="product_form.stock_input"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="prod-threshold">Seuil d'alerte stock</Label>
          <Input
            id="prod-threshold"
            type="number"
            min="0"
            step="1"
            placeholder="0"
            value={form.lowStockThreshold}
            onChange={(e) => onChange("lowStockThreshold", e.target.value)}
            data-ocid="product_form.threshold_input"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        <Button
          onClick={onSubmit}
          disabled={!form.name.trim()}
          data-ocid="product_form.submit_button"
        >
          Enregistrer
        </Button>
        <Button
          variant="outline"
          onClick={onCancel}
          data-ocid="product_form.cancel_button"
        >
          Annuler
        </Button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function InventoryPage() {
  const { state, dispatch } = useStore();
  const { currentUser, verifyPin } = useAuth();

  const [activeTab, setActiveTab] = useState("inventaire");
  const [form, setForm] = useState<ProductFormData>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [adjustTarget, setAdjustTarget] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [pinError, setPinError] = useState(false);

  const isAdmin = currentUser?.role === "admin";
  const products = state.products;
  const lowStockCount = products.filter(
    (p) => p.stock <= p.lowStockThreshold,
  ).length;

  // ── Form helpers ──────────────────────────────────────────────────────────

  const handleFormChange = (field: keyof ProductFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditProduct = (product: Product) => {
    setForm({
      name: product.name,
      category: product.category,
      price: String(product.price),
      stock: String(product.stock),
      lowStockThreshold: String(product.lowStockThreshold),
    });
    setEditingId(product.id);
    setActiveTab("ajouter");
  };

  const handleCancelForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const handleSubmitForm = () => {
    const name = form.name.trim();
    const category = form.category.trim();
    const price = Number.parseFloat(form.price) || 0;
    const stock = Number.parseInt(form.stock, 10) || 0;
    const lowStockThreshold = Number.parseInt(form.lowStockThreshold, 10) || 0;
    if (!name) return;

    if (editingId) {
      const updated: Product = {
        id: editingId,
        name,
        category,
        price,
        stock,
        lowStockThreshold,
      };
      dispatch({ type: "UPDATE_PRODUCT", payload: updated });
      dispatch({
        type: "ADD_AUDIT",
        payload: auditEntry(
          currentUser?.id ?? "unknown",
          "product_updated",
          `Produit modifié: ${name}`,
        ),
      });
    } else {
      const newProduct: Product = {
        id: `p-${Date.now()}`,
        name,
        category,
        price,
        stock,
        lowStockThreshold,
      };
      dispatch({ type: "ADD_PRODUCT", payload: newProduct });
      dispatch({
        type: "ADD_AUDIT",
        payload: auditEntry(
          currentUser?.id ?? "unknown",
          "product_added",
          `Produit ajouté: ${name}`,
        ),
      });
    }
    setForm(EMPTY_FORM);
    setEditingId(null);
    setActiveTab("inventaire");
  };

  // ── Stock adjustment ──────────────────────────────────────────────────────

  const handleConfirmAdjust = (productId: string, delta: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const newStock = Math.max(0, product.stock + delta);
    dispatch({
      type: "UPDATE_PRODUCT",
      payload: { ...product, stock: newStock },
    });
    dispatch({
      type: "ADD_AUDIT",
      payload: auditEntry(
        currentUser?.id ?? "unknown",
        "stock_adjustment",
        `${product.name}: ${delta > 0 ? "+" : ""}${delta} → stock=${newStock}`,
      ),
    });
  };

  // ── Delete with PIN ───────────────────────────────────────────────────────

  const handleConfirmDelete = (pin: string) => {
    if (!deleteTarget) return;
    if (!verifyPin(pin)) {
      setPinError(true);
      return;
    }
    dispatch({ type: "DELETE_PRODUCT", payload: deleteTarget.id });
    dispatch({
      type: "ADD_AUDIT",
      payload: auditEntry(
        currentUser?.id ?? "unknown",
        "product_deleted",
        `Produit supprimé: ${deleteTarget.name}`,
      ),
    });
    setDeleteTarget(null);
    setPinError(false);
  };

  return (
    <div className="space-y-6" data-ocid="inventory.page">
      {/* Header */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              Inventaire
            </h1>
            <p className="text-sm text-muted-foreground">
              {products.length} produit{products.length !== 1 ? "s" : ""} au
              catalogue
            </p>
          </div>
          {lowStockCount > 0 && (
            <Badge
              variant="destructive"
              className="ml-auto flex items-center gap-1"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              {lowStockCount} stock{lowStockCount > 1 ? "s" : ""} faible
              {lowStockCount > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        data-ocid="inventory.tab"
      >
        <TabsList className="mb-4">
          <TabsTrigger value="inventaire" data-ocid="inventory.inventaire_tab">
            Inventaire
          </TabsTrigger>
          <TabsTrigger value="ajouter" data-ocid="inventory.ajouter_tab">
            {editingId ? "Modifier produit" : "Ajouter / Modifier"}
          </TabsTrigger>
        </TabsList>

        {/* ── Tab 1 : Inventaire ──────────────────────────────────────────── */}
        <TabsContent value="inventaire">
          {products.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-20 text-center"
              data-ocid="inventory.empty_state"
            >
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <Package className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="font-display font-semibold text-foreground text-lg mb-1">
                Aucun produit
              </p>
              <p className="text-sm text-muted-foreground mb-5">
                Ajoutez votre premier produit pour commencer.
              </p>
              <Button
                onClick={() => setActiveTab("ajouter")}
                data-ocid="inventory.add_first_button"
              >
                <Plus className="w-4 h-4 mr-2" /> Ajouter un produit
              </Button>
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <Table data-ocid="inventory.table">
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Nom</TableHead>
                    <TableHead className="font-semibold">Catégorie</TableHead>
                    <TableHead className="font-semibold text-right">
                      Prix (G)
                    </TableHead>
                    <TableHead className="font-semibold text-right">
                      Stock actuel
                    </TableHead>
                    <TableHead className="font-semibold text-right">
                      Seuil alerte
                    </TableHead>
                    <TableHead className="font-semibold text-center">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product, index) => {
                    const isLow = product.stock <= product.lowStockThreshold;
                    return (
                      <TableRow
                        key={product.id}
                        className={
                          isLow
                            ? "bg-amber-50/60 dark:bg-amber-950/20 hover:bg-amber-100/50 dark:hover:bg-amber-900/30"
                            : ""
                        }
                        data-ocid={`inventory.item.${index + 1}`}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {isLow && (
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            )}
                            <span
                              className={
                                isLow
                                  ? "text-amber-700 dark:text-amber-400"
                                  : ""
                              }
                            >
                              {product.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-normal">
                            {product.category || "—"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {product.price.toLocaleString("fr")} G
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          <span
                            className={
                              isLow
                                ? "font-semibold text-amber-600 dark:text-amber-400"
                                : "font-medium"
                            }
                          >
                            {product.stock}
                          </span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {product.lowStockThreshold}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2.5 text-xs"
                              onClick={() => setAdjustTarget(product)}
                              data-ocid={`inventory.adjust_button.${index + 1}`}
                            >
                              <ArrowUpDown className="w-3.5 h-3.5 mr-1" />
                              Ajustement
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0"
                              onClick={() => handleEditProduct(product)}
                              data-ocid={`inventory.edit_button.${index + 1}`}
                              aria-label="Modifier"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            {isAdmin && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
                                onClick={() => {
                                  setDeleteTarget(product);
                                  setPinError(false);
                                }}
                                data-ocid={`inventory.delete_button.${index + 1}`}
                                aria-label="Supprimer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* ── Tab 2 : Ajouter / Modifier ──────────────────────────────────── */}
        <TabsContent value="ajouter">
          <ProductForm
            form={form}
            editingId={editingId}
            onChange={handleFormChange}
            onSubmit={handleSubmitForm}
            onCancel={handleCancelForm}
          />
        </TabsContent>
      </Tabs>

      {/* ── Modals ───────────────────────────────────────────────────────── */}
      <StockAdjustModal
        product={adjustTarget}
        onClose={() => setAdjustTarget(null)}
        onConfirm={handleConfirmAdjust}
      />

      {deleteTarget && (
        <PinModal
          productName={deleteTarget.name}
          onClose={() => {
            setDeleteTarget(null);
            setPinError(false);
          }}
          onConfirm={handleConfirmDelete}
        />
      )}

      {/* PIN error surfaced outside modal if needed */}
      {pinError && !deleteTarget && (
        <p
          className="text-xs text-destructive"
          data-ocid="inventory.pin_error_state"
        >
          PIN incorrect. L'opération a été annulée.
        </p>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function auditEntry(
  userId: string,
  action: string,
  details: string,
): AuditEntry {
  return {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    userId,
    action,
    details,
  };
}
