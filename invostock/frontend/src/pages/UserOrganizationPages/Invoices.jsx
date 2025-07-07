import React, {
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Panel } from "primereact/panel";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import { Tag } from "primereact/tag";

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
  const [status, setStatus] = useState({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("sve");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [invoicesRes, statusRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/invoices/getUserInvoices`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            organizationId: user.organization_id || null,
          }),
        }),
        fetch(
          `${import.meta.env.VITE_API_URL}/api/invoices/getUserInvoicesSummary`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.id,
              organizationId: user.organization_id || null,
            }),
          }
        ),
      ]);

      const invoicesData = await invoicesRes.json();
      const statusData = await statusRes.json();

      setInvoices(invoicesData.invoices || []);
      setStatus(statusData || {});
      console.log("Fajtzure: ", invoices);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, [user.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("hr-HR");
  };

  const filteredInvoices = useMemo(() => {
    return statusFilter === "sve"
      ? invoices.filter((invoice) => {
          const fullName =
            invoice.contact_first_name || invoice.contact_last_name
              ? `${invoice.contact_first_name || ""} ${
                  invoice.contact_last_name || ""
                }`.toLowerCase()
              : invoice.client_name?.toLowerCase() || "";

          const matchesSearch = fullName.includes(search.toLowerCase());
          const invoiceDate = new Date(invoice.invoice_date);
          const matchesDateRange =
            (!startDate || invoiceDate >= new Date(startDate)) &&
            (!endDate || invoiceDate <= new Date(endDate));
          return matchesSearch && matchesDateRange;
        })
      : invoices.filter((invoice) => {
          const fullName =
            invoice.first_name || invoice.last_name
              ? `${invoice.first_name || ""} ${
                  invoice.last_name || ""
                }`.toLowerCase()
              : invoice.client_name?.toLowerCase() || "";

          const matchesSearch = fullName.includes(search.toLowerCase());
          const matchesStatus = invoice.status === statusFilter;
          const invoiceDate = new Date(invoice.invoice_date);
          const matchesDateRange =
            (!startDate || invoiceDate >= new Date(startDate)) &&
            (!endDate || invoiceDate <= new Date(endDate));
          return matchesSearch && matchesStatus && matchesDateRange;
        });
  }, [invoices, statusFilter, search, startDate, endDate]);

  const handleStatusChange = useCallback((e) => {
    setStatusFilter(e.value);
  }, []);

  const handleRowClick = useCallback(
    (e) => {
      navigate(`/invoices/${e.data.id}/${e.data.user_id}`);
    },
    [navigate]
  );

  const getStatusTag = useCallback((status) => {
    const statusMap = {
      paid: { label: "Plaćeno", severity: "success" },
      partially_paid: { label: "Djelomično", severity: "warning" },
      pending: { label: "Neplaćeno", severity: "danger" },
    };

    const s = statusMap[status] || { label: "Nepoznato", severity: "info" };
    return <Tag value={s.label} severity={s.severity} />;
  }, []);

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("sve");
    setStartDate(null);
    setEndDate(null);
    fetchData(); 
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
      </div>

      <div className="div4">
        <div style={{ marginLeft: "3%", marginRight: "3%" }}>
          <Panel header="Status faktura" style={{ fontSize: "0.88rem" }}>
            <div style={{ display: "flex", gap: "2rem" }}>
              <div>
                <h3>{status.total_receivables || 0}€</h3>
                <p>Ukupna potražnja</p>
              </div>
              <div>
                <h3>{status.unpaid_invoices || 0}</h3>
                <p>Neplaćene fakture</p>
              </div>
              <div>
                <h3>{status.partially_paid_invoices || 0}</h3>
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
              onClick={resetFilters}
              style={{ height: "2.5rem", marginTop: "2%" }}
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
            sortMode="single"
            removableSort
          >
            <Column field="custom_invoice_code" header="ID" sortable></Column>
            <Column
              header="Klijent"
              body={(rowData) =>
                rowData.contact_first_name || rowData.contact_last_name
                  ? `${rowData.contact_first_name || ""} ${
                      rowData.contact_last_name || ""
                    }`.trim()
                  : rowData.client_name || "—"
              }
              sortable
            />

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
            <Column
              field="status"
              header="Status"
              body={(rowData) => getStatusTag(rowData.status)}
              sortable
            />
          </DataTable>
        </div>
      </div>
    </div>
  );
};

export default Invoices;
