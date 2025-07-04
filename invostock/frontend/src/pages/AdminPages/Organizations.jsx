import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "primereact/card";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Menu } from "primereact/menu";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { InputText } from "primereact/inputtext";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import EditOrganizationDialog from "../../components/EditOrganizationDialog";
const Organizations = () => {
  const navigate = useNavigate();
  const menu = useRef(null);

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

  const showMenu = (event, org) => {
    event.stopPropagation();
    setSelectedOrganization(org);
    menu.current.toggle(event);
  };

  const handleEdit = () => {
    setEditDialogVisible(true);
  };

  const handleDelete = () => {
    confirmDialog({
      message: `Jeste li sigurni da želite obrisati organizaciju "${selectedOrganization.name}"?`,
      header: "Potvrda brisanja",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Da, deaktiviraj",
      rejectLabel: "Odustani",
      accept: () => deleteOrganization(selectedOrganization.id),
    });
  };

  const handleActivate = () => {
    confirmDialog({
      message: `Jeste li sigurni da želite aktivirati organizaciju "${selectedOrganization.name}"?`,
      header: "Potvrda aktivacije",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Da, aktiviraj",
      rejectLabel: "Odustani",
      accept: () => activateOrganization(selectedOrganization.id),
    });
  };

  const activateOrganization = async (id) => {
    try {
      const res = await fetch(
        `${API_URL}/api/admin/organizations/${id}/activate`,
        {
          method: "PUT",
        }
      );
      if (!res.ok) throw new Error("Aktivacija nije uspjela");
      toast.current.show({
        severity: "success",
        summary: "Uspjeh",
        detail: "Organizacija je aktivirana",
        life: 2000,
      });
      fetchOrganizations();
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Greška",
        detail: "Neuspjela aktivacija organizacije",
        life: 3000,
      });
    }
  };

  const getMenuItems = () => {
    if (!selectedOrganization) return [];

    const baseItems = [
      { label: "Uredi", icon: "pi pi-pencil", command: handleEdit },
    ];

    if (selectedOrganization.is_active) {
      baseItems.push({
        label: "Deaktiviraj",
        icon: "pi pi-trash",
        command: handleDelete,
      });
    } else {
      baseItems.push({
        label: "Aktiviraj",
        icon: "pi pi-check",
        command: handleActivate,
      });
    }

    return baseItems;
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
            <Column field="id" header="ID" sortable />
            <Column field="name" header="Naziv" sortable />
            <Column field="address" header="Adresa" sortable />

            <Column field="member_count" header="Broj članova" sortable />
            <Column
              field="is_active"
              header="Aktivna"
              body={(rowData) =>
                rowData.is_active ? (
                  <span className="text-green-500">Da</span>
                ) : (
                  <span className="text-red-500">Ne</span>
                )
              }
              sortable
            />
            <Column
              body={(rowData) => (
                <div onClick={(e) => e.stopPropagation()}>
                  <Button
                    icon="pi pi-ellipsis-v"
                    rounded
                    text
                    onClick={(e) => showMenu(e, rowData)}
                    aria-controls="popup_menu"
                    aria-haspopup
                  />
                  <Menu
                    model={getMenuItems()}
                    popup
                    ref={menu}
                    id="popup_menu"
                  />
                </div>
              )}
              style={{ width: "5rem" }}
              headerStyle={{ width: "5rem" }}
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
