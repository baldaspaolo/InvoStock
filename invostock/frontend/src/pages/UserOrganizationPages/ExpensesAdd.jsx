import React, { useState, useEffect, useRef, useContext } from "react";
import { Panel } from "primereact/panel";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { Dialog } from "primereact/dialog";
import { AuthContext } from "../../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL;

const ExpensesAdd = () => {
  const { user } = useContext(AuthContext);
  const toast = useRef(null);

  const [expense, setExpense] = useState({
    name: "",
    amount: "",
    date: null,
    description: "",
    categoryId: null,
  });

  const [categories, setCategories] = useState([]);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  useEffect(() => {
    const fetchCategories = async () => {
      const res = await fetch(`${API_URL}/api/expenses/getExpenseCategories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (data.success) setCategories(data.categories);
    };
    fetchCategories();
  }, [user.id]);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    const res = await fetch(`${API_URL}/api/expenses/addExpenseCategory`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, name: newCategoryName }),
    });
    const data = await res.json();
    if (data.success) {
      const newCat = { id: data.categoryId, name: newCategoryName };
      setCategories([...categories, newCat]);
      setExpense({ ...expense, categoryId: newCat.id });
      setShowCategoryDialog(false);
      setNewCategoryName("");
    }
  };

  const handleSubmit = async () => {
    if (
      !expense.name ||
      !expense.amount ||
      !expense.date ||
      !expense.categoryId
    ) {
      toast.current.show({
        severity: "warn",
        summary: "Upozorenje",
        detail: "Popunite sva obavezna polja",
        life: 3000,
      });
      return;
    }

    const payload = {
      userId: user.id,
      organizationId: user.organization_id,
      name: expense.name,
      amount: parseFloat(expense.amount),
      description: expense.description,
      date: expense.date.toISOString(),
      categoryId: expense.categoryId,
    };

    const res = await fetch(`${API_URL}/api/expenses/addExpense`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (data.success) {
      toast.current.show({
        severity: "success",
        summary: "Uspjeh",
        detail: `Trošak dodan (${data.custom_expense_code})`,
        life: 3000,
      });
      setExpense({
        name: "",
        amount: "",
        date: null,
        description: "",
        categoryId: null,
      });
    } else {
      toast.current.show({
        severity: "error",
        summary: "Greška",
        detail: data.message || "Neuspješno dodavanje",
        life: 3000,
      });
    }
  };

  return (
    <div style={{ padding: "2% 5%", marginTop: "3%" }}>
      <Toast ref={toast} />
      <Panel header="Dodaj novi trošak" style={{ fontSize: "0.88rem" }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ width: "100%", maxWidth: "500px" }}>
            <div className="field">
              <label>Naziv troška *</label>
              <InputText
                value={expense.name}
                onChange={(e) =>
                  setExpense({ ...expense, name: e.target.value })
                }
              />
            </div>

            <div className="field">
              <label>Kategorija *</label>
              <div
                style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}
              >
                <Dropdown
                  value={expense.categoryId}
                  options={categories}
                  onChange={(e) =>
                    setExpense({ ...expense, categoryId: e.value })
                  }
                  optionLabel="name"
                  optionValue="id"
                  placeholder="Odaberi kategoriju"
                  style={{ flex: 1 }}
                />
                <Button
                  icon="pi pi-plus"
                  rounded
                  severity="success"
                  onClick={() => setShowCategoryDialog(true)}
                  size="small"
                />
              </div>
            </div>

            <div className="field">
              <label>Iznos (€) *</label>
              <InputText
                type="number"
                value={expense.amount}
                onChange={(e) =>
                  setExpense({ ...expense, amount: e.target.value })
                }
              />
            </div>

            <div className="field">
              <label>Datum *</label>
              <Calendar
                value={expense.date}
                onChange={(e) => setExpense({ ...expense, date: e.value })}
                showIcon
                dateFormat="dd.mm.yy"
                style={{ width: "100%" }}
              />
            </div>

            <div className="field">
              <label>Opis</label>
              <InputText
                value={expense.description}
                onChange={(e) =>
                  setExpense({ ...expense, description: e.target.value })
                }
              />
            </div>

            <div style={{ textAlign: "right", marginTop: "1.5rem" }}>
              <Button
                label="Spremi trošak"
                icon="pi pi-check"
                onClick={handleSubmit}
                severity="success"
              />
            </div>
          </div>
        </div>
      </Panel>

      <Dialog
        header="Nova kategorija"
        visible={showCategoryDialog}
        style={{ width: "25rem" }}
        onHide={() => setShowCategoryDialog(false)}
      >
        <div className="p-fluid">
          <div className="field">
            <label>Naziv kategorije</label>
            <InputText
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="npr. Održavanje, Marketing..."
            />
          </div>
          <Button
            label="Dodaj"
            icon="pi pi-check"
            onClick={handleAddCategory}
            style={{ marginTop: "1rem" }}
          />
        </div>
      </Dialog>
    </div>
  );
};

export default ExpensesAdd;
