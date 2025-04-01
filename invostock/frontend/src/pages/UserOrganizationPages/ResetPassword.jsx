import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { useRef } from "react";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const toast = useRef(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      toast.current.show({
        severity: "warn",
        summary: "Upozorenje",
        detail: "Unesite obje lozinke.",
        life: 3000,
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.current.show({
        severity: "error",
        summary: "Greška",
        detail: "Lozinke se ne podudaraju.",
        life: 3000,
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/users/reset-password/${token}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newPassword }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        toast.current.show({
          severity: "success",
          summary: "Uspjeh",
          detail: "Lozinka je promijenjena.",
          life: 3000,
        });

        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        toast.current.show({
          severity: "error",
          summary: "Greška",
          detail: data.message || "Neuspješno resetiranje.",
          life: 3000,
        });
      }
    } catch (err) {
      console.error(err);
      toast.current.show({
        severity: "error",
        summary: "Greška",
        detail: "Pokušajte ponovno kasnije.",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-password-container" style={{ paddingTop: "5rem" }}>
      <Toast ref={toast} />
      <div className="card" style={{ width: "25rem", margin: "auto" }}>
        <h2>Reset lozinke</h2>
        <form onSubmit={handleReset}>
          <div className="field">
            <label htmlFor="newPassword">Nova lozinka</label>
            <InputText
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div className="field" style={{ marginTop: "1rem" }}>
            <label htmlFor="confirmPassword">Ponovi lozinku</label>
            <InputText
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <Button
            type="submit"
            label={loading ? "Resetiram..." : "Resetiraj lozinku"}
            disabled={loading}
            style={{ marginTop: "1.5rem", width: "100%" }}
          />
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
