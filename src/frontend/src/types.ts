// --- Core Data Types ---------------------------------------------------------

export type PaymentMethod = "cash" | "credit";
export type UserRole = "admin" | "employee";
export type Theme = "light" | "dark";

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  lowStockThreshold: number;
}

export interface SaleItem {
  productId: string;
  name: string;
  qty: number;
  unitPrice: number;
}

export interface Sale {
  id: string;
  date: string;
  items: SaleItem[];
  clientId: string | null;
  paymentMethod: PaymentMethod;
  total: number;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  creditBalance: number;
  totalPurchases: number;
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  amount: number;
  description: string;
}

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  role: UserRole;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  userId: string;
  action: string;
  details: string;
}

export interface AppSettings {
  theme: Theme;
  adminPin: string;
  shopName: string;
  currency: string;
}

export type OrderStatus =
  | "pending"
  | "preparing"
  | "ready"
  | "delivered"
  | "cancelled";
export type ProductionStatus = "planned" | "in_progress" | "done";

export interface OrderItem {
  productId: string;
  name: string;
  qty: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  clientId: string | null;
  clientName: string;
  items: OrderItem[];
  status: OrderStatus;
  createdAt: string;
  deliveryDate: string;
  deposit: number;
  notes: string;
  totalAmount: number;
}

export interface Employee {
  id: string;
  name: string;
  position: string;
  baseSalary: number;
  hoursWorked: number;
  overtimeRate: number;
  hireDate: string;
  phone: string;
  email: string;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  period: string;
  basePay: number;
  overtimePay: number;
  totalPay: number;
  paidAt: string;
  paidBy: string;
}

export interface ProductionTask {
  id: string;
  productName: string;
  productId: string | null;
  quantity: number;
  plannedDate: string;
  status: ProductionStatus;
  completedAt: string | null;
  notes: string;
}

export interface StoreState {
  products: Product[];
  sales: Sale[];
  clients: Client[];
  expenses: Expense[];
  users: User[];
  auditLog: AuditEntry[];
  settings: AppSettings;
  orders: Order[];
  employees: Employee[];
  payrollRecords: PayrollRecord[];
  productionTasks: ProductionTask[];
}

export type StoreAction =
  | { type: "SET_STATE"; payload: StoreState }
  | { type: "ADD_PRODUCT"; payload: Product }
  | { type: "UPDATE_PRODUCT"; payload: Product }
  | { type: "DELETE_PRODUCT"; payload: string }
  | { type: "ADD_SALE"; payload: Sale }
  | { type: "DELETE_SALE"; payload: string }
  | { type: "ADD_CLIENT"; payload: Client }
  | { type: "UPDATE_CLIENT"; payload: Client }
  | { type: "DELETE_CLIENT"; payload: string }
  | { type: "ADD_EXPENSE"; payload: Expense }
  | { type: "UPDATE_EXPENSE"; payload: Expense }
  | { type: "DELETE_EXPENSE"; payload: string }
  | { type: "ADD_USER"; payload: User }
  | { type: "UPDATE_USER"; payload: User }
  | { type: "DELETE_USER"; payload: string }
  | { type: "ADD_AUDIT"; payload: AuditEntry }
  | { type: "SET_THEME"; payload: Theme }
  | { type: "UPDATE_SETTINGS"; payload: Partial<AppSettings> }
  | { type: "ADD_ORDER"; payload: Order }
  | { type: "UPDATE_ORDER"; payload: Order }
  | { type: "DELETE_ORDER"; payload: string }
  | { type: "ADD_EMPLOYEE"; payload: Employee }
  | { type: "UPDATE_EMPLOYEE"; payload: Employee }
  | { type: "DELETE_EMPLOYEE"; payload: string }
  | { type: "ADD_PAYROLL"; payload: PayrollRecord }
  | { type: "DELETE_PAYROLL"; payload: string }
  | { type: "ADD_PRODUCTION_TASK"; payload: ProductionTask }
  | { type: "UPDATE_PRODUCTION_TASK"; payload: ProductionTask }
  | { type: "DELETE_PRODUCTION_TASK"; payload: string };

export type PageName =
  | "dashboard"
  | "ventes"
  | "inventaire"
  | "clients"
  | "depenses"
  | "commandes"
  | "employes"
  | "production"
  | "rapports"
  | "administration";
