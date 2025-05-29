import React, { useContext, useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Panel } from "primereact/panel";
import { Divider } from "primereact/divider";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";
import { Dialog } from "primereact/dialog";
import { Calendar } from "primereact/calendar";


import { InputTextarea } from "primereact/inputtextarea";

import ExportUtility from "../../components/ExportUtility";
import "./style.css";

const SalesItem = () => {
  const { user } = useContext(AuthContext);
  const { sale_id } = useParams();
  const toastRef = useRef(null);
  const salesRef = useRef(null);
  const navigate = useNavigate();

  const [orderItems, setOrderItems] = useState([]);
  const [orderData, setOrderData] = useState(null);
  const [contact, setContact] = useState(null);
  const [salePrice, setSalePrice] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [closeReason, setCloseReason] = useState("");
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [selectedDueDate, setSelectedDueDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
  );

  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        const res1 = await fetch(
          `${import.meta.env.VITE_API_URL}/api/sales/getOrderDetails`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: sale_id }),
          }
        );
        const data1 = await res1.json();
        setOrderData(data1.order);
        setOrderItems(data1.items);
        setContact({
          first_name: data1.order.first_name,
          last_name: data1.order.last_name,
          address: data1.order.address,
          zip_code: data1.order.zip_code,
          place: data1.order.place,
          phone_number: data1.order.phone_number,
          email: data1.order.email,
        });
        console.log(data1);
        console.log("Kontakt", contact);
      } catch (error) {
        console.error("Greška pri dohvaćanju naloga:", error);
      }
    };

    const fetchPrice = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/sales/calculateOrderTotal`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: sale_id }),
          }
        );
        const data = await res.json();
        setSalePrice(data);
      } catch (error) {
        console.error("Greška na serveru!", error);
      }
    };

    fetchOrderData();
    fetchPrice();
  }, [sale_id]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("hr-HR");
  };

  const handleCreateInvoice = async () => {
    try {
      // Dohvati stavke naloga ako već nisu u stateu
      const itemsRes = await fetch(
        `${import.meta.env.VITE_API_URL}/api/sales/getOrderDetails`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: sale_id }),
        }
      );
      const data = await itemsRes.json();

      const payload = {
        userId: user.id,
        organizationId: user.organization_id,
        contactId: orderData.contact_id,
        invoiceDate: new Date().toISOString().slice(0, 10),
        dueDate: selectedDueDate.toISOString().slice(0, 10),
        discount: orderData.discount,
        salesOrderId: orderData.id,
        items: data.items.map((item) => ({
          itemId: item.item_id,
          itemName: item.item_name,
          itemDescription: null,
          quantity: item.quantity,
          price: item.price,
        })),
      };

      console.log("Payload za fakturu:", payload);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/invoices/createInvoice`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (result.success) {
        toastRef.current.show({
          severity: "success",
          summary: "Faktura kreirana",
          detail: `Broj fakture: ${result.custom_invoice_code}`,
          life: 4000,
        });

        // Osvježi podatke o nalogu
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/sales/getOrderDetails`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: sale_id }),
          }
        );
        const updatedData = await res.json();
        setOrderData(updatedData.order);
      } else {
        throw new Error(result.error || "Neuspješno kreiranje fakture.");
      }
    } catch (error) {
      toastRef.current.show({
        severity: "error",
        summary: "Greška",
        detail: error.message,
        life: 4000,
      });
      console.error("Greška pri kreiranju fakture:", error);
    }
  };

  const handleCreatePackage = async () => {
    try {
      const payload = {
        userId: user.id,
        organizationId: user.organization_id,
        contactId: orderData.contact_id,
        salesOrderId: orderData.id,
        courier: null,
        description: null,
      };

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/packages/createPackage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (data.success) {
        toastRef.current.show({
          severity: "success",
          summary: "Paket kreiran",
          detail: `Broj paketa: ${data.custom_package_code}`,
          life: 4000,
        });

        // Osvježi podatke o nalogu
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/sales/getOrderDetails`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: sale_id }),
          }
        );
        const updatedData = await res.json();
        setOrderData(updatedData.order);
      } else {
        throw new Error(data.error || "Greška prilikom kreiranja paketa.");
      }
    } catch (error) {
      toastRef.current.show({
        severity: "error",
        summary: "Greška",
        detail: error.message,
        life: 4000,
      });
      console.error("Greška pri kreiranju paketa:", error);
    }
  };

  const translatePackageStatus = (status) => {
    switch (status) {
      case "not_shipped":
        return "U pripremi";
      case "shipped":
        return "Poslano";
      case "delivered":
        return "Dostavljeno";
      default:
        return "Nepoznato";
    }
  };

  const getExcelData = () => {
    return [
      ["Nalog br.", orderData?.id || "N/A"],
      ["Datum", formatDate(orderData?.created_at)],
      ["Status", orderData?.status || "N/A"],
      ["Klijent", `${contact?.first_name || ""} ${contact?.last_name || ""}`],
      ["Adresa", contact?.address || "N/A"],
      ["Mjesto", `${contact?.zip_code || ""} ${contact?.place || ""}`],
      ["Telefon", contact?.phone_number || "N/A"],
      ["Email", contact?.email || "N/A"],
      ["Napomena", orderData?.notes || ""],
      [],
      ["Stavke naloga"],
      ["Naziv", "Količina", "Cijena (€)", "Ukupno (€)"],
      ...orderItems.map((item) => [
        item.item_name,
        item.quantity,
        item.price,
        (item.quantity * item.price).toFixed(2),
      ]),
      [],
      ["Zbroj:", salePrice?.subtotal || 0],
      ["Popust:", salePrice?.discount || 0],
      ["Ukupno:", salePrice?.total || 0],
    ];
  };

  const excelColumns = [
    { width: 30 }, // Naziv
    { width: 10 }, // Količina
    { width: 15 }, // Cijena
    { width: 15 }, // Ukupno
  ];

  const confirmCloseAccount = () => {
    setShowConfirm(true);
  };

  const handleCloseAccount = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/sales/closeOrder`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: sale_id, reason: closeReason }),
        }
      );

      if (response.ok) {
        toastRef.current.show({
          severity: "success",
          summary: "Uspjeh",
          detail: "Nalog uspješno zatvoren",
          life: 3000,
        });
        setCloseReason("");
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/sales/getOrderDetails`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: sale_id }),
          }
        );
        const data = await res.json();
        setOrderData(data.order);
      } else {
        throw new Error("Greška pri zatvaranju naloga");
      }
    } catch (error) {
      toastRef.current.show({
        severity: "error",
        summary: "Greška",
        detail: error.message,
        life: 3000,
      });
    }
  };

  // Check if invoice exists and payment is marked as paid
  const isCloseButtonDisabled = !(
    orderData?.invoice_id && orderData?.invoice_status === "paid"
  );

  return (
    <div className="parent" style={{ margin: "5rem" }}>
      <Toast ref={toastRef} />
      <Dialog
        header="Zatvaranje naloga"
        visible={showConfirm}
        style={{ width: "30vw" }}
        onHide={() => setShowConfirm(false)}
        footer={
          <div
            style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}
          >
            <Button
              label="Odustani"
              icon="pi pi-times"
              onClick={() => {
                setShowConfirm(false);
                setCloseReason("");
              }}
              className="p-button-text"
            />
            <Button
              label="Zatvori"
              icon="pi pi-check"
              onClick={handleCloseAccount}
              disabled={!closeReason.trim()}
              autoFocus
            />
          </div>
        }
      >
        <p>Jeste li sigurni da želite zatvoriti ovaj nalog?</p>
        <p>Molimo unesite razlog zatvaranja:</p>
        <InputTextarea
          rows={3}
          autoResize
          value={closeReason}
          onChange={(e) => setCloseReason(e.target.value)}
          style={{ width: "100%" }}
          placeholder="Npr. sve izvršeno, plaćeno i dostavljeno."
        />
      </Dialog>

      <div className="div1" style={{ marginRight: "15%" }}>
        <Button
          icon="pi pi-arrow-left"
          text
          raised
          severity="secondary"
          aria-label="Natrag"
          onClick={() => navigate("/sales")}
          style={{ width: "30%" }}
        />
      </div>
      <div className="div3">
        <ExportUtility
          refElement={salesRef}
          toastRef={toastRef}
          fileName={`nalog_${orderData?.id || "unknown"}`}
          excelData={getExcelData()}
          excelColumns={excelColumns}
        />
      </div>

      <div className="div4" ref={salesRef}>
        <div style={{ marginLeft: "3%", marginRight: "3%" }}>
          <Panel
            header={"Nalog ID: " + orderData?.id}
            style={{ fontSize: "0.9rem" }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "100%",
                  alignItems: "flex-start",
                  marginBottom: "0.5rem",
                }}
              >
                <div style={{ width: "60%", textAlign: "left" }}>
                  <h3 style={{ margin: "4px 0" }}>Klijent</h3>
                  <Divider />
                  <h4 style={{ margin: "4px 0" }}>
                    <span style={{ fontWeight: "normal" }}>Ime i prezime:</span>{" "}
                    {contact?.first_name || "N/A"} {contact?.last_name || ""}
                  </h4>
                  <h4 style={{ margin: "4px 0" }}>
                    <span style={{ fontWeight: "normal" }}>Adresa:</span>{" "}
                    {contact?.address || "N/A"}
                  </h4>
                  <h4 style={{ margin: "4px 0" }}>
                    <span style={{ fontWeight: "normal" }}>
                      Poštanski broj:
                    </span>{" "}
                    {contact?.zip_code || "N/A"}
                  </h4>
                  <h4 style={{ margin: "4px 0" }}>
                    <span style={{ fontWeight: "normal" }}>Mjesto:</span>{" "}
                    {contact?.place || "N/A"}
                  </h4>
                  <h4 style={{ margin: "4px 0" }}>
                    <span style={{ fontWeight: "normal" }}>Kontakt broj:</span>{" "}
                    {contact?.phone_number || "N/A"}
                  </h4>
                  <h4 style={{ margin: "4px 0" }}>
                    <span style={{ fontWeight: "normal" }}>Email adresa:</span>{" "}
                    {contact?.email || "N/A"}
                  </h4>
                </div>

                <div style={{ textAlign: "left", marginTop: "4rem" }}>
                  <h4 style={{ margin: "4px 0" }}>
                    <span style={{ fontWeight: "normal" }}>Datum:</span>{" "}
                    {formatDate(orderData?.created_at)}
                  </h4>
                  <h4 style={{ margin: "4px 0" }}>
                    <span style={{ fontWeight: "normal" }}>Status:</span>{" "}
                    {orderData?.status || "N/A"}
                  </h4>
                </div>
              </div>
              <div style={{ width: "60%" }}>
                <Divider />
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  flexWrap: "wrap",
                  alignItems: "center",
                  padding: "0.5rem 0",
                }}
              >
                <Tag
                  value={`Faktura: ${
                    orderData?.invoice_id ? "Povezana" : "Nema"
                  }`}
                  severity={orderData?.invoice_id ? "success" : "danger"}
                  style={{ width: "fit-content" }}
                />
                <Tag
                  value={
                    orderData?.invoice_status === "paid"
                      ? "Plaćeno"
                      : "Nepodmireno"
                  }
                  severity={
                    orderData?.invoice_status === "paid" ? "success" : "danger"
                  }
                  style={{ width: "fit-content" }}
                />
                <Tag
                  value={`Paket: ${
                    orderData?.package_id
                      ? translatePackageStatus(orderData.package_status)
                      : "Nema"
                  }`}
                  severity={
                    orderData?.package_status === "delivered"
                      ? "success"
                      : orderData?.package_status === "shipped"
                      ? "warning"
                      : orderData?.package_id
                      ? "info"
                      : "danger"
                  }
                  style={{ width: "fit-content" }}
                />
              </div>
              {orderData?.notes && (
                <div style={{ width: "60%" }}>
                  <Divider />
                </div>
              )}

              {orderData?.notes && (
                <div style={{ margin: "0" }}>
                  <h4>Napomena</h4>
                  {orderData.notes}
                </div>
              )}

              {orderData?.status === "closed" && orderData?.close_reason && (
                <>
                  <div style={{ width: "60%" }}>
                    <Divider />
                  </div>
                  <div style={{ marginTop: "0" }}>
                    <h4>Razlog ručnog zatvaranja</h4>
                    <p>{orderData.close_reason}</p>
                  </div>
                </>
              )}
              {orderData?.status === "closed" && orderData?.close_reason && (
                <div style={{ width: "60%" }}>
                  <Divider />
                </div>
              )}

              <h3 style={{ margin: "0 0 1rem 0" }}>Stavke</h3>
            </div>

            <div style={{ display: "flex", gap: "2rem" }}>
              <DataTable
                value={orderItems}
                rows={5}
                responsiveLayout="scroll"
                style={{ fontSize: "0.9rem" }}
              >
                <Column field="item_name" header="Naziv stavke" />
                <Column field="quantity" header="Količina" />
                <Column field="price" header="Jedinična cijena (€)" />
                <Column
                  header="Ukupno (€)"
                  body={(rowData) =>
                    (rowData.quantity * rowData.price).toFixed(2)
                  }
                />
              </DataTable>
            </div>

            <div style={{ textAlign: "right", fontSize: "0.9rem" }}>
              <h3>Zbroj: {salePrice?.subtotal || 0} €</h3>
            </div>
            <div style={{ textAlign: "right", fontSize: "0.9rem" }}>
              <h3>Popust: {salePrice?.discount || 0} €</h3>
            </div>
            <div style={{ textAlign: "right", fontSize: "0.9rem" }}>
              <h3>Ukupno: {salePrice?.total || 0} €</h3>
            </div>

            {/* STATUS PANEL */}
            <div style={{ width: "100%", marginTop: "2rem" }}>
              <div
                style={{
                  marginTop: "1rem",
                  display: "flex",
                  gap: "1rem",
                  flexWrap: "wrap",
                }}
              >
                {orderData?.status !== "closed" && !orderData?.invoice_id && (
                  <Button
                    label="Kreiraj fakturu"
                    icon="pi pi-file"
                    onClick={() => setShowInvoiceDialog(true)}
                    severity="success"
                  />
                )}
                {orderData?.status !== "closed" && !orderData?.package_id && (
                  <Button
                    label="Kreiraj paket"
                    icon="pi pi-box"
                    onClick={handleCreatePackage}
                    severity="info"
                  />
                )}
                <Divider />
                {orderData?.status === "open" && (
                  <Button
                    label="Zatvori nalog"
                    icon="pi pi-lock"
                    severity="danger"
                    onClick={confirmCloseAccount}
                  />
                )}
              </div>
            </div>
          </Panel>
          <Dialog
            header="Kreiranje fakture"
            visible={showInvoiceDialog}
            style={{ width: "30vw" }}
            onHide={() => setShowInvoiceDialog(false)}
            footer={
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "1rem",
                }}
              >
                <Button
                  label="Odustani"
                  icon="pi pi-times"
                  onClick={() => setShowInvoiceDialog(false)}
                  className="p-button-text"
                />
                <Button
                  label="Kreiraj fakturu"
                  icon="pi pi-check"
                  onClick={() => {
                    setShowInvoiceDialog(false);
                    handleCreateInvoice();
                  }}
                  autoFocus
                />
              </div>
            }
          >
            <p>Odaberite datum dospijeća fakture:</p>
            <Calendar
              value={selectedDueDate}
              onChange={(e) => setSelectedDueDate(e.value)}
              showIcon
              dateFormat="dd.mm.yy"
              style={{ width: "100%" }}
            />
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default SalesItem;
