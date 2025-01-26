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
    setError(""); // Resetiraj prethodne pogreške

    // Provjeri je li unos valjan
    if (!email || !password) {
      setError("Email i lozinka su obavezni!");
      return;
    }

    // Ako su podaci ispravni, prikaži alert
    alert(`Prijavljeni ste kao: ${email}`);
    setEmail("");
    setPassword("");
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: " center",
      }}
    >
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
              placeholder="Enter your email"
              required
              className="p-inputtext-lg"
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <InputText
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="Enter your password"
              required
              className="p-inputtext-lg"
            />
          </div>
          <Button label="Login" className="mt-3 p-button-lg" type="submit" />
        </form>
      </Card>
    </div>
  );
};

export default Login;
