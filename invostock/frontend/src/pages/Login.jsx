import React, { useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useContext } from "react";
import { useNavigate } from "react-router-dom";

import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Message } from "primereact/message";
import "../styles/login.css";

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    handleLoginAsync();
  };

  const handleLoginAsync = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/users/getUser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        login(data.user); //ls

        window.toast.show({
          severity: "success",
          summary: "Prijava uspješna",
          detail: `Pozdrav, ${data.user.name}! Dobrodošao!`,
          life: 3000,
        });

        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      } else {
        window.toast.show({
          severity: "error",
          summary: "Neuspješna prijava",
          detail: "Provjerite email i lozinku.",
          life: 3000,
        });
      }
    } catch (error) {
      console.error("Greška:", error);
      window.toast.show({
        severity: "error",
        summary: "Greška",
        detail: "Došlo je do pogreške prilikom prijave.",
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
      <Card title="" style={{ width: "25rem" }}>
        <div className="r mb-5">
          <img
            src="/photos/logo-no-background.svg"
            alt="Logo"
            style={{ width: "60%", height: "60%", marginBottom: "20px" }}
          />
          <div
            className="text-900 text-3xl font-medium mb-3"
            style={{ marginBottom: "10%" }}
          >
            Dobrodošli natrag!
          </div>
        </div>

        {error && <Message severity="error" text={error} />}

        <form onSubmit={handleLogin}>
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
          <div className="field">
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
          <a href="/register">
            <u>Nemate račun? Registrirajte se!</u>
          </a>
          <Button label="Login" className="mt-3 p-button-m" type="submit" />
        </form>
      </Card>
    </div>
  );
};

export default Login;
