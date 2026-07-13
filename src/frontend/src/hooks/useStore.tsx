import type {
  Client,
  Employee,
  Order,
  PayrollRecord,
  Product,
  ProductionTask,
  StoreAction,
  StoreState,
  User,
} from "@/types";
import type React from "react";
import { createContext, useContext, useEffect, useReducer } from "react";

const STORAGE_KEY = "minou_patisserie_v1";

// Simple hash (not cryptographic, for local use only)
export function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

// Seed Data
const seedProducts: Product[] = [
  {
    id: "p1",
    name: "Gateau au Chocolat",
    category: "Gateaux",
    price: 350,
    stock: 12,
    lowStockThreshold: 3,
  },
  {
    id: "p2",
    name: "Croissant Beurre",
    category: "Viennoiseries",
    price: 45,
    stock: 30,
    lowStockThreshold: 10,
  },
  {
    id: "p3",
    name: "Madeleine Citron",
    category: "Biscuits",
    price: 25,
    stock: 50,
    lowStockThreshold: 15,
  },
  {
    id: "p4",
    name: "Tarte aux Fruits",
    category: "Tartes",
    price: 280,
    stock: 8,
    lowStockThreshold: 3,
  },
  {
    id: "p5",
    name: "Pain au Lait",
    category: "Pains",
    price: 35,
    stock: 40,
    lowStockThreshold: 10,
  },
];

const seedClients: Client[] = [
  {
    id: "c1",
    name: "Marie Dupont",
    phone: "509-3400-1234",
    email: "marie@example.com",
    creditBalance: 0,
    totalPurchases: 1250,
  },
  {
    id: "c2",
    name: "Jean Baptiste",
    phone: "509-3600-5678",
    email: "jean@example.com",
    creditBalance: 450,
    totalPurchases: 3800,
  },
];

const seedAdmin: User = {
  id: "u1",
  username: "admin",
  passwordHash: simpleHash("123"),
  role: "admin",
};

const seedEmployees: Employee[] = [
  {
    id: "e1",
    name: "Sophie Martin",
    position: "Pâtissière chef",
    baseSalary: 18000,
    hoursWorked: 160,
    overtimeRate: 120,
    hireDate: "2022-03-15",
    phone: "509-3400-0001",
    email: "sophie@minoubakery.ht",
  },
  {
    id: "e2",
    name: "Pierre Louis",
    position: "Vendeur",
    baseSalary: 12000,
    hoursWorked: 160,
    overtimeRate: 80,
    hireDate: "2023-06-01",
    phone: "509-3600-0002",
    email: "pierre@minoubakery.ht",
  },
];

const initialState: StoreState = {
  products: seedProducts,
  sales: [],
  clients: seedClients,
  expenses: [],
  users: [seedAdmin],
  auditLog: [],
  settings: {
    theme: "light",
    adminPin: "1234",
    shopName: "Minou Patisserie",
    currency: "G",
  },
  orders: [],
  employees: seedEmployees,
  payrollRecords: [],
  productionTasks: [],
};

// Reducer
function storeReducer(state: StoreState, action: StoreAction): StoreState {
  switch (action.type) {
    case "SET_STATE":
      return action.payload;
    case "ADD_PRODUCT":
      return { ...state, products: [...state.products, action.payload] };
    case "UPDATE_PRODUCT":
      return {
        ...state,
        products: state.products.map((p) =>
          p.id === action.payload.id ? action.payload : p,
        ),
      };
    case "DELETE_PRODUCT":
      return {
        ...state,
        products: state.products.filter((p) => p.id !== action.payload),
      };
    case "ADD_SALE":
      return { ...state, sales: [...state.sales, action.payload] };
    case "DELETE_SALE":
      return {
        ...state,
        sales: state.sales.filter((s) => s.id !== action.payload),
      };
    case "ADD_CLIENT":
      return { ...state, clients: [...state.clients, action.payload] };
    case "UPDATE_CLIENT":
      return {
        ...state,
        clients: state.clients.map((c) =>
          c.id === action.payload.id ? action.payload : c,
        ),
      };
    case "DELETE_CLIENT":
      return {
        ...state,
        clients: state.clients.filter((c) => c.id !== action.payload),
      };
    case "ADD_EXPENSE":
      return { ...state, expenses: [...state.expenses, action.payload] };
    case "UPDATE_EXPENSE":
      return {
        ...state,
        expenses: state.expenses.map((e) =>
          e.id === action.payload.id ? action.payload : e,
        ),
      };
    case "DELETE_EXPENSE":
      return {
        ...state,
        expenses: state.expenses.filter((e) => e.id !== action.payload),
      };
    case "ADD_USER":
      return { ...state, users: [...state.users, action.payload] };
    case "UPDATE_USER":
      return {
        ...state,
        users: state.users.map((u) =>
          u.id === action.payload.id ? action.payload : u,
        ),
      };
    case "DELETE_USER":
      return {
        ...state,
        users: state.users.filter((u) => u.id !== action.payload),
      };
    case "ADD_AUDIT":
      return {
        ...state,
        auditLog: [action.payload, ...state.auditLog].slice(0, 500),
      };
    case "SET_THEME":
      return {
        ...state,
        settings: { ...state.settings, theme: action.payload },
      };
    case "UPDATE_SETTINGS":
      return { ...state, settings: { ...state.settings, ...action.payload } };
    case "ADD_ORDER":
      return { ...state, orders: [...state.orders, action.payload] };
    case "UPDATE_ORDER":
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.payload.id ? action.payload : o,
        ),
      };
    case "DELETE_ORDER":
      return {
        ...state,
        orders: state.orders.filter((o) => o.id !== action.payload),
      };
    case "ADD_EMPLOYEE":
      return { ...state, employees: [...state.employees, action.payload] };
    case "UPDATE_EMPLOYEE":
      return {
        ...state,
        employees: state.employees.map((e) =>
          e.id === action.payload.id ? action.payload : e,
        ),
      };
    case "DELETE_EMPLOYEE":
      return {
        ...state,
        employees: state.employees.filter((e) => e.id !== action.payload),
      };
    case "ADD_PAYROLL":
      return {
        ...state,
        payrollRecords: [...state.payrollRecords, action.payload],
      };
    case "DELETE_PAYROLL":
      return {
        ...state,
        payrollRecords: state.payrollRecords.filter(
          (p) => p.id !== action.payload,
        ),
      };
    case "ADD_PRODUCTION_TASK":
      return {
        ...state,
        productionTasks: [...state.productionTasks, action.payload],
      };
    case "UPDATE_PRODUCTION_TASK":
      return {
        ...state,
        productionTasks: state.productionTasks.map((t) =>
          t.id === action.payload.id ? action.payload : t,
        ),
      };
    case "DELETE_PRODUCTION_TASK":
      return {
        ...state,
        productionTasks: state.productionTasks.filter(
          (t) => t.id !== action.payload,
        ),
      };
    default:
      return state;
  }
}

// Context
interface StoreContextValue {
  state: StoreState;
  dispatch: React.Dispatch<StoreAction>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(storeReducer, initialState, (init) => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<StoreState>;
        const merged: StoreState = {
          ...init,
          ...parsed,
          settings: { ...init.settings, ...(parsed.settings ?? {}) },
        };
        // Migration: ensure the admin user always has role='admin'
        // This fixes old localStorage data where role may have been corrupted.
        merged.users = merged.users.map((u) =>
          u.username === "admin" && u.role !== "admin"
            ? { ...u, role: "admin" as const }
            : u,
        );
        // Migration: ensure seed admin exists if users list is empty
        if (merged.users.length === 0) {
          merged.users = [seedAdmin];
        }
        return merged;
      }
    } catch {
      // use initial state
    }
    return init;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // storage quota exceeded or unavailable
    }
  }, [state]);

  // Apply theme class on change
  useEffect(() => {
    if (state.settings.theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [state.settings.theme]);

  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
