import React, { useState, useEffect, useRef, useContext } from "react";
import { Panel } from "primereact/panel";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
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
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryOptions, setCategoryOptions] = useState([
    { label: "Sve kategorije", value: null },
  ]);

  const { user } = useContext(AuthContext);
  const toast = useRef(null);

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
          }))
        );
      }
    };

    const fetchCategories = async () => {
      const res = await fetch(`${API_URL}/api/inventory/getCategories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          organizationId: user.organization_id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCategoryOptions((prev) => [...prev, ...data.categories]);
      }
    };

    fetchInventory();
    fetchCategories();
  }, [user.id, user.organization_id]);

  const handleAddItem = (item) => {
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
          value={[...salesItems, { id: "new", item_name: "➕ Dodaj stavku" }]}
          onRowClick={(e) => e.data.id === "new" && setShowAddItemDialog(true)}
          style={{ fontSize: "0.9rem", marginTop: "1rem" }}
        >
          <Column field="item_name" header="Naziv stavke" />
          <Column
            header="Količina"
            body={(rowData) =>
              rowData.id !== "new" && (
                <InputText
                  type="number"
                  min={1}
                  value={rowData.quantity}
                  style={{ width: 60 }}
                  onChange={(e) => {
                    const updated = salesItems.map((item) =>
                      item.id === rowData.id
                        ? {
                            ...item,
                            quantity: parseInt(e.target.value),
                            total_price: item.price * parseInt(e.target.value),
                          }
                        : item
                    );
                    setSalesItems(updated);
                  }}
                />
              )
            }
          />
          <Column field="price" header="Jed. cijena (€)" />
          <Column field="total_price" header="Ukupno (€)" />
          <Column
            body={(rowData) =>
              rowData.id !== "new" && (
                <Button
                  icon="pi pi-trash"
                  severity="danger"
                  rounded
                  onClick={() =>
                    setSalesItems(salesItems.filter((i) => i.id !== rowData.id))
                  }
                />
              )
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
          value={availableItems.filter((item) => {
            const matchCat = selectedCategory
              ? item.category === selectedCategory
              : true;
            const matchSearch = item.name
              .toLowerCase()
              .includes(searchTerm.toLowerCase());
            return matchCat && matchSearch;
          })}
          paginator
          rows={5}
          responsiveLayout="scroll"
        >
          <Column field="name" header="Naziv" />
          <Column field="category" header="Kategorija" />
          <Column field="stock" header="Na zalihi" />
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
              <Button
                label="Dodaj"
                icon="pi pi-plus"
                onClick={() => handleAddItem(rowData)}
                disabled={(rowData.tempQty || 1) > rowData.stock}
              />
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
