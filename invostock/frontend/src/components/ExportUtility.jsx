import React, { useRef } from "react";
import { Menu } from "primereact/menu";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";

const ExportUtility = ({
  refElement,
  toastRef,
  fileName,
  excelData,
  excelColumns,
}) => {
  const menuRef = useRef(null);

  const generatePDF = () => {
    const input = refElement.current;

    const originalStyles = {
      overflow: input.style.overflow,
      position: input.style.position,
      zIndex: input.style.zIndex,
    };

    input.style.overflow = "visible";
    input.style.position = "relative";
    input.style.zIndex = "9999";

    html2canvas(input, {
      scale: 1,
      logging: false,
      useCORS: true,
      scrollX: 0,
      scrollY: 0,
      windowWidth: input.scrollWidth,
      windowHeight: input.scrollHeight,
      backgroundColor: "#ffffff",
    })
      .then((canvas) => {
        Object.assign(input.style, originalStyles);

        const imgWidth = (canvas.width * 0.75) / 96;
        const imgHeight = (canvas.height * 0.75) / 96;

        const pdf = new jsPDF({
          orientation: imgWidth > imgHeight ? "landscape" : "portrait",
          unit: "in",
          format: [imgWidth, imgHeight],
        });

        pdf.addImage(
          canvas,
          "PNG",
          0,
          0,
          imgWidth,
          imgHeight,
          undefined,
          "FAST"
        );
        pdf.save(`${fileName}.pdf`);

        toastRef.current.show({
          severity: "success",
          summary: "PDF spremljen",
          detail: "Dokument je uspješno spremljen kao PDF",
          life: 3000,
        });
      })
      .catch((error) => {
        console.error("Greška pri generiranju PDF-a:", error);
        Object.assign(input.style, originalStyles);
      });
  };

  const exportToExcel = () => {
    // Kreiranje Excel radne knjige
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(excelData);

    // Stiliziranje (opcionalno)
    if (excelColumns) {
      ws["!cols"] = excelColumns;
    }

    XLSX.utils.book_append_sheet(wb, ws, fileName);
    XLSX.writeFile(wb, `${fileName}.xlsx`);

    toastRef.current.show({
      severity: "success",
      summary: "Excel spremljen",
      detail: "Dokument je uspješno spremljen kao Excel",
      life: 3000,
    });
  };

  const menuItems = [
    {
      label: "Opcije",
      items: [
        {
          label: "Spremi kao PDF",
          icon: "pi pi-file-pdf",
          command: () => generatePDF(),
        },
        {
          label: "Spremi kao Excel",
          icon: "pi pi-file-excel",
          command: () => exportToExcel(),
        },
      ],
    },
  ];

  return (
    <>
      <Menu
        model={menuItems}
        popup
        ref={menuRef}
        id="popup_menu"
        style={{ width: "200px" }}
      />
      <Button
        icon="pi pi-ellipsis-h"
        text
        raised
        severity="info"
        aria-label="Opcije"
        style={{ width: "30%", marginLeft: "70%", marginBottom: "5%" }}
        onClick={(e) => menuRef.current.toggle(e)}
        aria-controls="popup_menu"
        aria-haspopup
      />
    </>
  );
};

export default ExportUtility;
