import React from "react";
import { Panel } from "primereact/panel";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { useNavigate } from "react-router-dom";

const InventoryAlerts = ({ alerts }) => {
  const navigate = useNavigate();

  const formatCurrency = (amount) => {
    return parseFloat(amount || 0).toLocaleString("hr-HR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <Panel header="Upozorenja za zalihe" style={{ flex: 1 }}>
      {alerts?.length > 0 ? (
        <DataTable
          value={alerts}
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
  );
};

export default InventoryAlerts;
