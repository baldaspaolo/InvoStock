import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

import { Toast } from "primereact/toast";
import { useRef } from "react";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Panel } from "primereact/panel";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Dialog } from "primereact/dialog";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Calendar } from "primereact/calendar";

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
  const [summary, setSummary] = useState({});
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [dueDate, setDueDate] = useState(null);
  const [invoiceDialogVisible, setInvoiceDialogVisible] = useState(false);

  const fetchOrders = async () => {
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
    }
  };

  const fetchSummary = () => {
    const open = orders.filter((o) => o.status === "open").length;
    const closed = orders.filter((o) => o.status === "closed").length;
    setSummary({ open, closed, total: orders.length });
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [orders]);

  const filteredOrders = orders.filter((order) => {
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

  const confirmCreateInvoice = async (createPackage) => {
    if (!dueDate) return;

    try {
      const itemsRes = await fetch(
        "http://localhost:3000/api/sales/getOrderDetails",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ orderId: selectedOrder.id }),
        }
      );

      const data = await itemsRes.json();

      const payload = {
        userId: user.id,
        organizationId: user.organization_id,
        contactId: selectedOrder.contact_id,
        invoiceDate: new Date().toISOString().slice(0, 10),
        dueDate: dueDate.toISOString().slice(0, 10),
        discount: selectedOrder.discount,
        salesOrderId: selectedOrder.id,
        items: data.items.map((item) => ({
          itemId: item.item_id,
          itemName: item.item_name,
          itemDescription: null,
          quantity: item.quantity,
          price: item.price,
        })),
      };

      const response = await fetch(
        "http://localhost:3000/api/invoices/createInvoice",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (result.success) {
        toast.current.show({
          severity: "success",
          summary: "Faktura kreirana",
          detail: `Kod: ${result.custom_invoice_code}`,
          life: 4000,
        });

        setInvoiceDialogVisible(false);
        setDueDate(null);
        setSelectedOrder(null);
        fetchOrders();
      } else {
        throw new Error(result.error || "Neuspješno kreiranje fakture.");
      }
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Greška",
        detail: "Neuspješno kreiranje fakture.",
        life: 4000,
      });
      console.error("Greška pri kreiranju fakture iz naloga:", error);
    }
  };

  const handleCreatePackage = () => {
    confirmDialog({
      message: "Jeste li sigurni da želite kreirati samo paket?",
      header: "Kreiraj paket",
      icon: "pi pi-info-circle",
      accept: () => {
        console.log("Kreiraj samo paket za orderId:", selectedOrder.id);
        setDialogVisible(false);
      },
    });
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("svi");
    setStartDate(null);
    setEndDate(null);
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <Button
        icon="pi pi-ellipsis-v"
        rounded
        text
        onClick={(e) => {
          e.stopPropagation();
          openDialog(rowData);
        }}
      />
    );
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
        <Button
          icon="pi pi-ellipsis-h"
          text
          raised
          severity="info"
          aria-label="Opcije"
          style={{ width: "50%" }}
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
            />
            <Calendar
              value={endDate}
              onChange={(e) => setEndDate(e.value)}
              placeholder="Završni datum"
              showIcon
              style={inputStyle}
            />
            <Button
              label="Resetiraj"
              icon="pi pi-refresh"
              severity="secondary"
              onClick={resetFilters}
              style={{ marginBottom: "5%", height: "2.5rem" }}
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
            <Column field="status" header="Status" sortable></Column>
            <Column
              body={actionBodyTemplate}
              style={{ textAlign: "center", width: "4rem" }}
            ></Column>
          </DataTable>

          <Dialog
            header="Opcije za nalog"
            visible={dialogVisible}
            style={{ width: "30vw" }}
            onHide={() => setDialogVisible(false)}
          >
            <p>Odaberite što želite napraviti s ovim nalogom:</p>
            <div className="">
              <Button
                label="Kreiraj fakturu"
                icon="pi pi-file"
                onClick={handleCreateInvoice}
                style={{ marginBottom: "3%" }}
              />
              <Button
                label="Kreiraj paket"
                icon="pi pi-box"
                severity="secondary"
                onClick={handleCreatePackage}
              />
            </div>
          </Dialog>

          <Dialog
            header="Kreiraj fakturu"
            visible={invoiceDialogVisible}
            style={{ width: "25rem" }}
            onHide={() => setInvoiceDialogVisible(false)}
          >
            <p>Unesite datum dospijeća fakture:</p>
            <Calendar
              value={dueDate}
              onChange={(e) => setDueDate(e.value)}
              showIcon
              dateFormat="dd.mm.yy"
              style={{ width: "100%", marginTop: "1rem" }}
            />
            <div>
              <Button
                label="Odustani"
                icon="pi pi-times"
                severity="secondary"
                onClick={() => setInvoiceDialogVisible(false)}
                style={{ marginBottom: "3%" }}
              />
              <Button
                label="Samo faktura"
                icon="pi pi-check"
                onClick={() => confirmCreateInvoice(false)}
                style={{ marginBottom: "3%" }}
              />
              <Button
                label="Faktura + Paket"
                icon="pi pi-box"
                onClick={() => confirmCreateInvoice(true)}
              />
            </div>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default Sales;
