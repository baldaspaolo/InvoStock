import React, { useState } from "react";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Message } from "primereact/message";
import "../styles/login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Simulirani login bez API poziva
  const handleLogin = (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Email i lozinka su obavezni!");
      return;
    } else {
      handleLoginAsync();
    }

    setEmail("");
    setPassword("");
  };

  const handleLoginAsync = async () => {
    try {
      const response = await fetch("http://localhost:3000/getUser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const data = await response.json();
      console.log(data);

      if (data.success == true) {
        alert("Prijavljeni ste!");
      } else {
        alert("Neuspješna prijava");
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
        marginTop: "5%",
      }}
    >
      <img
        src="/photos/logo-no-background.svg"
        alt="Logo"
        style={{ width: "50%", height: "50%", marginBottom: "20px" }}
      />
      <Card title="Login" style={{ width: "25rem" }}>
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
              className="p-inputtext-lg"
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
              className="p-inputtext-lg"
            />
          </div>
          <a href="/register">
            <u>Nemate račun? Registrirajte se!</u>
          </a>
          <Button label="Login" className="mt-3 p-button-lg" type="submit" />
        </form>
      </Card>
    </div>
  );
};

export default Login;
