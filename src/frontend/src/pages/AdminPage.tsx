import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useAuth } from "@/hooks/useAuth";
import { simpleHash, useStore } from "@/hooks/useStore";
import type { AuditEntry, User, UserRole } from "@/types";
import {
  CheckCircle,
  ClipboardList,
  Database,
  Download,
  KeyRound,
  Plus,
  Settings,
  Shield,
  Trash2,
  Upload,
  Users,
  XCircle,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// PIN Modal
// ---------------------------------------------------------------------------
interface PinModalProps {
  title?: string;
  onConfirm: (pin: string) => void;
  onCancel: () => void;
}

function PinModal({
  title = "Confirmation requise",
  onConfirm,
  onCancel,
}: PinModalProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const { verifyPin } = useAuth();

  const handleConfirm = () => {
    if (!verifyPin(pin)) {
      setError("Code PIN incorrect.");
      setPin("");
      return;
    }
    onConfirm(pin);
  };

  return (
    <div
      data-ocid="admin.pin_modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm"
    >
      <Card className="w-full max-w-sm shadow-2xl mx-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-primary" />
            {title}
          </CardTitle>
          <CardDescription className="text-xs">
            Entrez le code PIN administrateur pour continuer.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="pin-input">Code PIN (4 chiffres)</Label>
            <Input
              id="pin-input"
              data-ocid="admin.pin_modal.input"
              type="password"
              maxLength={4}
              placeholder="••••"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
              autoFocus
              className="text-center text-2xl tracking-widest"
            />
          </div>
          {error && (
            <p
              data-ocid="admin.pin_modal.error_state"
              className="text-xs text-destructive"
            >
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              data-ocid="admin.pin_modal.cancel_button"
              onClick={onCancel}
            >
              Annuler
            </Button>
            <Button
              type="button"
              className="flex-1"
              data-ocid="admin.pin_modal.confirm_button"
              onClick={handleConfirm}
              disabled={pin.length !== 4}
            >
              Confirmer
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Utilisateurs
// ---------------------------------------------------------------------------
function TabUtilisateurs() {
  const { state, dispatch } = useStore();
  const { currentUser } = useAuth();

  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("employee");
  const [formError, setFormError] = useState("");

  const [pendingAction, setPendingAction] = useState<
    null | { type: "add" } | { type: "delete"; userId: string }
  >(null);

  // PIN change state
  const [pinCurrent, setPinCurrent] = useState("");
  const [pinNew, setPinNew] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinSuccess, setPinSuccess] = useState(false);
  const { verifyPin } = useAuth();

  const addAudit = useCallback(
    (action: string, details: string) => {
      dispatch({
        type: "ADD_AUDIT",
        payload: {
          id: `audit-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          timestamp: new Date().toISOString(),
          userId: currentUser?.id ?? "unknown",
          action,
          details,
        },
      });
    },
    [dispatch, currentUser],
  );

  const handleAddUser = () => {
    if (!newUsername.trim() || !newPassword.trim()) {
      setFormError("Nom d'utilisateur et mot de passe requis.");
      return;
    }
    if (state.users.find((u) => u.username === newUsername.trim())) {
      setFormError("Ce nom d'utilisateur existe déjà.");
      return;
    }
    setFormError("");
    setPendingAction({ type: "add" });
  };

  const confirmAdd = useCallback(() => {
    const newUser: User = {
      id: `u-${Date.now()}`,
      username: newUsername.trim(),
      passwordHash: simpleHash(newPassword),
      role: newRole,
    };
    dispatch({ type: "ADD_USER", payload: newUser });
    addAudit(
      "AJOUT_UTILISATEUR",
      `Utilisateur '${newUser.username}' (${newUser.role}) ajouté`,
    );
    setNewUsername("");
    setNewPassword("");
    setNewRole("employee");
    setPendingAction(null);
  }, [dispatch, addAudit, newUsername, newPassword, newRole]);

  const handleDeleteUser = (userId: string) => {
    if (userId === currentUser?.id) return;
    setPendingAction({ type: "delete", userId });
  };

  const confirmDelete = useCallback(
    (userId: string) => {
      const user = state.users.find((u) => u.id === userId);
      dispatch({ type: "DELETE_USER", payload: userId });
      addAudit(
        "SUPPRESSION_UTILISATEUR",
        `Utilisateur '${user?.username}' supprimé`,
      );
      setPendingAction(null);
    },
    [dispatch, addAudit, state.users],
  );

  const handlePinChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError("");
    setPinSuccess(false);
    if (!verifyPin(pinCurrent)) {
      setPinError("Code PIN actuel incorrect.");
      return;
    }
    if (!/^\d{4}$/.test(pinNew)) {
      setPinError("Le nouveau PIN doit comporter exactement 4 chiffres.");
      return;
    }
    if (pinNew !== pinConfirm) {
      setPinError("Les PINs ne correspondent pas.");
      return;
    }
    dispatch({
      type: "SET_STATE",
      payload: {
        ...state,
        settings: { ...state.settings, adminPin: pinNew },
      },
    });
    addAudit("CHANGEMENT_PIN", "Code PIN administrateur modifié");
    setPinCurrent("");
    setPinNew("");
    setPinConfirm("");
    setPinSuccess(true);
  };

  return (
    <div className="space-y-6" data-ocid="admin.users_tab">
      {/* Modal PIN */}
      {pendingAction?.type === "add" && (
        <PinModal
          title="Confirmer l'ajout d'utilisateur"
          onConfirm={confirmAdd}
          onCancel={() => setPendingAction(null)}
        />
      )}
      {pendingAction?.type === "delete" && (
        <PinModal
          title="Confirmer la suppression"
          onConfirm={() =>
            confirmDelete(
              (pendingAction as { type: "delete"; userId: string }).userId,
            )
          }
          onCancel={() => setPendingAction(null)}
        />
      )}

      {/* Table des utilisateurs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">
            Utilisateurs ({state.users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Nom d'utilisateur
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Rôle
                  </th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {state.users.map((user, idx) => (
                  <tr
                    key={user.id}
                    data-ocid={`admin.user.item.${idx + 1}`}
                    className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-2.5 px-3 font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-primary uppercase">
                            {user.username.charAt(0)}
                          </span>
                        </div>
                        {user.username}
                        {user.id === currentUser?.id && (
                          <Badge variant="outline" className="text-[10px] py-0">
                            Vous
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge
                        variant={
                          user.role === "admin" ? "default" : "secondary"
                        }
                        className="text-xs"
                      >
                        {user.role === "admin" ? "Administrateur" : "Employé"}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        data-ocid={`admin.user.delete_button.${idx + 1}`}
                        disabled={user.id === currentUser?.id}
                        onClick={() => handleDeleteUser(user.id)}
                        className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10 disabled:opacity-30"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Supprimer
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Formulaire ajout */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" />
            Ajouter un utilisateur
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="new-username">Nom d'utilisateur</Label>
              <Input
                id="new-username"
                data-ocid="admin.add_user.input"
                placeholder="nom_utilisateur"
                value={newUsername}
                onChange={(e) => {
                  setNewUsername(e.target.value);
                  setFormError("");
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-password">Mot de passe</Label>
              <Input
                id="new-password"
                data-ocid="admin.add_user.password_input"
                type="password"
                placeholder="mot de passe"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setFormError("");
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-role">Rôle</Label>
              <Select
                value={newRole}
                onValueChange={(v) => setNewRole(v as UserRole)}
              >
                <SelectTrigger id="new-role" data-ocid="admin.add_user.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Employé</SelectItem>
                  <SelectItem value="admin">Administrateur</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {formError && (
            <p
              data-ocid="admin.add_user.error_state"
              className="text-xs text-destructive mt-2"
            >
              {formError}
            </p>
          )}
          <div className="mt-4">
            <Button
              type="button"
              data-ocid="admin.add_user.submit_button"
              onClick={handleAddUser}
              className="gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Ajouter l'utilisateur
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Changer PIN */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-primary" />
            Changer le code PIN administrateur
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handlePinChange}
            className="grid gap-4 sm:grid-cols-3"
          >
            <div className="space-y-1.5">
              <Label htmlFor="pin-current">PIN actuel</Label>
              <Input
                id="pin-current"
                data-ocid="admin.pin_change.current_input"
                type="password"
                maxLength={4}
                placeholder="••••"
                value={pinCurrent}
                onChange={(e) => {
                  setPinCurrent(e.target.value);
                  setPinError("");
                  setPinSuccess(false);
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pin-new">Nouveau PIN</Label>
              <Input
                id="pin-new"
                data-ocid="admin.pin_change.new_input"
                type="password"
                maxLength={4}
                placeholder="••••"
                value={pinNew}
                onChange={(e) => {
                  setPinNew(e.target.value);
                  setPinError("");
                  setPinSuccess(false);
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pin-confirm">Confirmer nouveau PIN</Label>
              <Input
                id="pin-confirm"
                data-ocid="admin.pin_change.confirm_input"
                type="password"
                maxLength={4}
                placeholder="••••"
                value={pinConfirm}
                onChange={(e) => {
                  setPinConfirm(e.target.value);
                  setPinError("");
                  setPinSuccess(false);
                }}
              />
            </div>
            {pinError && (
              <p
                data-ocid="admin.pin_change.error_state"
                className="text-xs text-destructive sm:col-span-3"
              >
                {pinError}
              </p>
            )}
            {pinSuccess && (
              <p
                data-ocid="admin.pin_change.success_state"
                className="text-xs text-primary sm:col-span-3"
              >
                Code PIN modifié avec succès.
              </p>
            )}
            <div className="sm:col-span-3">
              <Button
                type="submit"
                data-ocid="admin.pin_change.submit_button"
                variant="outline"
                className="gap-1.5"
              >
                <KeyRound className="w-4 h-4" />
                Modifier le PIN
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Journal d'audit
// ---------------------------------------------------------------------------
function TabJournal() {
  const { state, dispatch } = useStore();
  const { currentUser } = useAuth();

  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [clearModal, setClearModal] = useState(false);

  const addAudit = useCallback(
    (action: string, details: string) => {
      dispatch({
        type: "ADD_AUDIT",
        payload: {
          id: `audit-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          timestamp: new Date().toISOString(),
          userId: currentUser?.id ?? "unknown",
          action,
          details,
        },
      });
    },
    [dispatch, currentUser],
  );

  const filteredLog: AuditEntry[] = state.auditLog.filter((entry) => {
    const entryDate = entry.timestamp.slice(0, 10);
    if (filterFrom && entryDate < filterFrom) return false;
    if (filterTo && entryDate > filterTo) return false;
    return true;
  });

  const getUserName = (userId: string) => {
    return state.users.find((u) => u.id === userId)?.username ?? userId;
  };

  const handleClear = () => setClearModal(true);

  const confirmClear = useCallback(() => {
    addAudit(
      "EFFACEMENT_JOURNAL",
      "Journal d'audit effacé par l'administrateur",
    );
    // Clear all but the newly added entry (dispatched first, then we need to handle order)
    // We dispatch a new state with empty auditLog, then re-add the trail entry
    dispatch({
      type: "SET_STATE",
      payload: {
        ...state,
        auditLog: [
          {
            id: `audit-${Date.now()}`,
            timestamp: new Date().toISOString(),
            userId: currentUser?.id ?? "unknown",
            action: "EFFACEMENT_JOURNAL",
            details: "Journal d'audit effacé",
          },
        ],
      },
    });
    setClearModal(false);
  }, [dispatch, state, currentUser, addAudit]);

  return (
    <div className="space-y-4" data-ocid="admin.audit_tab">
      {clearModal && (
        <PinModal
          title="Effacer le journal d'audit"
          onConfirm={confirmClear}
          onCancel={() => setClearModal(false)}
        />
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1.5">
              <Label htmlFor="filter-from">Du</Label>
              <Input
                id="filter-from"
                data-ocid="admin.audit.filter_from"
                type="date"
                value={filterFrom}
                onChange={(e) => setFilterFrom(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="filter-to">Au</Label>
              <Input
                id="filter-to"
                data-ocid="admin.audit.filter_to"
                type="date"
                value={filterTo}
                onChange={(e) => setFilterTo(e.target.value)}
                className="w-40"
              />
            </div>
            {(filterFrom || filterTo) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                data-ocid="admin.audit.clear_filter_button"
                onClick={() => {
                  setFilterFrom("");
                  setFilterTo("");
                }}
                className="gap-1.5 text-muted-foreground"
              >
                <XCircle className="w-4 h-4" />
                Réinitialiser
              </Button>
            )}
            <div className="ml-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-ocid="admin.audit.clear_button"
                onClick={handleClear}
                className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
              >
                <Trash2 className="w-4 h-4" />
                Effacer le journal
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">
            Journal d'audit
            <span className="ml-2 text-muted-foreground font-normal">
              ({filteredLog.length} entrée{filteredLog.length !== 1 ? "s" : ""})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
            {filteredLog.length === 0 ? (
              <div
                data-ocid="admin.audit.empty_state"
                className="text-center py-12"
              >
                <ClipboardList className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Aucune entrée dans le journal.
                </p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card z-10">
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                      Date / Heure
                    </th>
                    <th className="text-left py-2 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Utilisateur
                    </th>
                    <th className="text-left py-2 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Action
                    </th>
                    <th className="text-left py-2 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Détails
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLog.map((entry, idx) => (
                    <tr
                      key={entry.id}
                      data-ocid={`admin.audit.item.${idx + 1}`}
                      className="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors"
                    >
                      <td className="py-2 px-4 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(entry.timestamp).toLocaleString("fr-FR")}
                      </td>
                      <td className="py-2 px-4 font-medium">
                        {getUserName(entry.userId)}
                      </td>
                      <td className="py-2 px-4">
                        <Badge
                          variant="outline"
                          className="text-[10px] font-mono"
                        >
                          {entry.action}
                        </Badge>
                      </td>
                      <td className="py-2 px-4 text-muted-foreground text-xs max-w-xs truncate">
                        {entry.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Sauvegarde
// ---------------------------------------------------------------------------
function TabSauvegarde() {
  const { state, dispatch } = useStore();
  const { currentUser } = useAuth();

  const [lastExport, setLastExport] = useState<string | null>(
    localStorage.getItem("minou_last_export") ?? null,
  );
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importError, setImportError] = useState("");
  const [importModal, setImportModal] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addAudit = useCallback(
    (action: string, details: string) => {
      dispatch({
        type: "ADD_AUDIT",
        payload: {
          id: `audit-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          timestamp: new Date().toISOString(),
          userId: currentUser?.id ?? "unknown",
          action,
          details,
        },
      });
    },
    [dispatch, currentUser],
  );

  const handleExport = () => {
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10);
    const filename = `minou_patisserie_backup_${datePart}.json`;
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    const exportTime = now.toISOString();
    localStorage.setItem("minou_last_export", exportTime);
    setLastExport(exportTime);
    addAudit("EXPORT_DONNEES", `Sauvegarde exportée: ${filename}`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setImportFile(file);
    setImportError("");
    setImportSuccess(false);
  };

  const handleImportRequest = () => {
    if (!importFile) {
      setImportError("Veuillez sélectionner un fichier JSON.");
      return;
    }
    setImportModal(true);
  };

  const confirmImport = useCallback(() => {
    if (!importFile) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        // Basic validation
        if (!parsed.users || !parsed.products || !parsed.settings) {
          setImportError("Fichier de sauvegarde invalide ou incompatible.");
          setImportModal(false);
          return;
        }
        dispatch({ type: "SET_STATE", payload: parsed });
        addAudit(
          "IMPORT_DONNEES",
          `Sauvegarde importée depuis: ${importFile.name}`,
        );
        setImportSuccess(true);
        setImportFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } catch {
        setImportError("Erreur lors de la lecture du fichier.");
      }
      setImportModal(false);
    };
    reader.readAsText(importFile);
  }, [importFile, dispatch, addAudit]);

  return (
    <div className="space-y-6" data-ocid="admin.backup_tab">
      {importModal && (
        <PinModal
          title="Confirmer l'importation"
          onConfirm={confirmImport}
          onCancel={() => setImportModal(false)}
        />
      )}

      {/* Export */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Download className="w-4 h-4 text-primary" />
            Exporter les données
          </CardTitle>
          <CardDescription className="text-xs">
            Téléchargez une copie complète de toutes les données de
            l'application.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {lastExport && (
            <p className="text-xs text-muted-foreground">
              Dernière sauvegarde :{" "}
              <span className="font-medium text-foreground">
                {new Date(lastExport).toLocaleString("fr-FR")}
              </span>
            </p>
          )}
          <Button
            type="button"
            data-ocid="admin.backup.export_button"
            onClick={handleExport}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Exporter les données
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Import */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Upload className="w-4 h-4 text-primary" />
            Importer des données
          </CardTitle>
          <CardDescription className="text-xs">
            Restaurez l'application à partir d'une sauvegarde JSON.{" "}
            <strong>Toutes les données actuelles seront remplacées.</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="import-file">Fichier de sauvegarde (.json)</Label>
            <Input
              id="import-file"
              data-ocid="admin.backup.file_input"
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
          </div>
          {importFile && (
            <p className="text-xs text-muted-foreground">
              Fichier sélectionné :{" "}
              <span className="font-medium text-foreground">
                {importFile.name}
              </span>
            </p>
          )}
          {importError && (
            <p
              data-ocid="admin.backup.import.error_state"
              className="text-xs text-destructive"
            >
              {importError}
            </p>
          )}
          {importSuccess && (
            <p
              data-ocid="admin.backup.import.success_state"
              className="text-xs text-primary"
            >
              Données importées avec succès.
            </p>
          )}
          <Button
            type="button"
            data-ocid="admin.backup.import_button"
            variant="outline"
            onClick={handleImportRequest}
            disabled={!importFile}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            Charger la sauvegarde
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Paramètres
// ---------------------------------------------------------------------------
function TabParametres() {
  const { state, dispatch } = useStore();
  const { currentUser } = useAuth();

  const [shopName, setShopName] = useState(state.settings.shopName);
  const [currency, setCurrency] = useState(state.settings.currency);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const addAudit = useCallback(
    (action: string, details: string) => {
      dispatch({
        type: "ADD_AUDIT",
        payload: {
          id: `audit-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          timestamp: new Date().toISOString(),
          userId: currentUser?.id ?? "unknown",
          action,
          details,
        },
      });
    },
    [dispatch, currentUser],
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim()) return;
    dispatch({
      type: "UPDATE_SETTINGS",
      payload: { shopName: shopName.trim(), currency: currency.trim() || "G" },
    });
    addAudit(
      "MODIFICATION_PARAMETRES",
      `Nom: '${shopName.trim()}', Devise: '${currency.trim() || "G"}'`,
    );
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6" data-ocid="admin.settings_tab">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Settings className="w-4 h-4 text-primary" />
            Paramètres de la patisserie
          </CardTitle>
          <CardDescription className="text-xs">
            Configurez les informations générales de votre établissement.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="shop-name">Nom de l'établissement</Label>
                <Input
                  id="shop-name"
                  data-ocid="admin.settings.shop_name_input"
                  placeholder="Minou Patisserie"
                  value={shopName}
                  onChange={(e) => {
                    setShopName(e.target.value);
                    setSaveSuccess(false);
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="currency">Symbole de devise</Label>
                <Input
                  id="currency"
                  data-ocid="admin.settings.currency_input"
                  placeholder="G"
                  maxLength={5}
                  value={currency}
                  onChange={(e) => {
                    setCurrency(e.target.value);
                    setSaveSuccess(false);
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Ex: G (Gourde), USD, EUR
                </p>
              </div>
            </div>

            <div className="bg-muted/40 border border-border rounded-lg p-3 text-xs text-muted-foreground space-y-0.5">
              <p>
                <span className="font-medium text-foreground">
                  Paramètres actuels:
                </span>
              </p>
              <p>
                Nom:{" "}
                <span className="font-medium text-foreground">
                  {state.settings.shopName}
                </span>
              </p>
              <p>
                Devise:{" "}
                <span className="font-medium text-foreground">
                  {state.settings.currency}
                </span>
              </p>
              <p>
                Thème:{" "}
                <span className="font-medium text-foreground capitalize">
                  {state.settings.theme === "dark" ? "Sombre" : "Clair"}
                </span>
              </p>
            </div>

            {saveSuccess && (
              <div
                data-ocid="admin.settings.success_state"
                className="flex items-center gap-2 text-xs text-primary bg-primary/10 border border-primary/20 rounded-md p-3"
              >
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                Paramètres enregistrés avec succès.
              </div>
            )}

            <div>
              <Button
                type="submit"
                data-ocid="admin.settings.save_button"
                className="gap-1.5"
                disabled={!shopName.trim()}
              >
                <CheckCircle className="w-4 h-4" />
                Enregistrer les paramètres
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main AdminPage
// ---------------------------------------------------------------------------
type AdminTab = "users" | "audit" | "backup" | "settings";

const TABS: { id: AdminTab; label: string; icon: React.ElementType }[] = [
  { id: "users", label: "Utilisateurs", icon: Users },
  { id: "audit", label: "Journal d'audit", icon: ClipboardList },
  { id: "backup", label: "Sauvegarde", icon: Database },
  { id: "settings", label: "Paramètres", icon: Settings },
];

export function AdminPage() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("users");

  if (!currentUser || currentUser.role !== "admin") {
    return (
      <div
        data-ocid="admin.access_denied"
        className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4"
      >
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
          <Shield className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-xl font-display font-semibold text-foreground mb-2">
          Accès refusé
        </h2>
        <p className="text-muted-foreground text-sm max-w-xs">
          Cette page est réservée aux administrateurs.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5" data-ocid="admin.page">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-display font-bold text-foreground">
            Administration
          </h1>
          <p className="text-xs text-muted-foreground">
            Gestion des utilisateurs, journaux, sauvegardes et paramètres
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/50 p-1 rounded-xl w-full sm:w-auto sm:inline-flex">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            data-ocid={`admin.${tab.id}_tab`}
            onClick={() => setActiveTab(tab.id)}
            className={[
              "flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-smooth",
              activeTab === tab.id
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "users" && <TabUtilisateurs />}
      {activeTab === "audit" && <TabJournal />}
      {activeTab === "backup" && <TabSauvegarde />}
      {activeTab === "settings" && <TabParametres />}
    </div>
  );
}
