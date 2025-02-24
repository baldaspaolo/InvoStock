import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { Toast } from "primereact/toast";

import "./App.css";
import "primereact/resources/themes/lara-light-cyan/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/UserOrganizationPages/Dashboard";
import Layout from "./components/Layout";
import Invoices from "./pages/UserOrganizationPages/Invoices";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toast ref={(el) => (window.toast = el)} />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/invoices" element={<Invoices />} />
          </Route>

          <Route path="*" element={<Login />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
