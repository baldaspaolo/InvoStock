import React, { useEffect, useState } from "react";
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
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);
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
          body: JSON.stringify({ userId: 2 }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch invoices");
      }

      const data = await response.json();
      setInvoices(data.invoices);
      console.log(data);
    } catch (error) {
      console.error("Error fetching invoices:", error);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("hr-HR");
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const invoiceDate = new Date(invoice.invoice_date);
    const matchesSearch = invoice.client_name
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "sve" || invoice.status === statusFilter;

    const matchesDateRange =
      (!startDate || invoiceDate >= new Date(startDate)) &&
      (!endDate || invoiceDate <= new Date(endDate));

    return matchesSearch && matchesStatus && matchesDateRange;
  });

  const handleStatusChange = (e) => {
    const selectedStatus = e.value;
    setStatusFilter(selectedStatus);
  };

  const inputStyle = { height: "2.5rem", width: "100%" }; 

  return (
    <div className="parent">
      <div className="div1">
        <h1>Fakture</h1>
      </div>
      <div
        className="div3"
        style={{ width: "70%", textAlign: "center", margin: "0" }}
      >
        <Button
          label="Dodaj novu fakturu"
          icon="pi pi-plus"
          iconPos="right"
          raised
          size="small"
        />
      </div>

      <div className="div4">
        <div style={{ marginLeft: "3%", marginRight: "3%" }}>
          <Panel header="Trenutna potraživanja" style={{ fontSize: "0.88rem" }}>
            <div style={{ display: "flex", gap: "2rem" }}>
              <div>
                <h3>500€</h3>
                <p>Ukupno faktura</p>
              </div>
              <div>
                <h3>2</h3>
                <p>Neplaćene fakture</p>
              </div>
              <div>
                <h3>3</h3>
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
