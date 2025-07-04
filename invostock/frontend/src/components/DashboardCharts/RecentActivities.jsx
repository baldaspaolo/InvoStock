import React, { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";

import { Panel } from "primereact/panel";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { useNavigate } from "react-router-dom";

const RecentActivities = ({ activities }) => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const formatCurrency = (amount) => {
    return parseFloat(amount || 0).toLocaleString("hr-HR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("hr-HR");
  };

  const getStatusTag = (status) => {
    switch (status) {
      case "paid":
      case "delivered":
        return (
          <Tag
            severity="success"
            value={status === "paid" ? "Plaćeno" : "Isporučeno"}
          />
        );
      case "pending":
        return <Tag severity="danger" value="Neplaćeno" />;
      case "partially_paid":
        return <Tag severity="warning" value="Djelomično" />;
      default:
        return <Tag value={status} />;
    }
  };

  const getActivityIcon = (type) => {
    const icons = {
      invoice: "pi pi-file",
      payment: "pi pi-money-bill",
      order: "pi pi-shopping-cart",
      expense: "pi pi-euro",
    };
    return (
      <i
        className={icons[type] || "pi pi-info-circle"}
        style={{ fontSize: "1.2rem" }}
      />
    );
  };

  return (
    <Panel header="Nedavne aktivnosti" style={{ flex: 1, marginBottom: "1%" }}>
      {activities?.length > 0 ? (
        <DataTable
          value={activities}
          paginator
          rows={5}
          onRowClick={(e) => {
            if (e.data.type === "invoice")
              navigate(`/invoices/${e.data.id}/${user.id}`);
            if (e.data.type === "order")
              navigate(`/orders/${e.data.id}/${user.id}`);
            if (e.data.type === "payment") navigate(`/payments`);
            if (e.data.type === "expense") navigate(`/expenses`);
          }}
          selectionMode="single"
        >
          <Column
            header="Tip"
            body={(rowData) => getActivityIcon(rowData.type)}
            style={{ width: "50px" }}
          />
          <Column
            header="Opis"
            body={(rowData) => {
              switch (rowData.type) {
                case "invoice":
                  return `Faktura - ${rowData.code}`;
                case "order":
                  return `Nalog - ${rowData.code}`;
                case "expense":
                  return rowData.title || "Trošak";
                case "payment":
                  return rowData.title || `Plaćanje`;
                default:
                  return rowData.title || "-";
              }
            }}
          />
          <Column
            field="amount"
            header="Iznos"
            body={(rowData) => formatCurrency(rowData.amount)}
          />
          <Column
            field="date"
            header="Datum"
            body={(rowData) => formatDate(rowData.date)}
          />
          <Column
            field="status"
            header="Status"
            body={(rowData) =>
              rowData.status ? getStatusTag(rowData.status) : "-"
            }
          />
        </DataTable>
      ) : (
        <p>Nema nedavnih aktivnosti.</p>
      )}
    </Panel>
  );
};

export default RecentActivities;
