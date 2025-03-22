import React, { useState } from "react";
import { Panel } from "primereact/panel";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";

const InvoicesAdd = () => {
  const [selectedClient, setSelectedClient] = useState(null);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(null);
  const [dueDate, setDueDate] = useState(null);

  const [invoiceItems, setInvoiceItems] = useState([
    {
      id: 1,
      item_name: "Stavka 1",
      item_description: "Opis stavke 1",
      quantity: 2,
      price: 50,
      total_price: 100,
    },
    {
      id: 2,
      item_name: "Stavka 2",
      item_description: "Opis stavke 2",
      quantity: 1,
      price: 30,
      total_price: 30,
    },
  ]);

  const [newItem, setNewItem] = useState({
    item_name: "",
    item_description: "",
    quantity: 1,
    price: 0,
    total_price: 0,
  });
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);


  const [showItemSearchDialog, setShowItemSearchDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);


  const clients = [
    { name: "Klijent 1", id: 1 },
    { name: "Klijent 2", id: 2 },
    { name: "Klijent 3", id: 3 },
  ];


  const availableItems = [
    { id: 1, name: "Proizvod 1", category: "Kategorija 1", price: 50 },
    { id: 2, name: "Proizvod 2", category: "Kategorija 2", price: 30 },
    { id: 3, name: "Proizvod 3", category: "Kategorija 1", price: 20 },
  ];


  const addNewItem = () => {
    if (newItem.item_name && newItem.price && newItem.quantity) {
      const total_price = newItem.price * newItem.quantity;
      const newItemWithId = {
        ...newItem,
        id: invoiceItems.length + 1,
        total_price,
      };
      setInvoiceItems([...invoiceItems, newItemWithId]);
      setNewItem({
        item_name: "",
        item_description: "",
        quantity: 1,
        price: 0,
        total_price: 0,
      });
      setShowAddItemDialog(false);
    }
  };


  const handleItemSelect = (item) => {
    setSelectedItem(item);
    setNewItem({
      ...newItem,
      item_name: item.name,
      price: item.price,
    });
    setShowItemSearchDialog(false);
  };

  return (
    <div
      className="parent"
      style={{ paddingTop: "1%", paddingLeft: "5%", paddingRight: "5%" }}
    >
      <div className="div4">
        <div style={{ marginLeft: "3%", marginRight: "3%", marginTop: "2%" }}>
          <Panel header="Nova faktura" style={{ fontSize: "0.88rem" }}>
      
            <div
              style={{
                display: "flex",
                gap: "1rem",
                marginBottom: "1rem",
              }}
            >
              <Dropdown
                value={selectedClient}
                options={clients}
                onChange={(e) => setSelectedClient(e.value)}
                optionLabel="name"
                placeholder="Odaberi klijenta"
              />
            </div>

   
            <div style={{ marginBottom: "1rem" }}>
              <InputText
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="Broj fakture"
                style={{ width: "100%" }}
              />
            </div>

            <div
              style={{
                display: "flex",
                gap: "1rem",
              }}
            >
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

            <div style={{ marginBottom: "1rem" }}>
              <DataTable
                value={[
                  ...invoiceItems,
                  { id: "new", item_name: "Dodaj stavku" },
                ]}
                rows={5}
                responsiveLayout="scroll"
                style={{ fontSize: "0.9rem" }}
                onRowClick={(e) => {
                  if (e.data.id === "new") {
                    setShowAddItemDialog(true);
                  }
                }}
              >
                <Column field="item_name" header="Naziv stavke"></Column>
                <Column field="item_description" header="Opis"></Column>
                <Column field="quantity" header="Količina"></Column>
                <Column field="price" header="Jedinična cijena (€)"></Column>
                <Column field="total_price" header="Ukupna cijena (€)"></Column>
              </DataTable>
            </div>

  
            <div style={{ textAlign: "right", fontSize: "0.9rem" }}>
              <h3>Vrijednost zbroja: 130€</h3>
              <h3>Porez: NE</h3>
              <h3>Popust: 0€</h3>
              <h3>Ukupno: 130€</h3>
            </div>
          </Panel>
        </div>
      </div>


      <Dialog
        header="Dodaj stavku"
        visible={showAddItemDialog}
        style={{ width: "50vw" }}
        onHide={() => setShowAddItemDialog(false)}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <Button
            label="Odaberi stavku"
            icon="pi pi-search"
            onClick={() => setShowItemSearchDialog(true)}
          />
          <InputText
            value={newItem.item_name}
            onChange={(e) =>
              setNewItem({ ...newItem, item_name: e.target.value })
            }
            placeholder="Naziv stavke"
          />
          <InputText
            value={newItem.item_description}
            onChange={(e) =>
              setNewItem({ ...newItem, item_description: e.target.value })
            }
            placeholder="Opis stavke"
          />
          <InputText
            value={newItem.quantity}
            onChange={(e) =>
              setNewItem({ ...newItem, quantity: parseInt(e.target.value) })
            }
            placeholder="Količina"
            type="number"
          />
          <InputText
            value={newItem.price}
            onChange={(e) =>
              setNewItem({ ...newItem, price: parseFloat(e.target.value) })
            }
            placeholder="Cijena"
            type="number"
          />
          <Button label="Dodaj stavku" onClick={addNewItem} />
        </div>
      </Dialog>


      <Dialog
        header="Pretraži stavke"
        visible={showItemSearchDialog}
        style={{ width: "50vw" }}
        onHide={() => setShowItemSearchDialog(false)}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {availableItems.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.5rem",
                borderBottom: "1px solid #ccc",
              }}
              onClick={() => handleItemSelect(item)}
            >
              <span>{item.name}</span>
              <span>{item.price}€</span>
            </div>
          ))}
        </div>
      </Dialog>
    </div>
  );
};

export default InvoicesAdd;
