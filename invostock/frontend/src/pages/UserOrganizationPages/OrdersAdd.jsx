import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { Panel } from "primereact/panel";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";

const OrdersAdd = () => {
  const { user } = useContext(AuthContext);

  const [suppliers, setSuppliers] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [orderDate, setOrderDate] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [showItemSearchDialog, setShowItemSearchDialog] = useState(false);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/suppliers/getSuppliers`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.id,
              organizationId: user.organization_id,
            }),
          }
        );
        const data = await res.json();
        setSuppliers(data.suppliers || []);
      } catch (err) {
        console.error("Greška pri dohvaćanju dobavljača:", err);
      }
    };

    const fetchInventory = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/inventory/getInventory`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.id,
              organizationId: user.organization_id,
            }),
          }
        );
        const data = await res.json();
        setInventoryItems(
          (data.inventory || []).map((item) => ({
            ...item,
            quantity: 1,
            customPrice: item.price,
          }))
        );
      } catch (err) {
        console.error("Greška pri dohvaćanju inventara:", err);
      }
    };

    fetchSuppliers();
    fetchInventory();
  }, [user]);

  const handleSubmit = async () => {
    if (!selectedSupplier || !orderDate || orderItems.length === 0) {
      alert("Molimo ispunite sve podatke.");
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/orders/createOrder`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            organizationId: user.organization_id,
            supplierId: selectedSupplier.id,
            orderDate: orderDate.toISOString().slice(0, 10),
            totalPrice: totalSum.toFixed(2),
            items: orderItems.map((item) => ({
              name: item.item_name,
              quantity: item.quantity,
              price: item.price,
              description: item.item_description,
            })),
          }),
        }
      );

      const data = await res.json();

      if (data.success) {
        alert("Narudžbenica uspješno spremljena.");
        setSelectedSupplier(null);
        setOrderDate(null);
        setOrderItems([]);
      } else {
        alert("Greška: " + (data.error || "Nepoznata greška."));
      }
    } catch (err) {
      console.error("Greška kod spremanja narudžbenice:", err);
    }
  };

  const totalSum = orderItems.reduce((acc, item) => acc + item.total_price, 0);

  return (
    <div
      className="parent"
      style={{ paddingTop: "1%", paddingLeft: "5%", paddingRight: "5%" }}
    >
      <div className="div4">
        <div style={{ marginLeft: "3%", marginRight: "3%", marginTop: "2%" }}>
          <Panel header="Nova narudžbenica" style={{ fontSize: "0.88rem" }}>
            <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
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
            </div>
            <Button
              label="Spremi narudžbenicu"
              icon="pi pi-save"
              className="p-button-success"
              style={{ marginTop: "1rem" }}
              onClick={handleSubmit}
            />
          </Panel>
        </div>
      </div>

      <Dialog
        header="Odaberi artikl za narudžbu"
        visible={showItemSearchDialog}
        style={{ width: "60vw" }}
        onHide={() => setShowItemSearchDialog(false)}
      >
        <DataTable
          value={inventoryItems}
          responsiveLayout="scroll"
          style={{ fontSize: "0.9rem" }}
          dataKey="id"
        >
          <Column field="item_name" header="Naziv artikla" />
          <Column field="category" header="Kategorija" />
          <Column
            header="Količina"
            body={(rowData) => (
              <InputText
                type="number"
                value={rowData.quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  const updatedItems = inventoryItems.map((item) =>
                    item.id === rowData.id
                      ? { ...item, quantity: isNaN(val) || val < 1 ? 1 : val }
                      : item
                  );
                  setInventoryItems(updatedItems);
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
                  const updatedItems = inventoryItems.map((item) =>
                    item.id === rowData.id
                      ? {
                          ...item,
                          customPrice: isNaN(val) || val < 0 ? item.price : val,
                        }
                      : item
                  );
                  setInventoryItems(updatedItems);
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
                  const existingIndex = orderItems.findIndex(
                    (item) => item.item_name === rowData.item_name
                  );

                  if (existingIndex >= 0) {
                    const updatedItems = [...orderItems];
                    updatedItems[existingIndex].quantity += rowData.quantity;
                    updatedItems[existingIndex].total_price =
                      updatedItems[existingIndex].quantity *
                      updatedItems[existingIndex].price;
                    setOrderItems(updatedItems);
                  } else {
                    const total_price = rowData.quantity * rowData.customPrice;
                    const newItem = {
                      id: orderItems.length + 1,
                      item_name: rowData.item_name,
                      item_description: rowData.category,
                      quantity: rowData.quantity,
                      price: rowData.customPrice,
                      total_price,
                    };
                    setOrderItems([...orderItems, newItem]);
                  }

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
