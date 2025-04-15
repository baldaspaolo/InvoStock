import React, { useState } from "react";
import { Panel } from "primereact/panel";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";

const OrdersAdd = () => {
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [orderDate, setOrderDate] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [showItemSearchDialog, setShowItemSearchDialog] = useState(false);

  const suppliers = [
    { name: "WatchParts EU", id: 1 },
    { name: "Seiko OEM", id: 2 },
    { name: "Tech Components Ltd.", id: 3 },
  ];

  const availableItems = [
    { id: 1, name: "Bezel Insert – Pepsi", category: "Bezel", price: 10 },
    { id: 2, name: "SKX007 Case", category: "Case", price: 40 },
    { id: 3, name: "Crown SRPD", category: "Crown", price: 12 },
    { id: 4, name: "NH36 Movement", category: "Movement", price: 26 },
    { id: 5, name: "Sapphire Crystal 28.5mm", category: "Glass", price: 15 },
  ];

  const totalSum = orderItems.reduce((acc, item) => acc + item.total_price, 0);

  return (
    <div
      className="parent"
      style={{ paddingTop: "1%", paddingLeft: "5%", paddingRight: "5%" }}
    >
      <div className="div4">
        <div style={{ marginLeft: "3%", marginRight: "3%", marginTop: "2%" }}>
          <Panel header="Nova narudžbenica" style={{ fontSize: "0.88rem" }}>
            <div
              style={{
                display: "flex",
                gap: "1rem",
                marginBottom: "1rem",
              }}
            >
              <Dropdown
                value={selectedSupplier}
                options={suppliers}
                onChange={(e) => setSelectedSupplier(e.value)}
                optionLabel="name"
                placeholder="Odaberi dobavljača"
              />
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <Calendar
                value={orderDate}
                onChange={(e) => setOrderDate(e.value)}
                placeholder="Datum narudžbe"
                dateFormat="dd.mm.yy"
                style={{ width: "100%" }}
              />
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <DataTable
                value={[
                  ...orderItems,
                  { id: "new", item_name: "Dodaj artikl" },
                ]}
                rows={5}
                responsiveLayout="scroll"
                style={{ fontSize: "0.9rem" }}
                onRowClick={(e) => {
                  if (e.data.id === "new") {
                    setShowItemSearchDialog(true);
                  }
                }}
              >
                <Column field="item_name" header="Naziv artikla" />
                <Column field="item_description" header="Opis" />
                <Column field="quantity" header="Količina" />
                <Column field="price" header="Jedinična cijena (€)" />
                <Column field="total_price" header="Ukupna cijena (€)" />
              </DataTable>
            </div>

            <div style={{ textAlign: "right", fontSize: "0.9rem" }}>
              <h3>Ukupna vrijednost: {totalSum.toFixed(2)} €</h3>
              <h3>Status: Naručeno</h3>
              <h3>Isporuka: Očekivana</h3>
            </div>
          </Panel>
        </div>
      </div>

      {/* Dialog za odabir artikla iz liste */}
      <Dialog
        header="Odaberi artikl za narudžbu"
        visible={showItemSearchDialog}
        style={{ width: "60vw" }}
        onHide={() => setShowItemSearchDialog(false)}
      >
        <DataTable
          value={availableItems.map((item) => ({
            ...item,
            quantity: 1,
            customPrice: item.price,
          }))}
          responsiveLayout="scroll"
          style={{ fontSize: "0.9rem" }}
          dataKey="id"
        >
          <Column field="name" header="Naziv artikla" />
          <Column field="category" header="Kategorija" />

          <Column
            header="Količina"
            body={(rowData) => (
              <InputText
                type="number"
                value={rowData.quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  rowData.quantity = isNaN(val) || val < 1 ? 1 : val;
                }}
                style={{ width: "4rem" }}
              />
            )}
          />
          <Column
            header="Cijena (€)"
            body={(rowData) => (
              <InputText
                type="number"
                value={rowData.customPrice}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  rowData.customPrice =
                    isNaN(val) || val < 0 ? rowData.price : val;
                }}
                style={{ width: "5rem" }}
              />
            )}
          />
          <Column
            header=""
            body={(rowData) => (
              <Button
                label="Dodaj"
                icon="pi pi-plus"
                onClick={() => {
                  const total_price = rowData.quantity * rowData.customPrice;
                  const newItem = {
                    id: orderItems.length + 1,
                    item_name: rowData.name,
                    item_description: rowData.category,
                    quantity: rowData.quantity,
                    price: rowData.customPrice,
                    total_price,
                  };
                  setOrderItems([...orderItems, newItem]);
                  setShowItemSearchDialog(false); 
                }}
              />
            )}
          />
        </DataTable>
      </Dialog>
    </div>
  );
};

export default OrdersAdd;
