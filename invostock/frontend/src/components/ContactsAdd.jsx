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

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

    if (!contact.first_name.trim()) {
      newErrors.first_name = "Ime je obavezno.";
    }

    if (!contact.last_name.trim()) {
      newErrors.last_name = "Prezime je obavezno.";
    }
    if (!contact.email.trim()) {
      newErrors.email = "Email adresa je obavezna.";
    }
    if (!contact.address.trim()) {
      newErrors.address = "Adresa je obavezna.";
    }

    if (contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
      newErrors.email = "Neispravan email.";
    }

    if (
      contact.phone_number &&
      !/^[\d+\-\s]+$/.test(contact.phone_number.trim())
    ) {
      newErrors.phone_number =
        "Telefon može sadržavati samo brojeve, razmake, + i -.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      toast.current.show({
        severity: "warn",
        summary: "Greška",
        detail: "Molimo ispravite unesene podatke.",
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

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Greška pri dodavanju kontakta.");
      }

      toast.current.show({
        severity: "success",
        summary: "Dodano",
        detail: "Kontakt je uspješno dodan.",
        life: 3000,
      });
      if (onSuccess) onSuccess(data.contact);
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
              {["first_name", "last_name"].includes(id) ? "*" : ""}
            </label>
            <InputText
              id={id}
              value={contact[id]}
              onChange={(e) => setContact({ ...contact, [id]: e.target.value })}
              className={errors[id] ? "p-invalid" : ""}
            />
            {errors[id] && <small style={{ color: "red" }}>{errors[id]}</small>}
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
                  : "Mjesto"}
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
        />
      </div>
    </div>
  );
};

export default ContactsAdd;
