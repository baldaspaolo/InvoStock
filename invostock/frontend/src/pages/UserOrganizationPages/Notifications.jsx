import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { ConfirmDialog } from "primereact/confirmdialog";
import { confirmDialog } from "primereact/confirmdialog";
import { Panel } from "primereact/panel";
import { Dialog } from "primereact/dialog";
import { Tag } from "primereact/tag";
import NotificationsOrgAdd from "../../components/NotificationsOrgAdd";

const Notifications = () => {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);

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
    return date.toLocaleString("hr-HR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusTemplate = (rowData) => (
    <Tag
      value={rowData.is_read ? "Pročitano" : "Nepročitano"}
      severity={rowData.is_read ? "success" : "warning"}
      style={{ fontSize: "0.75rem" }}
    />
  );

  const actionTemplate = (rowData) => (
    <Button
      icon="pi pi-times"
      className="p-button-danger"
      size="small"
      onClick={() => handleDelete(rowData.id)}
    />
  );

  return (
    <div style={{ padding: "2rem", margin: "5%" }}>
      <Panel header="Obavijesti">
        {user.org_role === "admin" && (
          <div
            style={{
              margin: "1rem 0",
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <Button
              label="Pošalji obavijest"
              icon="pi pi-send"
              onClick={() => setDialogVisible(true)}
              style={{ width: "15%" }}
            />
          </div>
        )}
        <ConfirmDialog />
        <DataTable
          value={notifications}
          loading={loading}
          paginator
          rows={10}
          responsiveLayout="scroll"
          rowClassName={(rowData) => (!rowData.is_read ? "bg-blue-50" : "")}
          onRowClick={async (e) => {
            try {
              await fetch(
                "http://localhost:3000/api/notifications/markSingleNotificationAsRead",
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    userId: user.id,
                    notificationId: e.data.id,
                  }),
                }
              );

              setNotifications((prev) =>
                prev.map((n) => (n.id === e.data.id ? { ...n, is_read: 1 } : n))
              );
            } catch (err) {
              console.error(
                "Greška kod označavanja obavijesti kao pročitane:",
                err
              );
            }

            navigate(`/notifications/${e.data.id}`);
          }}
          selectionMode="single"
          style={{ cursor: "pointer" }}
        >
          <Column field="id" header="ID" sortable />
          <Column field="title" header="Naslov" sortable />
          <Column field="message" header="Poruka" />
          <Column body={dateTemplate} header="Datum" />
          <Column body={statusTemplate} header="Status" sortable />
          <Column body={actionTemplate} header="" />
        </DataTable>
      </Panel>

      <Dialog
        header="Nova obavijest"
        visible={dialogVisible}
        style={{ width: "50vw" }}
        onHide={() => setDialogVisible(false)}
        dismissableMask
      >
        <NotificationsOrgAdd />
      </Dialog>
    </div>
  );
};

export default Notifications;
