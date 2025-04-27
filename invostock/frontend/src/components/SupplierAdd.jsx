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

  const handleSubmit = async () => {
    if (!supplierData.name.trim()) {
      toast.current.show({
        severity: "warn",
        summary: "Greška",
        detail: "Naziv je obavezan",
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

      <InputText
        value={supplierData.name}
        onChange={(e) =>
          setSupplierData({ ...supplierData, name: e.target.value })
        }
        placeholder="Naziv"
        style={{ marginBottom: "1rem" }}
      />
      <InputText
        value={supplierData.address}
        onChange={(e) =>
          setSupplierData({ ...supplierData, address: e.target.value })
        }
        placeholder="Adresa"
        style={{ marginBottom: "1rem" }}
      />
      <InputText
        value={supplierData.city}
        onChange={(e) =>
          setSupplierData({ ...supplierData, city: e.target.value })
        }
        placeholder="Grad"
        style={{ marginBottom: "1rem" }}
      />
      <InputText
        value={supplierData.country}
        onChange={(e) =>
          setSupplierData({ ...supplierData, country: e.target.value })
        }
        placeholder="Država"
        style={{ marginBottom: "1rem" }}
      />
      <InputText
        value={supplierData.phone}
        onChange={(e) =>
          setSupplierData({ ...supplierData, phone: e.target.value })
        }
        placeholder="Telefon"
        style={{ marginBottom: "1rem" }}
      />
      <InputText
        value={supplierData.email}
        onChange={(e) =>
          setSupplierData({ ...supplierData, email: e.target.value })
        }
        placeholder="Email"
        style={{ marginBottom: "1rem" }}
      />

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
