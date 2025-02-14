import React, { useRef } from "react";
import { Menubar } from "primereact/menubar";
import { Avatar } from "primereact/avatar";
import { Menu } from "primereact/menu";

export default function Navbar() {
  const menu = useRef(null);

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
          label: "Fakture",
          icon: "pi pi-file",
          command: () => (window.location.href = "/invoices"),
        },
        {
          label: "Prodajni nalog",
          icon: "pi pi-book",
          command: () => (window.location.href = "/sales-orders"),
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
      command: () => alert("Odjava radi!"),
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
        gap: "10px",
        marginRight: "10%",
      }}
    >
      <i className="pi pi-user"></i>
      <span>Moj račun</span>
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
      <Menubar model={items} start={start} end={end} />
    </div>
  );
}
