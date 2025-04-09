import React from "react";
import { Dropdown } from "primereact/dropdown";
import { useState } from "react";
import { Card } from "primereact/card";
import { Chart } from "primereact/chart";
import { Button } from "primereact/button";
import { Panel } from "primereact/panel";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import "../../styles/dashboard.css";

const Dashboard = () => {
  const { user } = useContext(AuthContext);

  const [selectedInterval, setSelectedInterval] = useState("month");

  const intervalOptions = [
    { label: "Mjesec dana", value: "month" },
    { label: "Kvartal", value: "quarter" },
    { label: "Godina (tekuća)", value: "year" },
    { label: "2023", value: "2023" },
    { label: "2022", value: "2022" },
  ];

  const dummyStats = [
    { label: "Ukupne fakture", value: 124 },
    { label: "Ukupni troškovi (€)", value: 3120 },
    { label: "Ukupni prihodi (€)", value: 5600 },
    { label: "Aktivne narudžbenice", value: 46 },
    { label: "Zalihe ispod minimuma", value: 3 },
  ];

  const receivables = 1250.45;
  const latestInvoices = [
    {
      client: "Tvrtka A",
      date: "2024-04-01",
      number: "FK-101",
      amount: "850.00",
      status: "Plaćeno",
    },
    {
      client: "Tvrtka B",
      date: "2024-04-03",
      number: "FK-102",
      amount: "620.00",
      status: "Neplaćeno",
    },
    {
      client: "Tvrtka C",
      date: "2024-04-04",
      number: "FK-103",
      amount: "740.00",
      status: "Djelomično",
    },
  ];

  const financialChartData = {
    labels: ["Sij", "Velj", "Ožu"],
    datasets: [
      {
        label: "Prihodi",
        data: [1000, 1500, 1800],
        borderColor: "#42A5F5",
        backgroundColor: "#42A5F5",
        fill: false,
        tension: 0.4,
      },
      {
        label: "Troškovi",
        data: [700, 900, 1200],
        borderColor: "#EF5350",
        backgroundColor: "#EF5350",
        fill: false,
        tension: 0.4,
      },
    ],
  };

  const pieExpensesThisMonth = {
    labels: ["Web hosting", "Alati", "Marketing"],
    datasets: [
      {
        data: [40, 180, 300],
        backgroundColor: ["#42A5F5", "#66BB6A", "#FFA726"],
      },
    ],
  };

  return (
    <div className="dashboard-container">
      <h2>Dobrodošao, {user?.name}!</h2>

      <div className="dashboard-actions-top-row">
        <Button
          label="Nova faktura"
          icon="pi pi-file"
          size="small"
          onClick={() => alert("Nova faktura")}
        />
        <Button
          label="Nova uplata"
          icon="pi pi-credit-card"
          size="small"
          onClick={() => alert("Nova uplata")}
        />
        <Button
          label="Novi trošak"
          icon="pi pi-plus"
          severity="danger"
          size="small"
          onClick={() => alert("Novi trošak")}
        />
        <Button
          label="Nova narudžbenica"
          icon="pi pi-shopping-cart"
          size="small"
          onClick={() => alert("Nova narudžbenica")}
        />
      </div>

      <div className="dashboard-widgets">
        {dummyStats.map((stat, index) => (
          <Card key={index} title={stat.label} style={{ textAlign: "center" }}>
            <h3>{stat.value}</h3>
          </Card>
        ))}
      </div>

      <Panel header={`Trenutna potraživanja: ${receivables.toFixed(2)} €`}>
        <DataTable value={[]} emptyMessage="Nema aktivnih potraživanja." />
      </Panel>

      <div className="dashboard-panels-row">
        <Panel header="Posljednje fakture" style={{ flex: 1 }}>
          <DataTable
            value={latestInvoices}
            paginator
            rows={5}
            responsiveLayout="scroll"
          >
            <Column field="client" header="Klijent" />
            <Column field="date" header="Datum" />
            <Column field="number" header="Broj fakture" />
            <Column field="amount" header="Iznos (€)" />
            <Column field="status" header="Status" />
          </DataTable>
        </Panel>

        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
          <Panel header="Prihodi vs Troškovi" style={{ flex: 1 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
              }}
            >
              <h4 style={{ margin: 0 }}>Financije</h4>
              <Dropdown
                value={selectedInterval}
                options={intervalOptions}
                onChange={(e) => setSelectedInterval(e.value)}
                placeholder="Odaberi period"
                style={{ width: "180px" }}
              />
            </div>
            <Chart
              type="line"
              data={financialChartData}
              style={{ height: "250px" }}
            />
          </Panel>
          <Panel header="Troškovi ovog mjeseca" style={{ flex: 1 }}>
            <Chart
              type="pie"
              data={pieExpensesThisMonth}
              style={{ height: "250px" }}
            />
          </Panel>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
