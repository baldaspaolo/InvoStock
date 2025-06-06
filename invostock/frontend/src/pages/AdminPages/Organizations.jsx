import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "primereact/card";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { InputText } from "primereact/inputtext";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import EditOrganizationDialog from "../../components/EditOrganizationDialog";
const Organizations = () => {
  const navigate = useNavigate();
  const toast = useRef(null);
  const [organizations, setOrganizations] = useState([]);
  const [filteredOrganizations, setFilteredOrganizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [editDialogVisible, setEditDialogVisible] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetchOrganizations();
  }, [API_URL]);

  const fetchOrganizations = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/organizations`);
      if (!res.ok) throw new Error("Greška pri dohvaćanju organizacija");
      const data = await res.json();
      setOrganizations(data);
      setFilteredOrganizations(data);
    } catch (err) {
      console.error("Greška:", err);
      toast.current.show({
        severity: "error",
        summary: "Greška",
        detail: "Neuspješno dohvaćanje organizacija",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const filtered = organizations.filter((org) =>
      org.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredOrganizations(filtered);
  }, [searchTerm, organizations]);

  const handleRowClick = (e) => {
    navigate(`/admin/organizations/${e.data.id}`);
  };

  const handleEditClick = (org, e) => {
    e.stopPropagation();
    setSelectedOrganization(org);
    setEditDialogVisible(true);
  };

  const handleDeleteClick = (org, e) => {
    e.stopPropagation();
    confirmDialog({
      message: `Jeste li sigurni da želite obrisati organizaciju "${org.name}"?`,
      header: "Potvrda brisanja",
      icon: "pi pi-exclamation-triangle",
      accept: () => deleteOrganization(org.id),
    });
  };

  const deleteOrganization = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/organizations/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Brisanje nije uspjelo");
      toast.current.show({
        severity: "success",
        summary: "Uspjeh",
        detail: "Organizacija obrisana",
        life: 2000,
      });
      fetchOrganizations();
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Greška",
        detail: "Neuspjelo brisanje organizacije",
        life: 3000,
      });
    }
  };

  const handleSaveEdit = async (updatedOrg) => {
    try {
      const res = await fetch(
        `${API_URL}/api/admin/organizations/${updatedOrg.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedOrg),
        }
      );
      if (!res.ok) throw new Error("Greška pri spremanju");
      toast.current.show({
        severity: "success",
        summary: "Uspješno",
        detail: "Organizacija je ažurirana",
        life: 2000,
      });
      fetchOrganizations();
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Greška",
        detail: "Spremanje nije uspjelo",
        life: 3000,
      });
    }
  };

  return (
    <div style={{ minHeight: "70vh", marginTop: "3%" }}>
      <Card
        title="Organizacije"
        className="shadow-sm"
        style={{ maxWidth: "90%", margin: "0 auto" }}
      >
        <div style={{ marginBottom: "1rem" }}>
          <span className="p-float-label">
            <InputText
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: "100%" }}
            />
            <label htmlFor="search">Pretraži po nazivu</label>
          </span>
        </div>

        <div style={{ height: "calc(100vh - 250px)", overflowY: "auto" }}>
          <DataTable
            value={filteredOrganizations}
            loading={loading}
            onRowClick={handleRowClick}
            rowClassName="cursor-pointer hover:surface-100"
            scrollable
            scrollHeight="flex"
            emptyMessage="Nema organizacija za prikaz"
          >
            <Column field="name" header="Naziv" sortable />
            <Column field="address" header="Adresa" sortable />

            <Column field="member_count" header="Broj članova" sortable />
            <Column
              body={(rowData) => (
                <div className="flex gap-2">
                  <Button
                    icon="pi pi-pencil"
                    className="p-button-text"
                    onClick={(e) => handleEditClick(rowData, e)}
                  />
                  <Button
                    icon="pi pi-trash"
                    className="p-button-text p-button-danger"
                    onClick={(e) => handleDeleteClick(rowData, e)}
                  />
                </div>
              )}
              style={{ width: "6rem" }}
            />
          </DataTable>
        </div>
      </Card>
      <EditOrganizationDialog
        visible={editDialogVisible}
        onHide={() => setEditDialogVisible(false)}
        organization={selectedOrganization}
        onSave={handleSaveEdit}
      />
      <Toast ref={toast} position="top-right" />
      <ConfirmDialog />
    </div>
  );
};

export default Organizations;
