import React, { useState, useContext, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Panel } from "primereact/panel";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Menu } from "primereact/menu";
import { Dialog } from "primereact/dialog";

import "./style.css";

const stockStatusOptions = [
  { label: "Sve", value: "all" },
  { label: "Niska zaliha", value: "low_stock" },
  { label: "Dovoljna zaliha", value: "sufficient" },
  { label: "Nema zalihe", value: "out_of_stock" },
];

const categoryOptions = [
  { label: "Sve kategorije", value: "all" },
  { label: "Satovi", value: "Satovi" },
  { label: "Pribor", value: "Pribor" },
  { label: "Rezervni dijelovi", value: "Rezervni dijelovi" },
];

const Inventory = () => {
  const menu = useRef(null);
  const navigate = useNavigate();
  const [inventoryItems, setInventoryItems] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const { user } = useContext(AuthContext);
  const [displayModal, setDisplayModal] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [modalTitle, setModalTitle] = useState("");

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/inventory/getInventory`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: user.id,
              organizationId: user.organization_id, 
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Greška prilikom dohvaćanja inventara");
        }

        const data = await response.json();
        setInventoryItems(data.inventory);
        console.log(data);
      } catch (error) {
        console.error("Greška:", error);
      }
    };


    fetchInventory();
  }, [user.id, user.organizationId]);

  const menuItems = [
    {
      label: "Dodaj kategoriju",
      icon: "pi pi-folder-plus",
      command: () => {
        alert("Dodaj kategoriju");
      },
    },
  ];

  const handleStatusChange = (e) => {
    setStatusFilter(e.value);
  };

  const handleCategoryChange = (e) => {
    setCategoryFilter(e.value);
  };

  const filteredItems = inventoryItems.filter((item) => {
    const matchesSearch = item.item_name
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;
    const matchesCategory =
      categoryFilter === "all" || item.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const inputStyle = { height: "2.5rem", width: "100%" };

  const onRowClick = (e) => {
    const itemId = e.data.id;
    navigate(`/inventory/${itemId}`);
  };

  const lowStockItems = inventoryItems.filter(
    (item) =>
      item.stock_quantity <= item.reorder_level && item.stock_quantity > 0
  );
  const outOfStockItems = inventoryItems.filter(
    (item) => item.stock_quantity === 0
  );

  const showLowStockModal = () => {
    setModalTitle("Artikli na niskoj zalihi");
    setModalContent(
      <DataTable
        value={lowStockItems}
        paginator
        rows={5}
        rowsPerPageOptions={[5, 10, 25, 50]}
        style={{ fontSize: "0.9rem" }}
        onRowClick={onRowClick}
        pt={{
          bodyRow: {
            style: { cursor: "pointer" },
          },
        }}
      >
        <Column field="id" header="ID" sortable></Column>
        <Column field="item_name" header="Naziv artikla" sortable></Column>
        <Column field="category" header="Kategorija" sortable></Column>
        <Column
          field="stock_quantity"
          header="Količina na zalihi"
          sortable
        ></Column>
        <Column
          field="reorder_level"
          header="Minimalna zaliha"
          sortable
        ></Column>
        <Column field="price" header="Cijena (€)" sortable></Column>
      </DataTable>
    );
    setDisplayModal(true);
  };

  const showOutOfStockModal = () => {
    setModalTitle("Artikli bez zaliha");
    setModalContent(
      <DataTable
        value={outOfStockItems}
        paginator
        rows={5}
        rowsPerPageOptions={[5, 10, 25, 50]}
        style={{ fontSize: "0.9rem" }}
        onRowClick={onRowClick}
        pt={{
          bodyRow: {
            style: { cursor: "pointer" },
          },
        }}
      >
        <Column field="custom_inventory_code" header="ID" sortable></Column>
        <Column field="item_name" header="Naziv artikla" sortable></Column>
        <Column field="category" header="Kategorija" sortable></Column>
        <Column
          field="stock_quantity"
          header="Količina na zalihi"
          sortable
        ></Column>
        <Column
          field="reorder_level"
          header="Minimalna zaliha"
          sortable
        ></Column>
        <Column field="price" header="Cijena (€)" sortable></Column>
      </DataTable>
    );
    setDisplayModal(true);
  };

  return (
    <div className="parent">
      <div className="div1">
        <h1>Inventar</h1>
      </div>

      <div className="div3">
        <Button
          label="Novi artikl"
          icon="pi pi-plus"
          iconPos="right"
          size="small"
          onClick={() => navigate("/inventory/add")}
        />
        <Button
          icon="pi pi-ellipsis-h"
          text
          raised
          severity="info"
          aria-label="User"
          style={{ width: "50%" }}
          onClick={(e) => menu.current.toggle(e)}
        />
        <Menu model={menuItems} popup ref={menu} />
      </div>

      <div className="div4">
        <div style={{ marginLeft: "3%", marginRight: "3%" }}>
          <Panel header="Stanje zaliha" style={{ fontSize: "0.88rem" }}>
            <div style={{ display: "flex", gap: "2rem" }}>
              <div
                style={{ color: "red", cursor: "pointer" }}
                onClick={showLowStockModal}
              >
                <h3>{lowStockItems.length}</h3>
                <p>Artikli na niskoj zalihi</p>
              </div>
              <div
                style={{ color: "red", cursor: "pointer" }}
                onClick={showOutOfStockModal}
              >
                <h3>{outOfStockItems.length}</h3>
                <p>Artikli bez zalihe</p>
              </div>
            </div>
          </Panel>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(12rem, 1fr))",
              gap: "1rem",
              alignItems: "center",
              marginTop: "1rem",
            }}
          >
            <InputText
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pretraži artikl"
              style={inputStyle}
            />
            <Dropdown
              value={statusFilter}
              options={stockStatusOptions}
              onChange={handleStatusChange}
              placeholder="Filtriraj po statusu"
              style={inputStyle}
            />
            <Dropdown
              value={categoryFilter}
              options={categoryOptions}
              onChange={handleCategoryChange}
              placeholder="Filtriraj po kategoriji"
              style={inputStyle}
            />
          </div>

          <DataTable
            value={filteredItems}
            paginator
            rows={5}
            rowsPerPageOptions={[5, 10, 25, 50]}
            style={{ fontSize: "0.9rem", marginTop: "1.5rem" }}
            onRowClick={onRowClick}
            pt={{
              bodyRow: {
                style: { cursor: "pointer" },
              },
            }}
          >
            <Column field="custom_inventory_code" header="ID" sortable></Column>
            <Column field="item_name" header="Naziv artikla" sortable></Column>
            <Column field="category" header="Kategorija" sortable></Column>
            <Column
              field="stock_quantity"
              header="Količina na zalihi"
              sortable
            ></Column>
            <Column
              field="reorder_level"
              header="Minimalna zaliha"
              sortable
            ></Column>
            <Column field="price" header="Cijena (€)" sortable></Column>
          </DataTable>
        </div>
      </div>

      <Dialog
        header={modalTitle}
        visible={displayModal}
        style={{ width: "80vw" }}
        onHide={() => setDisplayModal(false)}
      >
        {modalContent}
      </Dialog>
    </div>
  );
};

export default Inventory;
