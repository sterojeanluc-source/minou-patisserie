import { AppLayout } from "@/components/Layout";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { StoreProvider, useStore } from "@/hooks/useStore";
import { AdminPage } from "@/pages/AdminPage";
import { ClientsPage } from "@/pages/ClientsPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { EmployeesPage } from "@/pages/EmployeesPage";
import { ExpensesPage } from "@/pages/ExpensesPage";
import { InventoryPage } from "@/pages/InventoryPage";
import { LoginPage } from "@/pages/LoginPage";
import { OrdersPage } from "@/pages/OrdersPage";
import { ProductionPage } from "@/pages/ProductionPage";
import { ReportsPage } from "@/pages/ReportsPage";
import { SalesPage } from "@/pages/SalesPage";
import type { PageName } from "@/types";
import { useState } from "react";

export { useStore } from "@/hooks/useStore";
export { useAuth, AuthProvider } from "@/hooks/useAuth";
export type {
  Product,
  SaleItem,
  Sale,
  Client,
  Expense,
  User,
  AuditEntry,
  AppSettings,
  StoreState,
  StoreAction,
  PageName,
  PaymentMethod,
  UserRole,
  Theme,
  Order,
  OrderItem,
  OrderStatus,
  Employee,
  PayrollRecord,
  ProductionTask,
  ProductionStatus,
} from "@/types";

function AppShell() {
  const { state, dispatch } = useStore();
  const auth = useAuth();
  const [currentPage, setCurrentPage] = useState<PageName>("dashboard");

  if (!auth.currentUser) {
    return <LoginPage onLogin={auth.login} />;
  }

  const handleToggleTheme = () => {
    dispatch({
      type: "SET_THEME",
      payload: state.settings.theme === "dark" ? "light" : "dark",
    });
  };

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <DashboardPage onNavigate={setCurrentPage} />;
      case "ventes":
        return <SalesPage />;
      case "inventaire":
        return <InventoryPage />;
      case "clients":
        return <ClientsPage />;
      case "depenses":
        return <ExpensesPage />;
      case "commandes":
        return <OrdersPage />;
      case "employes":
        return <EmployeesPage />;
      case "production":
        return <ProductionPage />;
      case "rapports":
        return <ReportsPage />;
      case "administration":
        return <AdminPage />;
      default:
        return <DashboardPage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <AppLayout
      currentPage={currentPage}
      onNavigate={setCurrentPage}
      currentUser={auth.currentUser}
      onLogout={auth.logout}
      theme={state.settings.theme}
      onToggleTheme={handleToggleTheme}
    >
      {renderPage()}
    </AppLayout>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </StoreProvider>
  );
}
