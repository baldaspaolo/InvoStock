import React, { useRef, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { AuthContext } from "../context/AuthContext";
import { Menubar } from "primereact/menubar";
import { Menu } from "primereact/menu";
import { OverlayPanel } from "primereact/overlaypanel";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
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
            read: n.read === 1, // Pretvori broj u boolean
          }));
          setNotifications(transformed); // Postavi state s ispravnim podacima
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
        setNotifications((prev) => prev.map((n) => ({ ...n, read: 1 })));
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
    console.log(user);
    setTimeout(() => {
      navigate("/login");
    }, 1500);
  };

  const items = [
    {
      label: "Home",
      icon: "pi pi-home",
      command: () => (window.location.href = "/dashboard"),
    },
    {
      label: "Prodaja",
      icon: "pi pi-shopping-cart",
      items: [
        {
          label: "Prodajni nalog",
          icon: "pi pi-book",
          command: () => (window.location.href = "/sales"),
        },
        {
          label: "Fakture",
          icon: "pi pi-file",
          command: () => (window.location.href = "/invoices"),
        },
        {
          label: "Uplate",
          icon: "pi pi-credit-card",
          command: () => (window.location.href = "/payments"),
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
          command: () => (window.location.href = "/orders"),
        },
      ],
    },
    {
      label: "Troškovi",
      icon: "pi pi-money-bill",
      command: () => (window.location.href = "/expenses"),
    },
    {
      label: "Inventar",
      icon: "pi pi-box",
      command: () => (window.location.href = "/inventory"),
    },
  ];

  const rightItems = [
    {
      label: "Odjava",
      icon: "pi pi-sign-out",
      command: () => logoutUser(),
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
        gap: "20px",
        marginRight: "10%",
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
      <i className="pi pi-user" style={{ cursor: "pointer" }}></i>
      <i>{user?.name}</i>
      <span style={{ cursor: "pointer" }}>Moj račun</span>

      <i
        className="pi pi-bars"
        style={{ cursor: "pointer" }}
        onClick={(e) => menu.current && menu.current.toggle(e)}
      />
      <Menu model={rightItems} popup ref={menu} />
    </div>
  );

  return (
    <div className="card">
      <Toast ref={toast} />
      <Menubar model={items} start={start} end={end} />

      <OverlayPanel
        ref={op}
        style={{ width: "300px" }}
        className="notification-overlay"
      >
        <h3>
          <i className="pi pi-bell" style={{ marginRight: "0.5rem" }} />{" "}
          Obavijesti
        </h3>
        {loading ? (
          <p>Učitavanje...</p>
        ) : notifications.length > 0 ? (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {notifications.map((n) => (
              <li
                key={n.id}
                style={{
                  backgroundColor: n.read ? "#f5f5f5" : "#e0f7fa",
                  padding: "0.7rem",
                  borderRadius: "5px",
                  marginBottom: "0.5rem",
                }}
              >
                <strong>{n.title}</strong>
                <p>{n.message}</p>
                <small style={{ color: n.read ? "green" : "red" }}>
                  {n.read ? "Pročitano" : "Nepročitano"}
                </small>
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
    </div>
  );
}
