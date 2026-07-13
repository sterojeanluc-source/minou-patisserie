import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useStore } from "@/hooks/useStore";
import type { Employee, PayrollRecord } from "@/types";
import {
  Building2,
  Calendar,
  Download,
  Mail,
  Pencil,
  Phone,
  Plus,
  Printer,
  Trash2,
  Users,
  Wallet,
} from "lucide-react";
import { useRef, useState } from "react";

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
function fmtG(n: number, currency = "G") {
  return `${n.toLocaleString("fr-HT")} ${currency}`;
}
function fmtDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR");
}

const MONTHS = [
  "Janvier",
  "F\u00e9vrier",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Ao\u00fbt",
  "Septembre",
  "Octobre",
  "Novembre",
  "D\u00e9cembre",
];

// ─── PinModal ─────────────────────────────────────────────────────────────────
function PinModal({
  open,
  onClose,
  onConfirm,
  title,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (pin: string) => void;
  title: string;
}) {
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");

  function submit() {
    onConfirm(pin);
    setErr("PIN incorrect.");
    setPin("");
  }
  function close() {
    setPin("");
    setErr("");
    onClose();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) close();
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Label htmlFor="pin-field">PIN administrateur</Label>
          <Input
            id="pin-field"
            data-ocid="pin.input"
            type="password"
            placeholder="\u2022\u2022\u2022\u2022"
            value={pin}
            maxLength={8}
            onChange={(e) => {
              setPin(e.target.value);
              setErr("");
            }}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
          {err && (
            <p className="text-destructive text-sm" data-ocid="pin.error_state">
              {err}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={close}
            data-ocid="pin.cancel_button"
          >
            Annuler
          </Button>
          <Button type="button" onClick={submit} data-ocid="pin.confirm_button">
            Confirmer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── PayslipPrint ─────────────────────────────────────────────────────────────
function PayslipPrint({
  record,
  onClose,
}: { record: PayrollRecord; onClose: () => void }) {
  const printRef = useRef<HTMLDivElement>(null);

  function doPrint() {
    const el = printRef.current;
    if (!el) return;
    const w = window.open("", "_blank", "width=700,height=900");
    if (!w) return;
    w.document.write(`
      <html><head><title>Fiche de paie</title>
      <style>
        body{font-family:serif;padding:40px;color:#111}
        h1{text-align:center;font-size:24px;margin-bottom:4px}
        .sub{text-align:center;color:#555;margin-bottom:32px}
        table{width:100%;border-collapse:collapse;margin-bottom:24px}
        th,td{padding:8px 12px;border:1px solid #ccc;font-size:14px}
        th{background:#f5f5f0;text-align:left}
        .total td{font-weight:bold;font-size:16px}
        .sig{margin-top:48px;display:flex;justify-content:space-between}
        .sig div{border-top:1px solid #555;padding-top:8px;width:180px;text-align:center;font-size:13px}
      </style></head><body>
      <h1>Minou P\u00e2tisserie</h1>
      <div class="sub">Fiche de paie \u2014 ${record.period}</div>
      <table>
        <tr><th>Employ\u00e9</th><td>${record.employeeName}</td></tr>
        <tr><th>P\u00e9riode</th><td>${record.period}</td></tr>
        <tr><th>Date de paiement</th><td>${fmtDate(record.paidAt)}</td></tr>
        <tr><th>Trait\u00e9 par</th><td>${record.paidBy}</td></tr>
      </table>
      <table>
        <tr><th>\u00c9l\u00e9ment</th><th>Montant</th></tr>
        <tr><td>Salaire de base</td><td>${fmtG(record.basePay)}</td></tr>
        <tr><td>Heures suppl\u00e9mentaires</td><td>${fmtG(record.overtimePay)}</td></tr>
        <tr class="total"><td>Total net</td><td>${fmtG(record.totalPay)}</td></tr>
      </table>
      <div class="sig">
        <div>Signature employeur</div>
        <div>Signature employ\u00e9</div>
      </div>
      </body></html>
    `);
    w.document.close();
    w.print();
  }

  return (
    <Dialog
      open
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Fiche de paie \u2014 {record.employeeName}</DialogTitle>
        </DialogHeader>
        <div ref={printRef} className="text-sm space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ["Employ\u00e9", record.employeeName],
                ["P\u00e9riode", record.period],
                ["Date de paiement", fmtDate(record.paidAt)],
                ["Trait\u00e9 par", record.paidBy],
              ] as [string, string][]
            ).map(([k, v]) => (
              <div key={k} className="bg-muted rounded p-2">
                <p className="text-muted-foreground text-xs">{k}</p>
                <p className="font-medium">{v}</p>
              </div>
            ))}
          </div>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-muted">
                <th className="text-left p-2 border border-border">
                  \u00c9l\u00e9ment
                </th>
                <th className="text-right p-2 border border-border">Montant</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 border border-border">Salaire de base</td>
                <td className="text-right p-2 border border-border">
                  {fmtG(record.basePay)}
                </td>
              </tr>
              <tr>
                <td className="p-2 border border-border">
                  Heures suppl\u00e9mentaires
                </td>
                <td className="text-right p-2 border border-border">
                  {fmtG(record.overtimePay)}
                </td>
              </tr>
              <tr className="font-bold bg-muted">
                <td className="p-2 border border-border">Total net</td>
                <td className="text-right p-2 border border-border text-primary">
                  {fmtG(record.totalPay)}
                </td>
              </tr>
            </tbody>
          </table>
          <div className="grid grid-cols-2 gap-8 pt-4">
            <div className="border-t border-border pt-2 text-center text-xs text-muted-foreground">
              Signature employeur
            </div>
            <div className="border-t border-border pt-2 text-center text-xs text-muted-foreground">
              Signature employ\u00e9
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            data-ocid="payslip.close_button"
          >
            Fermer
          </Button>
          <Button
            type="button"
            onClick={doPrint}
            data-ocid="payslip.print_button"
          >
            <Printer className="w-4 h-4 mr-2" />
            Imprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── EmployeeFormModal ────────────────────────────────────────────────────────
const EMPTY_EMP: Omit<Employee, "id"> = {
  name: "",
  position: "",
  phone: "",
  email: "",
  baseSalary: 0,
  hoursWorked: 160,
  overtimeRate: 100,
  hireDate: "",
};

function EmployeeFormModal({
  initial,
  onSave,
  onClose,
}: {
  initial: Employee | null;
  onSave: (data: Omit<Employee, "id">) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Omit<Employee, "id">>(
    initial ? { ...initial } : { ...EMPTY_EMP },
  );
  const set = (k: keyof typeof form, v: string | number) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <Dialog
      open
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Modifier l'employ\u00e9" : "Ajouter un employ\u00e9"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Nom complet *</Label>
            <Input
              data-ocid="employee.name_input"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Sophie Martin"
            />
          </div>
          <div className="space-y-1">
            <Label>Poste *</Label>
            <Input
              data-ocid="employee.position_input"
              value={form.position}
              onChange={(e) => set("position", e.target.value)}
              placeholder="P\u00e2tissi\u00e8re chef"
            />
          </div>
          <div className="space-y-1">
            <Label>T\u00e9l\u00e9phone</Label>
            <Input
              data-ocid="employee.phone_input"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="509-XXXX-XXXX"
            />
          </div>
          <div className="space-y-1">
            <Label>Email</Label>
            <Input
              data-ocid="employee.email_input"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="nom@example.com"
            />
          </div>
          <div className="space-y-1">
            <Label>Salaire de base (G)</Label>
            <Input
              data-ocid="employee.salary_input"
              type="number"
              min={0}
              value={form.baseSalary}
              onChange={(e) => set("baseSalary", Number(e.target.value))}
            />
          </div>
          <div className="space-y-1">
            <Label>Heures travaill\u00e9es / mois</Label>
            <Input
              data-ocid="employee.hours_input"
              type="number"
              min={0}
              value={form.hoursWorked}
              onChange={(e) => set("hoursWorked", Number(e.target.value))}
            />
          </div>
          <div className="space-y-1">
            <Label>Taux heure supp (G/h)</Label>
            <Input
              data-ocid="employee.overtime_rate_input"
              type="number"
              min={0}
              value={form.overtimeRate}
              onChange={(e) => set("overtimeRate", Number(e.target.value))}
            />
          </div>
          <div className="space-y-1">
            <Label>Date d'embauche</Label>
            <Input
              data-ocid="employee.hire_date_input"
              type="date"
              value={form.hireDate}
              onChange={(e) => set("hireDate", e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            data-ocid="employee.cancel_button"
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={() =>
              form.name.trim() && form.position.trim() && onSave(form)
            }
            data-ocid="employee.save_button"
          >
            {initial ? "Enregistrer" : "Ajouter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── PayrollModal ─────────────────────────────────────────────────────────────
function PayrollModal({
  employee,
  paidBy,
  onSave,
  onClose,
}: {
  employee: Employee;
  paidBy: string;
  onSave: (r: PayrollRecord) => void;
  onClose: () => void;
}) {
  const now = new Date();
  const [monthIdx, setMonthIdx] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [overtime, setOvertime] = useState(0);
  const [rate, setRate] = useState(employee.overtimeRate);
  const [pinOpen, setPinOpen] = useState(false);
  const auth = useAuth();

  const overtimePay = overtime * rate;
  const totalPay = employee.baseSalary + overtimePay;
  const period = `${MONTHS[monthIdx]} ${year}`;

  function handlePin(pin: string) {
    if (!auth.verifyPin(pin)) return;
    setPinOpen(false);
    onSave({
      id: `pay-${uid()}`,
      employeeId: employee.id,
      employeeName: employee.name,
      period,
      basePay: employee.baseSalary,
      overtimePay,
      totalPay,
      paidAt: new Date().toISOString(),
      paidBy,
    });
  }

  return (
    <>
      <Dialog
        open
        onOpenChange={(o) => {
          if (!o) onClose();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Payer \u2014 {employee.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Mois</Label>
                <select
                  data-ocid="payroll.month_select"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  value={monthIdx}
                  onChange={(e) => setMonthIdx(Number(e.target.value))}
                >
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Ann\u00e9e</Label>
                <Input
                  data-ocid="payroll.year_input"
                  type="number"
                  value={year}
                  min={2000}
                  max={2100}
                  onChange={(e) => setYear(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1">
                <Label>Heures suppl\u00e9mentaires</Label>
                <Input
                  data-ocid="payroll.overtime_input"
                  type="number"
                  min={0}
                  value={overtime}
                  onChange={(e) => setOvertime(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1">
                <Label>Taux / heure (G)</Label>
                <Input
                  data-ocid="payroll.rate_input"
                  type="number"
                  min={0}
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Salaire de base</span>
                <span className="font-medium">{fmtG(employee.baseSalary)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Heures supp ({overtime}h \u00d7 {rate} G)
                </span>
                <span className="font-medium">{fmtG(overtimePay)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 font-bold text-base">
                <span>Total \u00e0 payer</span>
                <span className="text-primary">{fmtG(totalPay)}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              data-ocid="payroll.cancel_button"
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={() => setPinOpen(true)}
              data-ocid="payroll.pay_button"
            >
              <Wallet className="w-4 h-4 mr-2" />
              Payer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <PinModal
        open={pinOpen}
        onClose={() => setPinOpen(false)}
        onConfirm={handlePin}
        title="Confirmer le paiement"
      />
    </>
  );
}

// ─── EmployeesPage ────────────────────────────────────────────────────────────
export function EmployeesPage() {
  const { state, dispatch } = useStore();
  const auth = useAuth();
  const { employees, payrollRecords } = state;
  const currency = state.settings.currency;

  const [empModalOpen, setEmpModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [payrollTarget, setPayrollTarget] = useState<Employee | null>(null);
  const [payslipRecord, setPayslipRecord] = useState<PayrollRecord | null>(
    null,
  );
  const [historyFilter, setHistoryFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const paidBy = auth.currentUser?.username ?? "admin";

  function saveEmployee(data: Omit<Employee, "id">) {
    if (editingEmp) {
      dispatch({
        type: "UPDATE_EMPLOYEE",
        payload: { id: editingEmp.id, ...data },
      });
    } else {
      dispatch({
        type: "ADD_EMPLOYEE",
        payload: { id: `emp-${uid()}`, ...data },
      });
    }
    setEmpModalOpen(false);
    setEditingEmp(null);
  }

  function handleDeletePin(pin: string) {
    if (!auth.verifyPin(pin) || !deleteTarget) return;
    dispatch({ type: "DELETE_EMPLOYEE", payload: deleteTarget });
    setDeleteTarget(null);
  }

  function savePayroll(record: PayrollRecord) {
    dispatch({ type: "ADD_PAYROLL", payload: record });
    setPayrollTarget(null);
  }

  function dlCsv(rows: (string | number)[][], filename: string) {
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportEmployeesCsv() {
    const header = [
      "Nom",
      "Poste",
      "T\u00e9l\u00e9phone",
      "Email",
      "Salaire de base (G)",
      "Heures/mois",
      "Taux supp (G/h)",
      "Date d'embauche",
    ];
    const rows = employees.map((e) => [
      e.name,
      e.position,
      e.phone,
      e.email,
      e.baseSalary,
      e.hoursWorked,
      e.overtimeRate,
      fmtDate(e.hireDate),
    ]);
    dlCsv([header, ...rows], "employes.csv");
  }

  function exportPayrollCsv() {
    const header = [
      "Employ\u00e9",
      "P\u00e9riode",
      "Salaire base (G)",
      "Heures supp (G)",
      "Total (G)",
      "Date paiement",
      "Pay\u00e9 par",
    ];
    const rows = sortedPayroll.map((r) => [
      r.employeeName,
      r.period,
      r.basePay,
      r.overtimePay,
      r.totalPay,
      fmtDate(r.paidAt),
      r.paidBy,
    ]);
    dlCsv([header, ...rows], "historique_paie.csv");
  }

  const filteredEmployees = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.position.toLowerCase().includes(search.toLowerCase()),
  );

  const filteredPayroll =
    historyFilter === "all"
      ? payrollRecords
      : payrollRecords.filter((r) => r.employeeId === historyFilter);

  const sortedPayroll = [...filteredPayroll].sort(
    (a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime(),
  );

  const totalPayroll = sortedPayroll.reduce((s, r) => s + r.totalPay, 0);

  const summaryCards = [
    {
      label: "Employ\u00e9s actifs",
      value: employees.length,
      icon: <Users className="w-5 h-5" />,
    },
    {
      label: "Masse salariale mensuelle",
      value: fmtG(
        employees.reduce((s, e) => s + e.baseSalary, 0),
        currency,
      ),
      icon: <Wallet className="w-5 h-5" />,
    },
    {
      label: "Paiements ce mois",
      value: payrollRecords.filter((r) =>
        r.paidAt.startsWith(new Date().toISOString().slice(0, 7)),
      ).length,
      icon: <Calendar className="w-5 h-5" />,
    },
    {
      label: "Total vers\u00e9 (cumul)",
      value: fmtG(
        payrollRecords.reduce((s, r) => s + r.totalPay, 0),
        currency,
      ),
      icon: <Building2 className="w-5 h-5" />,
    },
  ];

  const empTableHeaders = [
    "Nom",
    "Poste",
    "T\u00e9l\u00e9phone",
    "Email",
    `Salaire (${currency})`,
    "Embauch\u00e9",
    "Actions",
  ];

  const payTableHeaders = [
    "Employ\u00e9",
    "P\u00e9riode",
    `Base (${currency})`,
    `Supp. (${currency})`,
    `Total (${currency})`,
    "Pay\u00e9 le",
    "Par",
    "Fiche",
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto" data-ocid="employees.page">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-semibold text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" /> Gestion des Employ\u00e9s
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {employees.length} employ\u00e9{employees.length !== 1 ? "s" : ""}{" "}
            enregistr\u00e9
            {employees.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          type="button"
          onClick={() => {
            setEditingEmp(null);
            setEmpModalOpen(true);
          }}
          data-ocid="employees.add_button"
        >
          <Plus className="w-4 h-4 mr-2" /> Ajouter un employ\u00e9
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map((c) => (
          <Card key={c.label} className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                {c.icon}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">
                  {c.label}
                </p>
                <p className="font-semibold text-foreground">{c.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="employes">
        <TabsList data-ocid="employees.tab_list">
          <TabsTrigger value="employes" data-ocid="employees.employes_tab">
            Employ\u00e9s
          </TabsTrigger>
          <TabsTrigger value="historique" data-ocid="employees.history_tab">
            Historique de Paie
          </TabsTrigger>
        </TabsList>

        {/* ── Employés tab ─────────────────────────────────────────── */}
        <TabsContent value="employes" className="mt-4 space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Input
              data-ocid="employees.search_input"
              placeholder="Rechercher un employ\u00e9\u2026"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={exportEmployeesCsv}
              data-ocid="employees.export_button"
            >
              <Download className="w-4 h-4 mr-2" /> Exporter CSV
            </Button>
          </div>

          {filteredEmployees.length === 0 ? (
            <Card className="bg-card">
              <CardContent className="py-16 flex flex-col items-center gap-3">
                <Users className="w-12 h-12 text-muted-foreground/40" />
                <p
                  className="text-muted-foreground"
                  data-ocid="employees.empty_state"
                >
                  Aucun employ\u00e9 trouv\u00e9.
                </p>
                <Button
                  type="button"
                  onClick={() => {
                    setEditingEmp(null);
                    setEmpModalOpen(true);
                  }}
                  data-ocid="employees.empty_add_button"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un employ\u00e9
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div
              className="rounded-lg border border-border overflow-hidden"
              data-ocid="employees.list"
            >
              <table className="w-full text-sm">
                <thead className="bg-muted/60">
                  <tr>
                    {empTableHeaders.map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-muted-foreground font-medium"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((emp, i) => (
                    <tr
                      key={emp.id}
                      className="border-t border-border hover:bg-muted/30 transition-colors"
                      data-ocid={`employees.item.${i + 1}`}
                    >
                      <td className="px-4 py-3 font-medium text-foreground">
                        {emp.name}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary">{emp.position}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {emp.phone || "\u2014"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {emp.email || "\u2014"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {fmtG(emp.baseSalary, currency)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {fmtDate(emp.hireDate)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setPayrollTarget(emp)}
                            data-ocid={`employees.pay_button.${i + 1}`}
                          >
                            <Wallet className="w-3 h-3 mr-1" />
                            Payer
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingEmp(emp);
                              setEmpModalOpen(true);
                            }}
                            data-ocid={`employees.edit_button.${i + 1}`}
                            aria-label="Modifier"
                          >
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(emp.id)}
                            data-ocid={`employees.delete_button.${i + 1}`}
                            aria-label="Supprimer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* ── Historique tab ───────────────────────────────────────── */}
        <TabsContent value="historique" className="mt-4 space-y-4">
          <div className="flex items-center gap-3 flex-wrap justify-between">
            <select
              data-ocid="payroll_history.filter_select"
              className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              value={historyFilter}
              onChange={(e) => setHistoryFilter(e.target.value)}
            >
              <option value="all">Tous les employ\u00e9s</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                Total filtr\u00e9 :{" "}
                <strong className="text-foreground">
                  {fmtG(totalPayroll, currency)}
                </strong>
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={exportPayrollCsv}
                data-ocid="payroll_history.export_button"
              >
                <Download className="w-4 h-4 mr-2" />
                Exporter CSV
              </Button>
            </div>
          </div>

          {sortedPayroll.length === 0 ? (
            <Card className="bg-card">
              <CardContent className="py-16 flex flex-col items-center gap-3">
                <Wallet className="w-12 h-12 text-muted-foreground/40" />
                <p
                  className="text-muted-foreground"
                  data-ocid="payroll_history.empty_state"
                >
                  Aucun paiement enregistr\u00e9.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Paiements de salaire
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div
                  className="rounded-b-lg overflow-hidden"
                  data-ocid="payroll_history.list"
                >
                  <table className="w-full text-sm">
                    <thead className="bg-muted/60">
                      <tr>
                        {payTableHeaders.map((h) => (
                          <th
                            key={h}
                            className="text-left px-4 py-3 text-muted-foreground font-medium"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedPayroll.map((r, i) => (
                        <tr
                          key={r.id}
                          className="border-t border-border hover:bg-muted/30 transition-colors"
                          data-ocid={`payroll_history.item.${i + 1}`}
                        >
                          <td className="px-4 py-3 font-medium">
                            {r.employeeName}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {r.period}
                          </td>
                          <td className="px-4 py-3">
                            {fmtG(r.basePay, currency)}
                          </td>
                          <td className="px-4 py-3 text-primary">
                            {fmtG(r.overtimePay, currency)}
                          </td>
                          <td className="px-4 py-3 font-bold">
                            {fmtG(r.totalPay, currency)}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {fmtDate(r.paidAt)}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {r.paidBy}
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => setPayslipRecord(r)}
                              data-ocid={`payroll_history.print_button.${i + 1}`}
                            >
                              <Printer className="w-3 h-3 mr-1" />
                              Fiche
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Modals ───────────────────────────────────────────────────── */}
      {empModalOpen && (
        <EmployeeFormModal
          initial={editingEmp}
          onSave={saveEmployee}
          onClose={() => {
            setEmpModalOpen(false);
            setEditingEmp(null);
          }}
        />
      )}

      {deleteTarget && (
        <PinModal
          open
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeletePin}
          title="Supprimer l'employ\u00e9 (PIN requis)"
        />
      )}

      {payrollTarget && (
        <PayrollModal
          employee={payrollTarget}
          paidBy={paidBy}
          onSave={savePayroll}
          onClose={() => setPayrollTarget(null)}
        />
      )}

      {payslipRecord && (
        <PayslipPrint
          record={payslipRecord}
          onClose={() => setPayslipRecord(null)}
        />
      )}
    </div>
  );
}
