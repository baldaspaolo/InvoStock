import React, { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";

import { Panel } from "primereact/panel";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { AuthContext } from "../../context/AuthContext";
import ContactsAdd from "../../components/ContactsAdd";

const API_URL = import.meta.env.VITE_API_URL;

const SalesAdd = () => {
  const [selectedClient, setSelectedClient] = useState(null);
  const [clients, setClients] = useState([]);
  const [availableItems, setAvailableItems] = useState([]);
  const [salesItems, setSalesItems] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("");
  const [showAddContactDialog, setShowAddContactDialog] = useState(false);
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [categoryOptions, setCategoryOptions] = useState([
    { label: "Sve kategorije", value: "ALL" },
  ]);

  const { user } = useContext(AuthContext);
  const toast = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchContacts = async () => {
      const res = await fetch(`${API_URL}/api/contacts/getUserContacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (data.success) {
        setClients(
          data.contacts.map((c) => ({
            ...c,
            name: `${c.first_name} ${c.last_name}`,
          }))
        );
      }
    };

    fetchContacts();
  }, [user.id]);

  useEffect(() => {
    const fetchInventory = async () => {
      const res = await fetch(`${API_URL}/api/inventory/getInventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          organizationId: user.organization_id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAvailableItems(
          data.inventory.map((item) => ({
            ...item,
            name: item.item_name,
            stock: item.stock_quantity,
            price: item.price,
            category_id: item.category_id?.toString() || "ALL",
          }))
        );
      }
    };

    const fetchCategories = async () => {
      const res = await fetch(
        `${API_URL}/api/inventory/getCategories?userId=${
          user.id
        }&organizationId=${user.organization_id || ""}`
      );

      const data = await res.json();
      if (data.success) {
        setCategoryOptions([
          { label: "Sve kategorije", value: "ALL" },
          ...data.categories.map((cat) => ({
            label: cat.name,
            value: cat.id.toString(),
          })),
        ]);
      }
    };

    fetchInventory();
    fetchCategories();
  }, [user.id, user.organization_id]);

  const filteredItems = availableItems.filter((item) => {
    const categoryMatch =
      selectedCategory === "ALL" ||
      item.category_id?.toString() === selectedCategory.toString();

    const searchMatch =
      !searchTerm || item.name.toLowerCase().includes(searchTerm.toLowerCase());

    return categoryMatch && searchMatch;
  });

  const handleAddItem = (item) => {
    const alreadyAdded = salesItems.some((i) => i.itemId === item.id);
    if (alreadyAdded) {
      toast.current.show({
        severity: "warn",
        summary: "Upozorenje",
        detail: "Ovaj artikl je već dodan!",
        life: 3000,
      });
      return;
    }

    if (item.stock <= 0) {
      toast.current.show({
        severity: "warn",
        summary: "Nema zaliha",
        detail: "Artikl nema dostupnih zaliha!",
        life: 4000,
      });
    } else if (item.stock <= 3) {
      toast.current.show({
        severity: "info",
        summary: "Niska zaliha",
        detail: `Preostalo na zalihi: ${item.stock}`,
        life: 3000,
      });
    }

    const quantity = item.tempQty || 1;
    const newItem = {
      id: Date.now(),
      itemId: item.id,
      item_name: item.name,
      quantity,
      price: item.price,
      total_price: item.price * quantity,
    };
    setSalesItems([...salesItems, newItem]);
  };

  const totalAmount = salesItems.reduce(
    (sum, item) => sum + item.total_price,
    0
  );

  const handleSubmit = async () => {
    if (!selectedClient || salesItems.length === 0) {
      toast.current.show({
        severity: "warn",
        summary: "Upozorenje",
        detail: "Molimo odaberite klijenta i unesite stavke.",
        life: 3000,
      });
      return;
    }

    const payload = {
      userId: user.id,
      organizationId: user.organization_id,
      contactId: selectedClient.id,
      notes,
      discount,
      items: salesItems.map((item) => ({
        itemId: item.itemId,
        quantity: item.quantity,
        price: item.price,
      })),
    };

    try {
      const res = await fetch(`${API_URL}/api/sales/createOrder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.orderId) {
        toast.current.show({
          severity: "success",
          summary: "Uspjeh",
          detail: `Nalog kreiran (#${data.orderId})`,
          life: 4000,
        });

        setSelectedClient(null);
        setSalesItems([]);
        setDiscount(0);
        setNotes("");
      } else {
        throw new Error(data.error || "Neuspjeh");
      }
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Greška",
        detail: "Greška pri kreiranju naloga",
        life: 3000,
      });
    }
  };

  return (
    <div style={{ padding: "2% 5%", marginTop: "3%" }}>
      <Toast ref={toast} />
      <div style={{ display: "flex", marginBottom: "1rem" }}>
        <Button
          icon="pi pi-arrow-left"
          text
          raised
          severity="secondary"
          aria-label="Natrag"
          onClick={() => navigate("/sales")}
          style={{ width: "8%" }}
        />
      </div>
      <Panel header="Novi prodajni nalog" style={{ fontSize: "0.88rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Dropdown
            value={selectedClient}
            options={clients}
            onChange={(e) => setSelectedClient(e.value)}
            optionLabel="name"
            placeholder="Odaberi klijenta"
            style={{ flex: 1 }}
          />
          <Button
            icon="pi pi-plus"
            title="Dodaj novi kontakt"
            onClick={() => setShowAddContactDialog(true)}
            severity="info"
            style={{ width: 40, height: 40 }}
          />
          {selectedClient && (
            <Button
              icon="pi pi-times"
              title="Odustani"
              severity="danger"
              onClick={() => setSelectedClient(null)}
              style={{ width: 40, height: 40 }}
            />
          )}
        </div>

        <InputText
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Napomene"
          style={{ width: "100%", marginTop: "1rem" }}
        />

        <DataTable
          value={[...salesItems, { id: "new", item_name: "Dodaj stavku" }]}
          onRowClick={(e) => e.data.id === "new" && setShowAddItemDialog(true)}
          style={{ fontSize: "0.9rem", marginTop: "1rem" }}
        >
          <Column field="item_name" header="Naziv stavke" />
          <Column
            header="Količina"
            body={(rowData) =>
              rowData.id !== "new" ? (
                <InputText
                  type="number"
                  min={1}
                  max={
                    availableItems.find((i) => i.id === rowData.itemId)
                      ?.stock || 1
                  }
                  value={rowData.quantity}
                  style={{ width: "60px" }}
                  onChange={(e) => {
                    const newQuantity = parseInt(e.target.value);

                    if (isNaN(newQuantity)) {
                      return;
                    }

                    if (newQuantity < 1) {
                      toast.current.show({
                        severity: "warn",
                        summary: "Upozorenje",
                        detail: "Količina ne može biti manja od 1.",
                        life: 3000,
                      });
                      return;
                    }

                    const stockForItem =
                      availableItems.find((i) => i.id === rowData.itemId)
                        ?.stock || 0;
                    if (newQuantity > stockForItem) {
                      toast.current.show({
                        severity: "warn",
                        summary: "Upozorenje",
                        detail: `Na zalihi je dostupno samo ${stockForItem} komada.`,
                        life: 3000,
                      });
                      return;
                    }

                    const updated = salesItems.map((item) =>
                      item.id === rowData.id
                        ? {
                            ...item,
                            quantity: newQuantity,
                            total_price: newQuantity * item.price,
                          }
                        : item
                    );
                    setSalesItems(updated);
                  }}
                />
              ) : null
            }
          />
          <Column field="price" header="Jed. cijena (€)" />
          <Column field="total_price" header="Ukupno (€)" />
          <Column
            header="Akcija"
            body={(rowData) =>
              rowData.id !== "new" ? (
                <Button
                  icon="pi pi-trash"
                  severity="danger"
                  rounded
                  onClick={() =>
                    setSalesItems(salesItems.filter((i) => i.id !== rowData.id))
                  }
                  style={{ width: "45px", height: "45px" }}
                />
              ) : null
            }
          />
        </DataTable>

        <div style={{ textAlign: "right", marginTop: "1rem" }}>
          <span style={{ marginRight: "0.5rem" }}>Popust (€):</span>
          <InputText
            type="number"
            min={0}
            value={discount}
            onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
            style={{ width: 100, textAlign: "right" }}
          />
          <h3>Ukupno: {totalAmount.toFixed(2)} €</h3>
          <h3>Za naplatu: {(totalAmount - discount).toFixed(2)} €</h3>
        </div>

        <div style={{ textAlign: "right", marginTop: "1rem" }}>
          <Button
            label="Kreiraj nalog"
            icon="pi pi-check"
            onClick={handleSubmit}
            severity="success"
          />
        </div>
      </Panel>

      <Dialog
        header="Dodaj artikl iz inventara"
        visible={showAddItemDialog}
        style={{ width: "60vw" }}
        onHide={() => setShowAddItemDialog(false)}
      >
        <div style={{ marginBottom: "1rem", display: "flex", gap: "1rem" }}>
          <Dropdown
            value={selectedCategory}
            options={categoryOptions}
            onChange={(e) => setSelectedCategory(e.value)}
            optionLabel="label"
            placeholder="Kategorija"
            style={{ width: 200 }}
          />
          <InputText
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pretraga"
            style={{ width: "100%" }}
          />
        </div>

        <DataTable
          value={filteredItems}
          paginator
          rows={5}
          responsiveLayout="scroll"
        >
          <Column field="name" header="Naziv" />
          <Column
            field="category_name"
            header="Kategorija"
            body={(rowData) => rowData.category_name || "Bez kategorije"}
          />
          <Column field="stock" header="Na zalihi" />
          <Column field="price" header="Jed. cijena €" />
          <Column
            header="Količina"
            body={(rowData) => (
              <InputText
                type="number"
                min={1}
                max={rowData.stock}
                value={rowData.tempQty || 1}
                style={{ width: 60 }}
                onChange={(e) => {
                  const updated = availableItems.map((i) =>
                    i.id === rowData.id
                      ? { ...i, tempQty: parseInt(e.target.value) }
                      : i
                  );
                  setAvailableItems(updated);
                }}
              />
            )}
          />
          <Column
            body={(rowData) => (
              <div>
                <Button
                  label="Dodaj"
                  icon="pi pi-plus"
                  onClick={() => handleAddItem(rowData)}
                  disabled={(rowData.tempQty || 1) > rowData.stock}
                />
              </div>
            )}
          />
        </DataTable>
      </Dialog>

      <Dialog
        header="Dodaj novi kontakt"
        visible={showAddContactDialog}
        style={{ width: "50vw" }}
        onHide={() => setShowAddContactDialog(false)}
      >
        <ContactsAdd
          userId={user.id}
          organizationId={user.organization_id}
          onSuccess={() => {
            toast.current.show({
              severity: "success",
              summary: "Uspjeh",
              detail: "Kontakt uspješno dodan",
              life: 3000,
            });
            setShowAddContactDialog(false);
            fetchContacts();
          }}
          onError={(err) => {
            toast.current.show({
              severity: "error",
              summary: "Greška",
              detail: err || "Neuspješno dodavanje kontakta",
              life: 3000,
            });
          }}
        />
      </Dialog>
    </div>
  );
};

export default SalesAdd;
