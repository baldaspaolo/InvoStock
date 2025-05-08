import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Dropdown } from "primereact/dropdown";
import { ProgressBar } from "primereact/progressbar";
import { AuthContext } from "../../context/AuthContext";
import DashboardActions from "../../components/DashboardCharts/DashboardActions";
import DashboardCards from "../../components/DashboardCharts/DashboardCards";
import FinancialChart from "../../components/DashboardCharts/FinancialChart";
import InventoryAlerts from "../../components/DashboardCharts/InventoryAlerts";
import RecentActivities from "../../components/DashboardCharts/RecentActivities";
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

  return (
    <div className="dashboard-container">
      <h2>Dobrodošli, {user?.name}!</h2>

      <DashboardActions />

      <div className="time-range-selector">
        <span>Prikaz podataka za: </span>
        <Dropdown
          value={timeRange}
          options={timeRangeOptions}
          onChange={(e) => setTimeRange(e.value)}
          style={{ width: "180px" }}
        />
      </div>

      <DashboardCards stats={dashboardData.stats} />

      <div className="dashboard-panels-row">
        <FinancialChart financialData={dashboardData.financial_data} />
        <RecentActivities activities={dashboardData.recent_activities} />
      </div>

      <div className="dashboard-panels-row">
        <InventoryAlerts alerts={dashboardData.inventory_alerts} />
      </div>
    </div>
  );
};

export default Dashboard;
