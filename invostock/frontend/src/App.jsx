import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { Toast } from "primereact/toast";
import ProtectedRoute from "./ProtectedRoute"; // Uvozite ProtectedRoute

import "./App.css";
import "primereact/resources/themes/lara-light-cyan/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/UserOrganizationPages/Dashboard";
import Layout from "./components/Layout";
import Invoices from "./pages/UserOrganizationPages/Invoices";
import Inventory from "./pages/UserOrganizationPages/Inventory";
import Expenses from "./pages/UserOrganizationPages/Expenses";
import InvoiceItem from "./pages/UserOrganizationPages/InvoiceItem";
import InvoiceAdd from "./pages/UserOrganizationPages/InvoiceAdd";
import Contacts from "./pages/UserOrganizationPages/Contacts";
import InventoryItem from "./pages/UserOrganizationPages/InventoryItem";
import ResetPassword from "./pages/UserOrganizationPages/ResetPassword";
import Sales from "./pages/UserOrganizationPages/Sales";
import SalesItem from "./pages/UserOrganizationPages/SalesItem";
import Notifications from "./pages/UserOrganizationPages/Notifications";
import NotificationItem from "./pages/UserOrganizationPages/NotificationItem";
import Account from "./pages/UserOrganizationPages/Account";
import Orders from "./pages/UserOrganizationPages/Orders";
import OrdersAdd from "./pages/UserOrganizationPages/OrdersAdd";
import Payments from "./pages/UserOrganizationPages/Payments";
import Packages from "./pages/UserOrganizationPages/Packages";
import SalesAdd from "./pages/UserOrganizationPages/SalesAdd";
import InventoryAdd from "./pages/UserOrganizationPages/InventoryAdd";
import ExpensesAdd from "./pages/UserOrganizationPages/ExpensesAdd";

import SystemAdminPanel from "./pages/AdminPages/SystemAdminPanel";
import UsersItem from "./pages/AdminPages/UsersItem";
import Users from "./pages/AdminPages/Users";
import Organizations from "./pages/AdminPages/Organizations";
import AdminProtectedRoutes from "./AdminProtectedRoutes";
import OrganizationsItem from "./pages/AdminPages/OrganizationsItem";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toast ref={(el) => (window.toast = el)} />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/invoices/:id/:user_id" element={<InvoiceItem />} />
            <Route path="/invoices/add" element={<InvoiceAdd />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/inventoryItem" element={<InventoryItem />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/sales/:sale_id" element={<SalesItem />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/notifications/:id" element={<NotificationItem />} />
            <Route path="/account" element={<Account />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/add" element={<OrdersAdd />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/packages" element={<Packages />} />
            <Route path="/sales/add" element={<SalesAdd />} />
            <Route path="/inventory/add" element={<InventoryAdd />} />
            <Route path="/expenses/add" element={<ExpensesAdd />} />
          </Route>
          <Route
            path="/admin/dashboard"
            element={
              <AdminProtectedRoutes>
                <SystemAdminPanel />
              </AdminProtectedRoutes>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminProtectedRoutes>
                <Users />
              </AdminProtectedRoutes>
            }
          />
          <Route
            path="/admin/users/:id"
            element={
              <AdminProtectedRoutes>
                <UsersItem />
              </AdminProtectedRoutes>
            }
          />
          <Route
            path="/admin/organizations"
            element={
              <AdminProtectedRoutes>
                <Organizations />
              </AdminProtectedRoutes>
            }
          />
          <Route
            path="/admin/organizations/:id"
            element={
              <AdminProtectedRoutes>
                <OrganizationsItem />
              </AdminProtectedRoutes>
            }
          />

          <Route path="*" element={<Login />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
