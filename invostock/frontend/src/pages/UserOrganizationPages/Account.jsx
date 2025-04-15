import React, { useState } from "react";
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

export default function Account() {
  const [activeSection, setActiveSection] = useState("profil");
  const [firstName, setFirstName] = useState("Ivan");
  const [lastName, setLastName] = useState("Privatnik");
  const [email, setEmail] = useState("ivan@email.com");
  const [password, setPassword] = useState("");
  const [language, setLanguage] = useState("hr");
  const [notify, setNotify] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showUserDialog, setShowUserDialog] = useState(false);

  const mockUsers = [
    {
      id: 1,
      name: "Ana Horvat",
      email: "ana@firma.com",
      role: "Korisnik",
    },
    {
      id: 2,
      name: "Marko Marić",
      email: "marko@firma.com",
      role: "Administrator",
    },
    {
      id: 3,
      name: "Petra Novak",
      email: "petra@firma.com",
      role: "Korisnik",
    },
  ];

  const organization = {
    name: "Privatna firma d.o.o.",
    role: "Administrator",
    members: 3,
  };

  const toast = React.useRef(null);

  const handleSave = () => {
    toast.current.show({
      severity: "success",
      summary: "Spremanje",
      detail: "Promjene spremljene",
      life: 3000,
    });
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
            <Panel header="Moj profil" style={{ fontSize: "0.88rem" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  margin: "1rem 0 2rem",
                }}
              >
                <h4 style={{ margin: 0 }}>Osobni podaci</h4>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <Checkbox
                    inputId="edit"
                    checked={isEditing}
                    onChange={(e) => setIsEditing(e.checked)}
                  />
                  <label htmlFor="edit">Uredi podatke</label>
                </div>
              </div>
              <div
                style={{ display: "flex", gap: "2rem", marginBottom: "2rem" }}
              >
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
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={!isEditing}
                  />
                  <label htmlFor="lastName">Prezime</label>
                </span>
              </div>

              <div className="p-float-label" style={{ marginBottom: "1rem" }}>
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
                <div className="p-float-label" style={{ marginBottom: "1rem" }}>
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
            <Panel header="Organizacija" style={{ fontSize: "0.88rem" }}>
              <p>
                <strong>Naziv:</strong> {organization.name}
              </p>
              <p>
                <strong>Uloga:</strong> {organization.role}
              </p>
              <p>
                <strong>Broj članova:</strong> {organization.members}
              </p>

              {organization.role === "Administrator" && (
                <div style={{ marginTop: "1rem" }}>
                  <Button
                    label="Upravljaj korisnicima"
                    icon="pi pi-users"
                    onClick={() => setShowUserDialog(true)}
                  />{" "}
                </div>
              )}
            </Panel>
          )}

          {activeSection === "postavke" && (
            <Panel header="Ostale postavke" style={{ fontSize: "0.88rem" }}>
              <div style={{ marginBottom: "1rem" }}>
                <Dropdown
                  value={language}
                  options={[
                    { label: "Hrvatski", value: "hr" },
                    { label: "Engleski", value: "en" },
                  ]}
                  onChange={(e) => setLanguage(e.value)}
                  placeholder="Odaberi jezik"
                />
              </div>

              <div
                className="p-field-checkbox"
                style={{ marginBottom: "1rem" }}
              >
                <Checkbox
                  inputId="notify"
                  checked={notify}
                  onChange={(e) => setNotify(e.checked)}
                />
                <label htmlFor="notify" style={{ marginLeft: "0.5rem" }}>
                  Primaj obavijesti e-mailom
                </label>
              </div>

              <div style={{ textAlign: "right" }}>
                <Button
                  label="Spremi postavke"
                  icon="pi pi-check"
                  onClick={handleSave}
                  severity="success"
                />
              </div>
            </Panel>
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
          />
        </div>

        <DataTable
          value={mockUsers}
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
                  tooltip="Uredi"
                />
                <Button
                  icon="pi pi-trash"
                  rounded
                  text
                  severity="danger"
                  tooltip="Obriši"
                />
              </div>
            )}
          />
        </DataTable>
      </Dialog>
    </div>
  );
}
