import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Panel } from "primereact/panel";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Dialog } from "primereact/dialog";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";

import "./style.css";

const statusOptions = [
  { label: "Svi", value: "svi" },
  { label: "Otvoreni", value: "open" },
  { label: "Zatvoreni", value: "closed" },
];

const Sales = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState("svi");
  const [search, setSearch] = useState("");
  const [summary, setSummary] = useState({});
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

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
    return matchesSearch && matchesStatus;
  });

  const handleRowClick = (e) => {
    navigate(`/sales/${e.data.id}`);
  };

  const openDialog = (order) => {
    setSelectedOrder(order);
    setDialogVisible(true);
  };

  const handleCreateInvoice = () => {
    confirmDialog({
      message: "Želite li također odmah kreirati i paket?",
      header: "Kreiraj fakturu",
      icon: "pi pi-question-circle",
      acceptLabel: "Faktura + Paket",
      rejectLabel: "Samo faktura",
      accept: () => {
        console.log("Kreiraj fakturu i paket za orderId:", selectedOrder.id);
        setDialogVisible(false);
      },
      reject: () => {
        console.log("Kreiraj samo fakturu za orderId:", selectedOrder.id);
        setDialogVisible(false);
      },
    });
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

  return (
    <div className="parent">
      <ConfirmDialog />
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
              style={{ height: "2.5rem", width: "100%" }}
            />
            <Dropdown
              value={statusFilter}
              options={statusOptions}
              onChange={(e) => setStatusFilter(e.value)}
              placeholder="Filtriraj po statusu"
              style={{ height: "2.5rem", width: "100%" }}
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
            <Column field="id" header="ID" sortable></Column>
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
            <div className="flex flex-column gap-2 mt-4">
              <Button
                label="Kreiraj fakturu"
                icon="pi pi-file"
                onClick={handleCreateInvoice}
              />
              <Button
                label="Kreiraj paket"
                icon="pi pi-box"
                severity="secondary"
                onClick={handleCreatePackage}
              />
            </div>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default Sales;
