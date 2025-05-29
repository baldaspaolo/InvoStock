import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Message } from "primereact/message";
import { RadioButton } from "primereact/radiobutton";
import { Toast } from "primereact/toast";

import "../styles/login.css";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isOrganization, setIsOrganization] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [orgEmail, setOrgEmail] = useState("");
  const [orgAddress, setOrgAddress] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const toast = useRef(null);

  const handleRegister = (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password || !name) {
      setError("Sva polja su obavezna!");
      return;
    }

    if (isOrganization && (!orgName || !orgEmail || !orgAddress)) {
      setError("Sva polja organizacije su obavezna!");
      return;
    }

    handleRegisterAsync();
    setEmail("");
    setPassword("");
    setName("");
    setOrgName("");
    setOrgEmail("");
    setOrgAddress("");
  };

  const handleRegisterAsync = async () => {
    try {
      if (isOrganization) {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/users/registerOrganizationUser`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name,
              email,
              password,
              orgName,
              orgAddress,
            }),
          }
        );

        const data = await response.json();
        if (data.success) {
          toast.current.show({
            severity: "success",
            summary: "Organizacija i korisnik (admin) uspješno registrirani!",
            life: 3000,
          });
          setTimeout(() => {
            navigate("/login");
          }, 2000);
        } else {
          toast.current.show({
            severity: "danger",
            summary: "Greška pri registraciji organizacije ili korisnika!",
            life: 3000,
          });
        }
      } else {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/users/registerUser`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password }),
          }
        );

        const data = await response.json();
        if (data.success) {
          toast.current.show({
            severity: "success",
            summary: "Registracija uspješna!",
            detail: "Možete se sada prijaviti.",
            life: 3000,
          });
          setTimeout(() => {
            navigate("/login");
          }, 3000);
        } else {
          toast.current.show({
            severity: "danger",
            summary: "Greška pri registraciji organizacije ili korisnika!",
            life: 3000,
          });
        }
      }

      setEmail("");
      setPassword("");
      setName("");
      setOrgName("");
      setOrgEmail("");
      setOrgAddress("");
    } catch (error) {
      console.error("Greška:", error);
      toast.current.show({
        severity: "danger",
        summary: "Greška pri registraciji organizacije ili korisnika!",
        life: 3000,
      });
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        marginTop: "5%",
      }}
    >
      <Toast ref={toast} />

      <Card title="" style={{ width: "25rem" }}>
        <img
          src="/photos/logo-no-background.svg"
          alt="Logo"
          style={{ width: "60%", height: "60%", marginBottom: "20px" }}
        />
        <div className="text-900 text-3xl font-medium mb-4">
          Registrirajte se
        </div>

        <div className="field" style={{ marginBottom: "25px" }}>
          <label>Registriram se kao:</label>
          <div
            style={{
              display: "flex",
              gap: "20px",
              alignItems: "center",
              justifyContent: "center",
              marginTop: "5px",
            }}
          >
            <div>
              <RadioButton
                inputId="individual"
                name="userType"
                value={false}
                onChange={() => setIsOrganization(false)}
                checked={!isOrganization}
              />
              <label htmlFor="individual" style={{ marginLeft: "5px" }}>
                Pojedinac
              </label>
            </div>
            <div>
              <RadioButton
                inputId="organization"
                name="userType"
                value={true}
                onChange={() => {
                  setIsOrganization(true);
                  setOrgName("");
                  setOrgEmail("");
                  setOrgAddress("");
                }}
                checked={isOrganization}
              />
              <label htmlFor="organization" style={{ marginLeft: "5px" }}>
                Organizacija
              </label>
            </div>
          </div>
        </div>

        {error && <Message severity="error" text={error} />}

        <form onSubmit={handleRegister}>
          {/* 🎯 Unos korisnika */}
          <div className="field">
            <label htmlFor="name">Korisničko ime</label>
            <InputText
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              placeholder="Unesite korisničko ime"
              required
              className="p-inputtext-m"
            />
          </div>

          <div className="field">
            <label htmlFor="email">Email</label>
            <InputText
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="Unesite email adresu"
              required
              className="p-inputtext-m"
            />
          </div>

          <div className="field" style={{ marginBottom: "15px" }}>
            <label htmlFor="password">Zaporka</label>
            <InputText
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="Unesite zaporku"
              required
              className="p-inputtext-m"
            />
          </div>

          {/* 📦 Ako je organizacija, prikazujemo dodatna polja */}
          {isOrganization && (
            <>
              <Message
                severity="info"
                text="Vi ćete biti administrator organizacije."
                style={{ marginBottom: "15px" }}
              />
              <div className="field">
                <label htmlFor="orgName">Ime organizacije</label>
                <InputText
                  id="orgName"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  type="text"
                  placeholder="Unesite ime organizacije"
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="orgEmail">Email organizacije</label>
                <InputText
                  id="orgEmail"
                  value={orgEmail}
                  onChange={(e) => setOrgEmail(e.target.value)}
                  type="email"
                  placeholder="Unesite email organizacije"
                  required
                />
              </div>

              <div className="field" style={{ marginBottom: "15px" }}>
                <label htmlFor="orgAddress">Adresa organizacije</label>
                <InputText
                  id="orgAddress"
                  value={orgAddress}
                  onChange={(e) => setOrgAddress(e.target.value)}
                  type="text"
                  placeholder="Unesite adresu organizacije"
                  required
                />
              </div>
            </>
          )}

          <a href="/login">
            <u>Već ste registrirani? Prijavite se!</u>
          </a>

          <Button
            label="Registracija"
            className="p-button-m"
            type="submit"
            style={{ marginTop: "10px" }}
          />
        </form>
      </Card>
    </div>
  );
};

export default Register;
