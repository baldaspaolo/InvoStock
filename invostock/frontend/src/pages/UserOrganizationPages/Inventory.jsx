import React, { useState, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Panel } from "primereact/panel";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Menu } from "primereact/menu";

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
  const [inventoryItems, setInventoryItems] = useState([
    {
      id: 1,
      item_name: "Sat Seiko SNK809",
      category: "Satovi",
      stock_quantity: 3,
      reorder_level: 5,
      price: 120,
      status: "low_stock",
    },
    {
      id: 2,
      item_name: "Narukvica Mesh 20mm",
      category: "Pribor",
      stock_quantity: 10,
      reorder_level: 5,
      price: 25,
      status: "sufficient",
    },
    {
      id: 3,
      item_name: "Staklo Hardlex",
      category: "Rezervni dijelovi",
      stock_quantity: 0,
      reorder_level: 2,
      price: 15,
      status: "out_of_stock",
    },
  ]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const menuItems = [
    {
      label: "Dodaj kategoriju",
      icon: "pi pi-folder-plus",
      command: () => {
        alert("Dodaj kategoriju");
      },
    }
    ,
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
    console.log(`Kliknuto na artikl s ID: ${itemId}`);
    // Kasnije: navigate(`/inventory/${itemId}`)
  };

  const lowStockCount = inventoryItems.filter(
    (item) => item.stock_quantity <= item.reorder_level
  ).length;
  const outOfStockCount = inventoryItems.filter(
    (item) => item.stock_quantity === 0
  ).length;

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
              <div style={{ color: "red" }}>
                <h3>{lowStockCount}</h3>
                <p>Artikli na niskoj zalihi</p>
              </div>
              <div style={{ color: "red" }}>
                <h3>{outOfStockCount}</h3>
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
        </div>
      </div>
    </div>
  );
};

export default Inventory;
