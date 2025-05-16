import React, { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";

const EditUserDialog = ({ visible, onHide, user, onSave, organizations }) => {
  const [editedUser, setEditedUser] = useState({ ...user });

  useEffect(() => {
    setEditedUser({ ...user });
  }, [user]);

  const handleChange = (field, value) => {
    setEditedUser((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    const dataToSave = {
      ...editedUser,
      organization_id:
        editedUser.organization_id === "" ? null : editedUser.organization_id,
    };
    onSave(dataToSave);
    onHide();
  };

  const footer = (
    <div className="flex justify-content-end gap-2">
      <Button label="Odustani" icon="pi pi-times" onClick={onHide} text />
      <Button label="Spremi" icon="pi pi-check" onClick={handleSubmit} />
    </div>
  );

  return (
    <Dialog
      header="Uredi korisnika"
      visible={visible}
      style={{ width: "30vw" }}
      onHide={onHide}
      footer={footer}
      draggable={false}
    >
      <div className="p-fluid">
        <label>Ime i prezime</label>
        <InputText
          value={editedUser.name || ""}
          onChange={(e) => handleChange("name", e.target.value)}
        />

        <label>Email</label>
        <InputText
          value={editedUser.email || ""}
          onChange={(e) => handleChange("email", e.target.value)}
        />

        <label>Organizacija</label>
        <Dropdown
          value={editedUser.organization_id ?? null}
          options={[
            { label: "Nema", value: null },
            ...organizations.map((org) => ({
              label: org.name,
              value: org.id,
            })),
          ]}
          optionLabel="label"
          optionValue="value"
          onChange={(e) => handleChange("organization_id", e.value)}
          placeholder="Odaberi organizaciju"
        />
      </div>
    </Dialog>
  );
};

export default EditUserDialog;
