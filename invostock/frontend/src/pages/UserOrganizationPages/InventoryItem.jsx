import React, { useRef, useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { Button } from "primereact/button";
import { Panel } from "primereact/panel";
import { Divider } from "primereact/divider";
import { Dialog } from "primereact/dialog";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";

import "./style.css";

const InventoryItem = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const toast = useRef(null);

  const [inventoryItem, setInventoryItem] = useState(null);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [stockDialogVisible, setStockDialogVisible] = useState(false);
  const [editedData, setEditedData] = useState({});
  const [stockChange, setStockChange] = useState(0);
  const [newReorderLevel, setNewReorderLevel] = useState(null);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const res = await fetch(
          `${
            import.meta.env.VITE_API_URL
          }/api/inventory/getInventoryItem/${id}?userId=${
            user.id
          }&organizationId=${user.organization_id || ""}`
        );
        const data = await res.json();
        if (data.success) {
          setInventoryItem(data.item);
          setEditedData({
            item_name: data.item.item_name,
            category_id: data.item.category_id,
            price: data.item.price,
            description: data.item.description,
          });

          setNewReorderLevel(data.item.reorder_level);
        }
      } catch (err) {
        console.error("Greška pri dohvaćanju artikla:", err);
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
        if (data.success) setCategories(data.categories);
      } catch (err) {
        console.error("Greška kod dohvaćanja kategorija:", err);
      }
    };

    fetchItem();
    fetchCategories();
  }, [id]);

  if (!inventoryItem) return <p>Učitavanje...</p>;

  const handleSaveEdit = () => {
    confirmDialog({
      message: "Spremiti promjene proizvoda?",
      header: "Potvrda",
      icon: "pi pi-exclamation-triangle",
      accept: async () => {
        try {
          const res = await fetch(
            `${
              import.meta.env.VITE_API_URL
            }/api/inventory/updateInventoryItem/${inventoryItem.id}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: user.id,
                organizationId: user.organization_id,
                ...editedData,
                reorder_level: newReorderLevel,
              }),
            }
          );
          const data = await res.json();
          if (data.success) {
            toast.current?.show({
              severity: "success",
              summary: "Uspješno",
              detail: "Artikal ažuriran",
              life: 2000,
            });
            setInventoryItem((prev) => ({
              ...prev,
              ...editedData,
              reorder_level: newReorderLevel,
            }));
            setEditDialogVisible(false);
          }
        } catch (err) {
          console.error("Greška pri spremanju:", err);
        }
      },
    });
  };

  const handleDeleteItem = () => {
    confirmDialog({
      message: "Sigurno želite obrisati ovaj artikl?",
      header: "Potvrda brisanja",
      icon: "pi pi-exclamation-triangle",
      accept: async () => {
        try {
          const res = await fetch(
            `${
              import.meta.env.VITE_API_URL
            }/api/inventory/deleteInventoryItem/${inventoryItem.id}?userId=${
              user.id
            }&organizationId=${user.organization_id || ""}`,
            {
              method: "DELETE",
            }
          );
          const data = await res.json();
          if (data.success) {
            toast.current?.show({
              severity: "info",
              summary: "Obrisano",
              detail: "Artikal je uspješno izbrisan",
              life: 2000,
            });
            setTimeout(() => {
              navigate("/inventory");
            }, 2000);
          }
        } catch (err) {
          console.error("Greška pri brisanju:", err);
        }
      },
    });
  };

  const handleUpdateStock = () => {
    confirmDialog({
      message: `Potvrditi promjenu zalihe za ${
        stockChange >= 0 ? "+" : ""
      }${stockChange}?`,
      header: "Uskladi zalihu",
      icon: "pi pi-exclamation-triangle",
      accept: async () => {
        try {
          const res = await fetch(
            `${import.meta.env.VITE_API_URL}/api/inventory/updateStock`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: inventoryItem.id,
                quantityChange: stockChange,
                reorder_level: newReorderLevel,
                userId: user.id,
                organizationId: user.organization_id || null,
              }),
            }
          );

          const data = await res.json();
          if (data.success) {
            setInventoryItem((currentItem) => ({
              ...currentItem,
              stock_quantity: currentItem.stock_quantity + stockChange,
              reorder_level: newReorderLevel,
            }));
            toast.current?.show({
              severity: "success",
              summary: "Zaliha ažurirana",
              detail: `Nova količina: ${
                inventoryItem.stock_quantity + stockChange
              }`,
              life: 2000,
            });
            setStockChange(0);
            setStockDialogVisible(false);
          }
        } catch (err) {
          console.error("Greška pri ažuriranju zalihe:", err);
        }
      },
    });
  };

  return (
    <div className="parent">
      <Toast ref={toast} position="top-right" />

      <div className="div1">
        <Button
          icon="pi pi-arrow-left"
          text
          raised
          severity="secondary"
          onClick={() => navigate("/inventory")}
          style={{ width: "30%" }}
        />
      </div>

      <div className="div4">
        <div style={{ marginLeft: "3%", marginRight: "3%" }}>
          <Panel
            header="Detalji proizvoda"
            style={{ fontSize: "0.95rem", padding: "1.5rem" }}
          >
            <h2 style={{ marginBottom: "1rem", fontWeight: 600 }}>
              {inventoryItem.item_name}
            </h2>
            <Divider />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
                marginBottom: "2rem",
              }}
            >
              <div>
                <p>
                  <strong>Kategorija:</strong> {inventoryItem.category_name}
                </p>

                <p>
                  <strong>Cijena:</strong> {inventoryItem.price} €
                </p>
                <p>
                  <strong>Šifra artikla:</strong>{" "}
                  {inventoryItem.custom_inventory_code}
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: "1rem",
                    height: "28%",
                    marginLeft: "15%",
                  }}
                >
                  <Button
                    label="Uredi stavku"
                    icon="pi pi-pencil"
                    raised
                    severity="info"
                    style={{ width: "60%", fontSize: "0.9rem" }}
                    onClick={() => setEditDialogVisible(true)}
                  />
                  <Button
                    label="Obriši stavku"
                    icon="pi pi-trash"
                    raised
                    severity="danger"
                    style={{ width: "20%", fontSize: "0.85rem" }}
                    onClick={handleDeleteItem}
                  />
                </div>
              </div>
              <div>
                <p>
                  <strong>Količina na zalihi:</strong>{" "}
                  {inventoryItem.stock_quantity}
                </p>
                <p>
                  <strong>Minimalna zaliha:</strong>{" "}
                  {inventoryItem.reorder_level}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  {inventoryItem.stock_quantity === 0
                    ? "Nema zalihe"
                    : inventoryItem.stock_quantity <=
                      inventoryItem.reorder_level
                    ? "Niska zaliha"
                    : "Dovoljna zaliha"}
                </p>
                <Button
                  label="Uskladi zalihu"
                  icon="pi pi-plus"
                  raised
                  severity="info"
                  style={{ width: "60%", fontSize: "0.9rem" }}
                  onClick={() => setStockDialogVisible(true)}
                />
              </div>
            </div>

            <Divider />
            <h3>Opis proizvoda</h3>
            <p style={{ whiteSpace: "pre-wrap" }}>
              {inventoryItem.description || "Nema opisa."}
            </p>
          </Panel>
        </div>
      </div>

      {/* Dialog za Uređivanje proizvoda */}
      <Dialog
        header="Uredi proizvod"
        visible={editDialogVisible}
        onHide={() => setEditDialogVisible(false)}
        style={{ width: "35vw" }}
        footer={
          <>
            <Button
              label="Odustani"
              icon="pi pi-times"
              onClick={() => setEditDialogVisible(false)}
              style={{ marginBottom: "1rem" }}
            />
            <Button
              label="Spremi"
              icon="pi pi-check"
              onClick={handleSaveEdit}
            />
          </>
        }
      >
        <div className="p-fluid">
          <label>Naziv</label>
          <InputText
            value={editedData.item_name}
            onChange={(e) =>
              setEditedData((d) => ({ ...d, item_name: e.target.value }))
            }
          />

          <label style={{ marginTop: "1rem" }}>Kategorija</label>
          <Dropdown
            value={editedData.category_id}
            options={categories.map((cat) => ({
              label: cat.name,
              value: cat.id,
            }))}
            placeholder="Odaberi kategoriju"
            onChange={(e) =>
              setEditedData((d) => ({ ...d, category_id: e.value }))
            }
          />

          <label style={{ marginTop: "1rem" }}>Cijena (€)</label>
          <InputNumber
            value={editedData.price}
            onValueChange={(e) =>
              setEditedData((d) => ({ ...d, price: e.value }))
            }
            mode="decimal"
            min={0}
          />

          <label style={{ marginTop: "1rem" }}>Opis</label>
          <InputText
            value={editedData.description}
            onChange={(e) =>
              setEditedData((d) => ({ ...d, description: e.target.value }))
            }
          />
        </div>
      </Dialog>

           <Dialog
        header="Uskladi zalihu"
        visible={stockDialogVisible}
        onHide={() => setStockDialogVisible(false)}
        style={{ width: "30vw" }}
        footer={
          <div>
            <Button
              label="Odustani"
              icon="pi pi-times"
              onClick={() => setStockDialogVisible(false)}
              style={{ marginBottom: "1rem" }}
            />
            <Button
              label="Potvrdi"
              icon="pi pi-check"
              onClick={handleUpdateStock}
            />
          </div>
        }
      >
        <div className="p-fluid">
          <p>
            Trenutna količina: <strong>{inventoryItem.stock_quantity}</strong>
          </p>

          <label>Promjena (+/-)</label>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              marginBottom: "1rem",
            }}
          >
            <Button
              icon="pi pi-minus"
              onClick={() => setStockChange((prev) => (prev || 0) - 1)}
              severity="secondary"
              text
            />
            <span style={{ minWidth: "2rem", textAlign: "center" }}>
              {stockChange || 0}
            </span>
            <Button
              icon="pi pi-plus"
              onClick={() => setStockChange((prev) => (prev || 0) + 1)}
              severity="secondary"
              text
            />
          </div>

          <label style={{ marginTop: "1rem" }}>Minimalna zaliha</label>
          <InputNumber
            value={newReorderLevel}
            onValueChange={(e) => setNewReorderLevel(e.value)}
            min={0}
          />
        </div>
      </Dialog>

      <ConfirmDialog />
    </div>
  );
};

export default InventoryItem;
