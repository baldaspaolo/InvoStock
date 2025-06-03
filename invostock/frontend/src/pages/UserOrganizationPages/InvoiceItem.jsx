import React, { useContext, useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Panel } from "primereact/panel";
import { Divider } from "primereact/divider";
import { Toast } from "primereact/toast";
import ExportUtility from "../../components/ExportUtility";
import "./style.css";
import Invoices from "./Invoices";

const InvoiceItem = () => {
  const { user } = useContext(AuthContext);
  const { id, user_id } = useParams();
  const toastRef = useRef(null);
  const invoiceRef = useRef(null);
  const navigate = useNavigate();

  const [invoiceItems, setInvoiceItems] = useState([]);
  const [invoiceData, setInvoiceData] = useState([]);
  const [contact, setContact] = useState([]);

  useEffect(() => {
    const fetchEverything = async () => {
      try {
        const [itemsRes, dataRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/invoices/getInvoiceItems`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ invoiceId: id }),
          }),
          fetch(`${import.meta.env.VITE_API_URL}/api/invoices/getUserInvoice`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ invoiceId: id }),
          }),
        ]);
  
        const itemsData = await itemsRes.json();
        const invoiceDataResponse = await dataRes.json();
  
        setInvoiceItems(itemsData.items || []);
        setInvoiceData(invoiceDataResponse.invoice || []);
  
        const invoice = invoiceDataResponse.invoice?.[0];
  
        if (invoice?.contact_id) {
          const contactRes = await fetch(
            `${import.meta.env.VITE_API_URL}/api/contacts/getInvoiceContact`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ contactId: invoice.contact_id }),
            }
          );
          const contactData = await contactRes.json();
  
          setContact(Array.isArray(contactData.contact) ? contactData.contact : [contactData.contact]);
        }
      } catch (err) {
        console.error("Greška prilikom dohvata podataka:", err);
      }
    };
  
    fetchEverything();
  }, [id]);

  useEffect(() => {
    console.log("Invoice:", invoiceData);
    console.log("Contact:", contact);
  }, [invoiceData, contact]);
  

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return isNaN(date) ? "N/A" : date.toLocaleDateString("hr-HR");
  };
  

  const getExcelData = () => {
    return [
      ["Faktura br.", invoiceData?.[0]?.custom_invoice_code || "N/A"],
      ["Datum izdavanja", formatDate(invoiceData?.[0]?.invoice_date)],
      ["Datum dospijeća", formatDate(invoiceData?.[0]?.due_date)],
      [
        "Klijent",
        `${contact?.[0]?.first_name || ""} ${contact?.[0]?.last_name || ""}`,
      ],
      ["Adresa", contact?.[0]?.address || "N/A"],
      [
        "Mjesto",
        `${contact?.[0]?.zip_code || ""} ${contact?.[0]?.place || ""}`,
      ],
      [],
      ["Stavke fakture"],
      ["Naziv", "Opis", "Količina", "Cijena (€)", "Ukupno (€)"],
      ...invoiceItems.map((item) => [
        item.item_name,
        item.item_description,
        item.quantity,
        item.price,
        item.total_price,
      ]),
      [],
      ["Ukupno bez popusta:", invoiceData?.[0]?.total_amount || "0"],
      ["Popust:", invoiceData?.[0]?.discount || "0"],
      ["Ukupan iznos:", invoiceData?.[0]?.final_amount || "0"],
    ];
  };

  const excelColumns = [
    { width: 30 }, // Naziv
    { width: 50 }, // Opis
    { width: 10 }, // Količina
    { width: 15 }, // Cijena
    { width: 15 }, // Ukupno
  ];

  return (
    <div className="parent" style={{ margin: "5rem" }}>
      <Toast ref={toastRef} />
      <div className="div1" style={{ marginRight: "15%" }}>
        <Button
          icon="pi pi-arrow-left"
          text
          raised
          severity="secondary"
          aria-label="Natrag"
          onClick={() => navigate("/invoices")}
          style={{ width: "30%" }}
        />
      </div>
      <div className="div3">
        <ExportUtility
          refElement={invoiceRef}
          toastRef={toastRef}
          fileName={`faktura_${
            invoiceData?.[0]?.custom_invoice_code || "unknown"
          }`}
          excelData={getExcelData()}
          excelColumns={excelColumns}
        />
      </div>

      <div className="div4" ref={invoiceRef}>
        <div style={{ marginLeft: "3%", marginRight: "3%" }}>
          <Panel
            header={"Faktura: " + invoiceData?.[0]?.custom_invoice_code}
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
                  marginBottom: "1rem",
                }}
              >
                <div style={{ width: "60%", textAlign: "left" }}>
                  <h3 style={{ margin: "4px 0" }}>Klijent</h3>
                  <Divider />
                  <h4 style={{ margin: "4px 0" }}>
                    <span style={{ fontWeight: "normal" }}>Ime i prezime:</span>{" "}
                    {contact?.[0]?.first_name || "N/A"}{" "}
                    {contact?.[0]?.last_name || "N/A"}
                  </h4>
                  <h4 style={{ margin: "4px 0" }}>
                    <span style={{ fontWeight: "normal" }}>Adresa:</span>{" "}
                    {contact?.[0]?.address || "N/A"}
                  </h4>
                  <h4 style={{ margin: "4px 0" }}>
                    <span style={{ fontWeight: "normal" }}>
                      Poštanski broj:
                    </span>{" "}
                    {contact?.[0]?.zip_code || "N/A"}
                  </h4>
                  <h4 style={{ margin: "4px 0" }}>
                    <span style={{ fontWeight: "normal" }}>Mjesto:</span>{" "}
                    {contact?.[0]?.place || "N/A"}
                  </h4>
                  <h4 style={{ margin: "4px 0" }}>
                    <span style={{ fontWeight: "normal" }}>Kontakt broj:</span>{" "}
                    {contact?.[0]?.phone_number || "N/A"}
                  </h4>
                  <h4 style={{ margin: "4px 0" }}>
                    <span style={{ fontWeight: "normal" }}>Email adresa:</span>{" "}
                    {contact?.[0]?.email || "N/A"}
                  </h4>
                </div>

                <div
                  style={{
                    textAlign: "left",
                    marginTop: "4rem",
                  }}
                >
                  <h4 style={{ margin: "4px 0" }}>
                    <span style={{ fontWeight: "normal" }}>Datum računa:</span>{" "}
                    {formatDate(invoiceData?.[0]?.invoice_date)}
                  </h4>
                  <h4 style={{ margin: "4px 0" }}>
                    <span style={{ fontWeight: "normal" }}>
                      Datum dospijeća:
                    </span>{" "}
                    {formatDate(invoiceData?.[0]?.due_date)}
                  </h4>
                  <h4 style={{ margin: "4px 0" }}>
                    <span style={{ fontWeight: "normal" }}>Račun izdao: <b>{invoiceData?.[0]?.issuer_name}</b></span>{" "}
                  </h4>
                </div>
              </div>

              <Divider />
              <h3 style={{ margin: "0 0 1rem 0" }}>Stavke</h3>
            </div>

            <div style={{ display: "flex", gap: "2rem" }}>
              <DataTable
                value={invoiceItems}
                rows={5}
                responsiveLayout="scroll"
                style={{ fontSize: "0.9rem" }}
              >
                <Column field="item_name" header="Naziv stavke"></Column>
                <Column field="item_description" header="Opis"></Column>
                <Column field="quantity" header="Količina"></Column>
                <Column field="price" header="Jedinična cijena (€)"></Column>
                <Column field="total_price" header="Ukupna cijena (€)"></Column>
              </DataTable>
            </div>
            <div style={{ textAlign: "right", fontSize: "0.9rem" }}>
              <h3>Vrijednost zbroja: {invoiceData?.[0]?.total_amount}</h3>
              <h3>Popust: {invoiceData?.[0]?.discount}</h3>
              <h3>Ukupno: {invoiceData?.[0]?.final_amount}</h3>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
};

export default InvoiceItem;
