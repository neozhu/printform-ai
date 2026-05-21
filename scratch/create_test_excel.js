import XLSX from "xlsx";
import fs from "fs";
import path from "path";

const dir = "./scratch";
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const data = [
  {
    "PO Number": "PO-2026-991A",
    "Part Number": "PT-BUS-99",
    "Description": "Model 3 Bushing Unit",
    "Quantity": 150,
    "Unit": "PCS",
    "Carrier": "FedEx",
    "Weight": "250kg",
    "Pallets": "1 Unit"
  },
  {
    "PO Number": "PO-2026-991A",
    "Part Number": "PT-PLT-04",
    "Description": "Model Y Reinforcement Plate",
    "Quantity": 80,
    "Unit": "PCS",
    "Carrier": "FedEx",
    "Weight": "120kg",
    "Pallets": "1 Unit"
  },
  {
    "PO Number": "PO-2026-992B",
    "Part Number": "PT-CLP-11",
    "Description": "CyberTruck Panel Clip",
    "Quantity": 2000,
    "Unit": "PCS",
    "Carrier": "DHL Express",
    "Weight": "50kg",
    "Pallets": "2 Units"
  }
];

const worksheet = XLSX.utils.json_to_sheet(data);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, "Manifest");

const filePath = path.join(dir, "sample_shipment.xlsx");
XLSX.writeFile(workbook, filePath);
console.log(`Excel file written successfully to ${filePath}`);
