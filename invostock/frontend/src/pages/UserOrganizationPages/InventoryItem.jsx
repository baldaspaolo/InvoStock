import React, { useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Panel } from "primereact/panel";
import { Divider } from "primereact/divider";
import { Menu } from "primereact/menu";
import "./style.css";

const InventoryItemDetails = () => {
  const menu = useRef(null);


  const inventoryItem = {
    id: 1,
    item_name: "Seiko 5 SNK809",
    category: "Satovi",
    stock_quantity: 3,
    reorder_level: 5,
    price: 120,
    status: "low_stock",
    description: "Automatik sat sa japanskim mehanizmom.",
    notes: "Dostupan u crnoj i plavoj boji.",
    image_url: "https://via.placeholder.com/300", 
  };


  const relatedItems = [
    {
      id: 2,
      item_name: "Seiko Presage",
      category: "Satovi",
      stock_quantity: 10,
      price: 300,
      status: "sufficient",
      image_url: "https://via.placeholder.com/100",
    },
    {
      id: 3,
      item_name: "Casio G-Shock",
      category: "Satovi",
      stock_quantity: 5,
      price: 150,
      status: "low_stock",
      image_url: "https://via.placeholder.com/100",
    },
  ];

  // Opcije menija
  const menuItems = [
    {
      label: "Uredi proizvod",
      icon: "pi pi-pencil",
      command: () => {
        alert("Uređivanje proizvoda...");

      },
    },
    {
      label: "Uskladi zalihu",
      icon: "pi pi-box",
      command: () => {
        alert("Uskladištavanje zalihe...");
        
      },
    },
  ];

  return (
    <div className="parent">
      <div className="div1">
        <h1>Inventar</h1>
      </div>
      <div className="div3">

        <Button
          icon="pi pi-ellipsis-h"
          text
          raised
          severity="info"
          aria-label="Menu"
          style={{ width: "30%", marginLeft: "70%", marginBottom: "5%" }}
          onClick={(e) => menu.current.toggle(e)} 
        />

        <Menu model={menuItems} popup ref={menu} />
      </div>

      <div className="div4">
        <div style={{ marginLeft: "3%", marginRight: "3%" }}>
          <Panel
            header={`Detalji proizvoda`}
            style={{ fontSize: "0.9rem", padding: "1.5rem" }}
          >
            <div
              style={{
                display: "flex",
                gap: "2rem",
                alignItems: "flex-start",
              }}
            >
              <div style={{ flex: "0 0 30%", textAlign: "center" }}>
                <img
                  src={inventoryItem.image_url}
                  alt={inventoryItem.item_name}
                  style={{
                    width: "100%",
                    maxWidth: "300px",
                    borderRadius: "8px",
                  }}
                />
              </div>

              <div style={{ flex: "1", textAlign: "left" }}>
                <h1 style={{ margin: "0 0 1rem 0", fontWeight: "bold" }}>
                  {inventoryItem.item_name}
                </h1>
                <Divider />
                <div style={{ marginBottom: "1.5rem" }}>
                  <h3 style={{ margin: "0.5rem 0" }}>Osnovni podaci</h3>
                  <p>
                    <strong>Kategorija:</strong> {inventoryItem.category}
                  </p>
                  <p>
                    <strong>Količina na zalihi:</strong>{" "}
                    {inventoryItem.stock_quantity}
                  </p>
                  <p>
                    <strong>Minimalna zaliha:</strong>{" "}
                    {inventoryItem.reorder_level}
                  </p>
                  <p>
                    <strong>Cijena:</strong> {inventoryItem.price} €
                  </p>
                  <p>
                    <strong>Status:</strong>{" "}
                    {inventoryItem.status === "low_stock"
                      ? "Niska zaliha"
                      : inventoryItem.status === "out_of_stock"
                      ? "Nema zalihe"
                      : "Dovoljna zaliha"}
                  </p>
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                  <h3 style={{ margin: "0.5rem 0" }}>Opis proizvoda</h3>
                  <p>{inventoryItem.description}</p>
                </div>

                <div>
                  <h3 style={{ margin: "0.5rem 0" }}>Dodatne napomene</h3>
                  <p>{inventoryItem.notes}</p>
                </div>
              </div>
            </div>

            <Divider />
            <h2 style={{ margin: "1.5rem 0 1rem 0" }}>Povezani artikli</h2>
            <DataTable
              value={relatedItems}
              rows={5}
              responsiveLayout="scroll"
              style={{ fontSize: "0.9rem" }}
            >
              <Column
                header="Slika"
                body={(rowData) => (
                  <img
                    src={rowData.image_url}
                    alt={rowData.item_name}
                    style={{ width: "50px", borderRadius: "4px" }}
                  />
                )}
              ></Column>
              <Column field="item_name" header="Naziv artikla"></Column>
              <Column field="category" header="Kategorija"></Column>
              <Column
                field="stock_quantity"
                header="Količina na zalihi"
              ></Column>
              <Column field="price" header="Cijena (€)"></Column>
              <Column field="status" header="Status"></Column>
            </DataTable>
          </Panel>
        </div>
      </div>
    </div>
  );
};

export default InventoryItemDetails;
