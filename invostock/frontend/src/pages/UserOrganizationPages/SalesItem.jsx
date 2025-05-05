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
              <div style={{ margin: "0" }}>
                <h4>Napomena</h4>
                {orderData?.notes}
              </div>

              <div style={{ width: "60%" }}>
                <Divider />
              </div>
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
          </Panel>
        </div>
      </div>
    </div>
  );
};

export default SalesItem;
