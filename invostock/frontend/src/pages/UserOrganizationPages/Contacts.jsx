import React, { useState, useRef, useEffect, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Menu } from "primereact/menu";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import "./style.css";

const Contacts = () => {
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [isEditDialogVisible, setIsEditDialogVisible] = useState(false);
  const [isAddDialogVisible, setIsAddDialogVisible] = useState(false);
  const [newContact, setNewContact] = useState({
    first_name: "",
    last_name: "",
    address: "",
    zip_code: "",
    phone_number: "",
    email: "",
    company_name: "",
    tax_id: "",
    notes: "",
  });
  const [expandedRows, setExpandedRows] = useState(null);
  const toast = useRef(null);
  const menuRef = useRef(null);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const response = await fetch(
          "http://localhost:3000/api/contacts/getUserContacts",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ userId: user.id }),
          }
        );

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const data = await response.json();

        if (data.success) {
          setContacts(data.contacts);
          console.log(data);
        } else {
          toast.current.show({
            severity: "error",
            summary: "Error",
            detail: "Unable to fetch contacts.",
            life: 3000,
          });
        }
      } catch (error) {
        console.error("Greška pri dohvaćanju kontakata:", error);
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: "Network error.",
          life: 3000,
        });
      }
    };

    fetchContacts();
  }, [user.id]);

  const onRowExpand = (event) => {
    toast.current.show({
      severity: "info",
      summary: "Contact Expanded",
      detail: `Showing details for ${event.data.first_name} ${event.data.last_name}`,
      life: 3000,
    });
  };

  const onRowCollapse = (event) => {
    toast.current.show({
      severity: "info",
      summary: "Contact Collapsed",
      detail: `Hiding details for ${event.data.first_name} ${event.data.last_name}`,
      life: 3000,
    });
  };

  const rowExpansionTemplate = (data) => {
    return (
      <div className="p-3">
        <h5>Detalji kontakta</h5>
        <div className="grid">
          <div className="col-6">
            <p>
              <strong>Adresa:</strong> {data.address}
            </p>
            <p>
              <strong>Mjesto:</strong> {data.place || "N/A"}
            </p>
            <p>
              <strong>Poštanski broj:</strong> {data.zip_code || "N/A"}
            </p>
            <p>
              <strong>Telefon:</strong> {data.phone_number}
            </p>
            <p>
              <strong>Email:</strong> {data.email}
            </p>
          </div>
          <div className="col-6">
            <p>
              <strong>Porezni broj (Tax ID):</strong> {data.tax_id || "N/A"}
            </p>
            <p>
              <strong>Bilješke:</strong> {data.notes || "N/A"}
            </p>
            <p>
              <strong>Dodano:</strong>{" "}
              {new Date(data.created_at).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const openEditDialog = (contact) => {
    setSelectedContact({ ...contact });
    setIsEditDialogVisible(true);
  };

  const hideEditDialog = () => {
    setIsEditDialogVisible(false);
  };

  const saveContact = async () => {
    try {
      if (
        !selectedContact.first_name ||
        !selectedContact.last_name ||
        !selectedContact.phone_number ||
        !selectedContact.email
      ) {
        toast.current.show({
          severity: "error",
          summary: "Greška",
          detail: "Molimo popunite sva obavezna polja.",
          life: 3000,
        });
        return;
      }

      const response = await fetch(
        `http://localhost:3000/api/contacts/updateContact/${selectedContact.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(selectedContact),
        }
      );

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();

      if (data.success) {
        setContacts((prevContacts) =>
          prevContacts.map((contact) =>
            contact.id === selectedContact.id ? selectedContact : contact
          )
        );
        toast.current.show({
          severity: "success",
          summary: "Uspjeh",
          detail: "Kontakt uspješno ažuriran.",
          life: 3000,
        });
        hideEditDialog();
      } else {
        toast.current.show({
          severity: "error",
          summary: "Greška",
          detail: data.error || "Došlo je do greške pri ažuriranju kontakta.",
          life: 3000,
        });
      }
    } catch (error) {
      console.error("Greška pri ažuriranju kontakta:", error);
      toast.current.show({
        severity: "error",
        summary: "Greška",
        detail: "Došlo je do greške pri ažuriranju kontakta.",
        life: 3000,
      });
    }
  };

  const deleteContact = async (contact) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/contacts/deleteContact/${contact.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();

      if (data.success) {
        setContacts((prevContacts) =>
          prevContacts.filter((c) => c.id !== contact.id)
        );
        toast.current.show({
          severity: "success",
          summary: "Uspjeh",
          detail: "Kontakt uspješno obrisan.",
          life: 3000,
        });
      } else {
        toast.current.show({
          severity: "error",
          summary: "Greška",
          detail: data.error || "Došlo je do greške pri brisanju kontakta.",
          life: 3000,
        });
      }
    } catch (error) {
      console.error("Greška pri brisanju kontakta:", error);
      toast.current.show({
        severity: "error",
        summary: "Greška",
        detail: "Došlo je do greške pri brisanju kontakta.",
        life: 3000,
      });
    }
  };

  const actionTemplate = (rowData) => {
    const menuModel = [
      {
        label: "Uredi",
        icon: "pi pi-pencil",
        command: () => openEditDialog(rowData),
      },
      {
        label: "Obriši",
        icon: "pi pi-trash",
        command: () => deleteContact(rowData),
      },
    ];

    return (
      <div>
        <Menu model={menuModel} popup ref={menuRef} id={`menu_${rowData.id}`} />
        <Button
          icon="pi pi-ellipsis-h"
          className="p-button-text"
          onClick={(event) => menuRef.current.toggle(event)}
          aria-controls={`menu_${rowData.id}`}
        />
      </div>
    );
  };

  const openAddDialog = () => {
    setIsAddDialogVisible(true);
  };

  const hideAddDialog = () => {
    setIsAddDialogVisible(false);
    setNewContact({
      first_name: "",
      last_name: "",
      address: "",
      zip_code: "",
      phone_number: "",
      email: "",
      company_name: "",
      tax_id: "",
      notes: "",
    });
  };

  const saveNewContact = async () => {
    if (
      !newContact.first_name ||
      !newContact.last_name ||
      !newContact.address ||
      !newContact.phone_number ||
      !newContact.email
    ) {
      toast.current.show({
        severity: "error",
        summary: "Greška",
        detail: "Molimo popunite sva obavezna polja.",
        life: 3000,
      });
      return;
    }

    const contactData = {
      userId: user.id,
      organizationId: user.organizationId,
      ...newContact,
    };

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/contacts/addUser`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(contactData),
        }
      );

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();

      if (data.success) {
        const newContactWithId = {
          ...newContact,
          id: data.contactId,
          user_id: user.id,
          organization_id: user.organizationId,
          created_at: new Date().toISOString(),
        };
        setContacts([...contacts, newContactWithId]);
        toast.current.show({
          severity: "success",
          summary: "Uspjeh",
          detail: "Kontakt uspješno dodan.",
          life: 3000,
        });
        hideAddDialog();
      } else {
        toast.current.show({
          severity: "error",
          summary: "Greška",
          detail: "Došlo je do greške pri dodavanju kontakta.",
          life: 3000,
        });
      }
    } catch (error) {
      console.error("Greška pri slanju zahtjeva:", error);
      toast.current.show({
        severity: "error",
        summary: "Greška",
        detail: "Došlo je do greške pri slanju zahtjeva.",
        life: 3000,
      });
    }
  };

  return (
    <div className="parent">
      <div className="div1">
        <h1>Kontakti</h1>
      </div>
      <div className="div3">
        <Button
          label="Novi kontakt"
          icon="pi pi-plus"
          raised
          size="small"
          onClick={openAddDialog}
        />
      </div>
      <div className="div4">
        <Toast ref={toast} />
        <ConfirmDialog />
        <DataTable
          value={contacts}
          dataKey="id"
          expandedRows={expandedRows}
          onRowToggle={(e) => setExpandedRows(e.data)}
          onRowExpand={onRowExpand}
          onRowCollapse={onRowCollapse}
          rowExpansionTemplate={rowExpansionTemplate}
          tableStyle={{ minWidth: "40rem" }}
        >
          <Column expander style={{ width: "3em" }} />
          <Column
            field="id"
            header="Redni broj"
            style={{ width: "10%" }}
            sortable
          />
          <Column
            field="first_name"
            header="Ime"
            style={{ width: "20%" }}
            sortable
          />
          <Column
            field="last_name"
            header="Prezime"
            style={{ width: "20%" }}
            sortable
          />
          <Column
            field="company_name"
            header="Ime kompanije"
            style={{ width: "20%" }}
            sortable
          />
          <Column
            body={actionTemplate}
            header="Akcija"
            style={{ width: "10%", textAlign: "center" }}
          />
        </DataTable>
      </div>

      <Dialog
        visible={isAddDialogVisible}
        style={{ width: "30vw" }}
        header="Dodaj novi kontakt"
        modal
        onHide={hideAddDialog}
      >
        <div className="p-fluid">
          <div className="p-field">
            <label>Ime</label>
            <InputText
              value={newContact.first_name}
              onChange={(e) =>
                setNewContact({ ...newContact, first_name: e.target.value })
              }
            />
          </div>
          <div className="p-field">
            <label>Prezime</label>
            <InputText
              value={newContact.last_name}
              onChange={(e) =>
                setNewContact({ ...newContact, last_name: e.target.value })
              }
            />
          </div>
          <div className="p-field">
            <label>Adresa</label>
            <InputText
              value={newContact.address}
              onChange={(e) =>
                setNewContact({ ...newContact, address: e.target.value })
              }
            />
          </div>
          <div className="p-field">
            <label>Poštanski broj</label>
            <InputText
              value={newContact.zip_code}
              onChange={(e) =>
                setNewContact({ ...newContact, zip_code: e.target.value })
              }
            />
          </div>
          <div className="p-field">
            <label>Telefon</label>
            <InputText
              value={newContact.phone_number}
              onChange={(e) =>
                setNewContact({ ...newContact, phone_number: e.target.value })
              }
            />
          </div>
          <div className="p-field">
            <label>Email</label>
            <InputText
              value={newContact.email}
              onChange={(e) =>
                setNewContact({ ...newContact, email: e.target.value })
              }
            />
          </div>
          <div className="p-field">
            <label>Ime kompanije</label>
            <InputText
              value={newContact.company_name}
              onChange={(e) =>
                setNewContact({ ...newContact, company_name: e.target.value })
              }
            />
          </div>
          <div className="p-field">
            <label>Porezni broj (Tax ID)</label>
            <InputText
              value={newContact.tax_id}
              onChange={(e) =>
                setNewContact({ ...newContact, tax_id: e.target.value })
              }
            />
          </div>
          <div className="p-field">
            <label>Bilješke</label>
            <InputText
              value={newContact.notes}
              onChange={(e) =>
                setNewContact({ ...newContact, notes: e.target.value })
              }
            />
          </div>
        </div>
        <div className="p-dialog-footer">
          <Button
            label="Odustani"
            icon="pi pi-times"
            onClick={hideAddDialog}
            className="p-button-text"
          />
          <Button
            label="Spremi"
            icon="pi pi-check"
            onClick={saveNewContact}
            autoFocus
          />
        </div>
      </Dialog>

      <Dialog
        visible={isEditDialogVisible}
        style={{ width: "30vw" }}
        header="Uredi kontakt"
        modal
        onHide={hideEditDialog}
      >
        {selectedContact && (
          <div className="p-fluid">
            <div className="p-field">
              <label>Ime</label>
              <InputText
                value={selectedContact.first_name}
                onChange={(e) =>
                  setSelectedContact({
                    ...selectedContact,
                    first_name: e.target.value,
                  })
                }
              />
            </div>
            <div className="p-field">
              <label>Prezime</label>
              <InputText
                value={selectedContact.last_name}
                onChange={(e) =>
                  setSelectedContact({
                    ...selectedContact,
                    last_name: e.target.value,
                  })
                }
              />
            </div>
            <div className="p-field">
              <label>Adresa</label>
              <InputText
                value={selectedContact.address}
                onChange={(e) =>
                  setSelectedContact({
                    ...selectedContact,
                    address: e.target.value,
                  })
                }
              />
            </div>
            <div className="p-field">
              <label>Telefon</label>
              <InputText
                value={selectedContact.phone_number}
                onChange={(e) =>
                  setSelectedContact({
                    ...selectedContact,
                    phone_number: e.target.value,
                  })
                }
              />
            </div>
            <div className="p-field">
              <label>Email</label>
              <InputText
                value={selectedContact.email}
                onChange={(e) =>
                  setSelectedContact({
                    ...selectedContact,
                    email: e.target.value,
                  })
                }
              />
            </div>
            <div className="p-field">
              <label>Tax ID</label>
              <InputText
                value={selectedContact.tax_id}
                onChange={(e) =>
                  setSelectedContact({
                    ...selectedContact,
                    tax_id: e.target.value,
                  })
                }
              />
            </div>
            <div className="p-field">
              <label>Notes</label>
              <InputText
                value={selectedContact.notes}
                onChange={(e) =>
                  setSelectedContact({
                    ...selectedContact,
                    notes: e.target.value,
                  })
                }
              />
            </div>
            <div className="p-field">
              <label>Datum dodavanja</label>
              <InputText
                value={new Date(selectedContact.created_at).toLocaleString()}
                disabled
              />
            </div>
          </div>
        )}
        <div className="p-dialog-footer">
          <Button
            label="Odustani"
            icon="pi pi-times"
            onClick={hideEditDialog}
            className="p-button-text"
          />
          <Button
            label="Spremi"
            icon="pi pi-check"
            onClick={saveContact}
            autoFocus
          />
        </div>
      </Dialog>
    </div>
  );
};

export default Contacts;
