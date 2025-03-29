import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { AuthContext } from "../../context/AuthContext";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Panel } from "primereact/panel";
import { Divider } from "primereact/divider";

import "./style.css";

const SalesItem = () => {
  const { user } = useContext(AuthContext);
  const { sale_id } = useParams();

  const [orderItems, setOrderItems] = useState([]);
  const [orderData, setOrderData] = useState(null);
  const [contact, setContact] = useState(null);

  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        const res1 = await fetch(
          "http://localhost:3000/api/sales/getOrderDetails",
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
      } catch (error) {
        console.error("Greška pri dohvaćanju naloga:", error);
      }
    };

    fetchOrderData();
  }, [sale_id]);

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
          aria-label="Opcije"
          style={{ width: "30%", marginLeft: "70%", marginBottom: "5%" }}
        />
      </div>

      <div className="div4">
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
                  marginBottom: "1rem",
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

              <Divider />
              <h3 style={{ margin: "0 0 1rem 0" }}>Stavke</h3>
            </div>

            <div style={{ display: "flex", gap: "2rem" }}>
              <DataTable
                value={orderItems}
                rows={5}
                responsiveLayout="scroll"
                style={{ fontSize: "0.9rem" }}
              >
                <Column field="item_name" header="Naziv stavke"></Column>
                <Column field="quantity" header="Količina"></Column>
                <Column field="price" header="Jedinična cijena (€)"></Column>
              </DataTable>
            </div>
            <div style={{ textAlign: "right", fontSize: "0.9rem" }}>
              <h3>Popust: {orderData?.discount || 0} €</h3>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
};

export default SalesItem;
