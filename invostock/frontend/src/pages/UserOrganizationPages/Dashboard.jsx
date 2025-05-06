import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Dropdown } from "primereact/dropdown";
import { Card } from "primereact/card";
import { Chart } from "primereact/chart";
import { Button } from "primereact/button";
import { Panel } from "primereact/panel";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { ProgressBar } from "primereact/progressbar";
import { AuthContext } from "../../context/AuthContext";
import "../../styles/dashboard.css";

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState("30days");
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/dashboard/getDashboardStats`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: user.id,
              organizationId: user.organization_id || null,
              timeRange: timeRange,
            }),
          }
        );

        const data = await response.json();
        setDashboardData(data);
      } catch (error) {
        console.error("Greška pri dohvaćanju podataka:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchDashboardData();
    }
  }, [user, timeRange]);

  const timeRangeOptions = [
    { label: "Zadnjih 30 dana", value: "30days" },
    { label: "Ovaj mjesec", value: "month" },
    { label: "Ovaj kvartal", value: "quarter" },
    { label: "Ova godina", value: "year" },
  ];

  const getStatusTag = (status) => {
    switch (status) {
      case "paid":
      case "delivered":
        return (
          <Tag
            severity="success"
            value={status === "paid" ? "Plaćeno" : "Isporučeno"}
          />
        );
      case "pending":
        return <Tag severity="danger" value="Neplaćeno" />;
      case "partially_paid":
        return <Tag severity="warning" value="Djelomično" />;
      default:
        return <Tag value={status} />;
    }
  };

  const getActivityIcon = (type) => {
    const icons = {
      invoice: "pi pi-file",
      payment: "pi pi-money-bill",
      order: "pi pi-shopping-cart",
      expense: "pi pi-euro",
    };
    return (
      <i
        className={icons[type] || "pi pi-info-circle"}
        style={{ fontSize: "1.2rem" }}
      />
    );
  };

  const formatCurrency = (amount) => {
    return parseFloat(amount || 0).toLocaleString("hr-HR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("hr-HR");
  };

  const handleCardClick = (route) => {
    navigate(route);
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <ProgressBar mode="indeterminate" style={{ height: "6px" }} />
      </div>
    );
  }

  if (!dashboardData) {
    return <div className="dashboard-container">Nema podataka za prikaz</div>;
  }

  // Priprema podataka za grafikon
  const financialChartData = {
    labels: dashboardData.financial_data?.map((item) => item.month) || [],
    datasets: [
      {
        label: "Prihodi",
        data: dashboardData.financial_data?.map((item) => item.revenue) || [],
        backgroundColor: "#4CAF50",
        borderColor: "#4CAF50",
        tension: 0.1,
      },
      {
        label: "Troškovi",
        data: dashboardData.financial_data?.map((item) => item.expenses) || [],
        backgroundColor: "#F44336",
        borderColor: "#F44336",
        tension: 0.1,
      },
    ],
  };

  return (
    <div className="dashboard-container">
      <h2>Dobrodošli, {user?.name}!</h2>

      <div className="dashboard-actions-top-row">
        <Button
          label="Nova faktura"
          icon="pi pi-file"
          size="small"
          onClick={() => navigate("/invoices/new")}
        />
        <Button
          label="Nova uplata"
          icon="pi pi-credit-card"
          size="small"
          onClick={() => navigate("/payments/new")}
        />
        <Button
          label="Novi trošak"
          icon="pi pi-euro"
          severity="danger"
          size="small"
          onClick={() => navigate("/expenses/new")}
        />
        <Button
          label="Nova narudžbenica"
          icon="pi pi-shopping-cart"
          size="small"
          onClick={() => navigate("/orders/new")}
        />
      </div>

      <div className="time-range-selector">
        <span>Prikaz podataka za: </span>
        <Dropdown
          value={timeRange}
          options={timeRangeOptions}
          onChange={(e) => setTimeRange(e.value)}
          style={{ width: "180px" }}
        />
      </div>

      <div className="dashboard-widgets">
        <Card
          title="Prihodi (30 dana)"
          style={{ textAlign: "center", cursor: "pointer" }}
          onClick={() => handleCardClick("/invoices")}
        >
          <h3>{formatCurrency(dashboardData.stats.total_revenue)}</h3>
          <small>Ukupno prihoda u zadnjih 30 dana</small>
        </Card>

        <Card
          title="Trenutna potraživanja"
          style={{ textAlign: "center", cursor: "pointer" }}
          onClick={() =>
            handleCardClick("/invoices?status=pending,partially_paid")
          }
        >
          <h3>{formatCurrency(dashboardData.stats.outstanding_amount)}</h3>
          <small>Neizmireni iznosi</small>
        </Card>

        <Card
          title="Troškovi (30 dana)"
          style={{ textAlign: "center", cursor: "pointer" }}
          onClick={() => handleCardClick("/expenses")}
        >
          <h3>{formatCurrency(dashboardData.stats.total_expenses)}</h3>
          <small>Ukupni troškovi u zadnjih 30 dana</small>
        </Card>

        <Card
          title="Artikli u inventaru"
          style={{ textAlign: "center", cursor: "pointer" }}
          onClick={() => handleCardClick("/inventory")}
        >
          <h3>{dashboardData.stats.inventory_stats.total_items}</h3>
          <small>Ukupno artikala</small>
        </Card>

        <Card
          title="Niska zaliha"
          style={{ textAlign: "center", cursor: "pointer" }}
          onClick={() => handleCardClick("/inventory?alert=true")}
        >
          <h3>{dashboardData.stats.inventory_stats.low_stock_items}</h3>
          <small>Artikli ispod minimuma</small>
        </Card>
      </div>

      <div className="dashboard-panels-row">
        <Panel header="Financijski pregled" style={{ flex: 2 }}>
          <Chart
            type="bar"
            data={financialChartData}
            options={{
              responsive: true,
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: function (value) {
                      return formatCurrency(value);
                    },
                  },
                },
              },
              plugins: {
                tooltip: {
                  callbacks: {
                    label: function (context) {
                      let label = context.dataset.label || "";
                      if (label) {
                        label += ": ";
                      }
                      label += formatCurrency(context.raw);
                      return label;
                    },
                  },
                },
              },
            }}
            style={{ height: "300px" }}
          />
        </Panel>

        <Panel header="Nedavne aktivnosti" style={{ flex: 1 }}>
          {dashboardData.recent_activities?.length > 0 ? (
            <DataTable
              value={dashboardData.recent_activities}
              paginator
              rows={5}
              onRowClick={(e) => {
                if (e.data.type === "invoice")
                  navigate(`/invoices/${e.data.id}`);
                if (e.data.type === "order") navigate(`/orders/${e.data.id}`);
                if (e.data.type === "expense")
                  navigate(`/expenses/${e.data.id}`);
              }}
              selectionMode="single"
            >
              <Column
                header="Tip"
                body={(rowData) => getActivityIcon(rowData.type)}
                style={{ width: "50px" }}
              />
              <Column field="title" header="Opis" />
              <Column
                field="amount"
                header="Iznos"
                body={(rowData) => formatCurrency(rowData.amount)}
              />
              <Column
                field="date"
                header="Datum"
                body={(rowData) => formatDate(rowData.date)}
              />
              <Column
                field="status"
                header="Status"
                body={(rowData) =>
                  rowData.status ? getStatusTag(rowData.status) : "-"
                }
              />
            </DataTable>
          ) : (
            <p>Nema nedavnih aktivnosti.</p>
          )}
        </Panel>
      </div>

      <div className="dashboard-panels-row">
        <Panel header="Upozorenja za zalihe" style={{ flex: 1 }}>
          {dashboardData.inventory_alerts?.length > 0 ? (
            <DataTable
              value={dashboardData.inventory_alerts}
              paginator
              rows={5}
              onRowClick={(e) => navigate(`/inventory/${e.data.id}`)}
              selectionMode="single"
            >
              <Column field="item_name" header="Artikl" />
              <Column
                field="stock_quantity"
                header="Zaliha"
                body={(rowData) => (
                  <div>
                    {rowData.stock_quantity} / {rowData.reorder_level}
                    {rowData.stock_quantity <= 0 && (
                      <Tag
                        severity="danger"
                        value="Nema na zalihi"
                        className="ml-2"
                      />
                    )}
                  </div>
                )}
              />
              <Column
                field="price"
                header="Cijena"
                body={(rowData) => formatCurrency(rowData.price)}
              />
            </DataTable>
          ) : (
            <p>Svi artikli imaju dovoljnu zalihu.</p>
          )}
        </Panel>
      </div>
    </div>
  );
};

export default Dashboard;
