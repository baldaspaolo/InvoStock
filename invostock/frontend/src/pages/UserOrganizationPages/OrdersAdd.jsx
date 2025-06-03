import React, { useState, useEffect, useContext, useRef } from "react";
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
import { Toast } from "primereact/toast";
import { useNavigate } from "react-router-dom";

import SupplierAdd from "../../components/SupplierAdd";

const OrdersAdd = () => {
  const { user } = useContext(AuthContext);
  const toast = useRef(null);
  const navigate = useNavigate();

  const [suppliers, setSuppliers] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [orderDate, setOrderDate] = useState(new Date());
  const [orderItems, setOrderItems] = useState([]);
  const [showItemSearchDialog, setShowItemSearchDialog] = useState(false);
  const [itemAddMode, setItemAddMode] = useState("inventory");
  const [manualItem, setManualItem] = useState({
    name: "",
    category: "",
    quantity: 1,
    price: 0,
  });
  const [showSupplierDialog, setShowSupplierDialog] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState([
    { label: "Odaberi kategoriju", value: "" },
  ]);

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

    const fetchCategories = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/inventory/getCategories?userId=${
            user.id
          }&organizationId=${user.organization_id || ""}`
        );
        const data = await res.json();
        if (data.success) {
          setCategoryOptions([
            { label: "Odaberi kategoriju", value: "" },
            ...data.categories.map((cat) => ({
              label: cat.name,
              value: cat.id,
            })),
          ]);
        }
      } catch (error) {
        console.error("Greška pri dohvaćanju kategorija:", error);
      }
    };

    fetchSuppliers();
    fetchInventory();
    fetchCategories();
  }, [user]);

  const toLocalISOString = (date) => {
    return new Date(
      date.getTime() - date.getTimezoneOffset() * 60000
    ).toISOString();
  };

  const handleSubmit = async () => {
    if (!selectedSupplier || !orderDate || orderItems.length === 0) {
      toast.current.show({
        severity: "error",
        summary: "Nedostajući podaci",
        detail: "Molimo popunite sve podatke!",
        life: 2000,
      });
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
            orderDate: toLocalISOString(orderDate).slice(0, 10),
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
        toast.current.show({
          severity: "success",
          summary: "Uspjeh",
          detail: "Narudžbenica je spremljena",
          life: 2000,
        });

        setTimeout(() => {
          navigate("/orders");
        }, 1000);

        setSelectedSupplier(null);
        setOrderDate(null);
        setOrderItems([]);
      } else {
        alert("Greška: " + (data.error || "Nepoznata greška."));
      }
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Greška",
        detail: "Greška kod spremanja narudžbenice",
        life: 2000,
      });
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
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "1rem",
              }}
            >
              <Dropdown
                value={selectedSupplier}
                options={suppliers}
                onChange={(e) => setSelectedSupplier(e.value)}
                optionLabel="name"
                placeholder="Odaberi dobavljača"
                style={{ flexGrow: 1 }}
              />
              <Button
                icon="pi pi-plus"
                severity="success"
                size="small"
                style={{ width: "2.5rem", height: "2.5rem" }}
                onClick={() => setShowSupplierDialog(true)}
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
                <Column
                  header="Akcije"
                  body={(rowData) =>
                    rowData.id !== "new" && (
                      <Button
                        icon="pi pi-trash"
                        severity="danger"
                        rounded
                        onClick={() =>
                          setOrderItems(
                            orderItems.filter((item) => item.id !== rowData.id)
                          )
                        }
                      />
                    )
                  }
                />
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
        <div
          style={{
            display: "flex",
            gap: "2rem",
            alignItems: "center",
            marginBottom: "1rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <RadioButton
              inputId="inventory"
              name="mode"
              value="inventory"
              onChange={(e) => setItemAddMode(e.value)}
              checked={itemAddMode === "inventory"}
            />
            <label htmlFor="inventory">Iz inventara</label>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
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
                    const alreadyExists = orderItems.some(
                      (item) => item.item_name === rowData.item_name
                    );

                    if (alreadyExists) {
                      toast.current.show({
                        severity: "warn",
                        summary: "Upozorenje",
                        detail: "Artikl je već dodan u narudžbu.",
                        life: 3000,
                      });
                      return;
                    }

                    if (alreadyExists) {
                      toast.current.show({
                        severity: "warn",
                        summary: "Upozorenje",
                        detail: "Artikl je već dodan u narudžbu.",
                        life: 3000,
                      });
                      return;
                    }

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
            <Dropdown
              value={manualItem.category}
              options={categoryOptions}
              onChange={(e) =>
                setManualItem({ ...manualItem, category: e.value })
              }
              placeholder="Odaberi kategoriju"
              style={{ width: "100%" }}
            />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <label style={{ display: "flex", marginBottom: "0.3rem" }}>
                Količina
              </label>
              <InputText
                type="number"
                min={1}
                value={manualItem.quantity}
                onChange={(e) =>
                  setManualItem({
                    ...manualItem,
                    quantity: parseInt(e.target.value) || 1,
                  })
                }
                style={{ width: "100%" }}
              />
            </div>

            <label style={{ display: "flex" }}>Cijena (€)</label>
            <InputText
              type="number"
              min={0}
              value={manualItem.price === 0 ? "" : manualItem.price.toString()}
              onChange={(e) => {
                const input = e.target.value;
                setManualItem({
                  ...manualItem,
                  price: input === "" ? "" : parseFloat(input),
                });
              }}
              style={{ width: "100%" }}
            />

            <Button
              label="Dodaj ručno"
              icon="pi pi-plus"
              onClick={async () => {
                const total_price = manualItem.quantity * manualItem.price;

                try {
                  const res = await fetch(
                    `${
                      import.meta.env.VITE_API_URL
                    }/api/inventory/checkOrAddItem`,
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        userId: user.id,
                        organizationId: user.organization_id,
                        item_name: manualItem.name,
                        category: manualItem.category,
                        category_id: manualItem.category,
                        price: manualItem.price,
                      }),
                    }
                  );

                  const data = await res.json();

                  if (data.item) {
                    const newItem = {
                      id: orderItems.length + 1,
                      item_name: data.item.item_name,
                      item_description: data.item.category,
                      category: data.item.category,
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
                  } else {
                    toast.current?.show({
                      severity: "error",
                      summary: "Greška",
                      detail: data.error || "Artikal nije spremljen.",
                    });
                  }
                } catch (err) {
                  console.error("Greška kod unosa artikla:", err);
                  toast.current?.show({
                    severity: "error",
                    summary: "Greška",
                    detail: "Nije moguće spremiti artikl.",
                  });
                }
              }}
            />
          </div>
        )}
      </Dialog>
      <Dialog
        header="Dodaj dobavljača"
        visible={showSupplierDialog}
        style={{ width: "40vw" }}
        onHide={() => setShowSupplierDialog(false)}
      >
        <SupplierAdd
          onSuccess={() => {
            setShowSupplierDialog(false);
            fetchSuppliers();
          }}
        />
      </Dialog>
      <Toast ref={toast} />
    </div>
  );
};

export default OrdersAdd;
