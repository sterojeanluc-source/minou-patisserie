import { Badge } from "@/components/ui/badge";
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
import type { Product, ProductionStatus, ProductionTask } from "@/types";
import {
  CheckCircle2,
  ClipboardList,
  Clock,
  Filter,
  Pencil,
  Play,
  Plus,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { useMemo, useState } from "react";

const today = () => new Date().toISOString().split("T")[0];

const statusLabel: Record<ProductionStatus, string> = {
  planned: "Planifié",
  in_progress: "En cours",
  done: "Terminé",
};

const statusColors: Record<ProductionStatus, string> = {
  planned: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  in_progress:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  done: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
};

interface TaskFormData {
  productName: string;
  productId: string;
  quantity: number;
  plannedDate: string;
  notes: string;
}

const emptyForm = (): TaskFormData => ({
  productName: "",
  productId: "",
  quantity: 1,
  plannedDate: today(),
  notes: "",
});

export function ProductionPage() {
  const { state, dispatch } = useStore();
  const { productionTasks, products } = state;

  const [filterStatus, setFilterStatus] = useState<ProductionStatus | "all">(
    "all",
  );
  const [filterDate, setFilterDate] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<ProductionTask | null>(null);
  const [form, setForm] = useState<TaskFormData>(emptyForm());
  const [confirmFinish, setConfirmFinish] = useState<ProductionTask | null>(
    null,
  );
  const [confirmDelete, setConfirmDelete] = useState<ProductionTask | null>(
    null,
  );
  const [useInventory, setUseInventory] = useState(false);

  // Derived stats
  const inProgressCount = useMemo(
    () => productionTasks.filter((t) => t.status === "in_progress").length,
    [productionTasks],
  );
  const todayPlannedCount = useMemo(
    () =>
      productionTasks.filter(
        (t) => t.status === "planned" && t.plannedDate === today(),
      ).length,
    [productionTasks],
  );

  // Filtered + sorted tasks
  const filteredTasks = useMemo(() => {
    return productionTasks
      .filter((t) => {
        if (filterStatus !== "all" && t.status !== filterStatus) return false;
        if (filterDate && t.plannedDate !== filterDate) return false;
        return true;
      })
      .sort((a, b) => a.plannedDate.localeCompare(b.plannedDate));
  }, [productionTasks, filterStatus, filterDate]);

  function openAdd() {
    setEditingTask(null);
    setForm(emptyForm());
    setUseInventory(false);
    setShowForm(true);
  }

  function openEdit(task: ProductionTask) {
    setEditingTask(task);
    setForm({
      productName: task.productName,
      productId: task.productId ?? "",
      quantity: task.quantity,
      plannedDate: task.plannedDate,
      notes: task.notes,
    });
    setUseInventory(!!task.productId);
    setShowForm(true);
  }

  function handleProductSelect(productId: string) {
    if (productId === "__custom__") {
      setUseInventory(false);
      setForm((f) => ({ ...f, productId: "", productName: "" }));
    } else {
      const product = products.find((p: Product) => p.id === productId);
      if (product) {
        setForm((f) => ({
          ...f,
          productId: product.id,
          productName: product.name,
        }));
      }
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.productName.trim() || form.quantity < 1) return;

    if (editingTask) {
      dispatch({
        type: "UPDATE_PRODUCTION_TASK",
        payload: { ...editingTask, ...form, productId: form.productId || null },
      });
    } else {
      const newTask: ProductionTask = {
        id: `pt_${Date.now()}`,
        productName: form.productName.trim(),
        productId: form.productId || null,
        quantity: form.quantity,
        plannedDate: form.plannedDate,
        status: "planned",
        completedAt: null,
        notes: form.notes,
      };
      dispatch({ type: "ADD_PRODUCTION_TASK", payload: newTask });
    }
    setShowForm(false);
  }

  function handleStart(task: ProductionTask) {
    dispatch({
      type: "UPDATE_PRODUCTION_TASK",
      payload: { ...task, status: "in_progress" },
    });
  }

  function handleFinishConfirm() {
    if (!confirmFinish) return;
    const task = confirmFinish;
    // Update task to done
    dispatch({
      type: "UPDATE_PRODUCTION_TASK",
      payload: {
        ...task,
        status: "done",
        completedAt: new Date().toISOString(),
      },
    });
    // Update inventory if linked product
    if (task.productId) {
      const product = products.find((p: Product) => p.id === task.productId);
      if (product) {
        dispatch({
          type: "UPDATE_PRODUCT",
          payload: { ...product, stock: product.stock + task.quantity },
        });
      }
    }
    setConfirmFinish(null);
  }

  function handleDelete() {
    if (!confirmDelete) return;
    dispatch({ type: "DELETE_PRODUCTION_TASK", payload: confirmDelete.id });
    setConfirmDelete(null);
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Planification de Production
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gérez vos tâches de production quotidiennes
          </p>
        </div>
        <Button
          onClick={openAdd}
          data-ocid="production.add_button"
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Nouvelle tâche
        </Button>
      </div>

      {/* Stats badges */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 px-4 py-2">
          <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
            {inProgressCount} tâche{inProgressCount !== 1 ? "s" : ""} en cours
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20 px-4 py-2">
          <ClipboardList className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            {todayPlannedCount} planifiée{todayPlannedCount !== 1 ? "s" : ""}{" "}
            aujourd'hui
          </span>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filtres</span>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Statut</Label>
              <Select
                value={filterStatus}
                onValueChange={(v) =>
                  setFilterStatus(v as ProductionStatus | "all")
                }
              >
                <SelectTrigger
                  data-ocid="production.filter.status"
                  className="w-40"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="planned">Planifié</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="done">Terminé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                Date prévue
              </Label>
              <Input
                type="date"
                data-ocid="production.filter.date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-44"
              />
            </div>
            {(filterStatus !== "all" || filterDate) && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilterStatus("all");
                  setFilterDate("");
                }}
                data-ocid="production.filter.reset"
              >
                Réinitialiser
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Task list */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Tâches ({filteredTasks.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTasks.length === 0 ? (
            <div
              data-ocid="production.empty_state"
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <ClipboardList className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground font-medium">
                Aucune tâche de production
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Ajoutez une tâche pour commencer la planification
              </p>
              <Button
                onClick={openAdd}
                variant="outline"
                className="mt-4 gap-2"
              >
                <Plus className="h-4 w-4" />
                Nouvelle tâche
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredTasks.map((task, idx) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  index={idx + 1}
                  onEdit={() => openEdit(task)}
                  onStart={() => handleStart(task)}
                  onFinish={() => setConfirmFinish(task)}
                  onDelete={() => setConfirmDelete(task)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTask
                ? "Modifier la tâche"
                : "Nouvelle tâche de production"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {/* Product source toggle */}
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={!useInventory ? "default" : "outline"}
                onClick={() => {
                  setUseInventory(false);
                  setForm((f) => ({ ...f, productId: "" }));
                }}
              >
                Nom libre
              </Button>
              <Button
                type="button"
                size="sm"
                variant={useInventory ? "default" : "outline"}
                onClick={() => setUseInventory(true)}
              >
                Depuis l'inventaire
              </Button>
            </div>

            {useInventory ? (
              <div className="space-y-1">
                <Label htmlFor="productSelect">Produit (inventaire)</Label>
                <Select
                  value={form.productId}
                  onValueChange={handleProductSelect}
                >
                  <SelectTrigger
                    data-ocid="production.form.product_select"
                    id="productSelect"
                  >
                    <SelectValue placeholder="Sélectionner un produit" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p: Product) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} — stock: {p.stock}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-1">
                <Label htmlFor="productName">Nom du produit *</Label>
                <Input
                  id="productName"
                  data-ocid="production.form.product_name"
                  value={form.productName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, productName: e.target.value }))
                  }
                  placeholder="Ex: Tarte Fraise, Pain Spécial…"
                  required
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="quantity">Quantité *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min={1}
                  data-ocid="production.form.quantity"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, quantity: Number(e.target.value) }))
                  }
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="plannedDate">Date prévue *</Label>
                <Input
                  id="plannedDate"
                  type="date"
                  data-ocid="production.form.planned_date"
                  value={form.plannedDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, plannedDate: e.target.value }))
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                data-ocid="production.form.notes"
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                placeholder="Instructions spéciales, ingrédients, variantes…"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
                data-ocid="production.form.cancel_button"
              >
                Annuler
              </Button>
              <Button type="submit" data-ocid="production.form.submit_button">
                {editingTask ? "Enregistrer" : "Ajouter"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Finish Dialog */}
      <Dialog
        open={!!confirmFinish}
        onOpenChange={() => setConfirmFinish(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Terminer la production</DialogTitle>
          </DialogHeader>
          {confirmFinish && (
            <div className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground">
                Confirmez-vous la fin de la production de{" "}
                <span className="font-semibold text-foreground">
                  {confirmFinish.quantity} × {confirmFinish.productName}
                </span>{" "}
                ?
              </p>
              {confirmFinish.productId && (
                <div className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20 p-3">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <p className="text-sm text-emerald-700 dark:text-emerald-300">
                    Le stock du produit sera automatiquement augmenté de{" "}
                    <strong>{confirmFinish.quantity}</strong> unités.
                  </p>
                </div>
              )}
              {!confirmFinish.productId && (
                <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 p-3">
                  <TriangleAlert className="h-4 w-4 mt-0.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Ce produit n'est pas lié à l'inventaire. Le stock ne sera
                    pas mis à jour.
                  </p>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setConfirmFinish(null)}
                  data-ocid="production.finish.cancel_button"
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  onClick={handleFinishConfirm}
                  data-ocid="production.finish.confirm_button"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Confirmer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <Dialog
        open={!!confirmDelete}
        onOpenChange={() => setConfirmDelete(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer la tâche</DialogTitle>
          </DialogHeader>
          {confirmDelete && (
            <div className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground">
                Voulez-vous supprimer la tâche{" "}
                <span className="font-semibold text-foreground">
                  {confirmDelete.productName}
                </span>{" "}
                ? Cette action est irréversible.
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setConfirmDelete(null)}
                  data-ocid="production.delete.cancel_button"
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  data-ocid="production.delete.confirm_button"
                >
                  Supprimer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---- TaskRow sub-component ----
interface TaskRowProps {
  task: ProductionTask;
  index: number;
  onEdit: () => void;
  onStart: () => void;
  onFinish: () => void;
  onDelete: () => void;
}

function TaskRow({
  task,
  index,
  onEdit,
  onStart,
  onFinish,
  onDelete,
}: TaskRowProps) {
  const isOverdue = task.status !== "done" && task.plannedDate < today();

  return (
    <div
      data-ocid={`production.item.${index}`}
      className="flex flex-wrap items-start justify-between gap-4 py-4 first:pt-0 last:pb-0"
    >
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-foreground truncate">
            {task.productName}
          </span>
          <Badge
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[task.status]}`}
          >
            {statusLabel[task.status]}
          </Badge>
          {isOverdue && (
            <Badge className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
              En retard
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span>
            Quantité :{" "}
            <strong className="text-foreground">{task.quantity}</strong>
          </span>
          <span>
            Date prévue :{" "}
            <strong
              className={`${
                isOverdue ? "text-red-600 dark:text-red-400" : "text-foreground"
              }`}
            >
              {new Date(`${task.plannedDate}T00:00:00`).toLocaleDateString(
                "fr-FR",
                { day: "numeric", month: "long", year: "numeric" },
              )}
            </strong>
          </span>
          {task.completedAt && (
            <span>
              Terminé :{" "}
              <strong className="text-foreground">
                {new Date(task.completedAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </strong>
            </span>
          )}
        </div>
        {task.notes && (
          <p className="text-sm text-muted-foreground italic line-clamp-2">
            {task.notes}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {task.status === "planned" && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onStart}
            data-ocid={`production.start_button.${index}`}
            className="gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/20"
          >
            <Play className="h-3.5 w-3.5" />
            Démarrer
          </Button>
        )}
        {task.status === "in_progress" && (
          <Button
            type="button"
            size="sm"
            onClick={onFinish}
            data-ocid={`production.finish_button.${index}`}
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Terminer
          </Button>
        )}
        {task.status !== "done" && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onEdit}
            data-ocid={`production.edit_button.${index}`}
            className="text-muted-foreground hover:text-foreground"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={onDelete}
          data-ocid={`production.delete_button.${index}`}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
