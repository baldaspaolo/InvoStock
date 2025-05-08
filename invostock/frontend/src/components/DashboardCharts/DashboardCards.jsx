import React from "react";
import { Card } from "primereact/card";
import { useNavigate } from "react-router-dom";

const DashboardCards = ({ stats }) => {
  const navigate = useNavigate();

  const formatCurrency = (amount) => {
    return parseFloat(amount || 0).toLocaleString("hr-HR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatNumber = (number) => {
    return parseFloat(number || 0).toLocaleString("hr-HR");
  };

  const handleCardClick = (route) => {
    navigate(route);
  };

  const cards = [
    {
      title: "Prihodi (30 dana)",
      value: stats.total_revenue,
      formatter: formatCurrency,
      description: "Ukupno prihoda u zadnjih 30 dana",
      route: "/invoices",
    },
    {
      title: "Trenutna potraživanja",
      value: stats.outstanding_amount,
      formatter: formatCurrency,
      description: "Neizmireni iznosi",
      route: "/invoices",
    },
    {
      title: "Troškovi (30 dana)",
      value: stats.total_expenses,
      formatter: formatCurrency,
      description: "Ukupni troškovi u zadnjih 30 dana",
      route: "/expenses",
    },
    {
      title: "Artikli u inventaru",
      value: stats.inventory_stats.total_items,
      formatter: formatNumber,
      description: "Ukupno artikala",
      route: "/inventory",
    },
    {
      title: "Niska zaliha",
      value: stats.inventory_stats.low_stock_items,
      formatter: formatNumber,
      description: "Artikli ispod minimuma",
      route: "/inventory",
    },
  ];

  return (
    <div className="dashboard-widgets">
      {cards.map((card, index) => (
        <Card
          key={index}
          title={card.title}
          style={{ textAlign: "center", cursor: "pointer" }}
          onClick={() => handleCardClick(card.route)}
        >
          <h3>{card.formatter(card.value)}</h3>
          <small>{card.description}</small>
        </Card>
      ))}
    </div>
  );
};

export default DashboardCards;
