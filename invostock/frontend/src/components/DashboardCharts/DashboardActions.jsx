import React from "react";
import { Button } from "primereact/button";
import { useNavigate } from "react-router-dom";

const DashboardActions = () => {
  const navigate = useNavigate();

  const actions = [
    {
      label: "Nova faktura",
      icon: "pi pi-file",
      onClick: () => navigate("/invoices/add"),
    },
    {
      label: "Nova uplata",
      icon: "pi pi-credit-card",
      onClick: () => navigate("/payments"),
    },
    {
      label: "Novi trošak",
      icon: "pi pi-euro",
      severity: "danger",
      onClick: () => navigate("/expenses"),
    },
    {
      label: "Nova narudžbenica",
      icon: "pi pi-shopping-cart",
      onClick: () => navigate("/orders/add"),
    },
  ];

  return (
    <div className="dashboard-actions-top-row">
      {actions.map((action, index) => (
        <Button
          key={index}
          label={action.label}
          icon={action.icon}
          size="small"
          severity={action.severity}
          onClick={action.onClick}
        />
      ))}
    </div>
  );
};

export default DashboardActions;
