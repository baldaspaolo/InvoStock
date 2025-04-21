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
import { RadioButton } from "primereact/radiobutton";

const OrdersAdd = () => {
  const { user } = useContext(AuthContext);

  const [suppliers, setSuppliers] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [orderDate, setOrderDate] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [showItemSearchDialog, setShowItemSearchDialog] = useState(false);
  const [itemAddMode, setItemAddMode] = useState("inventory");
  const [manualItem, setManualItem] = useState({
    name: "",
    category: "",
    quantity: 1,
    price: 0,
  });

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
              category: item.category || null,
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
        header="Dodaj artikl u narudžbu"
        visible={showItemSearchDialog}
        style={{ width: "60vw" }}
        onHide={() => setShowItemSearchDialog(false)}
      >
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
          <div>
            <RadioButton
              inputId="inventory"
              name="mode"
              value="inventory"
              onChange={(e) => setItemAddMode(e.value)}
              checked={itemAddMode === "inventory"}
            />
            <label htmlFor="inventory">Iz inventara</label>
          </div>
          <div>
            <RadioButton
              inputId="manual"
              name="mode"
              value="manual"
              onChange={(e) => setItemAddMode(e.value)}
              checked={itemAddMode === "manual"}
            />
            <label htmlFor="manual">Ručni unos</label>
          </div>
        </div>

        {itemAddMode === "inventory" ? (
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
                            customPrice:
                              isNaN(val) || val < 0 ? item.price : val,
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
                    const total_price = rowData.quantity * rowData.customPrice;
                    const newItem = {
                      id: orderItems.length + 1,
                      item_name: rowData.item_name,
                      item_description: rowData.category,
                      category: rowData.category,
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
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <InputText
              placeholder="Naziv artikla"
              value={manualItem.name}
              onChange={(e) =>
                setManualItem({ ...manualItem, name: e.target.value })
              }
            />
            <InputText
              placeholder="Kategorija"
              value={manualItem.category}
              onChange={(e) =>
                setManualItem({ ...manualItem, category: e.target.value })
              }
            />
            <InputText
              placeholder="Količina"
              type="number"
              value={manualItem.quantity}
              onChange={(e) =>
                setManualItem({
                  ...manualItem,
                  quantity: parseInt(e.target.value) || 1,
                })
              }
            />
            <InputText
              placeholder="Cijena (€)"
              type="number"
              value={manualItem.price}
              onChange={(e) =>
                setManualItem({
                  ...manualItem,
                  price: parseFloat(e.target.value) || 0,
                })
              }
            />
            <Button
              label="Dodaj ručno"
              icon="pi pi-plus"
              onClick={() => {
                const total_price = manualItem.quantity * manualItem.price;
                const newItem = {
                  id: orderItems.length + 1,
                  item_name: manualItem.name,
                  item_description: manualItem.category,
                  category: manualItem.category,
                  quantity: manualItem.quantity,
                  price: manualItem.price,
                  total_price,
                };
                setOrderItems([...orderItems, newItem]);
                setManualItem({
                  name: "",
                  category: "",
                  quantity: 1,
                  price: 0,
                });
                setShowItemSearchDialog(false);
              }}
            />
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default OrdersAdd;
