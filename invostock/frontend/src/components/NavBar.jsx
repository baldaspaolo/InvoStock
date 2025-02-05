import React from "react";
import { Menubar } from "primereact/menubar";
import { Avatar } from "primereact/avatar";

export default function Navbar() {
  const items = [
    {
      label: "Home",
      icon: "pi pi-home",
    },
    {
      label: "Prodaja",
      icon: "pi pi-shopping-cart",
      items: [
        { label: "Fakture", icon: "pi pi-file" },
        { label: "Prodajni nalog", icon: "pi pi-book" },
        { label: "Uplate", icon: "pi pi-credit-card" },
      ],
    },
    {
      label: "Kupnja",
      icon: "pi pi-truck",
      items: [{ label: "Narudžbenice", icon: "pi pi-shopping-bag" }],
    },
    {
      label: "Inventar",
      icon: "pi pi-box",
    },
  ];

  const start = (
    <img
      alt="logo"
      src="https://primefaces.org/cdn/primereact/images/logo.png"
      height="40"
      className="mr-2"
    />
  );
  const end = (
    <Avatar
      image="https://primefaces.org/cdn/primereact/images/avatar/amyelsner.png"
      shape="circle"
    />
  );

  return (
    <div className="card">
      <Menubar model={items} start={start} end={end} />
    </div>
  );
}
