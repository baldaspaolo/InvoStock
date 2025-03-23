import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Panel } from "primereact/panel";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";

import "./style.css";

const statusOptions = [
  { label: "Sve", value: "sve" },
  { label: "Plaćene", value: "paid" },
  { label: "Neplaćene", value: "pending" },
  { label: "Djelomično plaćene", value: "partially_paid" },
];

const Invoices = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState([]);
  const [status, setStatus] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("sve");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const fetchInvoices = async () => {
    try {
      const response = await fetch(
        "http://localhost:3000/api/invoices/getUserInvoices",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: user.id }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch invoices");
      }

      const data = await response.json();
      setInvoices(data.invoices);
      console.log(data);
      console.log(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
    }
  };

  const fetchStatusData = async () => {
    try {
      const response = await fetch(
        "http://localhost:3000/api/invoices/getUserInvoicesSummary",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: user.id }),
        }
      );

      const data = await response.json();
      setStatus(data);
      console.log(data);
    } catch (error) {
      console.log("Greška u izvršavanju zahtjeva!", error);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchStatusData();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("hr-HR");
  };

  const filteredInvoices = statusFilter
    ? invoices.filter((invoice) => {
        const matchesSearch = invoice.client_name
          .toLowerCase()
          .includes(search.toLowerCase());
        const matchesStatus =
          statusFilter === "sve" || invoice.status === statusFilter;
        const invoiceDate = new Date(invoice.invoice_date);
        const matchesDateRange =
          (!startDate || invoiceDate >= new Date(startDate)) &&
          (!endDate || invoiceDate <= new Date(endDate));
        return matchesSearch && matchesStatus && matchesDateRange;
      })
    : [];

  const handleStatusChange = (e) => {
    setStatusFilter(e.value);
  };

  const handleRowClick = (e) => {
    console.log(e.data);
    navigate(`/invoices/${e.data.id}/${e.data.user_id}`);
  };

  const inputStyle = { height: "2.5rem", width: "100%" };

  return (
    <div className="parent">
      <div className="div1">
        <h1>Fakture</h1>
      </div>
      <div className="div3">
        <Button
          label="Novu faktura"
          icon="pi pi-plus"
          iconPos="right"
          raised
          size="small"
          onClick={() => navigate("/invoices/add")}
        />
        <Button
          icon="pi pi-ellipsis-h"
          text
          raised
          severity="info"
          aria-label="User"
          style={{ width: "50%" }}
        />
      </div>

      <div className="div4">
        <div style={{ marginLeft: "3%", marginRight: "3%" }}>
          <Panel header="Status faktura" style={{ fontSize: "0.88rem" }}>
            <div style={{ display: "flex", gap: "2rem" }}>
              <div>
                <h3>{invoices.remaining_amount}</h3>
                <h3>{status.total_receivables}€</h3>
                <p>Ukupna potražnja</p>
              </div>
              <div>
                <h3>{status.unpaid_invoices}</h3>
                <p>Neplaćene fakture</p>
              </div>
              <div>
                <h3>{status.partially_paid_invoices}</h3>
                <p>Djelomično plaćene</p>
              </div>
            </div>
          </Panel>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(12rem, 1fr))",
              gap: "1rem",
              alignItems: "center",
            }}
          >
            <InputText
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pretraži klijenta"
              style={inputStyle}
            />
            <Dropdown
              value={statusFilter}
              options={statusOptions}
              onChange={handleStatusChange}
              placeholder="Filtriraj po statusu"
              style={inputStyle}
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
          </div>

          <DataTable
            value={filteredInvoices}
            paginator
            rows={5}
            rowsPerPageOptions={[5, 10, 25, 50]}
            style={{ fontSize: "0.9rem" }}
            onRowClick={handleRowClick}
            selectionMode="single"
          >
            <Column field="id" header="ID" sortable></Column>
            <Column field="client_name" header="Klijent" sortable></Column>
            <Column
              field="invoice_date"
              header="Datum fakture"
              body={(rowData) => formatDate(rowData.invoice_date)}
              sortable
            ></Column>
            <Column
              field="due_date"
              header="Datum dospijeća"
              body={(rowData) => formatDate(rowData.due_date)}
              sortable
            ></Column>
            <Column field="total_amount" header="Ukupno (€)" sortable></Column>
            <Column field="discount" header="Popust (€)" sortable></Column>
            <Column
              field="final_amount"
              header="Konačni iznos (€)"
              sortable
            ></Column>
            <Column field="status" header="Status" sortable></Column>
          </DataTable>
        </div>
      </div>
    </div>
  );
};

export default Invoices;
