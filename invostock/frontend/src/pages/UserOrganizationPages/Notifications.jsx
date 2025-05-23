// Notifications.jsx
import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { ConfirmDialog } from "primereact/confirmdialog";
import { confirmDialog } from "primereact/confirmdialog";
import { Panel } from "primereact/panel";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import "primereact/resources/primereact.min.css";

const Notifications = () => {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch(
          "http://localhost:3000/api/notifications/getNotifications",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.id,
              organizationId: user.organization_id,
            }),
          }
        );
        const data = await response.json();
        if (data.success) {
          const sorted = data.notifications.sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at)
          );
          setNotifications(sorted);
        }
      } catch (error) {
        console.error("Greška kod dohvata obavijesti:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [user]);

  const handleDelete = (id) => {
    confirmDialog({
      message: "Jeste li sigurni da želite obrisati ovu obavijest?",
      header: "Potvrda",
      icon: "pi pi-exclamation-triangle",
      accept: async () => {
        try {
          const res = await fetch(
            `http://localhost:3000/api/notifications/deleteNotification/${id}`,
            {
              method: "DELETE",
            }
          );
          const data = await res.json();
          if (data.success) {
            setNotifications((prev) => prev.filter((n) => n.id !== id));
          }
        } catch (err) {
          console.error("Greška kod brisanja obavijesti:", err);
        }
      },
    });
  };

  const dateTemplate = (rowData) => {
    const date = new Date(rowData.created_at);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  const actionTemplate = (rowData) => {
    return (
      <Button
        icon="pi pi-times"
        className="p-button-danger"
        size="small"
        onClick={() => handleDelete(rowData.id)}
      />
    );
  };

  return (
    <div style={{ padding: "2rem", margin: "5%" }}>
      <Panel header="Obavijesti">
        <ConfirmDialog />
        <DataTable
          value={notifications}
          loading={loading}
          paginator
          rows={10}
          responsiveLayout="scroll"
          onRowClick={(e) => navigate(`/notifications/${e.data.id}`)}
          selectionMode="single"
          style={{ cursor: "pointer" }}
        >
          <Column
            field="custom_notification_code"
            header="ID"
            sortable
          ></Column>

          <Column field="title" header="Naslov" sortable></Column>
          <Column field="message" header="Poruka"></Column>
          <Column body={dateTemplate} header="Datum"></Column>
          <Column
            field="read"
            header="Status"
            body={(rowData) => (rowData.read ? "Pročitano" : "Nepročitano")}
            sortable
          ></Column>
          <Column body={actionTemplate} header=""></Column>
        </DataTable>
      </Panel>
    </div>
  );
};

export default Notifications;
