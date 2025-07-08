// Expenses.jsx
import React, { useState, useRef, useEffect, useContext, useMemo } from "react";
import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";

import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { InputText } from "primereact/inputtext";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Panel } from "primereact/panel";
import { Menu } from "primereact/menu";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";

import "./style.css";

const Expenses = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const categoryMenuRef = useRef(null);
  const toast = useRef(null);

  const [editedCategory, setEditedCategory] = useState(null);
  const [editedName, setEditedName] = useState("");
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [expandedRows, setExpandedRows] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editExpense, setEditExpense] = useState(null);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showCategoryListDialog, setShowCategoryListDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [summary, setSummary] = useState(null);
  const [interval, setInterval] = useState("last_30_days");
  const [stats, setStats] = useState(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    categoryId: null,
    amount: "",
    date: null,
  });

  const getRange = (type) => {
    const today = new Date();
    const toISO = (d) => d.toISOString().split("T")[0];

    switch (type) {
      case "last_15_days":
        return [
          toISO(new Date(today.setDate(today.getDate() - 15))),
          toISO(new Date()),
        ];
      case "last_30_days":
        return [
          toISO(new Date(today.setDate(today.getDate() - 30))),
          toISO(new Date()),
        ];
      case "this_month":
        return [
          toISO(new Date(today.getFullYear(), today.getMonth(), 1)),
          toISO(new Date()),
        ];
      case "this_quarter":
        const qStart = new Date(
          today.getFullYear(),
          Math.floor(today.getMonth() / 3) * 3,
          1
        );
        return [toISO(qStart), toISO(new Date())];
      case "this_year":
        return [toISO(new Date(today.getFullYear(), 0, 1)), toISO(new Date())];
      default:
        return [null, null];
    }
  };

  useEffect(() => {
    const [start, end] = getRange(interval);
    if (!start || !end) return;

    const fetchStats = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/expenses/getExpenseSummary`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.id,
              organizationId: user.organization_id,
            }),
          }
        );
        const data = await res.json();
        if (data.success) setStats(data);
      } catch (err) {
        console.error("Greška kod dohvaćanja općih statistika:", err);
      }
    };

    if (user?.id) fetchStats();
  }, [user]);

  const fetchExpenses = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/expenses/getUserExpenses`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user?.id,
            organizationId: user?.organization_id,
          }),
        }
      );
      const data = await res.json();
      if (data.success) setExpenses(data.expenses);
    } catch (err) {
      console.error("Greška kod dohvata troškova:", err);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchExpenses();
    }
  }, [user?.id]);

  const fetchCategories = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/expenses/getExpenseCategories`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user?.id,
            organizationId: user?.organization_id,
          }),
        }
      );
      const data = await res.json();
      if (data.success) setCategories(data.categories);
    } catch (err) {
      console.error("Greška kod dohvata kategorija:", err);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchCategories();
    }
  }, [user?.id]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const lower = searchTerm.toLowerCase();
      const matches =
        e.name.toLowerCase().includes(lower) ||
        e.category.toLowerCase().includes(lower) ||
        e.description.toLowerCase().includes(lower);
      const date = new Date(e.expense_date);
      const dateInRange =
        (!startDate || date >= new Date(startDate)) &&
        (!endDate || date <= new Date(endDate));
      return matches && dateInRange;
    });
  }, [expenses, searchTerm, startDate, endDate]);

  const menuItems = [
    {
      label: "Uredi",
      icon: "pi pi-pencil",
      command: () => {
        setForm({
          name: selectedRow.name,
          description: selectedRow.description,
          category: selectedRow.category,
          categoryId: selectedRow.category_id,
          amount: selectedRow.amount,
          date: new Date(selectedRow.expense_date),
        });
        setEditExpense(selectedRow.id);
        setShowDialog(true);
      },
    },
    {
      label: "Obriši",
      icon: "pi pi-trash",
      command: async () => {
        if (window.confirm("Jeste li sigurni da želite obrisati trošak?")) {
          try {
            await fetch(
              `${import.meta.env.VITE_API_URL}/api/expenses/deleteExpense/${
                selectedRow.id
              }`,
              {
                method: "DELETE",
              }
            );
            setExpenses(expenses.filter((exp) => exp.id !== selectedRow.id));
            fetchExpenses();
            fetchCategories();
          } catch (err) {
            console.error("Greška kod brisanja:", err);
          }
        }
      },
    },
  ];

  const categoryOptionsMenu = [
    {
      label: "Upravljanje kategorijama",
      icon: "pi pi-cog",
      command: () => setShowCategoryListDialog(true),
    },
  ];

  const saveExpense = async () => {
    try {
      const payload = {
        categoryId: form.categoryId,
        name: form.name,
        date: `${form.date.getFullYear()}-${String(
          form.date.getMonth() + 1
        ).padStart(2, "0")}-${String(form.date.getDate()).padStart(2, "0")}`,
        amount: form.amount,
        description: form.description,
      };
      await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/api/expenses/updateExpense/${editExpense}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            userId: user.id,
            organizationId: user.organization_id
          })
          
        }
      );
      setShowDialog(false);
      fetchExpenses();
      fetchCategories();
    } catch (err) {
      console.error("Greška kod spremanja izmjena:", err);
    }
  };

  const addCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/expenses/addExpenseCategory`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, name: newCategoryName, organizationId: user.organization_id }),
        }
      );

      const data = await res.json();

      if (res.status === 409) {
        toast.current.show({
          severity: "warn",
          summary: "Postojeća kategorija",
          detail: `Kategorija "${newCategoryName}" već postoji.`,
          life: 3000,
        });
        return;
      }

      if (!res.ok) {
        toast.current.show({
          severity: "error",
          summary: "Greška",
          detail: "Kategorija već postoji ili je došlo do greške.",
          life: 3000,
        });
        return;
      }

      if (data.success) {
        const newCategory = { id: data.categoryId, name: newCategoryName };
        setCategories((prev) => [...prev, newCategory]);
        setForm((prevForm) => ({ ...prevForm, categoryId: newCategory.id }));
        setShowCategoryDialog(false);
        setShowCategoryListDialog(true);
        setNewCategoryName("");

        toast.current.show({
          severity: "success",
          summary: "Kategorija dodana",
          detail: `Nova kategorija "${newCategoryName}" je dodana.`,
          life: 3000,
        });

        fetchExpenses();
        fetchCategories();
      }
    } catch (err) {
      console.error("Greška kod dodavanja kategorije:", err);
      toast.current.show({
        severity: "error",
        summary: "Greška",
        detail: "Došlo je do greške prilikom komunikacije s poslužiteljem.",
        life: 3000,
      });
    }
  };

  const inputStyle = { height: "2.5rem", width: "100%" };

  const actionBodyTemplate = (rowData) => (
    <Button
      icon="pi pi-ellipsis-h"
      text
      onClick={(event) => {
        setSelectedRow(rowData);
        menuRef.current.toggle(event);
      }}
    />
  );

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("hr-HR");

  const handleEditCategory = (category) => {
    setEditedCategory(category);
    setEditedName(category.name);
  };

  const saveEditedCategory = async () => {
    if (!editedName.trim()) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/expenses/updateExpenseCategory/${
          editedCategory.id
        }`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editedName,
            userId: user.id,
            organizationId: user.organization_id
          })
          
        }
      );
      const data = await res.json();

      if (data.success) {
        setCategories((prev) =>
          prev.map((cat) =>
            cat.id === editedCategory.id ? { ...cat, name: editedName } : cat
          )
        );
        setEditedCategory(null);
        setEditedName("");
        fetchExpenses();
        fetchCategories();
        toast.current.show({
          severity: "success",
          summary: "Kategorija ažurirana",
          detail: `Naziv je promijenjen u "${editedName}"`,
          life: 3000,
        });
      }
    } catch (err) {
      console.error("Greška kod ažuriranja:", err);
    }
  };

  const handleDeleteCategory = (category) => {
    setEditedCategory(category);
    setConfirmDeleteVisible(true);
  };

  const confirmDeleteCategory = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/expenses/deleteExpenseCategory/${editedCategory.id}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            organizationId: user.organization_id,
          }),
        }
      );
      
      const data = await res.json();

      if (data.success) {
        setCategories((prev) =>
          prev.filter((cat) => cat.id !== editedCategory.id)
        );
        toast.current.show({
          severity: "success",
          summary: "Kategorija obrisana",
          detail: `"${editedCategory.name}" je uspješno uklonjena.`,
          life: 3000,
        });
        fetchExpenses();
        fetchCategories();
      }
    } catch (err) {
      console.error("Greška kod brisanja kategorije:", err);
    } finally {
      setEditedCategory(null);
      setConfirmDeleteVisible(false);
    }
  };

  return (
    <div className="parent">
      <div className="div1">
        <h1>Troškovi</h1>
      </div>
      <div className="div3">
        <Button
          label="Novi trošak"
          icon="pi pi-plus"
          onClick={() => navigate("/expenses/add")}
        />
        <Button
          icon="pi pi-ellipsis-h"
          text
          onClick={(e) => categoryMenuRef.current.toggle(e)}
        />
        <Menu model={categoryOptionsMenu} popup ref={categoryMenuRef} />
      </div>

      <div className="div4">
        <div style={{ marginLeft: "3%", marginRight: "3%" }}>
          {stats && (
            <Panel
              header="Statistika troškova"
              style={{ marginBottom: "1rem", fontSize: "0.9rem" }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(12rem, 1fr))",
                  gap: "1rem",
                }}
              >
                <div>
                  <strong>30 dana:</strong>
                  <br />
                  {parseFloat(stats.last30Days).toFixed(2)} €
                </div>
                <div>
                  <strong>3 mjeseca:</strong>
                  <br />
                  {parseFloat(stats.last3Months).toFixed(2)} €
                </div>
                <div>
                  <strong>Zadnja godina:</strong>
                  <br />
                  {parseFloat(stats.lastYear).toFixed(2)} €
                </div>
                <div>
                  <strong>Top kategorija (ukupno):</strong>
                  <br />
                  {stats.topCategory?.category || "N/A"}
                  <br />
                  {parseFloat(stats.topCategory?.total || 0).toFixed(2)} €
                </div>
              </div>
            </Panel>
          )}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(12rem, 1fr))",
              gap: "1rem",
              alignItems: "center",
              marginBottom: "1rem",
            }}
          >
            <InputText
              placeholder="Pretraži"
              style={inputStyle}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Calendar
              value={startDate}
              onChange={(e) => setStartDate(e.value)}
              placeholder="Početni datum"
              showIcon
              style={inputStyle}
              dateFormat="dd.mm.yy"
            />
            <Calendar
              value={endDate}
              onChange={(e) => setEndDate(e.value)}
              placeholder="Završni datum"
              showIcon
              style={inputStyle}
              dateFormat="dd.mm.yy"
            />
            <Button
              label="Resetiraj"
              icon="pi pi-refresh"
              severity="secondary"
              onClick={() => {
                setSearchTerm("");
                setStartDate(null);
                setEndDate(null);
              }}
              style={{ height: "2.5rem" }}
            />
          </div>

          <DataTable
            value={filteredExpenses}
            paginator
            rows={5}
            rowsPerPageOptions={[5, 10, 25, 50]}
            emptyMessage="Nema pronađenih troškova."
            dataKey="id"
            expandedRows={expandedRows}
            onRowToggle={(e) => setExpandedRows(e.data)}
            rowExpansionTemplate={(data) => (
              <Panel header="Detalji">
                <p>
                  <strong>Naslov:</strong> {data.name}
                </p>
                <p>
                  <strong>Opis:</strong> {data.description}
                </p>
                <p>
                  <strong>Datum:</strong> {formatDate(data.expense_date)}
                </p>
                <p>
                  <strong>Iznos:</strong> {data.amount} €
                </p>
                <p>
                  <strong>Kategorija:</strong> {data.category}
                </p>
              </Panel>
            )}
            style={{ fontSize: "0.9rem" }}
          >
            <Column expander style={{ width: "3em" }} />
            <Column field="custom_expense_code" header="ID" sortable />
            <Column field="name" header="Naslov" sortable />
            <Column
              field="expense_date"
              header="Datum"
              sortable
              body={(rowData) => formatDate(rowData.expense_date)}
            />
            <Column field="category" header="Kategorija" sortable />
            <Column field="amount" header="Iznos (€)" sortable />
            <Column body={actionBodyTemplate} style={{ width: "4rem" }} />
          </DataTable>

          <Menu model={menuItems} popup ref={menuRef} />

          <Dialog
            header="Uredi trošak"
            visible={showDialog}
            style={{ width: "30rem" }}
            onHide={() => setShowDialog(false)}
          >
            <div className="p-fluid">
              <div className="field">
                <label>Naslov</label>
                <InputText
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="field">
                <label style={{ display: "block", marginBottom: "0.5rem" }}>
                  Kategorija
                </label>
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    alignItems: "center",
                  }}
                >
                  <Dropdown
                    value={form.categoryId}
                    options={categories}
                    onChange={(e) => setForm({ ...form, categoryId: e.value })}
                    optionLabel="name"
                    optionValue="id"
                    placeholder="Odaberi kategoriju"
                    filter
                    showClear
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
                <label>Opis</label>
                <InputText
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>
              <div className="field">
                <label>Iznos (€)</label>
                <InputText
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Datum</label>
                <Calendar
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.value })}
                  showIcon
                  style={{ width: "100%" }}
                />
              </div>
              <Button
                label="Spremi"
                icon="pi pi-check"
                onClick={saveExpense}
                style={{ marginTop: "1rem" }}
              />
            </div>
          </Dialog>

          <Dialog
            header="Upravljanje kategorijama"
            visible={showCategoryListDialog}
            style={{ width: "30rem" }}
            onHide={() => {
              setShowCategoryListDialog(false);
              setEditedCategory(null);
              setEditedName("");
              setNewCategoryName("");
            }}
          >
            <DataTable value={categories} emptyMessage="Nema kategorija.">
              <Column
                field="name"
                header="Naziv kategorije"
                body={(rowData) =>
                  editedCategory?.id === rowData.id ? (
                    <InputText
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      style={{ width: "100%" }}
                    />
                  ) : (
                    rowData.name
                  )
                }
              />
              <Column
                header="Akcije"
                body={(rowData) =>
                  editedCategory?.id === rowData.id ? (
                    <Button
                      icon="pi pi-check"
                      severity="success"
                      text
                      onClick={saveEditedCategory}
                    />
                  ) : (
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <Button
                        icon="pi pi-pencil"
                        severity="warning"
                        text
                        onClick={() => handleEditCategory(rowData)}
                      />
                      <Button
                        icon="pi pi-trash"
                        severity="danger"
                        text
                        onClick={() => handleDeleteCategory(rowData)}
                      />
                    </div>
                  )
                }
              />
            </DataTable>
            <div style={{ marginTop: "1rem" }}>
              <div className="field">
                <label htmlFor="newCategory">Nova kategorija</label>
                <InputText
                  id="newCategory"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="npr. Alati, Marketing..."
                  style={{ width: "100%" }}
                />
              </div>
              <Button
                label="Dodaj"
                icon="pi pi-plus"
                onClick={addCategory}
                style={{ marginTop: "0.5rem" }}
                severity="success"
              />
            </div>
          </Dialog>
        </div>
      </div>
      <Toast ref={toast} />
      <ConfirmDialog
        visible={confirmDeleteVisible}
        onHide={() => setConfirmDeleteVisible(false)}
        message={`Jeste li sigurni da želite obrisati kategoriju "${editedCategory?.name}"?`}
        header="Potvrda brisanja"
        icon="pi pi-exclamation-triangle"
        accept={confirmDeleteCategory}
        reject={() => setConfirmDeleteVisible(false)}
      />
    </div>
  );
};

export default Expenses;
