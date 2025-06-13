import React, { useState, useRef, useContext } from "react";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { AuthContext } from "../context/AuthContext";

const SupplierAdd = ({ userId, organizationId, onSuccess }) => {
  const toast = useRef(null);
  const { user } = useContext(AuthContext);

  const [supplierData, setSupplierData] = useState({
    name: "",
    address: "",
    city: "",
    country: "",
    phone: "",
    email: "",
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

    if (!supplierData.name.trim()) {
      newErrors.name = "Naziv je obavezan.";
    }

    if (!supplierData.email.trim()) {
      newErrors.email = "Email je obavezan.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supplierData.email)) {
      newErrors.email = "Email nije ispravan.";
    }

    if (supplierData.phone && !/^[\d+\-\s]+$/.test(supplierData.phone)) {
      newErrors.phone = "Telefon može sadržavati samo brojeve, razmake, + i -.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      toast.current.show({
        severity: "warn",
        summary: "Greška",
        detail: "Molimo ispravite unesene podatke.",
        life: 3000,
      });
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/suppliers/addSupplier`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            organizationId: user.organization_id,
            ...supplierData,
          }),
        }
      );

      const data = await res.json();
      if (data.success) {
        toast.current.show({
          severity: "success",
          summary: "Uspjeh",
          detail: "Dobavljač uspješno dodan",
          life: 3000,
        });
        if (onSuccess) onSuccess(data.supplier);
        setSupplierData({
          name: "",
          address: "",
          city: "",
          country: "",
          phone: "",
          email: "",
        });
        setErrors({});
      } else {
        toast.current.show({
          severity: "error",
          summary: "Greška",
          detail: data.error || "Dogodila se pogreška.",
          life: 3000,
        });
      }
    } catch (err) {
      console.error("Greška kod dodavanja dobavljača:", err);
      toast.current.show({
        severity: "error",
        summary: "Greška",
        detail: "Dogodila se pogreška.",
        life: 3000,
      });
    }
  };

  return (
    <div className="p-fluid">
      <Toast ref={toast} />

      <div style={{ marginBottom: "1rem" }}>
        <InputText
          value={supplierData.name}
          onChange={(e) =>
            setSupplierData({ ...supplierData, name: e.target.value })
          }
          placeholder="Naziv"
        />
        {errors.name && <small style={{ color: "red" }}>{errors.name}</small>}
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <InputText
          value={supplierData.address}
          onChange={(e) =>
            setSupplierData({ ...supplierData, address: e.target.value })
          }
          placeholder="Adresa"
        />
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <InputText
          value={supplierData.city}
          onChange={(e) =>
            setSupplierData({ ...supplierData, city: e.target.value })
          }
          placeholder="Grad"
        />
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <InputText
          value={supplierData.country}
          onChange={(e) =>
            setSupplierData({ ...supplierData, country: e.target.value })
          }
          placeholder="Država"
        />
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <InputText
          value={supplierData.phone}
          onChange={(e) =>
            setSupplierData({ ...supplierData, phone: e.target.value })
          }
          placeholder="Telefon"
        />
        {errors.phone && <small style={{ color: "red" }}>{errors.phone}</small>}
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <InputText
          value={supplierData.email}
          onChange={(e) =>
            setSupplierData({ ...supplierData, email: e.target.value })
          }
          placeholder="Email"
        />
        {errors.email && <small style={{ color: "red" }}>{errors.email}</small>}
      </div>

      <Button
        label="Dodaj dobavljača"
        icon="pi pi-plus"
        className="p-button-success"
        onClick={handleSubmit}
      />
    </div>
  );
};

export default SupplierAdd;
