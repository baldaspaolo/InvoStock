import React, { useEffect, useState } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";

const EditOrganizationDialog = ({ visible, onHide, organization, onSave }) => {
  const [editedOrg, setEditedOrg] = useState({ ...organization });

  useEffect(() => {
    setEditedOrg({ ...organization });
  }, [organization]);

  const handleChange = (field, value) => {
    setEditedOrg((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    onSave(editedOrg);
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
      header="Uredi organizaciju"
      visible={visible}
      style={{ width: "30vw" }}
      onHide={onHide}
      footer={footer}
      draggable={false}
    >
      <div className="p-fluid">
        <label htmlFor="name">Naziv</label>
        <InputText
          id="name"
          value={editedOrg.name || ""}
          onChange={(e) => handleChange("name", e.target.value)}
        />

        <label htmlFor="address">Adresa</label>
        <InputText
          id="address"
          value={editedOrg.address || ""}
          onChange={(e) => handleChange("address", e.target.value)}
        />
      </div>
    </Dialog>
  );
};

export default EditOrganizationDialog;
