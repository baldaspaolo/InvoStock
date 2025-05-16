import React, { useContext, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { Card } from "primereact/card";

const SystemAdminPanel = () => {
  const { user } = useContext(AuthContext);
  const [section, setSection] = useState(null);
  const navigate = useNavigate();

  /*if (user?.role !== "systemadmin") {
    return <Navigate to="/dashboard" replace />;
  }*/

  if (section === "users")
    return <UsersAdmin onBack={() => setSection(null)} />;
  if (section === "organizations")
    return <OrganizationsAdmin onBack={() => setSection(null)} />;

  return (
    <div
      style={{
        padding: "2rem",
        display: "flex",
        flexWrap: "wrap",
        gap: "2rem",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "70vh",
      }}
    >
      <Card
        title="Korisnici"
        style={{
          cursor: "pointer",
          textAlign: "center",
          width: "300px",
          height: "225px", // 300 * 3/4 = 225
          borderRadius: "16px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          transition: "transform 0.2s, box-shadow 0.2s",
          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
        }}
        onClick={() => navigate("/admin/users")}
      >
        <p>Pregled svih korisnika sustava</p>
      </Card>

      <Card
        title="Organizacije"
        style={{
          cursor: "pointer",
          textAlign: "center",
          width: "300px",
          height: "225px",
          borderRadius: "16px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          transition: "transform 0.2s, box-shadow 0.2s",
          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
        }}
        onClick={() => navigate("/admin/organizations")}
      >
        <p>Pregled svih organizacija</p>
      </Card>
    </div>
  );
};

export default SystemAdminPanel;
