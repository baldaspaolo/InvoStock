import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Panel } from "primereact/panel";
import { Tag } from "primereact/tag";

const NotificationsAdmin = () => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/notifications/admin/getAllNotifications`
      );
      const data = await response.json();
      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error("Greška prilikom dohvaćanja obavijesti:", error);
    }
  };

  const filteredNotifications = useMemo(() => {
    if (filter === "admin") {
      return notifications.filter((n) => n.sender === "system");
    }
    return notifications;
  }, [filter, notifications]);

  const typeTemplate = (rowData) => (
    <Tag
      value={rowData.type}
      severity={
        rowData.type === "info"
          ? "info"
          : rowData.type === "warning"
          ? "warning"
          : rowData.type === "error"
          ? "danger"
          : "success"
      }
    />
  );

  const senderTemplate = (rowData) =>
    rowData.sender === "system" ? "System admin" : "Admin organizacije";

  return (
    <div style={{ margin: "5%" }}>
      <Panel header="Sistemske obavijesti">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
            flexWrap: "wrap",
            marginBottom: "1rem",
          }}
        >
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Button
              label="Sve"
              className="p-button-sm"
              onClick={() => setFilter("all")}
              outlined={filter !== "all"}
            />
            <Button
              label="Admin obavijesti"
              className="p-button-sm"
              onClick={() => setFilter("admin")}
              outlined={filter !== "admin"}
            />
          </div>
          <div style={{ display: "flex" }}>
            <Button
              label="Pošalji obavijest"
              icon="pi pi-plus"
              className="p-button-success p-button-sm"
              onClick={() => navigate("/admin/notifications/add")}
            />
          </div>
        </div>

        <DataTable
          value={filteredNotifications}
          paginator
          rows={10}
          stripedRows
          responsiveLayout="scroll"
        >
          <Column field="title" header="Naslov" sortable />
          <Column field="message" header="Poruka" sortable />
          <Column field="created_at" header="Datum" sortable />
          <Column header="Vrsta" body={typeTemplate} />
          <Column header="Poslao" body={senderTemplate} />
        </DataTable>
      </Panel>
    </div>
  );
};

export default NotificationsAdmin;
