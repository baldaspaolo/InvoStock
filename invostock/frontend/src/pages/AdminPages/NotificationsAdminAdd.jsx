import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { Panel } from "primereact/panel";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { RadioButton } from "primereact/radiobutton";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";

const NotificationsAdminAdd = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const toast = React.useRef(null);

  const [organizations, setOrganizations] = useState([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("info");
  const [targetType, setTargetType] = useState("global"); // 'global' | 'organization'
  const [selectedOrg, setSelectedOrg] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (targetType === "organization") {
      fetchOrganizations();
    }
  }, [targetType]);

  const fetchOrganizations = async () => {
    try {
      const res = await fetch(
        `${API_URL}/api/organizations/getAllOrganizations`
      );
      const data = await res.json();
      if (data.success) {
        setOrganizations(data.organizations);
      }
    } catch (err) {
      console.error("Greška prilikom dohvaćanja organizacija:", err);
    }
  };

  const handleSubmit = async () => {
    if (!title || !message) {
      toast.current.show({
        severity: "warn",
        summary: "Greška",
        detail: "Naslov i poruka su obavezni.",
      });
      return;
    }

    const payload = {
      senderUserId: user.id,
      title,
      message,
      type,
      isGlobal: targetType === "global",
      organizationId: targetType === "organization" ? selectedOrg?.id : null,
    };

    try {
      const res = await fetch(`${API_URL}/api/notifications/addNotification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.current.show({
          severity: "success",
          summary: "Uspjeh",
          detail: "Obavijest je poslana.",
        });
        setTimeout(() => navigate("/admin/notifications"), 1000);
      } else {
        toast.current.show({
          severity: "error",
          summary: "Greška",
          detail: data.message || "Neuspješno slanje.",
        });
      }
    } catch (err) {
      console.error("Greška prilikom slanja:", err);
      toast.current.show({
        severity: "error",
        summary: "Greška",
        detail: "Greška na serveru.",
      });
    }
  };

  return (
    <div style={{ margin: "5%" }}>
      <Toast ref={toast} />
      <div style={{ display: "flex", marginBottom: "2%" }}>
        <Button
          icon="pi pi-arrow-left"
          text
          raised
          severity="secondary"
          onClick={() => navigate("/admin/notifications")}
          style={{ width: "10%" }}
        />
      </div>
      <Panel header="Nova obavijest">
        <div
          className="p-fluid"
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          <div>
            <label htmlFor="title">Naslov</label>
            <InputText
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="message">Poruka</label>
            <InputText
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <div>
            <label>Vrsta obavijesti</label>
            <Dropdown
              value={type}
              options={[
                { label: "Info", value: "info" },
                { label: "Upozorenje", value: "warning" },
                { label: "Greška", value: "error" },
                { label: "Uspjeh", value: "success" },
              ]}
              onChange={(e) => setType(e.value)}
              placeholder="Odaberi tip"
            />
          </div>

          <div>
            <label style={{ marginBottom: "0.5rem", display: "block" }}>
              Primatelji
            </label>

            <div
              style={{
                display: "flex",
                gap: "2rem",
                alignItems: "center",
                marginLeft: "40%",
                marginTop: "2%",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <RadioButton
                  inputId="global"
                  name="target"
                  value="global"
                  onChange={(e) => setTargetType(e.value)}
                  checked={targetType === "global"}
                />
                <label htmlFor="global">Svi korisnici</label>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <RadioButton
                  inputId="org"
                  name="target"
                  value="organization"
                  onChange={(e) => setTargetType(e.value)}
                  checked={targetType === "organization"}
                />
                <label htmlFor="org">Odabrana organizacija</label>
              </div>
            </div>
          </div>

          {targetType === "organization" && (
            <div>
              <label>Organizacija</label>
              <Dropdown
                value={selectedOrg}
                options={organizations}
                optionLabel="name"
                placeholder="Odaberi organizaciju"
                onChange={(e) => setSelectedOrg(e.value)}
              />
            </div>
          )}

          <div>
            <Button
              label="Pošalji obavijest"
              className="p-button-success"
              onClick={handleSubmit}
            />
          </div>
        </div>
      </Panel>
    </div>
  );
};

export default NotificationsAdminAdd;
