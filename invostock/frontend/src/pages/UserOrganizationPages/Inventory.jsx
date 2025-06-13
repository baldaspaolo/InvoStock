import React, { useState, useContext, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

import { Toast } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";
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

const Inventory = () => {
  const menu = useRef(null);
  const navigate = useNavigate();
  const toast = useRef(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryDialogVisible, setCategoryDialogVisible] = useState(false);
  const [editedCategory, setEditedCategory] = useState(null);
  const [editedName, setEditedName] = useState("");
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [rawCategories, setRawCategories] = useState([]); // za prikaz tablice
  const [inventoryItems, setInventoryItems] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const { user } = useContext(AuthContext);
  const [displayModal, setDisplayModal] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [modalTitle, setModalTitle] = useState("");
  const [categoryOptions, setCategoryOptions] = useState([
    { label: "Sve kategorije", value: "all" },
  ]);

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

  useEffect(() => {
    fetchInventory();
  }, [user.id, user.organizationId]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/inventory/getCategories?userId=${
          user.id
        }&organizationId=${user.organization_id || ""}`
      );

      if (!response.ok) {
        throw new Error("Greška prilikom dohvaćanja kategorija");
      }

      const data = await response.json();
      console.log(data);

      const options = [
        { label: "Sve kategorije", value: "all" },
        ...data.categories.map((cat) => ({
          label: cat.name,
          value: cat.id.toString(),
        })),
      ];

      setCategoryOptions(options);
      setRawCategories(data.categories);
    } catch (error) {
      console.error("Greška kod dohvaćanja kategorija:", error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [user.id, user.organization_id]);

  const menuItems = [
    {
      label: "Upravljanje kategorijama",
      icon: "pi pi-tags",
      command: () => setCategoryDialogVisible(true),
    },
  ];

  const handleStatusChange = (e) => {
    setStatusFilter(e.value);
  };

  const handleCategoryChange = (e) => {
    setCategoryFilter(e.value);
  };

  const getItemStatus = (item) => {
    if (item.stock_quantity === 0) return "out_of_stock";
    if (item.stock_quantity <= item.reorder_level) return "low_stock";
    return "sufficient";
  };

  const filteredItems = inventoryItems.filter((item) => {
    const matchesSearch = item.item_name
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || getItemStatus(item) === statusFilter;
    const matchesCategory =
      categoryFilter === "all" ||
      item.category_id?.toString() === categoryFilter;

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

  const handleEditCategory = (category) => {
    setEditedCategory(category);
    setEditedName(category.name);
  };

  const saveEditedCategory = async () => {
    if (!editedName.trim()) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/inventory/updateCategory/${
          editedCategory.id
        }`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: editedName }),
        }
      );

      const data = await res.json();
      if (data.success) {
        setRawCategories((prev) =>
          prev.map((cat) =>
            cat.id === editedCategory.id ? { ...cat, name: editedName } : cat
          )
        );
        toast.current.show({
          severity: "success",
          summary: "Kategorija ažurirana",
          detail: `Naziv promijenjen u "${editedName}"`,
          life: 3000,
        });
        setEditedCategory(null);
        setEditedName("");
        fetchInventory();
        fetchCategories();
      }
    } catch (err) {
      console.error("Greška kod uređivanja:", err);
    }
  };

  const handleDeleteCategory = (category) => {
    setEditedCategory(category);
    setConfirmDeleteVisible(true);
  };

  const confirmDeleteCategory = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/inventory/deleteCategory/${
          editedCategory.id
        }`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (data.success) {
        setRawCategories((prev) =>
          prev.filter((cat) => cat.id !== editedCategory.id)
        );
        toast.current.show({
          severity: "success",
          summary: "Kategorija obrisana",
          detail: `"${editedCategory.name}" je uspješno uklonjena.`,
          life: 3000,
        });
        fetchInventory();
        fetchCategories();
      }
    } catch (err) {
      console.error("Greška kod brisanja:", err);
    } finally {
      setEditedCategory(null);
      setConfirmDeleteVisible(false);
    }
  };

  const addNewCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/inventory/addCategory`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            organizationId: user.organization_id,
            name: newCategoryName,
          }),
        }
      );

      const data = await res.json();
      if (data.success) {
        const newCat = { id: data.category_id, name: newCategoryName };
        setRawCategories((prev) => [...prev, newCat]);
        setCategoryOptions((prev) => [
          ...prev,
          { label: newCategoryName, value: data.category_id.toString() },
        ]);
        toast.current.show({
          severity: "success",
          summary: "Dodana kategorija",
          detail: `"${newCategoryName}" je uspješno dodana.`,
          life: 3000,
        });
        setNewCategoryName("");
        fetchInventory();
        fetchCategories();
      } else {
        throw new Error(data.error || "Neuspješno dodavanje kategorije");
      }
    } catch (err) {
      console.error("Greška kod dodavanja kategorije:", err);
      toast.current.show({
        severity: "error",
        summary: "Greška",
        detail: err.message,
        life: 3000,
      });
    }
  };

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
        <Column field="category_name" header="Kategorija" sortable></Column>
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
            <Column field="category_name" header="Kategorija" sortable></Column>
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
      <Toast ref={toast} />
      <ConfirmDialog
        visible={confirmDeleteVisible}
        onHide={() => setConfirmDeleteVisible(false)}
        message={`Jeste li sigurni da želite obrisati kategoriju "${editedCategory?.name}"?`}
        header="Potvrda brisanja"
        icon="pi pi-exclamation-triangle"
        accept={confirmDeleteCategory}
        reject={() => setConfirmDeleteVisible(false)}
      />
      <Dialog
        header="Upravljanje kategorijama"
        visible={categoryDialogVisible}
        style={{ width: "30rem" }}
        onHide={() => {
          setCategoryDialogVisible(false);
          setEditedCategory(null);
          setEditedName("");
        }}
      >
        <DataTable value={rawCategories} emptyMessage="Nema kategorija.">
          <Column
            field="name"
            header="Naziv kategorije"
            body={(rowData) =>
              editedCategory?.id === rowData.id ? (
                <InputText
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  style={{ width: "100%" }}
                />
              ) : (
                rowData.name
              )
            }
          />
          <Column
            header="Akcije"
            body={(rowData) =>
              editedCategory?.id === rowData.id ? (
                <Button
                  icon="pi pi-check"
                  severity="success"
                  text
                  onClick={saveEditedCategory}
                />
              ) : (
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <Button
                    icon="pi pi-pencil"
                    severity="warning"
                    text
                    onClick={() => handleEditCategory(rowData)}
                  />
                  <Button
                    icon="pi pi-trash"
                    severity="danger"
                    text
                    onClick={() => handleDeleteCategory(rowData)}
                  />
                </div>
              )
            }
          />
        </DataTable>
        <div style={{ marginTop: "1rem" }}>
          <div className="field">
            <label htmlFor="newCategory">Nova kategorija</label>
            <InputText
              id="newCategory"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="npr. Dijelovi, Pakiranja..."
              style={{ width: "100%" }}
            />
          </div>
          <Button
            label="Dodaj"
            icon="pi pi-plus"
            onClick={addNewCategory}
            style={{ marginTop: "0.5rem" }}
            severity="success"
          />
        </div>
      </Dialog>
    </div>
  );
};

export default Inventory;
