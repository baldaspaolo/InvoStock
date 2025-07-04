import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  Panel,
  Button,
  DataTable,
  Column,
  Card,
  ProgressSpinner,
  Toast,
  Dialog,
  Divider,
} from "primereact";
import {
  formatDate,
  formatCurrency,
  formatStatus,
} from "../../utils/formatters";

const UsersItem = () => {
  const { id } = useParams();
  const API_URL = import.meta.env.VITE_API_URL;
  const toast = useRef(null);

  const [user, setUser] = useState(null);
  const [expandedRows, setExpandedRows] = useState(null);
  const [activeTab, setActiveTab] = useState("invoices");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState({
    user: true,
    tabData: false,
    dialog: false,
  });
  const [selectedItem, setSelectedItem] = useState(null);
  const [dialogVisible, setDialogVisible] = useState(false);

  const tabs = [
    { key: "invoices", label: "Fakture" },
    { key: "orders", label: "Narudžbenice" },
    { key: "expenses", label: "Troškovi" },
    { key: "packages", label: "Paketi" },
    { key: "payments", label: "Uplate" },
    { key: "inventory", label: "Inventar" },
  ];

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/users/${id}`);
        if (!res.ok) throw new Error("Neuspješno dohvaćanje korisnika");
        const data = await res.json();
        setUser(data.user);
        console.log(data);
      } catch (error) {
        showError(error.message);
      } finally {
        setLoading((prev) => ({ ...prev, user: false }));
      }
    };
    fetchUser();
  }, [API_URL, id]);

  useEffect(() => {
    if (!activeTab) return;
    const fetchTabData = async () => {
      setLoading((prev) => ({ ...prev, tabData: true }));
      try {
        const res = await fetch(
          `${API_URL}/api/admin/users/${id}/${activeTab}`
        );
        if (!res.ok) throw new Error(`Neuspješno dohvaćanje ${activeTab}`);
        const data = await res.json();
        setData(data);
      } catch (error) {
        showError(error.message);
        setData([]);
      } finally {
        setLoading((prev) => ({ ...prev, tabData: false }));
      }
    };
    fetchTabData();
  }, [API_URL, id, activeTab]);

  const showError = (message) => {
    toast.current.show({
      severity: "error",
      summary: "Greška",
      detail: message,
      life: 5000,
    });
  };

  const onRowClick = async (event) => {
    setLoading((prev) => ({ ...prev, dialog: true }));
    setDialogVisible(true);

    try {
      let endpoint = "";
      switch (activeTab) {
        case "invoices":
          endpoint = `invoices/${event.data.id}`;
          break;
        case "orders":
          endpoint = `orders/${event.data.id}`;
          break;
        case "expenses":
          endpoint = `expenses/${event.data.id}`;
          break;
        case "packages":
          endpoint = `packages/${event.data.id}`;
          break;
        case "payments":
          endpoint = `payments/${event.data.id}`;
          break;
        case "inventory":
          endpoint = `inventory/${event.data.id}`;
          break;
        default:
          return;
      }

      const res = await fetch(`${API_URL}/api/admin/users/${id}/${endpoint}`);
      if (!res.ok) throw new Error("Neuspješno dohvaćanje detalja");
      const detailedData = await res.json();
      setSelectedItem(detailedData);
    } catch (error) {
      showError(error.message);
    } finally {
      setLoading((prev) => ({ ...prev, dialog: false }));
    }
  };

  const renderDialogContent = () => {
    if (loading.dialog) {
      return <ProgressSpinner />;
    }

    if (!selectedItem) {
      return <p>Nema dostupnih podataka</p>;
    }

    switch (activeTab) {
      case "invoices":
        return (
          <div>
            <div>
              <div>
                <h3>Osnovne informacije</h3>
                <p>
                  <strong>Broj fakture:</strong>{" "}
                  {selectedItem.custom_invoice_code || "-"}
                </p>
                <p>
                  <strong>Datum fakture:</strong>{" "}
                  {formatDate(selectedItem.invoice_date)}
                </p>
                <p>
                  <strong>Rok plaćanja:</strong>{" "}
                  {formatDate(selectedItem.due_date)}
                </p>
                <p>
                  <strong>Status:</strong> {formatStatus(selectedItem.status)}
                </p>
                <p>
                  <strong>Ukupan iznos:</strong>{" "}
                  {formatCurrency(selectedItem.total_amount)}
                </p>
                <p>
                  <strong>Popust:</strong>{" "}
                  {formatCurrency(selectedItem.discount)}
                </p>
                <p>
                  <strong>Konačni iznos:</strong>{" "}
                  {formatCurrency(selectedItem.final_amount)}
                </p>
                <p>
                  <strong>Preostalo za platiti:</strong>{" "}
                  {formatCurrency(selectedItem.remaining_amount)}
                </p>
              </div>
              <div>
                <h3>Klijent</h3>
                <p>
                  <strong>Ime:</strong> {selectedItem.contact_first_name || "-"}{" "}
                  {selectedItem.contact_last_name || "-"}
                </p>
                <p>
                  <strong>Email:</strong> {selectedItem.client_email || "-"}
                </p>
                <p>
                  <strong>Naziv tvrtke:</strong>{" "}
                  {selectedItem.client_company || "-"}
                </p>
              </div>
            </div>

            <Divider />

            <h3>Stavke fakture</h3>
            <DataTable
              value={selectedItem.items}
              className="p-datatable-sm"
              emptyMessage="Nema stavki"
              onRowClick={onRowClick}
            >
              <Column field="item_name" header="Naziv" />
              <Column field="quantity" header="Količina" />
              <Column
                field="price"
                header="Cijena"
                body={(row) => formatCurrency(row.price)}
              />
              <Column
                field="total_price"
                header="Ukupno"
                body={(row) => formatCurrency(row.total_price)}
              />
              <Column field="item_description" header="Opis" />
            </DataTable>

            {selectedItem.payments && selectedItem.payments.length > 0 && (
              <>
                <Divider />
                <h3>Uplate</h3>
                <DataTable
                  value={selectedItem.payments}
                  className="p-datatable-sm"
                >
                  <Column
                    field="payment_date"
                    header="Datum"
                    body={(row) => formatDate(row.payment_date)}
                  />
                  <Column
                    field="amount_paid"
                    header="Iznos"
                    body={(row) => formatCurrency(row.amount_paid)}
                  />
                  <Column field="payment_method" header="Način plaćanja" />
                </DataTable>
              </>
            )}
          </div>
        );

      case "orders":
        return (
          <div>
            <div>
              <div>
                <h3>Osnovne informacije</h3>
                <p>
                  <strong>Broj narudžbe:</strong>{" "}
                  {selectedItem.custom_order_code || "-"}
                </p>
                <p>
                  <strong>Datum narudžbe:</strong>{" "}
                  {formatDate(selectedItem.order_date)}
                </p>
                <p>
                  <strong>Datum isporuke:</strong>{" "}
                  {formatDate(selectedItem.received_date)}
                </p>
                <p>
                  <strong>Status:</strong> {formatStatus(selectedItem.status)}
                </p>
                <p>
                  <strong>Ukupan iznos:</strong>{" "}
                  {formatCurrency(selectedItem.total_price)}
                </p>
              </div>
              <div>
                <h3>Dobavljač</h3>
                <p>
                  <strong>Naziv:</strong> {selectedItem.supplier_name || "-"}
                </p>
                <p>
                  <strong>Email:</strong> {selectedItem.supplier_email || "-"}
                </p>
                <p>
                  <strong>Telefon:</strong> {selectedItem.supplier_phone || "-"}
                </p>
              </div>
            </div>

            <Divider />

            <h3>Stavke narudžbe</h3>
            <DataTable
              value={selectedItem.items}
              className="p-datatable-sm"
              emptyMessage="Nema stavki"
            >
              <Column field="item_name" header="Naziv" />
              <Column field="quantity" header="Količina" />
              <Column
                field="price"
                header="Cijena"
                body={(row) => formatCurrency(row.price)}
              />
              <Column field="description" header="Opis" />
            </DataTable>
          </div>
        );

      case "expenses":
        return (
          <div>
            <div>
              <div>
                <h3>Osnovne informacije</h3>
                <p>
                  <strong>Naziv:</strong> {selectedItem.name || "-"}
                </p>
                <p>
                  <strong>Datum:</strong>{" "}
                  {formatDate(selectedItem.expense_date)}
                </p>
                <p>
                  <strong>Kategorija:</strong>{" "}
                  {selectedItem.category_name || "-"}
                </p>
                <p>
                  <strong>Iznos:</strong> {formatCurrency(selectedItem.amount)}
                </p>
              </div>
              <div>
                <h3>Dodatne informacije</h3>
                <p>
                  <strong>Broj troška:</strong>{" "}
                  {selectedItem.custom_expense_code || "-"}
                </p>
                <p>
                  <strong>Opis:</strong> {selectedItem.description || "-"}
                </p>
              </div>
            </div>
          </div>
        );

      case "packages":
        return (
          <div>
            <div>
              <div>
                <h3>Osnovne informacije</h3>
                <p>
                  <strong>Broj paketa:</strong> {selectedItem.code || "-"}
                </p>
                <p>
                  <strong>Datum kreiranja:</strong>{" "}
                  {formatDate(selectedItem.created_at)}
                </p>
                <p>
                  <strong>Status:</strong> {formatStatus(selectedItem.status)}
                </p>
                <p>
                  <strong>Datum isporuke:</strong>{" "}
                  {formatDate(selectedItem.delivery_date)}
                </p>
                <p>
                  <strong>Datum primitka:</strong>{" "}
                  {formatDate(selectedItem.received_date)}
                </p>
              </div>
              <div>
                <h3>Klijent</h3>
                <p>
                  <strong>Ime:</strong> {selectedItem.contact_first_name || "-"}{" "}
                  {selectedItem.contact_last_name || "-"}
                </p>
                <p>
                  <strong>Adresa:</strong> {selectedItem.contact_address || "-"}
                </p>
                <p>
                  <strong>Telefon:</strong> {selectedItem.contact_phone || "-"}
                </p>
              </div>
            </div>

            <Divider />

            <h3>Dodatne informacije</h3>
            <p>
              <strong>Dostavljač:</strong> {selectedItem.courier || "-"}
            </p>
            <p>
              <strong>Opis:</strong> {selectedItem.description || "-"}
            </p>
          </div>
        );

      case "payments":
        return (
          <div>
            <div>
              <div>
                <h3>Osnovne informacije</h3>
                <p>
                  <strong>Datum uplate:</strong>{" "}
                  {formatDate(selectedItem.payment_date)}
                </p>
                <p>
                  <strong>Iznos:</strong>{" "}
                  {formatCurrency(selectedItem.amount_paid)}
                </p>
                <p>
                  <strong>Način plaćanja:</strong>{" "}
                  {selectedItem.payment_method || "-"}
                </p>
                <p>
                  <strong>Broj uplate:</strong>{" "}
                  {selectedItem.custom_payment_code || "-"}
                </p>
              </div>
              <div>
                <h3>Faktura</h3>
                <p>
                  <strong>Broj fakture:</strong>{" "}
                  {selectedItem.invoice_code || "-"}
                </p>
                <p>
                  <strong>Klijent:</strong> {selectedItem.client_name || "-"}
                </p>
                <p>
                  <strong>Iznos fakture:</strong>{" "}
                  {formatCurrency(selectedItem.invoice_amount)}
                </p>
              </div>
            </div>
          </div>
        );

      case "inventory":
        return (
          <div>
            <div>
              <div>
                <h3>Osnovne informacije</h3>
                <p>
                  <strong>Naziv artikla:</strong>{" "}
                  {selectedItem.item_name || "-"}
                </p>
                <p>
                  <strong>Kategorija:</strong> {selectedItem.category || "-"}
                </p>
                <p>
                  <strong>Količina:</strong>{" "}
                  {selectedItem.stock_quantity || "0"}
                </p>
                <p>
                  <strong>Minimalna zaliha:</strong>{" "}
                  {selectedItem.reorder_level || "0"}
                </p>
              </div>
              <div>
                <h3>Financije</h3>
                <p>
                  <strong>Cijena:</strong> {formatCurrency(selectedItem.price)}
                </p>
                <p>
                  <strong>Broj artikla:</strong>{" "}
                  {selectedItem.custom_inventory_code || "-"}
                </p>
              </div>
            </div>

            <Divider />

            <h3>Dodatne informacije</h3>
            <p>
              <strong>Opis:</strong> {selectedItem.description || "-"}
            </p>
            <p>
              <strong>Zadnja promjena:</strong>{" "}
              {formatDate(selectedItem.updated_at)}
            </p>
          </div>
        );

      default:
        return <p>Detalji nisu dostupni</p>;
    }
  };

  const getColumns = () => {
    switch (activeTab) {
      case "invoices":
        return [
          {
            field: "custom_invoice_code",
            header: "Broj fakture",
            sortable: true,
          },
          {
            field: "invoice_date",
            header: "Datum",
            sortable: true,
            body: (row) => formatDate(row.invoice_date),
          },
          {
            field: "total_amount",
            header: "Ukupno",
            sortable: true,
            body: (row) => formatCurrency(row.total_amount),
          },
          {
            field: "status",
            header: "Status",
            sortable: true,
            body: (row) => formatStatus(row.status),
          },
          {
            field: "contact_first_name",
            header: "Klijent",
            body: (row) =>
              `${row.contact_first_name || "-"} ${row.contact_last_name || ""}`,
          },
        ];
      case "orders":
        return [
          {
            field: "custom_order_code",
            header: "Broj narudžbe",
            sortable: true,
          },
          {
            field: "order_date",
            header: "Datum",
            sortable: true,
            body: (row) => formatDate(row.order_date),
          },
          {
            field: "total_price",
            header: "Ukupno",
            sortable: true,
            body: (row) => formatCurrency(row.total_price),
          },
          {
            field: "status",
            header: "Status",
            sortable: true,
            body: (row) => formatStatus(row.status),
          },
          { field: "supplier_name", header: "Dobavljač", sortable: true },
        ];
      case "expenses":
        return [
          {
            field: "custom_expense_code",
            header: "Broj troška",
            sortable: true,
          },
          {
            field: "expense_date",
            header: "Datum",
            sortable: true,
            body: (row) => formatDate(row.expense_date),
          },
          {
            field: "amount",
            header: "Iznos",
            sortable: true,
            body: (row) => formatCurrency(row.amount),
          },
          { field: "category_name", header: "Kategorija", sortable: true },
        ];
      case "payments":
        return [
          {
            field: "custom_payment_code",
            header: "Broj uplate",
            sortable: true,
          },
          {
            field: "payment_date",
            header: "Datum",
            sortable: true,
            body: (row) => formatDate(row.payment_date),
          },
          {
            field: "amount_paid",
            header: "Iznos",
            sortable: true,
            body: (row) => formatCurrency(row.amount_paid),
          },
          { field: "payment_method", header: "Način plaćanja", sortable: true },
        ];
      case "packages":
        return [
          { field: "code", header: "Broj paketa", sortable: true },
          {
            field: "created_at",
            header: "Datum",
            sortable: true,
            body: (row) => formatDate(row.created_at),
          },
          {
            field: "status",
            header: "Status",
            sortable: true,
            body: (row) => formatStatus(row.status),
          },
          {
            field: "contact_first_name",
            header: "Klijent",
            body: (row) =>
              `${row.contact_first_name || "-"} ${row.contact_last_name || ""}`,
          },
        ];
      case "inventory":
        return [
          {
            field: "custom_inventory_code",
            header: "Broj artikla",
            sortable: true,
          },
          { field: "item_name", header: "Naziv", sortable: true },
          { field: "stock_quantity", header: "Količina", sortable: true },
          {
            field: "price",
            header: "Cijena",
            sortable: true,
            body: (row) => formatCurrency(row.price),
          },
        ];
      default:
        return [];
    }
  };

  const rowExpansionTemplate = (rowData) => {
    switch (activeTab) {
      case "invoices":
        return (
          <div>
            <h5>Stavke fakture:</h5>
            <ul>
              {rowData.items?.map((item, index) => (
                <li key={index}>
                  {item.item_name} – {item.quantity} x{" "}
                  {formatCurrency(item.price)} ={" "}
                  {formatCurrency(item.total_price)}
                </li>
              ))}
            </ul>
            <p>
              <strong>Klijent:</strong> {rowData.contact_first_name || "-"}{" "}
              {rowData.contact_last_name || ""}
            </p>
          </div>
        );
      case "orders":
        return (
          <div>
            <h5>Stavke narudžbe:</h5>
            <ul>
              {rowData.items?.map((item, index) => (
                <li key={index}>
                  {item.item_name} – {item.quantity} x{" "}
                  {formatCurrency(item.price)}
                </li>
              ))}
            </ul>
            <p>
              <strong>Dobavljač:</strong> {rowData.supplier_name || "-"}
            </p>
          </div>
        );
      case "expenses":
        return (
          <div>
            <p>
              <strong>Opis:</strong> {rowData.description || "-"}
            </p>
            <p>
              <strong>Kategorija:</strong> {rowData.category_name || "-"}
            </p>
            <p>
              <strong>Iznos:</strong> {formatCurrency(rowData.amount)}
            </p>
          </div>
        );
      case "payments":
        return (
          <div>
            <p>
              <strong>Način plaćanja:</strong> {rowData.payment_method || "-"}
            </p>
            <p>
              <strong>Faktura:</strong> {rowData.invoice_code || "-"}
            </p>
          </div>
        );
      case "packages":
        return (
          <div>
            <p>
              <strong>Klijent:</strong> {rowData.contact_first_name || "-"}{" "}
              {rowData.contact_last_name || "-"}
            </p>
            <p>
              <strong>Dostavljač:</strong> {rowData.courier || "-"}
            </p>
          </div>
        );
      case "inventory":
        return (
          <div>
            <p>
              <strong>Kategorija:</strong> {rowData.category || "-"}
            </p>
            <p>
              <strong>Minimalna zaliha:</strong> {rowData.reorder_level || "0"}
            </p>
            {rowData.description && (
              <p>
                <strong>Opis:</strong> {rowData.description}
              </p>
            )}
          </div>
        );
      default:
        return <div className="p-3">Nema dodatnih podataka</div>;
    }
  };

  if (loading.user) {
    return (
      <div style={{ height: "50vh" }}>
        <ProgressSpinner />
      </div>
    );
  }

  if (!user) {
    return <p>Korisnik nije pronađen</p>;
  }

  return (
    <div style={{ margin: "5%" }}>
      <Toast ref={toast} />

      <Panel header="Podaci o korisniku" style={{ margin: "4% 3% 2% 3%" }}>
        <div>
          <div>
            <p>
              <strong>Ime:</strong> {user.name}
            </p>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>Organizacija:</strong>{" "}
              {user.organization_id
                ? `ID: ${user.organization_id}`
                : "Nema organizacije"}
            </p>
          </div>
          <div>
            <p>
              <strong>Uloga:</strong>{" "}
              {user.role === "systemadmin"
                ? "Sustavni administrator"
                : user.role === "organization"
                ? "Organizacijski admin"
                : "Korisnik"}
            </p>
            <p>
              <strong>Datum registracije:</strong> {formatDate(user.created_at)}
            </p>
          </div>
        </div>
      </Panel>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "0.5rem",
          margin: "0 5%",
        }}
      >
        {tabs.map((tab) => (
          <Button
            key={tab.key}
            label={tab.label}
            onClick={() => setActiveTab(tab.key)}
            severity={activeTab === tab.key ? "info" : "secondary"}
          />
        ))}
      </div>

      <Card title={tabs.find((t) => t.key === activeTab)?.label}>
        {loading.tabData ? (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <ProgressSpinner />
          </div>
        ) : (
          <>
            <DataTable
              value={data}
              tableStyle={{ minWidth: "50rem" }}
              paginator
              rows={10}
              rowsPerPageOptions={[5, 10, 25, 50]}
              emptyMessage="Nema podataka"
              expandedRows={expandedRows}
              onRowToggle={(e) => setExpandedRows(e.data)}
              rowExpansionTemplate={rowExpansionTemplate}
              onRowClick={onRowClick}
              selectionMode="single"
              selection={selectedItem}
              onSelectionChange={(e) => setSelectedItem(e.value)}
            >
              {getColumns().map((col) => (
                <Column
                  key={col.field}
                  field={col.field}
                  header={col.header}
                  sortable={col.sortable}
                  body={col.body}
                />
              ))}
            </DataTable>

            <Dialog
              header={`Detalji ${tabs.find((t) => t.key === activeTab)?.label}`}
              visible={dialogVisible}
              style={{ width: "70vw" }}
              maximizable
              modal
              onHide={() => setDialogVisible(false)}
            >
              {renderDialogContent()}
            </Dialog>
          </>
        )}
      </Card>
    </div>
  );
};

export default UsersItem;
