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
  const [joiningMessage, setJoiningMessage] = useState("");

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

  const acceptInvite = async () => {
    setJoiningMessage("Pridruživanje organizaciji... Odjavljivanje u tijeku.");

    try {
      const res = await fetch(
        "http://localhost:3000/api/organizations/acceptOrganizationInvite",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            inviteId: notification.ref_id,
            userId: user.id,
          }),
        }
      );

      const data = await res.json();

      if (data.success) {
        setTimeout(() => {
          navigate("/account");
        }, 2000);
      } else {
        setJoiningMessage("");
        alert(data.error || "Došlo je do greške.");
      }
    } catch (err) {
      setJoiningMessage("");
      console.error("Greška kod prihvata poziva:", err);
    }
  };

  const declineInvite = async () => {
    try {
      const res = await fetch(
        "http://localhost:3000/api/organizations/declineOrganizationInvite",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            inviteId: notification.ref_id,
            userId: user.id,
          }),
        }
      );
      const data = await res.json();
      if (data.success) {
        alert("Poziv je odbijen.");
        navigate("/notifications");
      } else {
        alert(data.error || "Greška kod odbijanja poziva.");
      }
    } catch (err) {
      console.error("Greška kod odbijanja poziva:", err);
    }
  };

  if (loading) return <p style={{ padding: "2rem" }}>Učitavanje...</p>;
  if (!notification)
    return <p style={{ padding: "2rem" }}>Obavijest nije pronađena.</p>;

  return (
    <div style={{ padding: "2rem", margin: "5%" }}>
      {joiningMessage && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.3)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <i
            className="pi pi-spin pi-spinner"
            style={{ fontSize: "3rem", color: "#fff" }}
          ></i>
          <p style={{ marginTop: "1rem", fontSize: "1.2rem", color: "white" }}>
            {joiningMessage}
          </p>
        </div>
      )}

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
          <div style={{ width: " 60%" }}>
            <Divider />
          </div>

          <p style={{ marginBottom: "1rem" }}>{notification.message}</p>
          {notification.type === "org_invite" && (
            <div style={{ marginTop: "1rem" }}>
              <p>
                <strong>Zahtjev poslao:</strong> {notification.inviter_name}
              </p>
              <p>
                <strong>Organizacija:</strong> {notification.organization_name}
              </p>

              {user.organization_id ? (
                <p style={{ marginTop: "1rem", color: "green" }}>
                  Već ste član organizacije.
                </p>
              ) : (
                <>
                  <p>
                    <strong>Želite li se pridružiti organizaciji?</strong>
                  </p>
                  <Button
                    label="Prihvati"
                    icon="pi pi-check"
                    className="p-button-success"
                    onClick={acceptInvite}
                    style={{ marginRight: "1rem", marginBottom: "1rem" }}
                  />
                  <Button
                    label="Odbij"
                    icon="pi pi-times"
                    className="p-button-danger"
                    onClick={declineInvite}
                  />
                </>
              )}
            </div>
          )}
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
