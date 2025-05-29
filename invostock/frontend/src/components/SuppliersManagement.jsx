import React, { useState, useEffect, useRef } from "react";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { InputText } from "primereact/inputtext";
import { Panel } from "primereact/panel";

import SupplierAdd from "./SupplierAdd";

const SuppliersManagement = ({ user }) => {
  const API_URL = import.meta.env.VITE_API_URL;
  const toast = useRef(null);

  const [suppliers, setSuppliers] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [editSupplier, setEditSupplier] = useState(null);

  const fetchSuppliers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/suppliers/getSuppliers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          organizationId: user.organization_id,
        }),
      });
      const data = await res.json();
      if (data.success) setSuppliers(data.suppliers);
    } catch (err) {
      console.error("Greška kod dohvata dobavljača:", err);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleDelete = async (id) => {
    try {
      await fetch(`${API_URL}/api/suppliers/deleteSupplier/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          organizationId: user.organization_id,
        }),
      });
      toast.current.show({
        severity: "success",
        summary: "Obrisano",
        detail: "Dobavljač je uspješno obrisan.",
      });
      fetchSuppliers();
    } catch (err) {
      console.error("Greška kod brisanja dobavljača:", err);
    }
  };

  const handleEditSubmit = async () => {
    try {
      await fetch(
        `${API_URL}/api/suppliers/updateSupplier/${editSupplier.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            organizationId: user.organization_id,
            name: editSupplier.name,
            address: editSupplier.address,
            phone: editSupplier.phone,
          }),
        }
      );
      toast.current.show({
        severity: "success",
        summary: "Ažurirano",
        detail: "Podaci su uspješno ažurirani.",
      });
      setEditDialog(false);
      fetchSuppliers();
    } catch (err) {
      console.error("Greška kod ažuriranja dobavljača:", err);
    }
  };

  return (
    <div>
      <Toast ref={toast} />
      <Panel header="Postavke" toggleable={false}>
        <div style={{ textAlign: "right", marginBottom: "1rem" }}>
          <Button
            label="Dodaj dobavljača"
            icon="pi pi-plus"
            severity="success"
            onClick={() => setShowAddDialog(true)}
          />
        </div>

        <DataTable
          value={suppliers}
          responsiveLayout="scroll"
          stripedRows
          size="small"
        >
          <Column field="name" header="Naziv" />
          <Column field="address" header="Adresa" />
          <Column field="phone" header="Telefon" />
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
                    setEditSupplier(rowData);
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
        header="Dodaj dobavljača"
        visible={showAddDialog}
        style={{ width: "40vw" }}
        modal
        onHide={() => setShowAddDialog(false)}
      >
        <SupplierAdd
          userId={user.id}
          organizationId={user.organization_id}
          onSuccess={() => {
            setShowAddDialog(false);
            fetchSuppliers();
          }}
        />
      </Dialog>

      <Dialog
        header="Uredi dobavljača"
        visible={editDialog}
        style={{ width: "30vw" }}
        modal
        onHide={() => setEditDialog(false)}
      >
        {editSupplier && (
          <div>
            <div>
              <label htmlFor="name">Naziv</label>
              <InputText
                id="name"
                value={editSupplier.name}
                onChange={(e) =>
                  setEditSupplier({ ...editSupplier, name: e.target.value })
                }
              />
            </div>
            <div>
              <label htmlFor="address">Adresa</label>
              <InputText
                id="address"
                value={editSupplier.address || ""}
                onChange={(e) =>
                  setEditSupplier({ ...editSupplier, address: e.target.value })
                }
              />
            </div>
            <div>
              <label htmlFor="phone">Telefon</label>
              <InputText
                id="phone"
                value={editSupplier.phone || ""}
                onChange={(e) =>
                  setEditSupplier({ ...editSupplier, phone: e.target.value })
                }
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

export default SuppliersManagement;
