import React, { useState, useEffect, useContext } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Panel } from "primereact/panel";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import { Tag } from "primereact/tag";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { Toast } from "primereact/toast";
import { AuthContext } from "../../context/AuthContext";

const Payments = () => {
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [amount, setAmount] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [expandedRows, setExpandedRows] = useState(null);
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState({
    thisMonth: 0,
    last3Months: 0,
    last12Months: 0,
  });

  const toast = React.useRef(null);

  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res1 = await fetch(
          `${import.meta.env.VITE_API_URL}/api/payments/getUserPayments`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.id,
              organizationId: user.organization_id,
            }),
          }
        );
        const data1 = await res1.json();
        if (data1.success) {
          setPayments(data1.payments);
          calculateStats(data1.payments);
        }
        console.log("Šaljem na getUnpaidInvoices:", {
          userId: user.id,
          organizationId: user.organization_id,
        });

        const res2 = await fetch(
          `${import.meta.env.VITE_API_URL}/api/payments/getUnpaidInvoices`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.id,
              organizationId: user.organization_id,
            }),
          }
        );
        const data2 = await res2.json();
        if (data2.success) setInvoices(data2.invoices);
      } catch (err) {
        console.error("Greška kod dohvaćanja uplata ili faktura:", err);
      }
    };

    fetchData();
  }, [user]);

  const calculateStats = (paymentsList) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    let thisMonth = 0;
    let last3Months = 0;
    let last12Months = 0;

    paymentsList.forEach((p) => {
      const date = new Date(p.payment_date);
      const amount = parseFloat(p.amount_paid) || 0;

      if (date >= startOfMonth) thisMonth += amount;
      if (date >= threeMonthsAgo) last3Months += amount;
      if (date >= twelveMonthsAgo) last12Months += amount;
    });

    setStats({
      thisMonth: thisMonth.toFixed(2),
      last3Months: last3Months.toFixed(2),
      last12Months: last12Months.toFixed(2),
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("hr-HR");
  };

  const getPaymentMethodLabel = (method) => {
    switch (method) {
      case "cash":
        return "Gotovina";
      case "bank_transfer":
        return "Bankovni prijenos";
      case "online_payment":
        return "Online plaćanje";
      default:
        return "Nepoznato";
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      paid: { label: "Plaćeno", severity: "success" },
      partially_paid: { label: "Djelomično", severity: "warning" },
      pending: { label: "Na čekanju", severity: "danger" },
    };

    const s = statusMap[status] || { label: "Nepoznato", severity: "info" };
    return <Tag value={s.label} severity={s.severity} />;
  };

  const handleAddPayment = async () => {
    if (!selectedInvoice || !amount || !paymentMethod) {
      toast.current.show({
        severity: "warn",
        summary: "Greška",
        detail: "Sva polja su obavezna",
      });
      return;
    }

    if (amount > selectedInvoice.remaining_amount) {
      toast.current.show({
        severity: "error",
        summary: "Prekoračenje",
        detail: "Iznos premašuje preostali dug",
      });
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/payments/addPayment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            invoiceId: selectedInvoice.id,
            userId: user.id,
            organizationId: user.organization_id,
            amount_paid: amount,
            payment_method: paymentMethod,
          }),
        }
      );

      const data = await res.json();
      if (data.success) {
        toast.current.show({
          severity: "success",
          summary: "Uspjeh",
          detail: `Uplata zabilježena za fakturu ${selectedInvoice.custom_invoice_code}`,
        });
        setShowDialog(false);
        setAmount(null);
        setPaymentMethod(null);
        setSelectedInvoice(null);
      } else {
        toast.current.show({
          severity: "error",
          summary: "Greška",
          detail: data.error || "Neuspješno",
        });
      }
    } catch (err) {
      console.error("Greška kod slanja uplate:", err);
      toast.current.show({
        severity: "error",
        summary: "Greška",
        detail: "Greška kod slanja zahtjeva.",
      });
    }
  };

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch = payment.custom_invoice_code
      ?.toLowerCase()
      .includes(search.toLowerCase());
    const paymentDate = new Date(payment.payment_date);
    const matchesDateRange =
      (!startDate || paymentDate >= startDate) &&
      (!endDate || paymentDate <= endDate);
    return matchesSearch && matchesDateRange;
  });

  const resetFilters = () => {
    setSearch("");
    setStartDate(null);
    setEndDate(null);
  };

  const inputStyle = { height: "2.5rem", width: "100%" };

  return (
    <div className="parent" style={{ marginTop: "5%" }}>
      <Toast ref={toast} />

      <div className="div1">
        <h1>Uplate</h1>
      </div>

      <div className="div3">
        <Button
          label="Zabilježi uplatu"
          icon="pi pi-plus"
          raised
          size="small"
          onClick={() => setShowDialog(true)}
        />
      </div>

      <div className="div4">
        <div style={{ marginLeft: "3%", marginRight: "3%" }}>
          <Panel
            header="Statistika uplata"
            style={{ fontSize: "0.88rem", marginBottom: "1rem" }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(14rem, 1fr))",
                gap: "1rem",
              }}
            >
              <div>
                <strong>Uplate ovog mjeseca:</strong>
                <br />
                {stats.thisMonth} €
              </div>
              <div>
                <strong>Uplate zadnja 3 mjeseca:</strong>
                <br />
                {stats.last3Months} €
              </div>
              <div>
                <strong>Uplate zadnjih 12 mjeseci:</strong>
                <br />
                {stats.last12Months} €
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
              placeholder="Pretraži broj fakture"
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
            value={filteredPayments}
            paginator
            rows={5}
            rowsPerPageOptions={[5, 10, 25, 50]}
            style={{ fontSize: "0.9rem" }}
          >
            <Column field="custom_payment_code" header="ID" sortable />
            <Column
              field="custom_invoice_code"
              header="Broj fakture"
              sortable
            />
            <Column
              field="payment_date"
              header="Datum uplate"
              body={(rowData) => formatDate(rowData.payment_date)}
              sortable
            />
            <Column
              field="amount_paid"
              header="Iznos uplate (€)"
              body={(rowData) =>
                !isNaN(parseFloat(rowData.amount_paid))
                  ? parseFloat(rowData.amount_paid).toFixed(2)
                  : "-"
              }
              sortable
            />
            <Column
              field="payment_method"
              header="Način plaćanja"
              body={(rowData) => getPaymentMethodLabel(rowData.payment_method)}
              sortable
            />
            <Column
              field="status"
              header="Status"
              body={(rowData) => getStatusTag(rowData.status)}
              sortable
            />
          </DataTable>
        </div>
      </div>

      <Dialog
        header="Nova uplata"
        visible={showDialog}
        style={{ width: "50rem" }}
        onHide={() => setShowDialog(false)}
      >
        {!selectedInvoice ? (
          <DataTable
            value={invoices.filter((i) => i.status !== "paid")}
            expandedRows={expandedRows}
            onRowToggle={(e) => setExpandedRows(e.data)}
            rowExpansionTemplate={(data) => (
              <div style={{ padding: "1rem" }}>
                <p>
                  <strong>Klijent:</strong> {data.client_name}
                </p>
                <p>
                  <strong>Iznos fakture:</strong>{" "}
                  {Number(data.final_amount).toFixed(2)} €
                </p>
                <p>
                  <strong>Preostalo za platiti:</strong>{" "}
                  {Number(data.remaining_amount).toFixed(2)} €
                </p>

                <p>
                  <strong>Datum fakture:</strong>{" "}
                  {formatDate(data.invoice_date)}
                </p>
              </div>
            )}
            dataKey="id"
            style={{ fontSize: "0.9rem" }}
          >
            <Column expander style={{ width: "3em" }} />
            <Column field="custom_invoice_code" header="Broj fakture" />
            <Column field="client_name" header="Klijent" />
            <Column field="remaining_amount" header="Za platiti (€)" />
            <Column
              header="Akcija"
              body={(rowData) => (
                <Button
                  label="Odaberi"
                  size="small"
                  onClick={() => setSelectedInvoice(rowData)}
                />
              )}
            />
          </DataTable>
        ) : (
          <div className="p-fluid">
            <h4>{selectedInvoice.custom_invoice_code}</h4>
            <p>
              Klijent: <strong>{selectedInvoice.client_name}</strong>
            </p>
            <p>
              Preostalo za platiti:{" "}
              <strong>
                {Number(selectedInvoice.remaining_amount).toFixed(2)} €
              </strong>
            </p>
            <InputNumber
              value={amount}
              onValueChange={(e) => setAmount(e.value)}
              mode="currency"
              currency="EUR"
              placeholder="Iznos uplate"
              max={selectedInvoice.remaining_amount}
            />
            <Dropdown
              value={paymentMethod}
              options={[
                { label: "Gotovina", value: "cash" },
                { label: "Bankovni prijenos", value: "bank_transfer" },
                { label: "Online plaćanje", value: "online_payment" },
              ]}
              placeholder="Način plaćanja"
              onChange={(e) => setPaymentMethod(e.value)}
              style={{ marginTop: "1rem" }}
            />
            <Button
              label="Potvrdi uplatu"
              icon="pi pi-check"
              onClick={() => {
                if (!amount || amount <= 0) {
                  toast.current.show({
                    severity: "error",
                    summary: "Neispravan iznos",
                    detail: "Iznos mora biti veći od 0.",
                  });
                  return;
                }

                if (amount > selectedInvoice.remaining_amount) {
                  toast.current.show({
                    severity: "error",
                    summary: "Prekoračenje",
                    detail: "Iznos premašuje preostali dug.",
                  });
                  return;
                }

                handleAddPayment();
              }}
              disabled={
                !amount ||
                amount <= 0 ||
                amount > selectedInvoice.remaining_amount ||
                !paymentMethod
              }
              style={{ marginTop: "1rem" }}
            />
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default Payments;
