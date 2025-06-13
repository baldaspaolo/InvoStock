import React, { useState, useRef, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { Panel } from "primereact/panel";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { AuthContext } from "../../context/AuthContext";
import { Dropdown } from "primereact/dropdown";
import { Dialog } from "primereact/dialog";

import "./style.css";

const API_URL = import.meta.env.VITE_API_URL;

const InventoryAdd = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const toast = useRef(null);
  const [categories, setCategories] = useState([]);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [item, setItem] = useState({
    item_name: "",
    category_id: "", 
    description: "",
    stock_quantity: 0,
    reorder_level: 1,
    price: 0,
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/inventory/getCategories?userId=${
            user.id
          }&organizationId=${user.organization_id || ""}`
        );
        const data = await res.json();
        if (data.success) {
          setCategories(
            data.categories.map((c) => ({
              label: c.name,
              value: c.id, 
            }))
          );

        }
      } catch (err) {
        console.error("Greška kod dohvata kategorija:", err);
      }
    };
    fetchCategories();
  }, [user.id, user.organization_id]);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.current.show({
        severity: "warn",
        summary: "Upozorenje",
        detail: "Naziv kategorije je obavezan.",
        life: 3000,
      });
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/inventory/addInventoryCategory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          organizationId: user.organization_id,
          name: newCategoryName,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setCategories((prev) => [
          ...prev,
          { label: newCategoryName, value: data.category_id }, 
        ]);
        setItem((prevItem) => ({ ...prevItem, category_id: data.category_id }));
        setShowCategoryDialog(false);
        setNewCategoryName("");

        toast.current.show({
          severity: "success",
          summary: "Kategorija dodana",
          detail: `Dodana kategorija: ${newCategoryName}`,
          life: 3000,
        });
      } else {
        throw new Error(data.error || "Neuspješno dodavanje kategorije.");
      }
    } catch (err) {
      console.error("Greška kod dodavanja kategorije:", err);
      toast.current.show({
        severity: "error",
        summary: "Greška",
        detail: err.message,
        life: 3000,
      });
    }
  };

  const handleInputChange = (e, field) => {
    setItem({ ...item, [field]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!item.item_name || !item.category_id) {
      toast.current.show({
        severity: "warn",
        summary: "Upozorenje",
        detail: "Naziv i kategorija su obavezni.",
        life: 3000,
      });
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/inventory/addInventoryItem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          organizationId: user.organization_id,
          itemData: item,
        }),
      });

      const data = await res.json();

      if (data.message) {
        toast.current.show({
          severity: "success",
          summary: "Uspjeh",
          detail: data.message,
          life: 3000,
        });
        setItem({
          item_name: "",
          category: "",
          description: "",
          stock_quantity: 0,
          reorder_level: 1,
          price: 0,
        });
      } else {
        throw new Error(data.error || "Greška kod dodavanja");
      }
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Greška",
        detail: error.message,
        life: 3000,
      });
    }
  };

  return (
    <div style={{ padding: "2% 5%", marginTop: "2%" }}>
      <div style={{ display: "flex" }}>
        <Button
          icon="pi pi-arrow-left"
          text
          raised
          severity="secondary"
          aria-label="Natrag"
          onClick={() => navigate("/inventory")}
          style={{ width: "8%", marginBottom: "1%" }}
        />
      </div>
      <Toast ref={toast} />
      <Panel header="Dodaj novi artikl" style={{ fontSize: "0.88rem" }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ width: "50%" }}>
            <div className="field">
              <label>Naziv artikla *</label>
              <InputText
                value={item.item_name}
                onChange={(e) => handleInputChange(e, "item_name")}
              />
            </div>

            <div className="field">
              <label>Kategorija *</label>
              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  alignItems: "center",
                }}
              >
                <Dropdown
                  value={item.category_id}
                  options={categories}
                  onChange={(e) => setItem({ ...item, category_id: e.value })}
                  placeholder="Odaberi kategoriju"
                  style={{ flex: 1 }}
                  showClear
                />

                <Button
                  icon="pi pi-plus"
                  rounded
                  severity="success"
                  onClick={() => setShowCategoryDialog(true)}
                  size="small"
                />
              </div>
            </div>

            <div className="field">
              <label>Opis</label>
              <InputText
                value={item.description}
                onChange={(e) => handleInputChange(e, "description")}
              />
            </div>

            <div className="field">
              <label>Zaliha (kom)</label>
              <InputText
                type="number"
                min={0}
                value={item.stock_quantity}
                onChange={(e) => handleInputChange(e, "stock_quantity")}
              />
            </div>

            <div className="field">
              <label>Razina za narudžbu</label>
              <InputText
                type="number"
                min={1}
                value={item.reorder_level}
                onChange={(e) => handleInputChange(e, "reorder_level")}
              />
            </div>

            <div className="field">
              <label>Cijena (€)</label>
              <InputText
                type="number"
                min={0}
                value={item.price}
                onChange={(e) => handleInputChange(e, "price")}
              />
            </div>

            <div style={{ textAlign: "right", marginTop: "1.5rem" }}>
              <Button
                label="Dodaj artikl"
                icon="pi pi-check"
                onClick={handleSubmit}
                severity="success"
              />
            </div>
          </div>
        </div>
      </Panel>

      <Dialog
        header="Nova kategorija"
        visible={showCategoryDialog}
        style={{ width: "25rem" }}
        onHide={() => setShowCategoryDialog(false)}
      >
        <div className="p-fluid">
          <div className="field">
            <label>Naziv kategorije</label>
            <InputText
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="npr. Alati, Dijelovi..."
            />
          </div>
          <Button
            label="Dodaj"
            icon="pi pi-check"
            onClick={handleAddCategory}
            style={{ marginTop: "1rem" }}
          />
        </div>
      </Dialog>
    </div>
  );
};

export default InventoryAdd;
