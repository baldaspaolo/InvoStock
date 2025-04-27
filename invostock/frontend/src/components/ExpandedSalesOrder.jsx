import React, { useEffect, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

const ExpandedSalesOrder = ({ orderId, apiUrl }) => {
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);

  useEffect(() => {
    const fetchDetails = async () => {
      const res = await fetch(`${apiUrl}/api/sales/getOrderDetails`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (data.success) {
        setOrder(data.order);
        setItems(data.items);
      }
    };

    fetchDetails();
  }, [orderId]);

  if (!order) return <p>Učitavanje detalja...</p>;

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const final = total - parseFloat(order.discount || 0);

  const translateStatus = (status) => {
    switch (status) {
      case "open":
        return "Otvoren";
      case "pending":
        return "Na čekanju";
      case "cancelled":
        return "Otkazano";
      case "closed":
        return "Zatvoreno";
      default:
        return status;
    }
  };

  return (
    <div style={{ padding: "1rem", fontSize: "0.9rem" }}>
      <p>
        <strong>Klijent:</strong> {order.first_name} {order.last_name}
      </p>
      <p>
        <strong>Status:</strong> {translateStatus(order.status)}
      </p>
      <p>
        <strong>Datum:</strong> {order.created_at?.split("T")[0]}
      </p>
      <p>
        <strong>Bilješke:</strong> {order.notes || "-"}
      </p>

      <DataTable value={items} style={{ marginTop: "1rem" }} size="small">
        <Column field="item_name" header="Artikl" />
        <Column field="quantity" header="Količina" />
        <Column field="price" header="Cijena (€)" />
        <Column
          header="Ukupno (€)"
          body={(row) => (row.price * row.quantity).toFixed(2)}
        />
      </DataTable>

      <div style={{ textAlign: "right", marginTop: "1rem" }}>
        <p>
          <strong>Međuzbroj:</strong> {total.toFixed(2)} €
        </p>
        <p>
          <strong>Popust:</strong> -{parseFloat(order.discount || 0).toFixed(2)}{" "}
          €
        </p>
        <p style={{ fontSize: "1.1rem", fontWeight: "bold" }}>
          Ukupno za naplatu: {final.toFixed(2)} €
        </p>
      </div>
    </div>
  );
};

export default ExpandedSalesOrder;
