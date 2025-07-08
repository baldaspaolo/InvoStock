import React, { useEffect, useState } from "react";
import { Card } from "primereact/card";
import { Panel } from "primereact/panel";
import { useNavigate } from "react-router-dom";
import { Tag } from "primereact/tag";
import { Button } from "primereact/button";

import { Divider } from "primereact/divider";

const AdminStatistics = () => {
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/admin/statistics`
        );
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("Greška kod dohvaćanja statistika:", err);
      }
    };

    fetchStats();
  }, []);

  if (!stats) return <p>Učitavanje...</p>;

  return (
    <div className="p-4" style={{ margin: "4%" }}>
      <div style={{ display: "flex" }}>
        <Button
          icon="pi pi-arrow-left"
          text
          raised
          severity="secondary"
          onClick={() => navigate("/admin/dashboard")}
          style={{ width: "10%" }}
        />
      </div>
      <h2 className="text-xl mb-3">📊 Administratorska Statistika</h2>

      <Panel header="👥 Korisnici i Organizacije">
        <div className="grid">
          <Card
            className="col"
            style={{
              borderRadius: "15px",
              overflow: "hidden",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <p>
              <strong>Ukupno korisnika:</strong> {stats.total_users}
            </p>
            <p>
              <strong>Pojedinačni korisnici:</strong> {stats.individual_users}
            </p>
            <p>
              <strong>Korisnici u organizacijama:</strong>{" "}
              {stats.organization_users} ({stats.organization_users_percentage}
              %)
            </p>
          </Card>
          <Card
            className="col"
            style={{
              borderRadius: "15px",
              overflow: "hidden",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <p>
              <strong>Ukupno organizacija:</strong> {stats.total_organizations}
            </p>
            <p>
              <strong>Prosječan broj članova:</strong>{" "}
              {stats.avg_members_per_org}
            </p>
            <p>
              <strong>Maks. članova u jednoj:</strong>{" "}
              {stats.max_members_in_org}
            </p>
          </Card>
        </div>
      </Panel>

      <Divider />

      <Panel header="📄 Fakture i Uplate">
        <div className="grid">
          <Card
            className="col"
            style={{
              borderRadius: "15px",
              overflow: "hidden",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <p>
              <strong>Ukupno faktura:</strong> {stats.total_invoices}
            </p>
            <p>
              <strong>Plaćene:</strong> {stats.paid_invoices} (
              {stats.paid_invoices_percentage}%)
            </p>
            <p>
              <strong>Djelomično:</strong> {stats.partially_paid_invoices}
            </p>
            <p>
              <strong>Na čekanju:</strong> {stats.pending_invoices} (
              {stats.pending_invoices_percentage}%)
            </p>
          </Card>
          <Card
            className="col"
            style={{
              borderRadius: "15px",
              overflow: "hidden",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <p>
              <strong>Ukupan iznos faktura:</strong>{" "}
              {stats.total_invoice_amount} €
            </p>
            <p>
              <strong>Prosječan iznos:</strong> {stats.average_invoice_amount} €
            </p>
            <p>
              <strong>Ukupno uplata:</strong> {stats.total_payments} €
            </p>
          </Card>
        </div>
      </Panel>

      <Divider />

      <Panel header="📦 Inventar i Narudžbe">
        <div className="grid">
          <Card
            className="col"
            style={{
              borderRadius: "15px",
              overflow: "hidden",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <p>
              <strong>Stavki u inventaru:</strong> {stats.total_inventory_items}
            </p>
            <p>
              <strong>Ukupna količina:</strong> {stats.total_stock_quantity}
            </p>
            <p>
              <strong>Vrijednost:</strong> {stats.total_inventory_value} €
            </p>
            <p>
              <strong>Turnover ratio:</strong> {stats.inventory_turnover_ratio}
            </p>
          </Card>
          <Card
            className="col"
            style={{
              borderRadius: "15px",
              overflow: "hidden",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <p>
              <strong>Ukupno narudžbi:</strong> {stats.total_orders}
            </p>
            <p>
              <strong>Dostavljene:</strong> {stats.delivered_orders}
            </p>
            <p>
              <strong>Otkazane:</strong> {stats.cancelled_orders}
            </p>
            <p>
              <strong>Na čekanju:</strong> {stats.pending_orders}
            </p>
          </Card>
        </div>
      </Panel>

      <Divider />

      <Panel header="📬 Paketi i Troškovi">
        <div className="grid">
          <Card
            className="col"
            style={{
              borderRadius: "15px",
              overflow: "hidden",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <p>
              <strong>Ukupno paketa:</strong> {stats.total_packages}
            </p>
          </Card>
          <Card
            className="col"
            style={{
              borderRadius: "15px",
              overflow: "hidden",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <p>
              <strong>Ukupni troškovi:</strong> {stats.total_expenses} €
            </p>
            <p>
              <strong>Prosječan trošak:</strong> {stats.average_expense_amount}{" "}
              €
            </p>
          </Card>
        </div>
      </Panel>
    </div>
  );
};

export default AdminStatistics;
