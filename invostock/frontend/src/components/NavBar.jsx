import React, { useRef, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { AuthContext } from "../context/AuthContext";
import { Menubar } from "primereact/menubar";
import { Menu } from "primereact/menu";
import { OverlayPanel } from "primereact/overlaypanel";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { SplitButton } from "primereact/splitbutton";
import "./NavBar.css";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const menu = useRef(null);
  const op = useRef(null);
  const toast = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("Current user:", user);
  }, [user]);

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
          const transformed = data.notifications.map((n) => ({
            ...n,
            read: !!n.is_read, // ispravka ovdje
          }));
          setNotifications(transformed);
        }
      } catch (err) {
        console.error("Greška prilikom dohvaćanja obavijesti:", err);
      }
    };

    fetchNotifications();
  }, [user]);

  const markAllAsRead = async () => {
    try {
      const response = await fetch(
        "http://localhost:3000/api/notifications/markAllNotificationsAsRead",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            organizationId: user.organization_id || null,
          }),
        }
      );

      const data = await response.json();

      toast.current.show({
        severity: data.success ? "success" : "info",
        summary: "Obavijesti",
        detail: data.message,
        life: 3000,
      });

      if (data.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      }
    } catch (error) {
      console.error("Greška:", error);
      toast.current.show({
        severity: "error",
        summary: "Greška",
        detail: "Neuspješno označavanje obavijesti kao pročitanih.",
        life: 3000,
      });
    }
  };

  const logoutUser = () => {
    logout();
    toast.current.show({
      severity: "success",
      summary: "Odjava",
      detail: "Uspješna odjava!",
      life: 3000,
    });
    setTimeout(() => {
      navigate("/login");
    }, 1500);
  };

  const items = [
    {
      label: "Home",
      icon: "pi pi-home",
      command: () => navigate("/dashboard"),
    },
    {
      label: "Prodaja",
      icon: "pi pi-shopping-cart",
      items: [
        {
          label: "Prodajni nalog",
          icon: "pi pi-book",
          command: () => navigate("/sales"),
        },
        {
          label: "Fakture",
          icon: "pi pi-file",
          command: () => navigate("/invoices"),
        },
        {
          label: "Paketi",
          icon: "pi pi-box",
          command: () => navigate("/packages"),
        },
        {
          label: "Uplate",
          icon: "pi pi-credit-card",
          command: () => navigate("/payments"),
        },
      ],
    },
    {
      label: "Kupnja",
      icon: "pi pi-truck",
      items: [
        {
          label: "Narudžbenice",
          icon: "pi pi-shopping-bag",
          command: () => navigate("/orders"),
        },
      ],
    },
    {
      label: "Troškovi",
      icon: "pi pi-money-bill",
      command: () => navigate("/expenses"),
    },
    {
      label: "Inventar",
      icon: "pi pi-box",
      command: () => navigate("/inventory"),
    },
  ];

  const start = (
    <img
      alt="logo"
      src="/photos/logo-no-background.svg"
      height="50"
      style={{ marginRight: "0" }}
    />
  );

  const end = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
      }}
    >
      <i
        className="pi pi-bell"
        onClick={(e) => op.current.toggle(e)}
        style={{ cursor: "pointer", position: "relative" }}
      >
        {notifications.some((n) => !n.read) && (
          <span
            style={{
              position: "absolute",
              top: "-5px",
              right: "-5px",
              backgroundColor: "red",
              color: "white",
              borderRadius: "50%",
              padding: "2px 6px",
              fontSize: "0.7rem",
            }}
          >
            {notifications.filter((n) => !n.read).length}
          </span>
        )}
      </i>

      <SplitButton
        label={`${user?.name}`}
        icon="pi pi-user"
        onClick={() => navigate("/account")}
        model={[
          {
            label: "Moj račun",
            icon: "pi pi-cog",
            command: () => navigate("/account"),
          },
          {
            label: "Odjava",
            icon: "pi pi-sign-out",
            command: () => logoutUser(),
          },
        ]}
        className="p-button-text user-splitbutton"
        style={{
          fontSize: "0.88rem",
          height: "36px",
          padding: "0 0.75rem",
        }}
      />
    </div>
  );

  return (
    <div className="navbar-fixed">
      <Toast ref={toast} position="top-left" />

      {user?.role === "systemadmin" ? (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            padding: "0.5rem 1rem",
            backgroundColor: "#f8f9fa",
          }}
        >
          <Button
            label="Odjava"
            icon="pi pi-sign-out"
            onClick={logoutUser}
            className="p-button-sm p-button-danger"
            style={{ width: "10%" }}
          />
        </div>
      ) : (
        <>
          <Menubar model={items} start={start} end={end} />
          <OverlayPanel
            ref={op}
            style={{ width: "300px" }}
            className="notification-overlay"
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 style={{ marginBottom: "0.5rem" }}>
                <i className="pi pi-bell" style={{ marginRight: "0.5rem" }} />{" "}
                Obavijesti
              </h3>
              <Button
                label="Otvori centar"
                icon="pi pi-external-link"
                onClick={(e) => {
                  op.current?.hide();
                  navigate(`/notifications`);
                }}
                text
                size="small"
                style={{ marginBottom: "8%", fontSize: "0.88rem" }}
              />
            </div>

            {loading ? (
              <p>Učitavanje...</p>
            ) : notifications.length > 0 ? (
              <ul style={{ listStyle: "none", padding: 0 }}>
                {notifications.slice(0, 10).map((n) => (
                  <li
                    key={n.id}
                    style={{
                      backgroundColor: n.read ? "#f5f5f5" : "#e0f7fa",
                      padding: "0.7rem",
                      borderRadius: "5px",
                      marginBottom: "0.5rem",
                      cursor: "pointer",
                    }}
                    onClick={(e) => {
                      op.current?.hide();
                      navigate(`/notifications/${n.id}`);
                    }}
                  >
                    <strong>{n.title}</strong>
                    <p style={{ margin: "0.3rem 0" }}>{n.message}</p>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.75rem",
                      }}
                    >
                      <span style={{ color: n.read ? "green" : "red" }}>
                        {n.read ? "Pročitano" : "Nepročitano"}
                      </span>
                      <span style={{ color: "#555" }}>
                        {new Date(n.created_at).toLocaleString("hr-HR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Nema dostupnih obavijesti.</p>
            )}

            <Button
              label="Označi sve kao pročitano"
              icon="pi pi-check"
              onClick={markAllAsRead}
              size="small"
              style={{ fontSize: "0.8rem", width: "100%" }}
            />
          </OverlayPanel>
        </>
      )}
    </div>
  );
}
