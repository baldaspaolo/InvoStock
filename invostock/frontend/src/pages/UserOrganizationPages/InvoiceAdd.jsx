import React, { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Panel } from "primereact/panel";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { AuthContext } from "../../context/AuthContext";
import ContactsAdd from "../../components/ContactsAdd";

const API_URL = import.meta.env.VITE_API_URL;

const InvoicesAdd = () => {
  const [selectedClient, setSelectedClient] = useState(null);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const today = new Date();
  const defaultDueDate = new Date();
  defaultDueDate.setDate(today.getDate() + 14);

  const [invoiceDate, setInvoiceDate] = useState(today);
  const [dueDate, setDueDate] = useState(defaultDueDate);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [discount, setDiscount] = useState(0);
  const [showAddContactDialog, setShowAddContactDialog] = useState(false);
  const [clients, setClients] = useState([]);
  const [availableItems, setAvailableItems] = useState([]);
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState([
    { label: "Sve kategorije", value: "ALL" }, // Koristimo "ALL" umjesto null
  ]);

  const { user } = useContext(AuthContext);
  const toast = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const res = await fetch(`${API_URL}/api/contacts/getUserContacts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            organizationId: user.organization_id || null,
          }),
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
      } catch (error) {
        console.error("Error fetching contacts:", error);
      }
    };
    fetchContacts();
  }, [user.id]);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
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
      } catch (error) {
        console.error("Error fetching inventory:", error);
      }
    };

    const fetchCategories = async () => {
      try {
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
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchInventory();
    fetchCategories();
  }, [user.id, user.organization_id]);

  const handleAddItem = (item) => {
    const alreadyAdded = invoiceItems.some((i) => i.item_name === item.name);

    if (alreadyAdded) {
      toast.current.show({
        severity: "warn",
        summary: "Upozorenje",
        detail: "Artikl je već dodan u fakturu.",
        life: 3000,
      });
      return;
    }

    const quantity = item.tempQty || 1;
    const total_price = item.price * quantity;
    const newItem = {
      id: Date.now(),
      itemId: item.id,
      item_name: item.name,
      item_description: "",
      quantity,
      price: item.price,
      total_price,
      max_quantity: item.stock,
    };

    setInvoiceItems([...invoiceItems, newItem]);

    setAvailableItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, tempQty: 1 } : i))
    );
  };

  const filteredItems = availableItems.filter((item) => {
    if (selectedCategory === "ALL" || !selectedCategory) {
      return true;
    }

    return item.category_id == selectedCategory;
  });

  useEffect(() => {}, [availableItems, selectedCategory, categoryOptions]);

  const totalAmount = invoiceItems.reduce(
    (sum, item) => sum + item.total_price,
    0
  );

  const handleInvoiceSubmit = async () => {
    if (
      !selectedClient ||
      !invoiceDate ||
      !dueDate ||
      invoiceItems.length === 0
    ) {
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
      userId: user.id,
      organizationId: user.organization_id,
      contactId: selectedClient.id,
      invoiceDate: invoiceDate.toISOString(),
      dueDate: dueDate.toISOString(),
      discount,
      final_amount,
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

        const stockUpdatePayload = {
          userId: user.id,
          organizationId: user.organization_id,
          items: invoiceItems.map((item) => ({
            itemId: item.itemId,
            quantity: item.quantity,
          })),
        };

        const stockRes = await fetch(
          `${API_URL}/api/inventory/updateStockAfterInvoice`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(stockUpdatePayload),
          }
        );

        const stockData = await stockRes.json();

        if (stockData.success) {
          toast.current.show({
            severity: "success",
            summary: "Zalihe ažurirane",
            detail: "Stanje zaliha je uspješno ažurirano.",
            life: 3000,
          });
        } else {
          toast.current.show({
            severity: "warn",
            summary: "Upozorenje",
            detail: "Faktura kreirana, ali zalihe nisu ažurirane.",
            life: 3000,
          });
        }

        setInvoiceItems([]);
        setSelectedClient(null);
        setInvoiceDate(today);
        setDueDate(defaultDueDate);
        setDiscount(0);
      } else {
        toast.current.show({
          severity: "error",
          summary: "Greška",
          detail: data.error || "Došlo je do greške pri kreiranju fakture",
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

  const refreshContacts = async () => {
    try {
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
    } catch (error) {
      console.error("Error refreshing contacts:", error);
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
          onClick={() => navigate("/invoices")}
          style={{ width: "8%", marginBottom: "0.5%" }}
        />
      </div>
      <Toast ref={toast} />
      <Panel header="Nova faktura" style={{ fontSize: "0.88rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "1rem",
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
            onClick={() => setShowAddContactDialog(true)}
            severity="info"
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "6px",
              padding: 0,
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
              }}
            />
          )}
        </div>

        {selectedClient && (
          <div
            style={{
              fontSize: "0.85rem",

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

        <div style={{ display: "flex", gap: "1rem" }}>
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "0.3rem",
            }}
          >
            <label
              style={{
                fontSize: "0.85rem",
                color: "#495057",
                marginBottom: "-5%",
              }}
            >
              Datum računa
            </label>
            <Calendar
              value={invoiceDate}
              onChange={(e) => {
                setInvoiceDate(e.value);
                if (dueDate < e.value) {
                  const newDueDate = new Date(e.value);
                  newDueDate.setDate(newDueDate.getDate() + 14);
                  setDueDate(newDueDate);
                }
              }}
              dateFormat="dd.mm.yy"
              style={{ width: "100%" }}
            />
          </div>

          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "0.3rem",
            }}
          >
            <label
              style={{
                fontSize: "0.85rem",
                marginBottom: "-5%",
                color: "#495057",
              }}
            >
              Datum dospijeća
            </label>
            <Calendar
              value={dueDate}
              onChange={(e) => setDueDate(e.value)}
              dateFormat="dd.mm.yy"
              style={{ width: "100%" }}
              minDate={invoiceDate}
            />
          </div>
        </div>

        <DataTable
          value={[...invoiceItems, { id: "new", item_name: "Dodaj stavku" }]}
          onRowClick={(e) => e.data.id === "new" && setShowAddItemDialog(true)}
          responsiveLayout="scroll"
          style={{ fontSize: "0.9rem" }}
        >
          <Column field="item_name" header="Naziv stavke" />
          <Column field="item_description" header="Opis" />
          <Column
            header="Količina"
            body={(rowData) =>
              rowData.id === "new" ? (
                ""
              ) : (
                <InputText
                  type="number"
                  min={1}
                  max={rowData.max_quantity}
                  value={rowData.quantity}
                  style={{ width: "60px" }}
                  onChange={(e) => {
                    const newQuantity = parseInt(e.target.value);

                    if (isNaN(newQuantity) || newQuantity < 1) {
                      toast.current.show({
                        severity: "warn",
                        summary: "Upozorenje",
                        detail: "Količina ne može biti manja od 1.",
                        life: 3000,
                      });
                      return;
                    }

                    if (newQuantity > rowData.max_quantity) {
                      toast.current.show({
                        severity: "warn",
                        summary: "Upozorenje",
                        detail: `Na zalihi je dostupno samo ${rowData.max_quantity} komada.`,
                        life: 3000,
                      });
                      return;
                    }

                    const updated = invoiceItems.map((item) =>
                      item.id === rowData.id
                        ? {
                            ...item,
                            quantity: newQuantity,
                            total_price: newQuantity * item.price,
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
                  style={{ width: "40px", height: "40px" }}
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
            optionLabel="label"
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
          value={filteredItems}
          paginator
          rows={5}
          responsiveLayout="scroll"
        >
          <Column field="name" header="Naziv" />
          <Column field="category_name" header="Kategorija" />
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
            refreshContacts();
          }}
          onError={(error) => {
            toast.current.show({
              severity: "error",
              summary: "Greška",
              detail: error || "Došlo je do greške pri dodavanju kontakta",
              life: 3000,
            });
          }}
        />
      </Dialog>
    </div>
  );
};

export default InvoicesAdd;
