// NotificationItem.jsx
import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { Panel } from "primereact/panel";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Divider } from "primereact/divider";

const NotificationItem = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotification = async () => {
      try {
        const res = await fetch(
          "http://localhost:3000/api/notifications/getSingleNotification",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ notificationId: id, userId: user.id }),
          }
        );
        const data = await res.json();
        if (data.success) {
          setNotification(data.notification);

          await fetch(
            "http://localhost:3000/api/notifications/markSingleNotificationAsRead",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                notificationId: id,
                userId: user.id,
              }),
            }
          );
        }
      } catch (err) {
        console.error("Greška kod dohvata ili označavanja obavijesti:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotification();
  }, [id]);

  if (loading) return <p style={{ padding: "2rem" }}>Učitavanje...</p>;
  if (!notification)
    return <p style={{ padding: "2rem" }}>Obavijest nije pronađena.</p>;

  return (
    <div style={{ padding: "2rem", margin: "5%" }}>
      <Panel header={notification.title}>
        <Tag
          value={notification.is_read ? "Pročitano" : "Nepročitano"}
          severity={notification.is_read ? "success" : "warning"}
          style={{ fontSize: "0.85rem", marginBottom: "1rem", width: "10%" }}
        />
        <p>
          <strong>Datum:</strong>{" "}
          {new Date(notification.created_at).toLocaleString("hr-HR", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
        <div style={{}}>
          <h4>Sadržaj poruke</h4>
          <div style={{width:" 60%"}}>
            <Divider />
          </div>
        
          <p style={{ marginBottom: "1rem" }}>{notification.message}</p>
        </div>
        <Button
          label="Natrag"
          icon="pi pi-arrow-left"
          className="p-button-text"
          onClick={() => navigate("/notifications")}
          style={{ marginTop: "1rem" }}
        />
      </Panel>
    </div>
  );
};

export default NotificationItem;
