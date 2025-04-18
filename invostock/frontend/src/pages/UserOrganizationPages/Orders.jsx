import React, { useState, useRef, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Panel } from "primereact/panel";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputText } from "primereact/inputtext";
import { Menu } from "primereact/menu";

const statusOptions = [
  { label: "Sve", value: "all" },
  { label: "Na čekanju", value: "pending" },
  { label: "Dostavljeno", value: "delivered" },
  { label: "Obustavljeno", value: "cancelled" },
];

const Orders = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [orders, setOrders] = useState([]);
  const [expandedRows, setExpandedRows] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const menuRef = useRef(null);
  const currentRowRef = useRef(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/orders/getOrders`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.id,
              organizationId: user.organization_id,
            }),
          }
        );

        const data = await res.json();
        if (data.success) {
          setOrders(data.orders);
        }
      } catch (err) {
        console.error("Greška kod dohvaćanja narudžbi:", err);
      }
    };

    fetchOrders();
  }, [user]);

  const handleReceiveOrder = async (orderId) => {
    const receivedDate = new Date().toISOString().slice(0, 10);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/orders/markAsReceived`,
        {
          method: "PUT", 
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            userId: user.id,
            organizationId: user.organization_id,
            receivedDate,
          }),
        }
      );

      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? { ...o, status: "delivered", received_date: receivedDate }
              : o
          )
        );
      }
    } catch (err) {
      console.error("Greška kod označavanja kao primljeno:", err);
    }
  };

  const handleCancelOrder = async (orderId) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/orders/cancelOrder/${orderId}`,
        {
          method: "DELETE",
        }
      );
      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status: "cancelled",
                }
              : o
          )
        );
      }
    } catch (err) {
      console.error("Greška kod otkazivanja narudžbe:", err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("hr-HR");
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.supplier
      ?.toLowerCase()
      .includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;
    const orderDate = new Date(order.order_date);
    const matchesDateRange =
      (!startDate || orderDate >= startDate) &&
      (!endDate || orderDate <= endDate);

    return matchesSearch && matchesStatus && matchesDateRange;
  });

  const inputStyle = { height: "2.5rem", width: "100%" };

  const itemTable = (rowData) => {
    return (
      <div style={{ padding: "1rem" }}>
        <DataTable
          value={rowData.items || []}
          responsiveLayout="scroll"
          size="small"
        >
          <Column field="item_name" header="Artikl" />
          <Column field="price" header="Cijena po komadu (€)" />
          <Column field="quantity" header="Količina" />
          <Column field="description" header="Opis" />
          <Column
            header="Ukupno za red (€)"
            body={(item) => (item.price * item.quantity).toFixed(2)}
          />
        </DataTable>
        {rowData.received_date && (
          <div
            style={{
              textAlign: "right",
              marginTop: "0.25rem",
              fontStyle: "italic",
              color: "#555",
            }}
          >
            Primljeno: {formatDate(rowData.received_date)}
          </div>
        )}
        <div
          style={{ textAlign: "right", marginTop: "1rem", fontWeight: "bold" }}
        >
          Ukupna cijena narudžbe: {parseFloat(rowData.total_price).toFixed(2)} €
        </div>
      </div>
    );
  };

  const renderActions = (rowData) => {
    return (
      <div style={{ display: "flex", gap: "0.5rem" }}>
        {rowData.status !== "delivered" && rowData.status !== "cancelled" && (
          <Button
            label="Primi"
            icon="pi pi-check"
            size="small"
            onClick={() => handleReceiveOrder(rowData.id)}
            severity="success"
          />
        )}
        {rowData.status !== "cancelled" && rowData.status !== "delivered" && (
          <Button
            icon="pi pi-ellipsis-h"
            text
            onClick={(e) => {
              currentRowRef.current = rowData;
              setMenuItems([
                {
                  label: "Obustavi narudžbu",
                  icon: "pi pi-ban",
                  command: () => handleCancelOrder(currentRowRef.current.id),
                },
              ]);
              menuRef.current.toggle(e);
            }}
          />
        )}
      </div>
    );
  };

  return (
    <div className="parent" style={{ marginTop: "5%" }}>
      <div className="div1">
        <h1>Narudžbenice</h1>
      </div>

      <div className="div3">
        <Button
          label="Nova narudžbenica"
          icon="pi pi-plus"
          iconPos="right"
          raised
          size="small"
          onClick={() => navigate("/orders/add")}
        />
      </div>

      <div className="div4">
        <div style={{ marginLeft: "3%", marginRight: "3%" }}>
          <Panel header="Filtriranje" style={{ fontSize: "0.88rem" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(12rem, 1fr))",
                gap: "1rem",
                alignItems: "center",
              }}
            >
              <InputText
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pretraži dobavljača"
                style={inputStyle}
              />
              <Dropdown
                value={statusFilter}
                options={statusOptions}
                onChange={(e) => setStatusFilter(e.value)}
                placeholder="Status"
                style={inputStyle}
              />
              <Calendar
                value={startDate}
                onChange={(e) => setStartDate(e.value)}
                placeholder="Početni datum"
                showIcon
                style={inputStyle}
              />
              <Calendar
                value={endDate}
                onChange={(e) => setEndDate(e.value)}
                placeholder="Završni datum"
                showIcon
                style={inputStyle}
              />
            </div>
          </Panel>

          <DataTable
            value={filteredOrders}
            paginator
            rows={5}
            rowsPerPageOptions={[5, 10, 25, 50]}
            style={{ fontSize: "0.9rem" }}
            expandedRows={expandedRows}
            onRowToggle={(e) => setExpandedRows(e.data)}
            rowExpansionTemplate={itemTable}
          >
            <Column expander style={{ width: "3em" }} />
            <Column field="id" header="ID" sortable />
            <Column
              field="order_date"
              header="Datum narudžbe"
              body={(rowData) => formatDate(rowData.order_date)}
              sortable
            />
            <Column field="supplier" header="Dobavljač" sortable />
            <Column field="total_price" header="Ukupna cijena (€)" sortable />
            <Column field="status" header="Status" sortable />
            <Column header="Akcija" body={renderActions} />
          </DataTable>

          <Menu model={menuItems} popup ref={menuRef} />
        </div>
      </div>
    </div>
  );
};

export default Orders;
