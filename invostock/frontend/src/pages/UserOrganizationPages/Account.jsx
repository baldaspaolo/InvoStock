import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";

import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Panel } from "primereact/panel";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Checkbox } from "primereact/checkbox";
import { Toast } from "primereact/toast";

import SuppliersManagement from "../../components/SuppliersManagement";

export default function Account() {
  const { user } = useContext(AuthContext);
  const toast = React.useRef(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [language, setLanguage] = useState("hr");
  const [notify, setNotify] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [activeSection, setActiveSection] = useState("profil");

  const [organization, setOrganization] = useState(null);
  const [users, setUsers] = useState([]);

  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");

  const [editUserId, setEditUserId] = useState(null);
  const [editUserEmail, setEditUserEmail] = useState("");
  const [editUserRole, setEditUserRole] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (user?.name) {
        const [first, ...last] = user.name.split(" ");
        setFirstName(first);
        setLastName(last.join(" "));
      }
      setEmail(user.email);

      if (user.organization_id) {
        try {
          const res = await fetch(
            `${import.meta.env.VITE_API_URL}/api/users/getUserOrganization/${
              user.id
            }`
          );
          const data = await res.json();
          setOrganization(data);
        } catch (err) {
          console.error("Greška kod organizacije:", err);
        }

        if (user.org_role === "admin") {
          try {
            const res = await fetch(
              `${import.meta.env.VITE_API_URL}/api/users/getOrganizationUsers/${
                user.organization_id
              }`
            );
            const data = await res.json();
            setUsers(data);
          } catch (err) {
            console.error("Greška kod korisnika:", err);
          }
        }
      }
    };

    fetchData();
  }, [user]);

  const handleSave = async () => {
    const fullName = `${firstName} ${lastName}`.trim();
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/users/updateUser/${user.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: fullName, email, password }),
        }
      );
      await res.json();

      toast.current.show({
        severity: "success",
        summary: "Spremanje",
        detail: "Podaci su uspješno spremljeni.",
        life: 3000,
      });
      setIsEditing(false);
      setPassword("");
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Greška",
        detail: "Došlo je do greške kod spremanja.",
      });
    }
  };

  const handleAddUser = async () => {
    if (!newUserEmail.includes("@")) {
      toast.current.show({
        severity: "warn",
        summary: "Upozorenje",
        detail: "Unesite ispravan email.",
      });
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/users/addOrganizationUser`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: newUserEmail,
            organizationId: user.organization_id,
          }),
        }
      );
      const data = await res.json();

      setUsers([
        ...users,
        {
          id: data.insertId || Date.now(),
          email: newUserEmail,
          name: newUserEmail.split("@")[0],
          role: "Korisnik",
        },
      ]);
      setShowAddUserDialog(false);
      setNewUserEmail("");
      toast.current.show({
        severity: "success",
        summary: "Dodano",
        detail: "Korisnik je dodan u organizaciju.",
      });
    } catch (err) {
      console.error("Greška prilikom dodavanja korisnika:", err);
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      await fetch(
        `${import.meta.env.VITE_API_URL}/api/users/deleteUser/${id}?adminId=${
          user.id
        }`,
        {
          method: "DELETE",
        }
      );
      setUsers(users.filter((u) => u.id !== id));
      toast.current.show({
        severity: "success",
        summary: "Obrisano",
        detail: "Korisnik je uspješno obrisan.",
      });
    } catch (err) {
      console.error("Greška kod brisanja korisnika:", err);
    }
  };

  const handleUpdateUserRole = async () => {
    try {
      await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/api/users/updateUserRole/${editUserId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: editUserRole, adminId: user.id }),
        }
      );
      setUsers(
        users.map((u) =>
          u.id === editUserId ? { ...u, role: editUserRole } : u
        )
      );
      setEditUserId(null);
      setEditUserEmail("");
      toast.current.show({
        severity: "success",
        summary: "Ažurirano",
        detail: "Uloga korisnika je promijenjena.",
      });
    } catch (err) {
      console.error("Greška kod ažuriranja uloge:", err);
    }
  };

  return (
    <div style={{ padding: "2% 5%", marginTop: "3%" }}>
      <Toast ref={toast} />

      <div style={{ display: "flex", gap: "2rem" }}>
        <div style={{ width: "220px" }}>
          <Panel header="Postavke" toggleable={false}>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              <li
                style={{
                  padding: "0.5rem",
                  cursor: "pointer",
                  backgroundColor:
                    activeSection === "profil" ? "#f0f0f0" : "transparent",
                  borderRadius: "5px",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
                onClick={() => setActiveSection("profil")}
              >
                <i
                  className="pi pi-user"
                  style={{ width: "20px", textAlign: "center" }}
                ></i>
                Moj profil
              </li>
              <li
                style={{
                  padding: "0.5rem",
                  cursor: "pointer",
                  backgroundColor:
                    activeSection === "organizacija"
                      ? "#f0f0f0"
                      : "transparent",
                  borderRadius: "5px",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
                onClick={() => setActiveSection("organizacija")}
              >
                <i
                  className="pi pi-building"
                  style={{ width: "20px", textAlign: "center" }}
                ></i>
                Organizacija
              </li>
              <li
                style={{
                  padding: "0.5rem",
                  cursor: "pointer",
                  backgroundColor:
                    activeSection === "kontatkti" ? "#f0f0f0" : "transparent",
                  borderRadius: "5px",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
                onClick={() => setActiveSection("kontakti")}
              >
                <i
                  className="pi pi-users"
                  style={{ width: "20px", textAlign: "center" }}
                ></i>
                Kontakti
              </li>
              <li
                style={{
                  padding: "0.5rem",
                  cursor: "pointer",
                  backgroundColor:
                    activeSection === "dobavljaci" ? "#f0f0f0" : "transparent",
                  borderRadius: "5px",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
                onClick={() => setActiveSection("dobavljaci")}
              >
                <i
                  className="pi pi-shopping-cart"
                  style={{ width: "20px", textAlign: "center" }}
                ></i>
                Dobavljači
              </li>
              <li
                style={{
                  padding: "0.5rem",
                  cursor: "pointer",
                  backgroundColor:
                    activeSection === "postavke" ? "#f0f0f0" : "transparent",
                  borderRadius: "5px",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
                onClick={() => setActiveSection("postavke")}
              >
                <i
                  className="pi pi-cog"
                  style={{ width: "20px", textAlign: "center" }}
                ></i>
                Ostale postavke
              </li>
            </ul>
          </Panel>
        </div>

        <div style={{ flex: 1 }}>
          {activeSection === "profil" && (
            <Panel header="Moj profil">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "1rem",
                }}
              >
                <h4 style={{ margin: 0 }}>Osobni podaci</h4>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <Checkbox
                    inputId="edit"
                    checked={isEditing}
                    onChange={(e) => setIsEditing(e.checked)}
                  />
                  <label htmlFor="edit" style={{ margin: 0 }}>
                    Uredi podatke
                  </label>
                </div>
              </div>

              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <span className="p-float-label" style={{ flex: 1 }}>
                  <InputText
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={!isEditing}
                  />
                  <label htmlFor="firstName">Ime</label>
                </span>
                <span className="p-float-label" style={{ flex: 1 }}>
                  <InputText
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={!isEditing}
                    style={{ width: "100%" }}
                  />
                  <label htmlFor="firstName">Ime</label>
                </span>
              </div>
              <div className="p-float-label" style={{ marginTop: "1rem" }}>
                <InputText
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!isEditing}
                  style={{ width: "100%" }}
                />
                <label htmlFor="email">E-mail</label>
              </div>
              {isEditing && (
                <div className="p-float-label" style={{ marginTop: "1rem" }}>
                  <Password
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    toggleMask
                    feedback={false}
                    style={{ width: "100%" }}
                  />
                  <label htmlFor="password">Nova lozinka</label>
                </div>
              )}
              {isEditing && (
                <div style={{ textAlign: "right", marginTop: "1rem" }}>
                  <Button
                    label="Spremi"
                    icon="pi pi-check"
                    onClick={handleSave}
                    severity="success"
                  />
                </div>
              )}
            </Panel>
          )}

          {activeSection === "organizacija" && (
            <Panel header="Organizacija">
              {organization ? (
                <>
                  <p>
                    <strong>Naziv:</strong> {organization.name}
                  </p>
                  <p>
                    <strong>Uloga:</strong>{" "}
                    {user.org_role === "admin" ? "Administrator" : "Korisnik"}
                  </p>
                  <p>
                    <strong>Broj članova:</strong> {users.length}
                  </p>
                  {user.org_role === "admin" && (
                    <Button
                      label="Upravljaj korisnicima"
                      icon="pi pi-users"
                      onClick={() => setShowUserDialog(true)}
                      style={{ marginTop: "1rem" }}
                    />
                  )}
                </>
              ) : (
                <p>Niste povezani s organizacijom.</p>
              )}
            </Panel>
          )}

          {activeSection === "postavke" && (
            <Panel header="Ostale postavke">
              <Dropdown
                value={language}
                options={[
                  { label: "Hrvatski", value: "hr" },
                  { label: "Engleski", value: "en" },
                ]}
                onChange={(e) => setLanguage(e.value)}
                placeholder="Odaberi jezik"
              />
              <div className="p-field-checkbox" style={{ marginTop: "1rem" }}>
                <Checkbox
                  inputId="notify"
                  checked={notify}
                  onChange={(e) => setNotify(e.checked)}
                />
                <label htmlFor="notify" style={{ marginLeft: "0.5rem" }}>
                  Primaj obavijesti e-mailom
                </label>
              </div>
              <div style={{ textAlign: "right", marginTop: "1rem" }}>
                <Button
                  label="Spremi postavke"
                  icon="pi pi-check"
                  onClick={handleSave}
                  severity="success"
                />
              </div>
            </Panel>
          )}

          {activeSection === "dobavljaci" && (
            <SuppliersManagement user={user} />
          )}
        </div>
      </div>

      <Dialog
        header="Korisnici organizacije"
        visible={showUserDialog}
        style={{ width: "60vw" }}
        modal
        onHide={() => setShowUserDialog(false)}
      >
        <div style={{ marginBottom: "1rem", textAlign: "right" }}>
          <Button
            icon="pi pi-user-plus"
            label="Dodaj korisnika"
            size="small"
            severity="success"
            onClick={() => setShowAddUserDialog(true)}
          />
        </div>

        <DataTable
          value={users}
          responsiveLayout="scroll"
          stripedRows
          size="small"
        >
          <Column field="name" header="Ime i prezime" />
          <Column field="email" header="Email" />
          <Column field="role" header="Uloga" />
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
                    setEditUserId(rowData.id);
                    setEditUserEmail(rowData.email);
                    setEditUserRole(rowData.role);
                  }}
                />
                <Button
                  icon="pi pi-trash"
                  rounded
                  text
                  severity="danger"
                  onClick={() => handleDeleteUser(rowData.id)}
                />
              </div>
            )}
          />
        </DataTable>
      </Dialog>

      <Dialog
        header="Dodaj korisnika"
        visible={showAddUserDialog}
        style={{ width: "30vw" }}
        modal
        onHide={() => {
          setShowAddUserDialog(false);
          setNewUserEmail("");
        }}
      >
        <div className="p-fluid">
          <div className="p-field">
            <label htmlFor="newUserEmail">Email korisnika</label>
            <InputText
              id="newUserEmail"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
            />
          </div>
          <div style={{ textAlign: "right", marginTop: "1rem" }}>
            <Button
              label="Dodaj"
              icon="pi pi-check"
              onClick={handleAddUser}
              severity="success"
            />
          </div>
        </div>
      </Dialog>

      <Dialog
        header="Uredi korisnika"
        visible={editUserId !== null}
        style={{ width: "30vw" }}
        modal
        onHide={() => {
          setEditUserId(null);
          setEditUserEmail("");
        }}
      >
        <div className="p-fluid">
          <div className="p-field">
            <label htmlFor="editUserEmail">Email</label>
            <InputText id="editUserEmail" value={editUserEmail} disabled />
          </div>
          <div className="p-field">
            <label htmlFor="editUserRole">Uloga</label>
            <Dropdown
              id="editUserRole"
              value={editUserRole}
              options={[
                { label: "Korisnik", value: "Korisnik" },
                { label: "Administrator", value: "Administrator" },
              ]}
              onChange={(e) => setEditUserRole(e.value)}
              placeholder="Odaberi ulogu"
            />
          </div>
          <div style={{ textAlign: "right", marginTop: "1rem" }}>
            <Button
              label="Spremi"
              icon="pi pi-check"
              onClick={handleUpdateUserRole}
              severity="success"
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
