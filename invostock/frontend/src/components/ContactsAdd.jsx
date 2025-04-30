import React, { useState, useRef } from "react";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea"; 
import { Toast } from "primereact/toast";


const ContactsAdd = ({ userId, organizationId, onSuccess, onError }) => {
  const API_URL = import.meta.env.VITE_API_URL;
  const toast = useRef(null);
  const [contact, setContact] = useState({
    first_name: "",
    last_name: "",
    address: "",
    zip_code: "",
    place: "",
    phone_number: "",
    email: "",
    company_name: "",
    tax_id: "",
    notes: "",
  });

  const handleSubmit = async () => {
    if (!contact.first_name || !contact.last_name) {
      toast.current.show({
        severity: "warn",
        summary: "Upozorenje",
        detail: "Ime i prezime su obavezni.",
        life: 3000,
      });
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/contacts/addUser`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          organizationId,
          ...contact,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to add contact");
      }

      if (data.success) {
        toast.current.show({
          severity: "success",
          summary: "Dodano",
          detail: "Kontakt je uspješno dodan.",
          life: 3000,
        });
        if (onSuccess) onSuccess(data.contact);
      } else {
        throw new Error(data.message || "Failed to add contact");
      }
    } catch (err) {
      console.error("Greška kod dodavanja kontakta:", err);
      toast.current.show({
        severity: "error",
        summary: "Greška",
        detail: err.message || "Greška kod komunikacije sa serverom.",
        life: 3000,
      });
      if (onError) onError(err.message);
    }
  };

  return (
    <div className="p-fluid grid">
      <Toast ref={toast} />

      <div className="col-6">
        {["first_name", "last_name", "email", "phone_number"].map((id) => (
          <div className="p-field mb-3" key={id}>
            <label htmlFor={id}>
              {id === "first_name"
                ? "Ime"
                : id === "last_name"
                ? "Prezime"
                : id === "email"
                ? "Email"
                : "Telefon"}
              *
            </label>
            <InputText
              id={id}
              value={contact[id]}
              onChange={(e) => setContact({ ...contact, [id]: e.target.value })}
              className={
                !contact[id] && ["first_name", "last_name"].includes(id)
                  ? "p-invalid"
                  : ""
              }
            />
          </div>
        ))}
      </div>

      <div className="col-6">
        {["company_name", "tax_id", "address", "zip_code", "place"].map(
          (id) => (
            <div className="p-field mb-3" key={id}>
              <label htmlFor={id}>
                {id === "company_name"
                  ? "Tvrtka"
                  : id === "tax_id"
                  ? "OIB"
                  : id === "address"
                  ? "Adresa"
                  : id === "zip_code"
                  ? "Poštanski broj"
                  : "Grad"}
              </label>
              <InputText
                id={id}
                value={contact[id]}
                onChange={(e) =>
                  setContact({ ...contact, [id]: e.target.value })
                }
              />
            </div>
          )
        )}
      </div>

      <div className="col-12">
        <div className="p-field mb-3">
          <label htmlFor="notes">Napomena</label>
          <InputTextarea
            id="notes"
            value={contact.notes}
            onChange={(e) => setContact({ ...contact, notes: e.target.value })}
            rows={3}
          />
        </div>
      </div>

      <div className="col-12 flex justify-content-end">
        <Button
          label="Dodaj"
          icon="pi pi-check"
          severity="success"
          onClick={handleSubmit}
          disabled={!contact.first_name || !contact.last_name}
        />
      </div>
    </div>
  );
};

export default ContactsAdd;
