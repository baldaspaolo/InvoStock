import React, { useContext, useEffect, useState, useRef, useMemo } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

import { Toast } from "primereact/toast";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Panel } from "primereact/panel";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Calendar } from "primereact/calendar";
import { Tag } from "primereact/tag";

import "./style.css";

const statusOptions = [
  { label: "Svi", value: "svi" },
  { label: "Otvoreni", value: "open" },
  { label: "Zatvoreni", value: "closed" },
];

const Sales = () => {
  const { user } = useContext(AuthContext);
  const toast = useRef(null);
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState("svi");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [loading, setLoading] = useState(false);

  const summary = useMemo(() => {
    const open = orders.filter((o) => o.status === "open").length;
    const closed = orders.filter((o) => o.status === "closed").length;
    return { open, closed, total: orders.length };
  }, [orders]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        "http://localhost:3000/api/sales/getOrders",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.id,
            organizationId: user.organization_id,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const ordersWithTotals = await Promise.all(
        data.orders.map(async (order) => {
          const totalRes = await fetch(
            "http://localhost:3000/api/sales/calculateOrderTotal",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ orderId: order.id }),
            }
          );
          const totalData = await totalRes.json();
          return { ...order, total: totalData.total };
        })
      );

      setOrders(ordersWithTotals);
    } catch (error) {
      console.error("Greška pri dohvaćanju naloga:", error);
      toast.current.show({
        severity: "error",
        summary: "Greška",
        detail: "Neuspješno dohvaćanje naloga",
        life: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch = `${order.first_name} ${order.last_name}`
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "svi" || order.status === statusFilter;

      const orderDate = new Date(order.created_at);
      const matchesDateRange =
        (!startDate || orderDate >= startDate) &&
        (!endDate || orderDate <= endDate);

      return matchesSearch && matchesStatus && matchesDateRange;
    });
  }, [orders, search, statusFilter, startDate, endDate]);

  const handleRowClick = (e) => {
    navigate(`/sales/${e.data.id}`);
  };

  const openDialog = (order) => {
    setSelectedOrder(order);
    setDialogVisible(true);
  };

  const handleCreateInvoice = () => {
    setDialogVisible(false);
    setInvoiceDialogVisible(true);
  };

  const getStatusTag = (status) => {
    const statusMap = {
      open: { label: "Otvoren", severity: "info" },
      closed: { label: "Zatvoren", severity: "success" },
    };

    const s = statusMap[status] || { label: "Nepoznato", severity: "warning" };
    return (
      <Tag
        value={s.label}
        severity={s.severity}
        style={{ }}
      />
    );
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("svi");
    setStartDate(null);
    setEndDate(null);
  };

  const inputStyle = { height: "2.5rem", width: "100%" };

  return (
    <div className="parent">
      <ConfirmDialog />
      <Toast ref={toast} />
      <div className="div1">
        <h1>Prodajni nalozi</h1>
      </div>
      <div className="div3">
        <Button
          label="Novi nalog"
          icon="pi pi-plus"
          iconPos="right"
          raised
          size="small"
          onClick={() => navigate("/sales/add")}
        />
      </div>

      <div className="div4">
        <div style={{ marginLeft: "3%", marginRight: "3%" }}>
          <Panel
            header="Status prodajnih naloga"
            style={{ fontSize: "0.88rem" }}
          >
            <div style={{ display: "flex", gap: "2rem" }}>
              <div>
                <h3>{summary.total}</h3>
                <p>Ukupno naloga</p>
              </div>
              <div>
                <h3>{summary.open}</h3>
                <p>Otvoreni nalozi</p>
              </div>
              <div>
                <h3>{summary.closed}</h3>
                <p>Zatvoreni nalozi</p>
              </div>
            </div>
          </Panel>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(12rem, 1fr))",
              gap: "1rem",
              alignItems: "center",
              marginTop: "1rem",
            }}
          >
            <InputText
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pretraži kontakt"
              style={inputStyle}
            />
            <Dropdown
              value={statusFilter}
              options={statusOptions}
              onChange={(e) => setStatusFilter(e.value)}
              placeholder="Filtriraj po statusu"
              style={inputStyle}
            />
            <Calendar
              value={startDate}
              onChange={(e) => setStartDate(e.value)}
              placeholder="Početni datum"
              showIcon
              style={inputStyle}
              dateFormat="dd.mm.yy"
            />
            <Calendar
              value={endDate}
              onChange={(e) => setEndDate(e.value)}
              placeholder="Završni datum"
              showIcon
              style={inputStyle}
              dateFormat="dd.mm.yy"
            />
            <Button
              label="Resetiraj"
              icon="pi pi-refresh"
              severity="secondary"
              onClick={resetFilters}
              style={{ height: "2.5rem", marginTop: "2%" }}
            />
          </div>

          <DataTable
            value={filteredOrders}
            paginator
            rows={5}
            rowsPerPageOptions={[5, 10, 25, 50]}
            style={{ fontSize: "0.9rem" }}
            onRowClick={handleRowClick}
            selectionMode="single"
            loading={loading}
          >
            <Column field="custom_order_code" header="ID" sortable></Column>
            <Column
              header="Kontakt"
              body={(rowData) => `${rowData.first_name} ${rowData.last_name}`}
              sortable
            ></Column>
            <Column
              field="created_at"
              header="Datum"
              body={(rowData) =>
                new Date(rowData.created_at).toLocaleDateString("hr-HR")
              }
              sortable
            ></Column>
            <Column field="discount" header="Popust (€)" sortable></Column>
            <Column field="total" header="Ukupno (€)" sortable></Column>
            <Column
              field="invoice_id"
              header="Fakturiran"
              body={(rowData) => (rowData.invoice_id ? "Da" : "Ne")}
              sortable
            ></Column>
            <Column
              field="status"
              header="Status"
              body={(rowData) => getStatusTag(rowData.status)}
              sortable
            />
          </DataTable>
        </div>
      </div>
    </div>
  );
};

export default Sales;
