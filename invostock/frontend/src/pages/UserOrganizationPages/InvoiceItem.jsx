import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { AuthContext } from "../../context/AuthContext";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Panel } from "primereact/panel";
import { Divider } from "primereact/divider";

import "./style.css";

const InvoiceItem = () => {
  const { user } = useContext(AuthContext);
  const { id, user_id } = useParams();

  const [invoiceItems, setInvoiceItems] = useState([]);
  const [invoiceData, setInvoiceData] = useState([]);
  const [contact, setContact] = useState([]);

  const fetchInvoiceItems = async () => {
    try {
      const response = await fetch(
        "http://localhost:3000/api/invoices/getInvoiceItems",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ invoiceId: id }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch invoice items");
      }

      const data = await response.json();
      setInvoiceItems(data.items);
      console.log("Na invoice itemi: " + data);
    } catch (error) {
      console.error("Error fetching invoices:", error);
    }
  };

  const fetchInvoiceData = async () => {
    try {
      const response = await fetch(
        "http://localhost:3000/api/invoices/getUserInovice",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ invoiceId: id }),
        }
      );

      const data = await response.json();
      setInvoiceData(data.invoice);
      console.log("Podaci fakture: " + data);
    } catch (error) {
      console.log("Greška u izvršavanju zahtjeva!", error);
    }
  };

  const fetchInvoiceContact = async () => {
    try {
      const response = await fetch(
        "http://localhost:3000/api/contacts/getInvoiceContact",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ contactId: invoiceData[0].contact_id }),
        }
      );

      const data = await response.json();
      setContact(data.contact);
      console.log(data);
    } catch (error) {
      console.log("Greška u izvršavanju zahtjeva!", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchInvoiceItems();
      await fetchInvoiceData();
    };

    fetchData();
  }, [id]);

  useEffect(() => {
    if (invoiceData.length > 0) {
      fetchInvoiceContact();
    }
    console.log(id, user_id);
    console.log("State invoice data: ", invoiceData);
    console.log("State items: ", invoiceItems);
    console.log("State contact: ", contact);
  }, [invoiceData]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("hr-HR");
  };

  return (
    <div className="parent" style={{ margin: "5rem" }}>
      <div className="div1"></div>
      <div className="div3">
        <Button
          icon="pi pi-ellipsis-h"
          text
          raised
          severity="info"
          aria-label="User"
          style={{ width: "30%", marginLeft: "70%", marginBottom: "5%" }}
        />
      </div>

      <div className="div4">
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
                    <span style={{ fontWeight: "normal" }}>Račun izdao:</span>{" "}
                    Admin
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
              <h3>Porez: NE</h3>
              <h3>Popust: {invoiceData?.[0]?.discount}</h3>
              <h3>Ukupno: {invoiceData?.[0]?.total_amount}</h3>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
};

export default InvoiceItem;
