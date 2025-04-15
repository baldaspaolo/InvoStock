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
import Orders from "./pages/UserOrganizationPages/Orders";
import OrdersAdd from "./pages/UserOrganizationPages/OrdersAdd";

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
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/add" element={<OrdersAdd />} />
          </Route>

          <Route path="*" element={<Login />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
