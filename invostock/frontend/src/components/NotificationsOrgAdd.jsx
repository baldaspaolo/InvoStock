import React, { useState, useContext } from "react";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { AuthContext } from "../context/AuthContext";
import { Panel } from "primereact/panel";

import "../pages/UserOrganizationPages/style.css";

const NotificationsOrgAdd = () => {
  const { user } = useContext(AuthContext);
  const toast = React.useRef(null);

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("info");

  const typeOptions = [
    { label: "Informacija", value: "info" },
    { label: "Upozorenje", value: "warning" },
    { label: "Opasnost", value: "danger" },
  ];

  const handleSend = async () => {
    if (!title || !message) {
      toast.current.show({
        severity: "warn",
        summary: "Upozorenje",
        detail: "Naslov i poruka su obavezni!",
      });
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/notifications/addNotification`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            senderUserId: user.id,
            title,
            message,
            type,
            organizationId: user.organization_id,
            isGlobal: false,
          }),
        }
      );

      const data = await res.json();

      if (data.success) {
        toast.current.show({
          severity: "success",
          summary: "Uspjeh",
          detail: "Obavijest poslana!",
        });
        setTitle("");
        setMessage("");
        setType("info");
      } else {
        toast.current.show({
          severity: "error",
          summary: "Greška",
          detail: data.error || "Nešto je pošlo po zlu.",
        });
      }
    } catch (error) {
      console.error("Greška:", error);
      toast.current.show({
        severity: "error",
        summary: "Greška",
        detail: "Greška pri slanju zahtjeva!",
      });
    }
  };

  return (
    <Panel
      header="Pošalji obavijest članovima organizacije"
      style={{ margin: "2rem auto", maxWidth: "600px" }}
    >
      <Toast ref={toast} />
      <div className="p-fluid p-formgrid p-grid">
        <div className="p-field p-col-12">
          <label htmlFor="title">Naslov</label>
          <InputText
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="p-field p-col-12">
          <label htmlFor="message">Poruka</label>
          <InputTextarea
            id="message"
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        <div className="p-field p-col-12">
          <label htmlFor="type">Važnost</label>
          <Dropdown
            id="type"
            value={type}
            options={typeOptions}
            onChange={(e) => setType(e.value)}
          />
        </div>
        <div className="p-field p-col-12">
          <Button
            label="Pošalji obavijest"
            icon="pi pi-send"
            onClick={handleSend}
          />
        </div>
      </div>
    </Panel>
  );
};

export default NotificationsOrgAdd;
