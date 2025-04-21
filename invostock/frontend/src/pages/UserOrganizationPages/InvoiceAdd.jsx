import React, { useState, useEffect, useRef } from "react";
import { Panel } from "primereact/panel";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";

const API_URL = import.meta.env.VITE_API_URL;

const InvoicesAdd = () => {
  const [selectedClient, setSelectedClient] = useState(null);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(null);
  const [dueDate, setDueDate] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [discount, setDiscount] = useState(0);

  const [clients, setClients] = useState([]);
  const [availableItems, setAvailableItems] = useState([]);
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);

  const toast = useRef(null);

  const [categoryOptions, setCategoryOptions] = useState([
    { label: "Sve kategorije", value: null },
  ]);

  const handleAddItem = (item) => {
    const quantity = item.tempQty || 1;
    const total_price = item.price * quantity;
    const newItem = {
      id: Date.now(),
      item_name: item.name,
      item_description: "",
      quantity,
      price: item.price,
      total_price,
    };
    setInvoiceItems([...invoiceItems, newItem]);

    setAvailableItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, tempQty: 1 } : i))
    );
  };

  const totalAmount = invoiceItems.reduce(
    (sum, item) => sum + item.total_price,
    0
  );

  const handleInvoiceSubmit = async () => {
    const userId = 1;
    const organizationId = 2;
    const contact_id = selectedClient?.id || null;

    if (!contact_id || !invoiceDate || !dueDate || invoiceItems.length === 0) {
      toast.current.show({
        severity: "warn",
        summary: "Upozorenje",
        detail: "Molimo popunite sve obavezne podatke.",
        life: 3000,
      });
      return;
    }

    const final_amount = totalAmount - discount;
    const items = invoiceItems.map((item) => ({
      itemName: item.item_name,
      itemDescription: item.item_description,
      quantity: item.quantity,
      price: item.price,
    }));

    const payload = {
      userId,
      organizationId,
      contactId: contact_id,
      invoiceDate: invoiceDate.toISOString(),
      dueDate: dueDate.toISOString(),
      discount,
      items,
    };

    try {
      const response = await fetch(`${API_URL}/api/invoices/createInvoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast.current.show({
          severity: "success",
          summary: "Uspjeh",
          detail: `Faktura kreirana (${data.custom_invoice_code})`,
          life: 4000,
        });

        setInvoiceItems([]);
        setSelectedClient(null);
        setInvoiceDate(null);
        setDueDate(null);
        setDiscount(0);
      } else {
        toast.current.show({
          severity: "error",
          summary: "Greška",
          detail: data.error,
          life: 3000,
        });
      }
    } catch (error) {
      console.error("Greška:", error);
      toast.current.show({
        severity: "error",
        summary: "Greška",
        detail: "Neuspješna komunikacija sa serverom.",
        life: 3000,
      });
    }
  };

  useEffect(() => {
    const fetchContacts = async () => {
      const res = await fetch(`${API_URL}/api/contacts/getUserContacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: 1 }),
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
  }, []);

  useEffect(() => {
    const fetchInventory = async () => {
      const res = await fetch(`${API_URL}/api/inventory/getInventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: 1, organizationId: 2 }),
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
    fetchInventory();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      const res = await fetch(`${API_URL}/api/inventory/getCategories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: 1, organizationId: 2 }),
      });
      const data = await res.json();
      if (data.success) {
        setCategoryOptions(data.categories);
      }
    };

    fetchCategories();
  }, []);

  return (
    <div style={{ padding: "2% 5%", marginTop: "3%" }}>
      <Toast ref={toast} />
      <Panel header="Nova faktura" style={{ fontSize: "0.88rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
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
            onClick={() => console.log("Dodaj kontakt")}
            severity="info"
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "6px",
              padding: 0,
              marginBottom: "5%",
            }}
          />

          {selectedClient && (
            <Button
              icon="pi pi-times"
              title="Odustani"
              severity="danger"
              onClick={() => setSelectedClient(null)}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "6px",
                padding: 0,
                marginBottom: "5%",
              }}
            />
          )}
        </div>

        {selectedClient && (
          <div
            style={{
              fontSize: "0.85rem",
              marginBottom: "1rem",
              padding: "1rem",
              border: "1px solid #ccc",
              borderRadius: "8px",
            }}
          >
            <div>
              <strong>Adresa:</strong> {selectedClient.address || "—"}
            </div>
            <div>
              <strong>Poštanski broj:</strong> {selectedClient.zip_code || "—"}
            </div>
            <div>
              <strong>Mjesto:</strong> {selectedClient.place || "—"}
            </div>
            <div>
              <strong>Telefon:</strong> {selectedClient.phone_number || "—"}
            </div>
            <div>
              <strong>Email:</strong> {selectedClient.email || "—"}
            </div>
            <div>
              <strong>Tvrtka:</strong> {selectedClient.company_name || "—"}
            </div>
            <div>
              <strong>OIB:</strong> {selectedClient.tax_id || "—"}
            </div>
            <div>
              <strong>Napomene:</strong> {selectedClient.notes || "—"}
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
          <Calendar
            value={invoiceDate}
            onChange={(e) => setInvoiceDate(e.value)}
            placeholder="Datum računa"
            dateFormat="dd.mm.yy"
            style={{ width: "100%" }}
          />
          <Calendar
            value={dueDate}
            onChange={(e) => setDueDate(e.value)}
            placeholder="Datum dospijeća"
            dateFormat="dd.mm.yy"
            style={{ width: "100%" }}
          />
        </div>

        <DataTable
          value={[...invoiceItems, { id: "new", item_name: "➕ Dodaj stavku" }]}
          onRowClick={(e) => e.data.id === "new" && setShowAddItemDialog(true)}
          responsiveLayout="scroll"
          style={{ fontSize: "0.9rem" }}
        >
          <Column field="item_name" header="Naziv stavke" />
          <Column field="item_description" header="Opis" />
          <Column
            header="Količina"
            body={(rowData) =>
              rowData.id !== "new" && (
                <InputText
                  type="number"
                  min={1}
                  value={rowData.quantity}
                  style={{ width: "60px" }}
                  onChange={(e) => {
                    const updated = invoiceItems.map((item) =>
                      item.id === rowData.id
                        ? {
                            ...item,
                            quantity: parseInt(e.target.value),
                            total_price: parseInt(e.target.value) * item.price,
                          }
                        : item
                    );
                    setInvoiceItems(updated);
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
                    setInvoiceItems(
                      invoiceItems.filter((item) => item.id !== rowData.id)
                    )
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
            style={{ width: "100px", textAlign: "right" }}
          />
          <h3>Ukupno: {totalAmount.toFixed(2)} €</h3>
          <h3>Za naplatu: {(totalAmount - discount).toFixed(2)} €</h3>
        </div>

        <div style={{ textAlign: "right", marginTop: "1rem" }}>
          <Button
            label="Fakturiraj"
            icon="pi pi-check"
            onClick={handleInvoiceSubmit}
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
            placeholder="Odaberi kategoriju"
            style={{ width: "200px" }}
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
            const matchesCategory = selectedCategory
              ? item.category === selectedCategory
              : true;
            const matchesSearch = item.name
              .toLowerCase()
              .includes(searchTerm.toLowerCase());
            return matchesCategory && matchesSearch;
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
                style={{ width: "60px" }}
                value={rowData.tempQty || 1}
                onChange={(e) => {
                  const updated = availableItems.map((item) =>
                    item.id === rowData.id
                      ? { ...item, tempQty: parseInt(e.target.value) }
                      : item
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
    </div>
  );
};

export default InvoicesAdd;
