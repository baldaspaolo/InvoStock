import React from "react";
import { Chart } from "primereact/chart";
import { Panel } from "primereact/panel";

const FinancialChart = ({ financialData }) => {
  const formatCurrency = (amount) => {
    return parseFloat(amount || 0).toLocaleString("hr-HR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const chartData = {
    labels: financialData?.map((item) => item.month) || [],
    datasets: [
      {
        label: "Prihodi",
        data: financialData?.map((item) => item.revenue) || [],
        backgroundColor: "#4CAF50",
        borderColor: "#4CAF50",
        tension: 0.1,
      },
      {
        label: "Troškovi",
        data: financialData?.map((item) => item.expenses) || [],
        backgroundColor: "#F44336",
        borderColor: "#F44336",
        tension: 0.1,
      },
    ],
  };

  return (
    <Panel header="Financijski pregled" style={{ flex: 2, marginBottom: "1%" }}>
      <Chart
        type="bar"
        data={chartData}
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
  );
};

export default FinancialChart;
