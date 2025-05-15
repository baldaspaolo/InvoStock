import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "primereact/card";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Menu } from "primereact/menu";
import { Toast } from "primereact/toast";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";

const Users = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [nameSearch, setNameSearch] = useState("");
  const [orgSearch, setOrgSearch] = useState("");
  const menu = useRef(null);
  const toast = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL;

  const filterOptions = [
    { label: "Svi korisnici", value: "all" },
    { label: "Bez organizacije", value: "no-organization" },
    { label: "Sa organizacijom", value: "with-organization" },
  ];

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const [noOrgRes, withOrgRes] = await Promise.all([
          fetch(`${API_URL}/api/admin/users/no-organization`),
          fetch(`${API_URL}/api/admin/users/with-organization`),
        ]);

        if (!noOrgRes.ok || !withOrgRes.ok) {
          throw new Error("Greška pri dohvaćanju podataka");
        }

        const noOrgData = await noOrgRes.json();
        const withOrgData = await withOrgRes.json();

        const noOrgUsers = noOrgData.map((user) => ({
          ...user,
          organization_id: null,
          organization_name: null,
        }));

        const allUsers = [...noOrgUsers, ...withOrgData];
        setUsers(allUsers);
        applyFilters(allUsers, selectedFilter, nameSearch, orgSearch);
      } catch (err) {
        console.error("Greška kod dohvaćanja korisnika:", err);
        toast.current.show({
          severity: "error",
          summary: "Greška",
          detail: "Došlo je do greške pri dohvaćanju korisnika",
          life: 3000,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [API_URL]);

  const applyFilters = (usersToFilter, filter, nameQuery, orgQuery) => {
    let result = [...usersToFilter];

    switch (filter) {
      case "no-organization":
        result = result.filter((user) => !user.organization_id);
        break;
      case "with-organization":
        result = result.filter((user) => user.organization_id);
        break;
      default:
        result = result;
    }

    if (nameQuery) {
      result = result.filter((user) =>
        user.name.toLowerCase().includes(nameQuery.toLowerCase())
      );
    }


    if (orgQuery) {
      result = result.filter((user) =>
        user.organization_name?.toLowerCase().includes(orgQuery.toLowerCase())
      );
    }

    setFilteredUsers(result);
  };

  useEffect(() => {
    applyFilters(users, selectedFilter, nameSearch, orgSearch);
  }, [selectedFilter, nameSearch, orgSearch, users]);

  const showMenu = (event, user) => {
    event.stopPropagation();
    setSelectedUser(user);
    menu.current.toggle(event);
  };

  const handleEdit = () => {
    toast.current.show({
      severity: "info",
      summary: "Uredi",
      detail: `Uredi korisnika: ${selectedUser.name}`,
      life: 3000,
    });
  };

  const handleDelete = () => {
    toast.current.show({
      severity: "warn",
      summary: "Brisanje",
      detail: `Obrisan korisnik: ${selectedUser.name}`,
      life: 3000,
    });
  };

  const handleRowClick = (event) => {
    navigate(`/admin/users/${event.data.id}`);
  };

  const menuItems = [
    { label: "Uredi", icon: "pi pi-pencil", command: handleEdit },
    { label: "Briši", icon: "pi pi-trash", command: handleDelete },
  ];

  const actionTemplate = (rowData) => {
    return (
      <div onClick={(e) => e.stopPropagation()}>
        <Button
          icon="pi pi-ellipsis-v"
          rounded
          text
          onClick={(e) => showMenu(e, rowData)}
          aria-controls="popup_menu"
          aria-haspopup
        />
        <Menu model={menuItems} popup ref={menu} id="popup_menu" />
      </div>
    );
  };

  const organizationTemplate = (rowData) => {
    return rowData.organization_id ? (
      <span>{rowData.organization_name || "Da"}</span>
    ) : (
      <span className="text-red-500">Ne</span>
    );
  };

  return (
    <div style={{ minHeight: "70vh", marginTop: "1%" }}>
      <Card
        title="Upravljanje korisnicima"
        className="shadow-sm"
        style={{ maxWidth: "90%", margin: "0 auto" }}
      >
        <div>
          <div>
            <span className="p-float-label">
              <InputText
                id="nameSearch"
                value={nameSearch}
                onChange={(e) => setNameSearch(e.target.value)}
                style={{ marginBottom: "1%" }}
              />
              <label htmlFor="nameSearch">Pretraži po imenu</label>
            </span>
          </div>

          <div>
            <span className="p-float-label">
              <InputText
                id="orgSearch"
                value={orgSearch}
                onChange={(e) => setOrgSearch(e.target.value)}
                className="w-full"
                disabled={selectedFilter === "no-organization"}
                style={{ marginBottom: "1%" }}
              />
              <label htmlFor="orgSearch">Pretraži po organizaciji</label>
            </span>
          </div>

          <div>
            <Dropdown
              value={selectedFilter}
              options={filterOptions}
              onChange={(e) => setSelectedFilter(e.value)}
              placeholder="Filtriraj korisnike"
              disabled={loading}
            />
          </div>
        </div>

        <div
          style={{
            marginTop: "1%",
            height: "calc(100vh - 250px)",
            overflowY: "auto",
          }}
        >
          <DataTable
            value={filteredUsers}
            loading={loading}
            onRowClick={handleRowClick}
            rowClassName="cursor-pointer hover:surface-100"
            scrollable
            scrollHeight="flex"
            emptyMessage="Nema korisnika za prikaz"
          >
            <Column field="name" header="Ime i prezime" sortable></Column>
            <Column field="email" header="Email" sortable></Column>
            <Column
              header="Organizacija"
              body={organizationTemplate}
              sortable
              sortField="organization_id"
            ></Column>
            <Column
              body={actionTemplate}
              style={{ width: "5rem" }}
              headerStyle={{ width: "5rem" }}
            ></Column>
          </DataTable>
        </div>
      </Card>
      <Toast ref={toast} position="top-right" />
    </div>
  );
};

export default Users;
