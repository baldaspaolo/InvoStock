import React, { useState } from "react";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Message } from "primereact/message";
import { RadioButton } from "primereact/radiobutton";
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
        const orgResponse = await fetch(
          "http://localhost:3000/registerOrganization",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: orgName,
              address: orgAddress,
            }),
          }
        );

        const orgData = await orgResponse.json();
        if (!orgData.success) {
          alert("Greška pri registraciji organizacije!");
          return;
        }

        const userResponse = await fetch("http://localhost:3000/registerUser", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            email,
            password,
            organizationId: orgData.organizationId,
          }),
        });

        const userData = await userResponse.json();
        if (userData.success) {
          alert("Uspješna registracija!");
        } else {
          alert("Greška pri registraciji korisnika!");
        }
      } else {
        const userResponse = await fetch("http://localhost:3000/registerUser", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        const userData = await userResponse.json();
        if (userData.success) {
          alert("Uspješna registracija!");
        } else {
          alert("Greška pri registraciji korisnika!");
        }
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        justifyContent: "center",
        marginTop: "5%",
      }}
    >
      <Card title="" style={{ width: "25rem", padding: "20px" }}>
        <div className="text-center mb-5">
          <img
            src="/photos/logo-no-background.svg"
            alt="Logo"
            style={{ width: "60%", height: "60%", marginBottom: "20px" }}
          />
          <div
            className="text-900 text-3xl font-medium mb-3"
            style={{ marginBottom: "10%" }}
          >
            Registrirajte se!
          </div>
        </div>
        {error && <Message severity="error" text={error} />}

        <form onSubmit={handleRegister}>
          <div className="field" style={{ marginBottom: "15px" }}>
            <label htmlFor="name">Korisničko ime</label>
            <InputText
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              placeholder="Unesite korisničko ime"
              required
              className="p-inputtext-lg"
            />
          </div>
          <div className="field" style={{ marginBottom: "15px" }}>
            <label htmlFor="email">Email</label>
            <InputText
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="Unesite email adresu"
              required
              className="p-inputtext-lg"
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
              className="p-inputtext-lg"
            />
          </div>

          <div className="field" style={{ marginBottom: "15px" }}>
            <label>Vrsta korisnika</label>
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
                  onChange={() => setIsOrganization(true)}
                  checked={isOrganization}
                />
                <label htmlFor="organization" style={{ marginLeft: "5px" }}>
                  Organizacija
                </label>
              </div>
            </div>
          </div>

          {isOrganization && (
            <>
              <div className="field" style={{ marginBottom: "15px" }}>
                <label htmlFor="orgName">Ime organizacije</label>
                <InputText
                  id="orgName"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  type="text"
                  placeholder="Unesite ime organizacije"
                  required
                  className="p-inputtext-lg"
                />
              </div>
              <div className="field" style={{ marginBottom: "15px" }}>
                <label htmlFor="orgEmail">Email organizacije</label>
                <InputText
                  id="orgEmail"
                  value={orgEmail}
                  onChange={(e) => setOrgEmail(e.target.value)}
                  type="email"
                  placeholder="Unesite email organizacije"
                  required
                  className="p-inputtext-lg"
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
                  className="p-inputtext-lg"
                />
              </div>
            </>
          )}
          <a href="/login">
            <u>Već ste registrirani? Prijavite se!</u>
          </a>

          <Button
            label="Registracija"
            className="p-button-lg"
            type="submit"
            style={{ marginTop: "10px" }}
          />
        </form>
      </Card>
    </div>
  );
};

export default Register;
