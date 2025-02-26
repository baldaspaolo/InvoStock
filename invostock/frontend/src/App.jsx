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

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toast ref={(el) => (window.toast = el)} />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

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
          </Route>

          <Route path="*" element={<Login />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
