import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

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
import { ConfirmDialog } from "primereact/confirmdialog";
import { confirmDialog } from "primereact/confirmdialog";

import SuppliersManagement from "../../components/SuppliersManagement";
import ContactsManagement from "../../components/ContactsManagement";

import "./style.css";

export default function Account() {
  const { user } = useContext(AuthContext);
  const toast = React.useRef(null);
  const navigate = useNavigate();
  const [loadingMessage, setLoadingMessage] = useState("");

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
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [confirmPasswordDialog, setConfirmPasswordDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [changePassword, setChangePassword] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [deactivatePassword, setDeactivatePassword] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (user?.name) {
        setFirstName(user.name);
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

        if (user.organization_id) {
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

  const confirmAndSave = async () => {
    const fullName = `${firstName} ${lastName}`.trim();

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/users/updateUser/${user.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: fullName,
            email,
            newPassword: password?.trim() || null,
            currentPassword,
          }),
        }
      );

      const data = await res.json();

      if (data.success) {
        setLoadingMessage("Uspješna promjena podataka. Odjava u tijeku...");

        setTimeout(() => {
          localStorage.clear();
          navigate("/login");
        }, 2000);
        setPassword("");
        setCurrentPassword("");
        setConfirmPasswordDialog(false);
      } else {
        toast.current.show({
          severity: "error",
          summary: "Greška",
          detail: data.message || "Pogrešna lozinka.",
        });
      }
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Greška",
        detail: "Greška kod spremanja.",
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

  const handleDeleteUser = (id) => {
    confirmDialog({
      message:
        "Jeste li sigurni da želite ukloniti ovog korisnika iz organizacije?",
      header: "Potvrda uklanjanja",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Da",
      rejectLabel: "Ne",
      accept: () => {
        fetch(`${import.meta.env.VITE_API_URL}/api/users/deleteOrgUser/${id}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ adminId: user.id }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success) {
              setUsers(users.filter((u) => u.id !== id));
              toast.current.show({
                severity: "success",
                summary: "Uspjeh",
                detail: "Korisnik je uklonjen iz organizacije.",
              });
            } else {
              toast.current.show({
                severity: "error",
                summary: "Greška",
                detail: data.error || "Neuspjelo uklanjanje korisnika.",
              });
            }
          })
          .catch((err) => {
            console.error("Greška kod uklanjanja korisnika:", err);
            toast.current.show({
              severity: "error",
              summary: "Greška",
              detail: "Greška kod zahtjeva.",
            });
          });
      },
    });
  };

  const handleInviteUser = async () => {
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
        `${
          import.meta.env.VITE_API_URL
        }/api/organizations/sendOrganizationInvite`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: newUserEmail,
            organizationId: user.organization_id,
            invitedBy: user.id,
          }),
        }
      );
      const data = await res.json();

      if (data.success) {
        toast.current.show({
          severity: "success",
          summary: "Pozivnica poslana",
          detail: "Korisnik je pozvan u organizaciju.",
        });
        setShowAddUserDialog(false);
        setNewUserEmail("");
      } else {
        toast.current.show({
          severity: "error",
          summary: "Greška",
          detail: data.error || "Pozivnica nije poslana.",
        });
      }
    } catch (err) {
      console.error("Greška kod slanja pozivnice:", err);
      toast.current.show({
        severity: "error",
        summary: "Greška",
        detail: "Došlo je do pogreške prilikom slanja.",
      });
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

  const handleDeactivateAccount = async () => {
    setShowDeactivateDialog(false);
    setLoadingMessage("Deaktiviranje u tijeku... Odjavljivanje");

    setTimeout(async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/users/deactivate`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.id,
              password: deactivatePassword,
            }),
          }
        );

        const data = await res.json();

        if (data.success) {
          localStorage.clear();
          navigate("/login");
        } else {
          setLoadingMessage("");
          toast.current.show({
            severity: "error",
            summary: "Greška",
            detail: data.message || "Neuspjela deaktivacija.",
          });
        }
      } catch (err) {
        setLoadingMessage("");
        toast.current.show({
          severity: "error",
          summary: "Greška",
          detail: "Greška na serveru.",
        });
      }
    }, 3000);
  };

  return (
    <div style={{ padding: "2% 5%", marginTop: "3%" }}>
      <Toast ref={toast} />
      <ConfirmDialog />

      {loadingMessage && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.3)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <i className="pi pi-spin pi-spinner" style={{ fontSize: "3rem" }}></i>
          <p style={{ marginTop: "1rem", fontSize: "1.2rem", color: "white" }}>
            {loadingMessage}
          </p>
        </div>
      )}

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
              {user.organization_id && (
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
              )}
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
                <h4 style={{}}>Osobni podaci</h4>
                <Button
                  icon="pi pi-pencil"
                  label="Uredi"
                  onClick={() => setEditDialogVisible(true)}
                  severity="secondary"
                  outlined
                  size="small"
                  style={{ width: "10%" }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  flexWrap: "wrap",
                }}
              >
                <span
                  className="p-float-label"
                  style={{ flex: 1, marginBottom: "1rem" }}
                >
                  <InputText id="firstName" value={firstName} disabled />
                  <label htmlFor="firstName">Korisničko ime</label>
                </span>
              </div>

              <div className="p-float-label" style={{ marginTop: "1rem" }}>
                <InputText
                  id="email"
                  value={email}
                  disabled
                  style={{ width: "100%" }}
                />
                <label htmlFor="email">E-mail adresa</label>
              </div>
              <Button
                label="Deaktiviraj račun"
                icon="pi pi-power-off"
                className="p-button-danger"
                style={{ marginTop: "2rem" }}
                onClick={() => setShowDeactivateDialog(true)}
              />
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
                    {user.org_role === "admin" ? "Administrator" : "Član"}
                  </p>
                  <p>
                    <strong>Broj članova:</strong> {users.length}
                  </p>
                  {user.org_role === "admin" && (
                    <Button
                      icon="pi pi-user-plus"
                      label="Pozovi korisnika"
                      size="small"
                      severity="success"
                      onClick={() => setShowAddUserDialog(true)}
                      style={{ marginTop: "1rem", marginBottom: "1rem" }}
                    />
                  )}

                  <DataTable
                    value={users}
                    responsiveLayout="scroll"
                    stripedRows
                    size="small"
                  >
                    <Column field="name" header="Ime i prezime" />
                    <Column field="email" header="Email" />
                    <Column
                      header="Uloga"
                      body={(rowData) =>
                        rowData.role === "admin"
                          ? "Administrator"
                          : rowData.role === "member"
                          ? "Član"
                          : "Korisnik"
                      }
                    />

                    {user.org_role === "admin" && (
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
                    )}
                  </DataTable>
                </>
              ) : (
                <p>Niste povezani s organizacijom.</p>
              )}
            </Panel>
          )}

          {activeSection === "kontakti" && <ContactsManagement user={user} />}

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
          <Column
            header="Uloga"
            body={(rowData) =>
              rowData.role === "admin"
                ? "Administrator"
                : rowData.role === "member"
                ? "Član"
                : "Korisnik"
            }
          />

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
              onClick={handleInviteUser}
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
      <Dialog
        header="Uredi osobne podatke"
        visible={editDialogVisible}
        style={{ width: "35vw" }}
        modal
        onHide={() => {
          setEditDialogVisible(false);
          setPassword("");
          setChangePassword(false);
        }}
      >
        <div className="p-fluid">
          <div className="p-field">
            <label htmlFor="firstName">Korisničko ime</label>
            <InputText
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div className="p-field">
            <label htmlFor="email">Email adresa</label>
            <InputText
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              marginTop: "1rem",
              marginBottom: "1rem",
            }}
          >
            <Checkbox
              inputId="changePassword"
              checked={changePassword}
              onChange={(e) => {
                setChangePassword(e.checked);
                if (!e.checked) setPassword("");
              }}
              style={{ width: "5%" }}
            />
            <label htmlFor="changePassword">Želim promijeniti lozinku</label>
          </div>

          {changePassword && (
            <div className="p-field">
              <label htmlFor="password">Nova lozinka</label>
              <Password
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                feedback={false}
                toggleMask={false}
                style={{ width: "100%" }}
              />
            </div>
          )}

          <div style={{ textAlign: "right", marginTop: "1rem" }}>
            <Button
              label="Spremi"
              icon="pi pi-check"
              onClick={() => {
                setEditDialogVisible(false);
                setConfirmPasswordDialog(true);
              }}
              severity="success"
            />
          </div>
        </div>
      </Dialog>

      <Dialog
        header="Potvrdi identitet"
        visible={confirmPasswordDialog}
        style={{ width: "30vw" }}
        modal
        onHide={() => {
          setConfirmPasswordDialog(false);
          setCurrentPassword("");
        }}
      >
        <div className="p-fluid">
          <div className="p-field">
            <label htmlFor="currentPassword">Trenutna lozinka</label>
            <Password
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              feedback={false}
              toggleMask={false}
              style={{ width: "100%" }}
            />
          </div>
          <div style={{ textAlign: "right", marginTop: "1rem" }}>
            <Button
              label="Potvrdi"
              icon="pi pi-check"
              onClick={confirmAndSave}
              severity="success"
              disabled={!currentPassword}
            />
          </div>
        </div>
      </Dialog>
      <Dialog
        header="Deaktivacija računa"
        visible={showDeactivateDialog}
        style={{ width: "30vw" }}
        modal
        onHide={() => {
          setShowDeactivateDialog(false);
          setDeactivatePassword("");
        }}
      >
        <div className="p-fluid">
          <p style={{ marginBottom: "1rem" }}>
            Jeste li sigurni da želite deaktivirati račun? <br />
            Ponovno aktiviranje računa moguće je samo kontaktiranjem sistemskog
            administratora.
          </p>
          <div className="p-field">
            <label htmlFor="deactivatePassword">
              Unesite lozinku za potvrdu
            </label>
            <Password
              id="deactivatePassword"
              value={deactivatePassword}
              onChange={(e) => setDeactivatePassword(e.target.value)}
              feedback={false}
              toggleMask
              style={{ width: "100%" }}
            />
          </div>
          <div style={{ textAlign: "right", marginTop: "1rem" }}>
            <Button
              label="Deaktiviraj"
              icon="pi pi-times-circle"
              severity="danger"
              disabled={!deactivatePassword}
              onClick={handleDeactivateAccount}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
