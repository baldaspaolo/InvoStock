import React, { useState, useEffect, useRef } from "react";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { InputText } from "primereact/inputtext";
import { Panel } from "primereact/panel";
import { InputTextarea } from "primereact/inputtextarea";

import ContactsAdd from "./ContactsAdd";

const ContactsManagement = ({ user }) => {
  const API_URL = import.meta.env.VITE_API_URL;
  const toast = useRef(null);

  const [contacts, setContacts] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [expandedRows, setExpandedRows] = useState(null);
  const [editDialog, setEditDialog] = useState(false);
  const [editContact, setEditContact] = useState(null);

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
      if (data.success) setContacts(data.contacts);
    } catch (err) {
      console.error("Greška kod dohvata kontakta:", err);
      toast.current.show({
        severity: "error",
        summary: "Greška",
        detail: "Došlo je do greške pri dohvatu kontakata",
      });
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleDelete = async (id) => {
    try {
      await fetch(`${API_URL}/api/contacts/deleteContact/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          organizationId: user.organization_id || null,
        }),
      });
      toast.current.show({
        severity: "success",
        summary: "Obrisano",
        detail: "Kontakt je uspješno obrisan.",
      });
      fetchContacts();
    } catch (err) {
      console.error("Greška kod brisanja kontakta:", err);
      toast.current.show({
        severity: "error",
        summary: "Greška",
        detail: "Došlo je do greške pri brisanju kontakta",
      });
    }
  };

  const handleEditSubmit = async () => {
    try {
      await fetch(`${API_URL}/api/contacts/updateContact/${editContact.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editContact,
          userId: user.id,
          organizationId: user.organization_id || null,
        }),
      });
      toast.current.show({
        severity: "success",
        summary: "Ažurirano",
        detail: "Podaci su uspješno ažurirani.",
      });
      setEditDialog(false);
      fetchContacts();
    } catch (err) {
      console.error("Greška kod ažuriranja kontakta:", err);
      toast.current.show({
        severity: "error",
        summary: "Greška",
        detail: "Došlo je do greške pri ažuriranju kontakta",
      });
    }
  };

  const rowExpansionTemplate = (data) => {
    return (
      <div>
        <p>
          <strong>Ime:</strong> {data.first_name} {data.last_name}
        </p>
        <p>
          <strong>Adresa:</strong> {data.address}, {data.zip_code} {data.place}
        </p>
        <p>
          <strong>Email:</strong> {data.email}
        </p>
        <p>
          <strong>Telefon:</strong> {data.phone_number}
        </p>
        <p>
          <strong>Tvrtka:</strong> {data.company_name}
        </p>
        <p>
          <strong>Tax ID:</strong> {data.tax_id}
        </p>
        <p>
          <strong>Napomena:</strong> {data.notes}
        </p>
      </div>
    );
  };

  return (
    <div>
      <Toast ref={toast} />
      <Panel header="Kontakti" toggleable={false}>
        <div style={{ textAlign: "right", marginBottom: "1rem" }}>
          <Button
            label="Dodaj kontakt"
            icon="pi pi-plus"
            severity="success"
            onClick={() => setShowAddDialog(true)}
          />
        </div>

        <DataTable
          value={contacts}
          responsiveLayout="scroll"
          stripedRows
          size="small"
          expandedRows={expandedRows}
          onRowToggle={(e) => setExpandedRows(e.data)}
          rowExpansionTemplate={rowExpansionTemplate}
          dataKey="id"
        >
          <Column expander style={{ width: "3em" }} />
          <Column
            header="Ime i prezime"
            body={(rowData) => `${rowData.first_name} ${rowData.last_name}`}
          />
          <Column field="email" header="Email" />
          <Column field="phone_number" header="Telefon" />
          <Column
            header="Akcije"
            body={(rowData) => (
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <Button
                  icon="pi pi-pencil"
                  rounded
                  text
                  severity="primary"
                  onClick={() => {
                    setEditContact(rowData);
                    setEditDialog(true);
                  }}
                />
                <Button
                  icon="pi pi-trash"
                  rounded
                  text
                  severity="danger"
                  onClick={() => handleDelete(rowData.id)}
                />
              </div>
            )}
          />
        </DataTable>
      </Panel>

      <Dialog
        header="Dodaj kontakt"
        visible={showAddDialog}
        style={{ width: "40vw" }}
        modal
        onHide={() => setShowAddDialog(false)}
      >
        <ContactsAdd
          userId={user.id}
          organizationId={user.organization_id}
          onSuccess={() => {
            setShowAddDialog(false);
            fetchContacts();
          }}
        />
      </Dialog>

      <Dialog
        header="Uredi kontakt"
        visible={editDialog}
        style={{ width: "40vw" }}
        modal
        onHide={() => setEditDialog(false)}
      >
        {editContact && (
          <div className="p-fluid">
            {[
              "first_name",
              "last_name",
              "email",
              "phone_number",
              "address",
              "zip_code",
              "place",
              "company_name",
              "tax_id",
            ].map((field) => (
              <div key={field}>
                <label htmlFor={field}>
                  {field === "first_name"
                    ? "Ime"
                    : field === "last_name"
                    ? "Prezime"
                    : field === "phone_number"
                    ? "Telefon"
                    : field === "zip_code"
                    ? "Poštanski broj"
                    : field === "tax_id"
                    ? "TAX ID"
                    : field.replace("_", " ")}
                </label>
                <InputText
                  id={field}
                  value={editContact[field] || ""}
                  onChange={(e) =>
                    setEditContact({ ...editContact, [field]: e.target.value })
                  }
                />
              </div>
            ))}
            <div>
              <label htmlFor="notes">Napomena</label>
              <InputTextarea
                id="notes"
                value={editContact.notes || ""}
                onChange={(e) =>
                  setEditContact({ ...editContact, notes: e.target.value })
                }
                rows={3}
              />
            </div>
            <div style={{ textAlign: "right", marginTop: "1rem" }}>
              <Button
                label="Spremi"
                icon="pi pi-check"
                severity="success"
                onClick={handleEditSubmit}
              />
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default ContactsManagement;
