import React, { useState, useEffect, useContext } from "react";
import { Card } from "primereact/card";
import { Dialog } from "primereact/dialog";
import { Tag } from "primereact/tag";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { AuthContext } from "../../context/AuthContext";
import "./style.css";

import ExpandedSalesOrder from "../../components/ExpandedSalesOrder";

const Packages = () => {
  const { user } = useContext(AuthContext);
  const API_URL = import.meta.env.VITE_API_URL;

  const [packages, setPackages] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [addDialog, setAddDialog] = useState(false);
  const [addMode, setAddMode] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);
  const [description, setDescription] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [expandedRows, setExpandedRows] = useState(null);
  const [courier, setCourier] = useState("");
  const [showAllDelivered, setShowAllDelivered] = useState(false);

  const fetchPackages = async () => {
    const res = await fetch(`${API_URL}/api/packages/getUserPackages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        organizationId: user.organization_id,
      }),
    });
    const data = await res.json();
    if (data.success) setPackages(data.packages);
  };

  useEffect(() => {
    if (packages.length && salesOrders.length) {
      const usedSalesOrderIds = new Set(
        packages.map((pkg) => pkg.sales_order_id).filter((id) => id !== null)
      );

      const availableOrders = salesOrders.filter(
        (order) => !usedSalesOrderIds.has(order.id)
      );

      setSalesOrders(availableOrders);
    }
  }, [packages, salesOrders]);

  const fetchContacts = async () => {
    const res = await fetch(`${API_URL}/api/contacts/getUserContacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        organizationId: user.organizationId,
      }),
    });
    console.log("Saljem: ", user.id, user.organization_id);
    const data = await res.json();
    if (data.success) {
      console.log("Kontakti", data);
      setContacts(
        data.contacts.map((c) => ({
          label: `${c.first_name} ${c.last_name}`,
          value: c.id,
        }))
      );
    }
  };

  const fetchSalesOrders = async () => {
    const res = await fetch(`${API_URL}/api/sales/getOrders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        organizationId: user.organization_id,
      }),
    });
    const data = await res.json();
    if (data.success) setSalesOrders(data.orders);
    console.log("Sales: ", data);
  };

  useEffect(() => {
    fetchPackages();
    fetchContacts();
    fetchSalesOrders();
  }, []);

  const updatePackageStatus = async (pkgId, newStatus) => {
    await fetch(`${API_URL}/api/packages/updatePackageStatus`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packageId: pkgId, status: newStatus }),
    });
    fetchPackages();
    setShowDialog(false);
  };

  const handlePackageClick = (pkg) => {
    setSelectedPackage(pkg);
    setShowDialog(true);
  };

  const couriers = [
    "GLS",
    "Paket24 - Hrvatska Pošta",
    "Overseas",
    "FedEx",
    "DHL",
    "BoxNow",
    "UPS",
  ];

  const handleAddPackage = async () => {
    const payload = {
      userId: user.id,
      organizationId: user.organization_id,
      contactId:
        addMode === "manual" ? selectedContact : selectedOrder.contact_id,
      salesOrderId: addMode === "order" ? selectedOrder.id : null,
      description,
      courier,
    };
    await fetch(`${API_URL}/api/packages/createPackage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    resetAddForm();
    fetchPackages();
  };

  const resetAddForm = () => {
    setAddMode(null);
    setAddDialog(false);
    setSelectedContact(null);
    setDescription("");
    setSelectedOrder(null);
    setCourier("");
  };

  const grouped = {
    not_shipped: [],
    shipped: [],
    delivered: [],
  };

  const sortedPackages = [...packages].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  sortedPackages.forEach((pkg) => grouped[pkg.status]?.push(pkg));

  const cardStyle = {
    maxWidth: "90%",
    margin: "0.3rem auto",
    padding: "0.1rem",
    boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "0.85rem",
    lineHeight: "0.2rem",
  };

  const getHeaderStyle = (color) => ({
    backgroundColor: color,
    padding: "0.75rem 1rem",
    fontWeight: "bold",
    fontSize: "0.95rem",
    color: "#333",
    borderTopLeftRadius: "10px",
    borderTopRightRadius: "10px",
  });

  return (
    <div className="parent" style={{ margin: "5%" }}>
      <div className="div1">
        <h1>Paketi</h1>
      </div>
      <div className="div3">
        <Button
          label="Dodaj paket"
          icon="pi pi-plus"
          iconPos="right"
          raised
          size="small"
          onClick={() => setAddDialog(true)}
        />
      </div>

      <div className="div4">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "2rem",
            marginTop: "2rem",
          }}
        >
          {[
            {
              label: "Potrebno zapakirati",
              key: "not_shipped",
              color: "#DFF4FB",
            },
            { label: "Poslani paketi", key: "shipped", color: "#FFF9D5" },
            { label: "Dostavljeni paketi", key: "delivered", color: "#DEF5D8" },
          ].map(({ label, key, color }) => (
            <div key={key}>
              <div style={getHeaderStyle(color)}>{label}</div>
              <div
                style={{
                  padding: "1rem",
                  background: "#f9f9f9",
                  borderBottomLeftRadius: "10px",
                  borderBottomRightRadius: "10px",
                }}
              >
                {key !== "delivered" ? (
                  grouped[key].map((pkg) => (
                    <Card
                      key={pkg.id}
                      onClick={() => handlePackageClick(pkg)}
                      style={cardStyle}
                    >
                      <p>
                        <strong>
                          {pkg.first_name} {pkg.last_name}
                        </strong>
                      </p>
                      <p>{pkg.code}</p>
                      <p>
                        {pkg.courier || "-"} | {pkg.created_at?.split("T")[0]}
                      </p>
                    </Card>
                  ))
                ) : (
                  <>
                    {grouped[key].slice(0, 4).map((pkg) => (
                      <Card
                        key={pkg.id}
                        onClick={() => handlePackageClick(pkg)}
                        style={cardStyle}
                      >
                        <p>
                          <strong>
                            {pkg.first_name} {pkg.last_name}
                          </strong>
                        </p>
                        <p>{pkg.code}</p>
                        <p>
                          {pkg.courier || "-"} | {pkg.created_at?.split("T")[0]}
                        </p>
                      </Card>
                    ))}
                    {grouped[key].length > 4 && (
                      <Button
                        label="Prikaži sve"
                        onClick={() => setShowAllDelivered(true)}
                        style={{
                          width: "100%",
                          marginTop: "1rem",
                        }}
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        <Dialog
          header="Svi dostavljeni paketi"
          visible={showAllDelivered}
          style={{ width: "70vw" }}
          onHide={() => setShowAllDelivered(false)}
        >
          <DataTable
            value={grouped.delivered}
            paginator
            rows={10}
            rowsPerPageOptions={[5, 10, 25, 50]}
            style={{ width: "100%" }}
          >
            <Column
              field="created_at"
              header="Datum"
              body={(rowData) => rowData.created_at?.split("T")[0] || "-"}
              sortable
            />
            <Column
              header="Klijent"
              body={(rowData) => `${rowData.first_name} ${rowData.last_name}`}
            />
            <Column field="code" header="Broj paketa" />
            <Column field="courier" header="Način slanja" />
            <Column
              header="Prodajni nalog"
              body={(rowData) => rowData.order_code || "-"}
            />
          </DataTable>
        </Dialog>

        <Dialog
          header="Dodaj paket"
          visible={addDialog}
          style={{ width: "50rem" }}
          onHide={resetAddForm}
        >
          {!addMode ? (
            <div
              style={{ display: "flex", gap: "1rem", justifyContent: "center" }}
            >
              <Button
                label="Ručno unesi"
                onClick={() => setAddMode("manual")}
              />
              <Button
                label="Iz prodajnog naloga"
                onClick={() => setAddMode("order")}
              />
            </div>
          ) : addMode === "manual" ? (
            <div className="p-fluid">
              <Dropdown
                value={selectedContact}
                options={contacts}
                onChange={(e) => setSelectedContact(e.value)}
                placeholder="Odaberite klijenta"
              />
              <Dropdown
                value={courier}
                options={couriers.map((c) => ({ label: c, value: c }))}
                onChange={(e) => setCourier(e.value)}
                placeholder="Odaberite kurira"
                style={{ marginTop: "1rem" }}
              />

              <InputText
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Opis ili bilješka"
                style={{ marginTop: "1rem" }}
              />
              <Button
                label="Dodaj"
                icon="pi pi-check"
                onClick={handleAddPackage}
                style={{ marginTop: "1rem" }}
                disabled={!selectedContact}
              />
            </div>
          ) : (
            <>
              {!selectedOrder ? (
                <DataTable
                  value={salesOrders}
                  expandedRows={expandedRows}
                  onRowToggle={(e) => setExpandedRows(e.data)}
                  rowExpansionTemplate={(data) => (
                    <ExpandedSalesOrder orderId={data.id} apiUrl={API_URL} />
                  )}
                  dataKey="id"
                >
                  <Column expander style={{ width: "3em" }} />
                  <Column field="id" header="Broj naloga" />
                  <Column
                    header="Klijent"
                    body={(rowData) =>
                      `${rowData.first_name} ${rowData.last_name}`
                    }
                  />
                  <Column
                    header="Akcija"
                    body={(rowData) => (
                      <Button
                        label="Odaberi"
                        size="small"
                        onClick={() => setSelectedOrder(rowData)}
                      />
                    )}
                  />
                </DataTable>
              ) : (
                <div>
                  <h4>Nalog #{selectedOrder.id}</h4>
                  <p>
                    Klijent:{" "}
                    <strong>
                      {selectedOrder.first_name} {selectedOrder.last_name}
                    </strong>
                  </p>
                  <p>Datum: {selectedOrder.created_at?.split("T")[0] || "-"}</p>
                  <Dropdown
                    value={courier}
                    options={couriers.map((c) => ({ label: c, value: c }))}
                    onChange={(e) => setCourier(e.value)}
                    placeholder="Odaberite kurira"
                    style={{ marginTop: "1rem" }}
                  />
                  <InputText
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Opis ili bilješka"
                    style={{ marginTop: "1rem" }}
                  />

                  <Button
                    label="Dodaj"
                    icon="pi pi-check"
                    onClick={handleAddPackage}
                    style={{ marginTop: "1rem" }}
                  />
                </div>
              )}
            </>
          )}
        </Dialog>

        <Dialog
          header="Detalji paketa"
          visible={showDialog}
          style={{ width: "40rem" }}
          onHide={() => setShowDialog(false)}
        >
          {selectedPackage && (
            <div className="p-fluid">
              <p>
                <strong>Klijent:</strong> {selectedPackage.first_name}{" "}
                {selectedPackage.last_name}
              </p>
              <p>
                <strong>Broj paketa:</strong> {selectedPackage.code}
              </p>

              <p>
                <strong>Prodajni nalog:</strong>{" "}
                {selectedPackage.order_code || "-"}
              </p>
              <p>
                <strong>Način slanja:</strong> {selectedPackage.courier || "-"}
              </p>
              <p>
                <strong>Datum kreiranja:</strong>{" "}
                {selectedPackage.created_at?.split("T")[0]}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                <Tag
                  value={
                    {
                      not_shipped: "Potrebno zapakirati",
                      shipped: "Poslano",
                      delivered: "Dostavljeno",
                    }[selectedPackage.status] || selectedPackage.status
                  }
                />
              </p>

              {selectedPackage.status === "not_shipped" && (
                <Button
                  label="Isporuci"
                  icon="pi pi-send"
                  severity="warning"
                  style={{ marginTop: "1rem" }}
                  onClick={() =>
                    updatePackageStatus(selectedPackage.id, "shipped")
                  }
                />
              )}
              {selectedPackage.status === "shipped" && (
                <Button
                  label="Zatvori"
                  icon="pi pi-check"
                  severity="success"
                  style={{ marginTop: "1rem" }}
                  onClick={() =>
                    updatePackageStatus(selectedPackage.id, "delivered")
                  }
                />
              )}
            </div>
          )}
        </Dialog>
      </div>
    </div>
  );
};

export default Packages;
