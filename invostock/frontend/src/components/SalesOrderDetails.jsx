// components/SalesOrderDetails.jsx
import React from "react";
import { Panel } from "primereact/panel";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";

const SalesOrderDetails = ({ order, items }) => {
  if (!order) return null;

  const calculateTotal = () => {
    const subtotal = items.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    );
    const discount = parseFloat(order.discount || 0);
    return {
      subtotal,
      discount,
      total: subtotal - discount,
    };
  };

  const getStatusTag = (status) => {
    let severity = "info";
    if (status === "closed") severity = "success";
    if (status === "cancelled") severity = "danger";

    return (
      <Tag
        value={
          status === "open"
            ? "Otvoren"
            : status === "closed"
            ? "Zatvoren"
            : status === "cancelled"
            ? "Otkazan"
            : status
        }
        severity={severity}
      />
    );
  };

  const totals = calculateTotal();

  return (
    <Panel header={`Detalji prodajnog naloga ${order.custom_order_code}`}>
      <div className="p-fluid">
        <div className="p-field">
          <label>Status:</label>
          {getStatusTag(order.status)}
        </div>

        <div className="p-field">
          <label>Klijent:</label>
          <p>
            {order.first_name} {order.last_name}{" "}
            {order.company_name && `(${order.company_name})`}
          </p>
        </div>

        <div className="p-field">
          <label>Kontakt:</label>
          <p>{order.email || "Nema emaila"}</p>
        </div>

        <div className="p-field">
          <label>Datum kreiranja:</label>
          <p>{new Date(order.created_at).toLocaleDateString("hr-HR")}</p>
        </div>

        <div className="p-field">
          <label>Napomena:</label>
          <p>{order.notes || "Nema napomene"}</p>
        </div>

        <DataTable
          value={items}
          className="p-datatable-sm"
          emptyMessage="Nema artikala"
        >
          <Column field="item_name" header="Artikl"></Column>
          <Column field="quantity" header="Količina"></Column>
          <Column
            field="price"
            header="Cijena"
            body={(row) => `${parseFloat(row.price || 0).toFixed(2)} €`}
          />
          <Column
            header="Ukupno"
            body={(row) =>
              `${(
                parseFloat(row.price || 0) * parseFloat(row.quantity || 0)
              ).toFixed(2)} €`
            }
          />
        </DataTable>

        <div className="p-mt-3 p-text-right">
          <p>Međuzbroj: {totals.subtotal.toFixed(2)} €</p>
          {totals.discount > 0 && (
            <p>Popust: -{totals.discount.toFixed(2)} €</p>
          )}
          <p>
            <strong>Ukupno: {totals.total.toFixed(2)} €</strong>
          </p>
        </div>
      </div>
    </Panel>
  );
};

export default SalesOrderDetails;
