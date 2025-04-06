// Expenses.jsx
import React, { useState, useRef, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Calendar } from "primereact/calendar";
import { InputText } from "primereact/inputtext";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Panel } from "primereact/panel";
import { Chart } from "primereact/chart";
import { Menu } from "primereact/menu";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";

import "./style.css";

const Expenses = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const categoryMenuRef = useRef(null);

  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCharts, setShowCharts] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [expandedRows, setExpandedRows] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editExpense, setEditExpense] = useState(null);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showCategoryListDialog, setShowCategoryListDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    categoryId: null,
    amount: "",
    date: null,
  });

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/expenses/getUserExpenses`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user.id }),
          }
        );
        const data = await res.json();
        if (data.success) setExpenses(data.expenses);
      } catch (err) {
        console.error("Greška kod dohvata troškova:", err);
      }
    };
    fetchExpenses();
  }, [user.id]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/expenses/getExpenseCategories`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user.id }),
          }
        );
        const data = await res.json();
        if (data.success) setCategories(data.categories);
      } catch (err) {
        console.error("Greška kod dohvata kategorija:", err);
      }
    };
    fetchCategories();
  }, [user.id]);

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
          } catch (err) {
            console.error("Greška kod brisanja:", err);
          }
        }
      },
    },
  ];

  const categoryOptionsMenu = [
    {
      label: "Moje kategorije",
      icon: "pi pi-list",
      command: () => setShowCategoryListDialog(true),
    },
    {
      label: "Dodaj kategoriju",
      icon: "pi pi-plus",
      command: () => setShowCategoryDialog(true),
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
          body: JSON.stringify(payload),
        }
      );
      setShowDialog(false);
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
          body: JSON.stringify({ userId: user.id, name: newCategoryName }),
        }
      );
      const data = await res.json();
      if (data.success) {
        const newCategory = { id: data.categoryId, name: newCategoryName };
        setCategories((prev) => [...prev, newCategory]);
        setForm((prevForm) => ({ ...prevForm, categoryId: newCategory.id }));
        setShowCategoryDialog(false);
        setNewCategoryName("");
      }
    } catch (err) {
      console.error("Greška kod dodavanja kategorije:", err);
    }
  };

  const filteredExpenses = expenses.filter((e) => {
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
          label={showCharts ? "Sakrij grafove" : "Prikaži grafove"}
          icon="pi pi-chart-bar"
          onClick={() => setShowCharts(!showCharts)}
          className="ml-2"
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
            />
            <Calendar
              value={endDate}
              onChange={(e) => setEndDate(e.value)}
              placeholder="Završni datum"
              showIcon
              style={inputStyle}
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
            emptyMessage="Nema pronađenih troškova."
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
            <Column field="name" header="Naslov" sortable />
            <Column
              field="date"
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
                  placeholder="npr. Alati, Marketing..."
                />
              </div>
              <Button
                label="Dodaj"
                icon="pi pi-check"
                onClick={addCategory}
                style={{ marginTop: "1rem" }}
              />
            </div>
          </Dialog>

          <Dialog
            header="Moje kategorije"
            visible={showCategoryListDialog}
            style={{ width: "25rem" }}
            onHide={() => setShowCategoryListDialog(false)}
          >
            <div className="p-fluid">
              {categories.length > 0 ? (
                categories.map((cat) => (
                  <div key={cat.id} style={{ padding: "0.5rem 0" }}>
                    <i
                      className="pi pi-tag"
                      style={{ marginRight: "0.5rem" }}
                    />
                    {cat.name}
                  </div>
                ))
              ) : (
                <p>Nemate još kategorija.</p>
              )}
            </div>
          </Dialog>

          {showCharts && (
            <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
              <Card style={{ flex: 1 }}>
                <h5>Troškovi po mjesecima (2024)</h5>
                <Chart
                  type="line"
                  data={{
                    labels: ["Sij", "Velj", "Ožu", "Tra", "Svi", "Lip"],
                    datasets: [
                      {
                        label: "Troškovi 2024",
                        data: [250, 900, 400, 0, 0, 0],
                        fill: false,
                        borderColor: "#42A5F5",
                        tension: 0.4,
                      },
                    ],
                  }}
                  style={{ height: "300px" }}
                />
              </Card>
              <Card style={{ flex: 1 }}>
                <h5>Top troškovne kategorije</h5>
                <Chart
                  type="bar"
                  data={{
                    labels: ["Materijal", "Marketing", "Web", "Servis"],
                    datasets: [
                      {
                        label: "Top kategorije",
                        backgroundColor: [
                          "#42A5F5",
                          "#66BB6A",
                          "#FFA726",
                          "#AB47BC",
                        ],
                        data: [900, 550, 250, 320],
                      },
                    ],
                  }}
                  style={{ height: "300px" }}
                />
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Expenses;
