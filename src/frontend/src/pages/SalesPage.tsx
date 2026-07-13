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
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useStore } from "@/hooks/useStore";
import type { Client, Product, Sale, SaleItem } from "@/types";
import {
  AlertCircle,
  CheckCircle,
  Download,
  Minus,
  Plus,
  Printer,
  ShieldCheck,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CartItem {
  product: Product;
  qty: number;
}

type PaymentMode = "cash" | "credit";

// ─── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({
  product,
  onAdd,
}: {
  product: Product;
  onAdd: (product: Product, qty: number) => void;
}) {
  const [qty, setQty] = useState(1);
  const disabled = product.stock === 0;

  const handleAdd = () => {
    onAdd(product, qty);
    setQty(1);
  };

  return (
    <Card
      data-ocid={`sales.product_card.${product.id}`}
      className={[
        "transition-smooth",
        disabled ? "opacity-50" : "hover:shadow-md hover:border-primary/30",
      ].join(" ")}
    >
      <CardContent className="p-3">
        <div className="mb-2">
          <div className="flex items-start justify-between gap-1 mb-0.5">
            <p className="text-sm font-semibold text-foreground leading-snug">
              {product.name}
            </p>
            {disabled && (
              <Badge
                variant="destructive"
                className="text-[10px] flex-shrink-0"
              >
                Epuisé
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{product.category}</p>
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-base font-bold text-primary">
            {product.price} G
          </span>
          <Badge
            variant={
              product.stock <= product.lowStockThreshold
                ? "destructive"
                : "secondary"
            }
            className="text-[10px]"
          >
            {product.stock} en stock
          </Badge>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center border border-input rounded-md overflow-hidden">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={disabled || qty <= 1}
              className="px-2 py-1.5 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors disabled:opacity-40"
              aria-label="Diminuer"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="px-3 text-sm font-medium text-foreground min-w-[2rem] text-center">
              {qty}
            </span>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
              disabled={disabled || qty >= product.stock}
              className="px-2 py-1.5 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors disabled:opacity-40"
              aria-label="Augmenter"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
          <Button
            type="button"
            size="sm"
            className="flex-1 text-xs"
            onClick={handleAdd}
            disabled={disabled}
            data-ocid={`sales.add_to_cart_button.${product.id}`}
          >
            <ShoppingCart className="w-3 h-3 mr-1" />
            Ajouter
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Cart Item Row ─────────────────────────────────────────────────────────────

function CartRow({
  item,
  index,
  onRemove,
}: {
  item: CartItem;
  index: number;
  onRemove: (productId: string) => void;
}) {
  const lineTotal = item.qty * item.product.price;
  return (
    <div
      data-ocid={`sales.cart.item.${index + 1}`}
      className="flex items-center gap-2 py-2 border-b border-border/50 last:border-0"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {item.product.name}
        </p>
        <p className="text-xs text-muted-foreground">
          {item.qty} × {item.product.price} G
        </p>
      </div>
      <span className="text-sm font-semibold text-foreground flex-shrink-0">
        {lineTotal} G
      </span>
      <button
        type="button"
        onClick={() => onRemove(item.product.id)}
        className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
        aria-label="Supprimer"
        data-ocid={`sales.cart.delete_button.${index + 1}`}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Receipt Modal ─────────────────────────────────────────────────────────────

interface ReceiptData {
  saleId: string;
  date: string;
  items: CartItem[];
  total: number;
  paymentMode: PaymentMode;
  client: Client | null;
  cashReceived: number;
  shopName: string;
}

function ReceiptModal({
  receipt,
  onClose,
}: {
  receipt: ReceiptData;
  onClose: () => void;
}) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  const receiptNumber = receipt.saleId.replace("sale_", "").slice(-8);
  const change =
    receipt.paymentMode === "cash" && receipt.cashReceived > 0
      ? receipt.cashReceived - receipt.total
      : 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Print styles injected into the document */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #receipt-print-area { display: block !important; }
          #receipt-print-area * { display: revert !important; }
        }
        #receipt-print-area { display: none; }
      `}</style>

      {/* Screen overlay */}
      <div
        data-ocid="sales.receipt_modal"
        className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
      >
        <Card className="w-full max-w-sm shadow-2xl relative">
          <button
            type="button"
            onClick={onClose}
            data-ocid="sales.receipt_modal.close_button"
            className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-muted/60 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Fermer le reçu"
          >
            <X className="w-4 h-4" />
          </button>

          <CardContent className="p-5">
            {/* Receipt content */}
            <div
              ref={receiptRef}
              className="font-mono text-[13px] text-foreground space-y-2"
            >
              {/* Header */}
              <div className="text-center space-y-0.5">
                <p className="text-xl font-bold tracking-widest uppercase">
                  {receipt.shopName}
                </p>
                <p className="text-xs text-muted-foreground">
                  Pâtisserie & Boulangerie
                </p>
                <Separator className="my-2" />
                <p className="font-bold uppercase tracking-wide text-sm">
                  REÇU DE VENTE
                </p>
                <p className="text-xs text-muted-foreground">
                  N° {receiptNumber}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(receipt.date)}
                </p>
              </div>

              <Separator className="my-1" />

              {/* Articles */}
              <div className="space-y-1">
                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border pb-1">
                  <span>Article</span>
                  <span className="text-right">Qté</span>
                  <span className="text-right">P.U.</span>
                  <span className="text-right">Total</span>
                </div>
                {receipt.items.map((item) => {
                  const lineTotal = item.qty * item.product.price;
                  return (
                    <div
                      key={item.product.id}
                      className="grid grid-cols-[1fr_auto_auto_auto] gap-x-2 text-xs"
                    >
                      <span className="truncate">{item.product.name}</span>
                      <span className="text-right">{item.qty}</span>
                      <span className="text-right whitespace-nowrap">
                        {item.product.price} G
                      </span>
                      <span className="text-right font-medium whitespace-nowrap">
                        {lineTotal} G
                      </span>
                    </div>
                  );
                })}
              </div>

              <Separator className="my-1" />

              {/* Totals */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Sous-total</span>
                  <span>{receipt.total} G</span>
                </div>
                <div className="flex justify-between font-bold text-base border-t border-border pt-1">
                  <span>TOTAL</span>
                  <span>{receipt.total} G</span>
                </div>
              </div>

              {/* Payment info */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Mode de paiement
                  </span>
                  <span className="font-medium">
                    {receipt.paymentMode === "cash" ? "Espèces" : "Crédit"}
                  </span>
                </div>
                {receipt.paymentMode === "cash" && receipt.cashReceived > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Montant reçu
                      </span>
                      <span>{receipt.cashReceived} G</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span className="text-muted-foreground">
                        Monnaie rendue
                      </span>
                      <span className={change < 0 ? "text-destructive" : ""}>
                        {change} G
                      </span>
                    </div>
                  </>
                )}
                {receipt.paymentMode === "credit" && receipt.client && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Client</span>
                      <span className="font-medium">{receipt.client.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Solde crédit
                      </span>
                      <span className="text-destructive font-medium">
                        {receipt.client.creditBalance + receipt.total} G
                      </span>
                    </div>
                  </>
                )}
              </div>

              <Separator className="my-2" />

              {/* Footer */}
              <div className="text-center text-xs text-muted-foreground space-y-0.5">
                <p className="font-medium">Merci pour votre achat!</p>
                <p>À bientôt chez {receipt.shopName} 🧁</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1 gap-1.5 text-xs"
                onClick={onClose}
                data-ocid="sales.receipt_modal.cancel_button"
              >
                <X className="w-3.5 h-3.5" />
                Fermer
              </Button>
              <Button
                type="button"
                className="flex-1 gap-1.5 text-xs"
                onClick={handlePrint}
                data-ocid="sales.receipt_modal.print_button"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hidden print-only area */}
      <div id="receipt-print-area" aria-hidden="true">
        <div
          style={{
            fontFamily: "monospace",
            fontSize: "12px",
            maxWidth: "300px",
            margin: "0 auto",
            padding: "16px",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "8px" }}>
            <div
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                letterSpacing: "2px",
                textTransform: "uppercase",
              }}
            >
              {receipt.shopName}
            </div>
            <div style={{ fontSize: "10px", color: "#666" }}>
              Pâtisserie & Boulangerie
            </div>
            <hr style={{ margin: "8px 0" }} />
            <div
              style={{
                fontWeight: "bold",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              REÇU DE VENTE
            </div>
            <div style={{ fontSize: "10px", color: "#666" }}>
              N° {receiptNumber}
            </div>
            <div style={{ fontSize: "10px", color: "#666" }}>
              {formatDateTime(receipt.date)}
            </div>
          </div>
          <hr style={{ margin: "8px 0" }} />
          <table
            style={{
              width: "100%",
              fontSize: "11px",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr style={{ borderBottom: "1px solid #ccc" }}>
                <th style={{ textAlign: "left", padding: "2px 0" }}>Article</th>
                <th style={{ textAlign: "right", padding: "2px 4px" }}>Qté</th>
                <th style={{ textAlign: "right", padding: "2px 4px" }}>P.U.</th>
                <th style={{ textAlign: "right", padding: "2px 0" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {receipt.items.map((item) => (
                <tr key={item.product.id}>
                  <td style={{ padding: "2px 0" }}>{item.product.name}</td>
                  <td style={{ textAlign: "right", padding: "2px 4px" }}>
                    {item.qty}
                  </td>
                  <td style={{ textAlign: "right", padding: "2px 4px" }}>
                    {item.product.price} G
                  </td>
                  <td style={{ textAlign: "right", padding: "2px 0" }}>
                    {item.qty * item.product.price} G
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <hr style={{ margin: "8px 0" }} />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "11px",
              marginBottom: "2px",
            }}
          >
            <span>Sous-total</span>
            <span>{receipt.total} G</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontWeight: "bold",
              fontSize: "14px",
              borderTop: "1px solid #ccc",
              paddingTop: "4px",
              marginBottom: "8px",
            }}
          >
            <span>TOTAL</span>
            <span>{receipt.total} G</span>
          </div>
          <div style={{ fontSize: "11px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "2px",
              }}
            >
              <span>Mode de paiement</span>
              <span>
                {receipt.paymentMode === "cash" ? "Espèces" : "Crédit"}
              </span>
            </div>
            {receipt.paymentMode === "cash" && receipt.cashReceived > 0 && (
              <>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "2px",
                  }}
                >
                  <span>Montant reçu</span>
                  <span>{receipt.cashReceived} G</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "2px",
                  }}
                >
                  <span>Monnaie rendue</span>
                  <span>{change} G</span>
                </div>
              </>
            )}
            {receipt.paymentMode === "credit" && receipt.client && (
              <>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "2px",
                  }}
                >
                  <span>Client</span>
                  <span>{receipt.client.name}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "2px",
                  }}
                >
                  <span>Solde crédit</span>
                  <span>{receipt.client.creditBalance + receipt.total} G</span>
                </div>
              </>
            )}
          </div>
          <hr style={{ margin: "8px 0" }} />
          <div style={{ textAlign: "center", fontSize: "11px", color: "#666" }}>
            <div style={{ fontWeight: "bold" }}>Merci pour votre achat!</div>
            <div>À bientôt chez {receipt.shopName}</div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Nouvelle Vente Tab ────────────────────────────────────────────────────────

function NouvelleVente() {
  const { state, dispatch } = useStore();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [clientId, setClientId] = useState<string>("none");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("cash");
  const [cashReceived, setCashReceived] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.qty * item.product.price, 0),
    [cart],
  );

  const handleAddToCart = (product: Product, qty: number) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id
            ? { ...i, qty: Math.min(i.qty + qty, product.stock) }
            : i,
        );
      }
      return [...prev, { product, qty }];
    });
    setSuccessMsg(null);
    setErrorMsg(null);
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const handleConfirm = () => {
    if (cart.length === 0) return;

    if (paymentMode === "credit" && clientId === "none") {
      setErrorMsg("Veuillez sélectionner un client pour une vente à crédit.");
      return;
    }

    const now = new Date().toISOString();
    const saleItems: SaleItem[] = cart.map((i) => ({
      productId: i.product.id,
      name: i.product.name,
      qty: i.qty,
      unitPrice: i.product.price,
    }));

    const saleId = `sale_${Date.now()}`;
    const sale: Sale = {
      id: saleId,
      date: now,
      items: saleItems,
      clientId: clientId !== "none" ? clientId : null,
      paymentMethod: paymentMode,
      total: cartTotal,
    };

    // Add sale
    dispatch({ type: "ADD_SALE", payload: sale });

    // Deduct stock from products
    for (const item of cart) {
      const product = state.products.find((p) => p.id === item.product.id);
      if (product) {
        dispatch({
          type: "UPDATE_PRODUCT",
          payload: { ...product, stock: product.stock - item.qty },
        });
      }
    }

    // Update client credit if credit sale
    const client =
      clientId !== "none"
        ? (state.clients.find((c) => c.id === clientId) ?? null)
        : null;
    if (paymentMode === "credit" && client) {
      dispatch({
        type: "UPDATE_CLIENT",
        payload: {
          ...client,
          creditBalance: client.creditBalance + cartTotal,
          totalPurchases: client.totalPurchases + cartTotal,
        },
      });
    } else if (client) {
      // Cash sale for known client — update total purchases only
      dispatch({
        type: "UPDATE_CLIENT",
        payload: {
          ...client,
          totalPurchases: client.totalPurchases + cartTotal,
        },
      });
    }

    // Show receipt modal
    setReceipt({
      saleId,
      date: now,
      items: [...cart],
      total: cartTotal,
      paymentMode,
      client,
      cashReceived: cashReceived ? Number(cashReceived) : 0,
      shopName: state.settings.shopName,
    });

    setSuccessMsg(null);
    setErrorMsg(null);
    setCart([]);
    setClientId("none");
    setPaymentMode("cash");
    setCashReceived("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
      {/* Product Catalog */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Catalogue produits
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {state.products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAdd={handleAddToCart}
            />
          ))}
        </div>
        {state.products.length === 0 && (
          <div
            data-ocid="sales.products_empty_state"
            className="text-center py-12"
          >
            <p className="text-sm text-muted-foreground">
              Aucun produit disponible. Ajoutez des produits dans le module
              Inventaire.
            </p>
          </div>
        )}
      </div>

      {/* Cart */}
      <div className="flex flex-col gap-3">
        <Card data-ocid="sales.cart_panel">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-primary" />
              Panier
              {cart.length > 0 && (
                <Badge variant="secondary" className="ml-auto text-xs">
                  {cart.length} article{cart.length > 1 ? "s" : ""}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {cart.length === 0 ? (
              <div
                data-ocid="sales.cart_empty_state"
                className="text-center py-6"
              >
                <ShoppingCart className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">
                  Le panier est vide
                </p>
              </div>
            ) : (
              <div className="space-y-0">
                {cart.map((item, idx) => (
                  <CartRow
                    key={item.product.id}
                    item={item}
                    index={idx}
                    onRemove={handleRemoveFromCart}
                  />
                ))}
              </div>
            )}

            {cart.length > 0 && (
              <>
                <Separator className="my-3" />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">
                    Total
                  </span>
                  <span className="text-lg font-bold text-primary">
                    {cartTotal} G
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Options */}
        <Card data-ocid="sales.options_panel">
          <CardContent className="p-4 space-y-4">
            {/* Client Selector */}
            <div className="space-y-1.5">
              <Label htmlFor="client-select" className="text-xs font-medium">
                Client (optionnel)
              </Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger
                  id="client-select"
                  data-ocid="sales.client_select"
                >
                  <SelectValue placeholder="Vente comptoir" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Vente comptoir</SelectItem>
                  {state.clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                      {client.creditBalance > 0 && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          (crédit: {client.creditBalance} G)
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Payment Method */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Mode de paiement</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMode("cash")}
                  data-ocid="sales.payment_cash_radio"
                  className={[
                    "flex-1 py-2 px-3 rounded-md text-sm font-medium border transition-smooth",
                    paymentMode === "cash"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-input hover:bg-accent/40",
                  ].join(" ")}
                >
                  Espèces
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMode("credit")}
                  data-ocid="sales.payment_credit_radio"
                  className={[
                    "flex-1 py-2 px-3 rounded-md text-sm font-medium border transition-smooth",
                    paymentMode === "credit"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-input hover:bg-accent/40",
                  ].join(" ")}
                >
                  Crédit
                </button>
              </div>
              {paymentMode === "credit" && clientId === "none" && (
                <p className="text-xs text-destructive mt-1">
                  Un client doit être sélectionné pour une vente à crédit.
                </p>
              )}
            </div>

            {/* Cash received (optional) */}
            {paymentMode === "cash" && cart.length > 0 && (
              <div className="space-y-1.5">
                <Label htmlFor="cash-received" className="text-xs font-medium">
                  Montant reçu (optionnel)
                </Label>
                <Input
                  id="cash-received"
                  data-ocid="sales.cash_received_input"
                  type="number"
                  min={cartTotal}
                  placeholder={`${cartTotal} G minimum`}
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  className="text-sm"
                />
                {cashReceived && Number(cashReceived) >= cartTotal && (
                  <p className="text-xs text-primary">
                    Monnaie à rendre : {Number(cashReceived) - cartTotal} G
                  </p>
                )}
              </div>
            )}

            {/* Feedback */}
            {successMsg && (
              <div
                data-ocid="sales.success_state"
                className="flex items-start gap-2 rounded-lg border border-border bg-muted p-3 text-sm text-foreground"
              >
                <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}
            {errorMsg && (
              <div
                data-ocid="sales.error_state"
                className="flex items-start gap-2 text-sm bg-destructive/10 border border-destructive/20 text-destructive rounded-md p-3"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <Button
              type="button"
              className="w-full"
              onClick={handleConfirm}
              disabled={
                cart.length === 0 ||
                (paymentMode === "credit" && clientId === "none")
              }
              data-ocid="sales.confirm_button"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Valider la vente{cart.length > 0 ? ` — ${cartTotal} G` : ""}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Receipt modal */}
      {receipt && (
        <ReceiptModal receipt={receipt} onClose={() => setReceipt(null)} />
      )}
    </div>
  );
}

// ─── PIN Delete Modal ────────────────────────────────────────────────────────

function PinDeleteModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: (pin: string) => void;
  onCancel: () => void;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const { verifyPin } = useAuth();

  const handleSubmit = () => {
    if (!verifyPin(pin)) {
      setError("PIN incorrect. Veuillez réessayer.");
      setPin("");
      return;
    }
    onConfirm(pin);
  };

  return (
    <div
      data-ocid="sales.pin_delete_modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
      onKeyDown={(e) => e.key === "Escape" && onCancel()}
    >
      <Card className="w-full max-w-xs shadow-2xl relative">
        <button
          type="button"
          onClick={onCancel}
          data-ocid="sales.pin_delete_modal.close_button"
          className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-muted/60 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Fermer"
        >
          <X className="w-4 h-4" />
        </button>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-4 h-4 text-destructive" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Confirmer la suppression
              </p>
              <p className="text-xs text-muted-foreground">
                Entrez le PIN administrateur
              </p>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="delete-pin" className="text-xs font-medium">
              PIN administrateur
            </Label>
            <Input
              id="delete-pin"
              data-ocid="sales.pin_delete_modal.input"
              type="password"
              placeholder="••••"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              autoFocus
              className="text-sm text-center tracking-widest"
            />
            {error && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {error}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 text-xs"
              onClick={onCancel}
              data-ocid="sales.pin_delete_modal.cancel_button"
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="flex-1 text-xs"
              onClick={handleSubmit}
              disabled={pin.length === 0}
              data-ocid="sales.pin_delete_modal.confirm_button"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Supprimer
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Historique Tab ────────────────────────────────────────────────────────────

function Historique() {
  const { state, dispatch } = useStore();
  const { currentUser } = useAuth();

  const [reprintSale, setReprintSale] = useState<Sale | null>(null);
  const [deleteSaleId, setDeleteSaleId] = useState<string | null>(null);

  const sortedSales = useMemo(
    () => [...state.sales].sort((a, b) => b.date.localeCompare(a.date)),
    [state.sales],
  );

  const getClientName = (clientId: string | null) => {
    if (!clientId) return "Comptoir";
    return (
      state.clients.find((c) => c.id === clientId)?.name ?? "Client inconnu"
    );
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const handleExportCSV = () => {
    const rows: string[] = [
      [
        "Date",
        "Client",
        "Articles",
        "Quantité",
        "Prix unitaire",
        "Total ligne",
        "Total vente",
        "Mode",
      ].join(";"),
    ];
    for (const sale of sortedSales) {
      for (const item of sale.items) {
        rows.push(
          [
            formatDate(sale.date),
            getClientName(sale.clientId),
            item.name,
            item.qty,
            item.unitPrice,
            item.qty * item.unitPrice,
            sale.total,
            sale.paymentMethod === "credit" ? "Crédit" : "Espèces",
          ].join(";"),
        );
      }
    }
    const blob = new Blob([rows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ventes_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteConfirmed = () => {
    if (!deleteSaleId) return;
    dispatch({ type: "DELETE_SALE", payload: deleteSaleId });
    setDeleteSaleId(null);
  };

  // Build a ReceiptData from an existing Sale for reprinting
  const buildReceiptFromSale = (sale: Sale): ReceiptData => {
    const client = sale.clientId
      ? (state.clients.find((c) => c.id === sale.clientId) ?? null)
      : null;
    const items: CartItem[] = sale.items.map((si) => ({
      product: {
        id: si.productId,
        name: si.name,
        price: si.unitPrice,
        category: "",
        stock: 0,
        lowStockThreshold: 0,
      },
      qty: si.qty,
    }));
    return {
      saleId: sale.id,
      date: sale.date,
      items,
      total: sale.total,
      paymentMode: sale.paymentMethod as PaymentMode,
      client,
      cashReceived: 0,
      shopName: state.settings.shopName,
    };
  };

  const handlePrint = () => window.print();

  return (
    <div className="space-y-4" data-ocid="sales.historique_panel">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {sortedSales.length} vente{sortedSales.length !== 1 ? "s" : ""} au
          total
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            data-ocid="sales.export_csv_button"
            className="gap-1.5 text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Exporter CSV
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrint}
            data-ocid="sales.print_button"
            className="gap-1.5 text-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimer
          </Button>
        </div>
      </div>

      {/* Table */}
      {sortedSales.length === 0 ? (
        <div
          data-ocid="sales.historique_empty_state"
          className="text-center py-16"
        >
          <ShoppingCart className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">
            Aucune vente enregistrée
          </p>
          <p className="text-xs text-muted-foreground">
            Les ventes validées apparaîtront ici.
          </p>
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm print:text-xs">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Articles
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Mode
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedSales.map((sale, idx) => (
                  <tr
                    key={sale.id}
                    data-ocid={`sales.historique.item.${idx + 1}`}
                    className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(sale.date)}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {getClientName(sale.clientId)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[200px]">
                      <span className="line-clamp-2 text-xs">
                        {sale.items
                          .map((i) => `${i.name} ×${i.qty}`)
                          .join(", ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-foreground whitespace-nowrap">
                      {sale.total} G
                    </td>
                    <td className="px-4 py-3">
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
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          title="Imprimer le reçu"
                          data-ocid={`sales.historique.print_button.${idx + 1}`}
                          onClick={() => setReprintSale(sale)}
                          className="w-7 h-7 flex items-center justify-center rounded-md border border-border bg-background text-primary hover:bg-primary/10 hover:border-primary/40 transition-colors"
                          aria-label="Imprimer le reçu"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        {currentUser?.role === "admin" && (
                          <button
                            type="button"
                            title="Supprimer cette vente"
                            data-ocid={`sales.historique.delete_button.${idx + 1}`}
                            onClick={() => setDeleteSaleId(sale.id)}
                            className="w-7 h-7 flex items-center justify-center rounded-md border border-destructive/30 bg-background text-destructive hover:bg-destructive/10 hover:border-destructive/60 transition-colors"
                            aria-label="Supprimer la vente"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      {/* Reprint receipt modal */}
      {reprintSale && (
        <ReceiptModal
          receipt={buildReceiptFromSale(reprintSale)}
          onClose={() => setReprintSale(null)}
        />
      )}

      {/* PIN delete confirmation modal */}
      {deleteSaleId && (
        <PinDeleteModal
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setDeleteSaleId(null)}
        />
      )}
    </div>
  );
}

// ─── Sales Page ────────────────────────────────────────────────────────────────

export function SalesPage() {
  return (
    <div className="space-y-4" data-ocid="sales.page">
      <Tabs defaultValue="nouvelle-vente" data-ocid="sales.tabs">
        <TabsList className="mb-4">
          <TabsTrigger
            value="nouvelle-vente"
            data-ocid="sales.tab.nouvelle_vente"
          >
            <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
            Nouvelle Vente
          </TabsTrigger>
          <TabsTrigger value="historique" data-ocid="sales.tab.historique">
            Historique des Ventes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="nouvelle-vente">
          <NouvelleVente />
        </TabsContent>

        <TabsContent value="historique">
          <Historique />
        </TabsContent>
      </Tabs>
    </div>
  );
}
