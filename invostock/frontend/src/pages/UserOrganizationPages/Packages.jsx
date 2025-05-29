import React, {
  useState,
  useEffect,
  useContext,
  useMemo,
  useCallback,
} from "react";
import { Card } from "primereact/card";
import { Dialog } from "primereact/dialog";
import { Tag } from "primereact/tag";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { AuthContext } from "../../context/AuthContext";
import { Panel } from "primereact/panel";

import "./style.css";

import ExpandedSalesOrder from "../../components/ExpandedSalesOrder";
import SalesOrderDetails from "../../components/SalesOrderDetails";

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
  const [loading, setLoading] = useState(false);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);

  const couriers = useMemo(
    () => [
      "GLS",
      "Paket24 - Hrvatska Pošta",
      "Overseas",
      "FedEx",
      "DHL",
      "BoxNow",
      "UPS",
    ],
    []
  );

  const fetchPackages = useCallback(async () => {
    setLoading(true);
    try {
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
    } catch (error) {
      console.error("Error fetching packages:", error);
    } finally {
      setLoading(false);
    }
  }, [API_URL, user.id, user.organization_id]);

  const fetchContacts = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/contacts/getUserContacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          organizationId: user.organization_id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setContacts(
          data.contacts.map((c) => ({
            label: `${c.first_name} ${c.last_name}`,
            value: c.id,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
    }
  }, [API_URL, user.id, user.organization_id]);

  const fetchSalesOrders = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/sales/getOrders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          organizationId: user.organization_id,
        }),
      });
      const data = await res.json();
      console.log("SALES ORDERS", data.orders);

      if (data.success) setSalesOrders(data.orders);
    } catch (error) {
      console.error("Error fetching sales orders:", error);
    }
  }, [API_URL, user.id, user.organization_id]);

  const fetchOrderDetails = async (orderId) => {
    try {
      const res = await fetch(`${API_URL}/api/sales/getOrderDetails`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedOrderDetails({
          order: data.order,
          items: data.items,
        });
        setShowOrderDialog(true);
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchPackages(), fetchContacts(), fetchSalesOrders()]);
    };
    loadData();
  }, [fetchPackages, fetchContacts, fetchSalesOrders]);

  const filteredSalesOrders = useMemo(() => {
    if (!packages.length || !salesOrders.length) return salesOrders;

    const usedSalesOrderIds = new Set(
      packages.map((pkg) => pkg.sales_order_id).filter((id) => id !== null)
    );
    return salesOrders.filter((order) => !usedSalesOrderIds.has(order.id));
  }, [packages, salesOrders]);

  const updatePackageStatus = async (pkgId, newStatus) => {
    try {
      await fetch(`${API_URL}/api/packages/updatePackageStatus`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: pkgId, status: newStatus }),
      });
      fetchPackages();
      setShowDialog(false);
    } catch (error) {
      console.error("Error updating package status:", error);
    }
  };

  const handlePackageClick = (pkg) => {
    setSelectedPackage(pkg);
    setShowDialog(true);
  };

  const handleAddPackage = async () => {
    try {
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
    } catch (error) {
      console.error("Error adding package:", error);
    }
  };

  const resetAddForm = () => {
    setAddMode(null);
    setAddDialog(false);
    setSelectedContact(null);
    setDescription("");
    setSelectedOrder(null);
    setCourier("");
  };

  const groupedPackages = useMemo(() => {
    const grouped = {
      not_shipped: [],
      shipped: [],
      delivered: [],
    };

    const sortedPackages = [...packages].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    sortedPackages.forEach((pkg) => grouped[pkg.status]?.push(pkg));
    return grouped;
  }, [packages]);

  const cardStyle = useMemo(
    () => ({
      maxWidth: "90%",
      margin: "0.3rem auto",
      padding: "0.1rem",
      boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
      borderRadius: "10px",
      cursor: "pointer",
      fontSize: "0.85rem",
      lineHeight: "0.2rem",
    }),
    []
  );

  const getHeaderStyle = useCallback(
    (color) => ({
      backgroundColor: color,
      padding: "0.75rem 1rem",
      fontWeight: "bold",
      fontSize: "0.95rem",
      color: "#333",
      borderTopLeftRadius: "10px",
      borderTopRightRadius: "10px",
    }),
    []
  );

  return (
    <div
      className="parent"
      style={{
        marginTop: "5%",
        marginLeft: "10%",
        marginRight: "10%",
      }}
    >
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
                  groupedPackages[key].map((pkg) => (
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
                    {groupedPackages[key].slice(0, 4).map((pkg) => (
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
                    {groupedPackages[key].length > 4 && (
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
            value={groupedPackages.delivered}
            paginator
            rows={10}
            rowsPerPageOptions={[5, 10, 25, 50]}
            style={{ width: "100%" }}
            loading={loading}
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
            <Column
              header="Akcija"
              body={(rowData) =>
                rowData.sales_order_id ? (
                  <Button
                    label="Detalji naloga"
                    icon="pi pi-eye"
                    className="p-button-sm p-button-text"
                    onClick={() => fetchOrderDetails(rowData.sales_order_id)}
                  />
                ) : (
                  "-"
                )
              }
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
                filter
              />
              <Dropdown
                value={courier}
                options={couriers.map((c) => ({ label: c, value: c }))}
                onChange={(e) => setCourier(e.value)}
                placeholder="Odaberite kurira"
                style={{ marginTop: "1rem" }}
                filter
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
                disabled={!selectedContact || !courier}
              />
            </div>
          ) : (
            <>
              {!selectedOrder ? (
                <DataTable
                  value={filteredSalesOrders}
                  expandedRows={expandedRows}
                  onRowToggle={(e) => setExpandedRows(e.data)}
                  rowExpansionTemplate={(data) => (
                    <ExpandedSalesOrder orderId={data.id} apiUrl={API_URL} />
                  )}
                  dataKey="id"
                  loading={loading}
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
                    filter
                  />
                  <InputText
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Opis ili bilješka"
                    style={{ marginTop: "1rem" }}
                  />

                  <div
                    style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}
                  >
                    <Button
                      label="Odustani"
                      severity="secondary"
                      onClick={() => setSelectedOrder(null)}
                    />
                    <Button
                      label="Dodaj"
                      icon="pi pi-check"
                      onClick={handleAddPackage}
                      disabled={!courier}
                    />
                  </div>
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
                {selectedPackage.sales_order_id ? (
                  <Button
                    label={selectedPackage.order_code}
                    icon="pi pi-eye"
                    className="p-button-text p-button-sm"
                    onClick={() =>
                      fetchOrderDetails(selectedPackage.sales_order_id)
                    }
                  />
                ) : (
                  "-"
                )}
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
        <Dialog
          header="Detalji prodajnog naloga"
          visible={showOrderDialog}
          style={{ width: "60vw" }}
          onHide={() => {
            setShowOrderDialog(false);
            setSelectedOrderDetails(null);
          }}
        >
          {selectedOrderDetails && (
            <SalesOrderDetails
              order={selectedOrderDetails.order}
              items={selectedOrderDetails.items}
            />
          )}
        </Dialog>
      </div>
    </div>
  );
};

export default Packages;
