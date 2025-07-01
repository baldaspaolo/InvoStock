import React, { useState, useRef } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";

const ForgotPasswordDialog = () => {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/users/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        toast.current.show({
          severity: "success",
          summary: "Uspjeh",
          detail:
            "Ako postoji račun s ovom email adresom, poslali smo vam link za resetiranje lozinke.",
          life: 5000,
        });
        setVisible(false);
      } else {
        toast.current.show({
          severity: "error",
          summary: "Greška",
          detail: data.message || "Došlo je do pogreške pri slanju zahtjeva",
          life: 3000,
        });
      }
    } catch (err) {
      console.error(err);
      toast.current.show({
        severity: "error",
        summary: "Greška",
        detail: "Pokušajte ponovno kasnije",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const footerContent = (
    <div>
      <Button
        label="Odustani"
        icon="pi pi-times"
        onClick={() => setVisible(false)}
        className="p-button-text"
      />
      <Button
        label={loading ? "Slanje..." : "Pošalji"}
        icon="pi pi-send"
        onClick={handleSubmit}
        loading={loading}
        disabled={loading}
      />
    </div>
  );

  return (
    <>
      <Toast ref={toast} />
      <a
        href="#!"
        onClick={(e) => {
          e.preventDefault();
          setVisible(true);
        }}
        style={{ textDecoration: "underline", cursor: "pointer" }}
      >
        Zaboravljena lozinka
      </a>

      <Dialog
        header="Resetiranje lozinke"
        visible={visible}
        style={{ width: "450px" }}
        onHide={() => setVisible(false)}
        footer={footerContent}
      >
        <div className="p-fluid">
          <div className="p-field">
            <label htmlFor="email">Unesite svoju email adresu</label>
            <InputText
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="p-mt-2"
              placeholder="primjer@mail.com"
            />
            <small className="p-text-secondary">
              Poslat ćemo vam link za resetiranje lozinke na unesenu email
              adresu.
            </small>
          </div>
        </div>
      </Dialog>
    </>
  );
};

export default ForgotPasswordDialog;
