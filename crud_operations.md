# Enterprise Operations Platform: Module CRUD Operations Reference

This document provides a comprehensive list of all data fields, input types, and operation types across the thirteen operational modules of the platform. This information is intended for database schema finalization and data export (Excel/CSV) mapping.

## Data Mapping & Field Definitions

| Module | Operation | Field Name | Data Type | Input Type / Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Yard Intake** | Create GRN | Supplier Name | String | Text Input (Required) |
| | | Vehicle Number | String | Text Input (e.g., KL-07-AB-1234) |
| | | Material Type | Enum | Select (Iron Ore, Quartz, Feldspar, Bauxite) |
| | | Gross Weight | Number | Number Input (kg) |
| | | Tare Weight | Number | Number Input (kg) |
| | | Net Weight | Number | Auto-calculated (Gross - Tare) |
| | | GRN Number | String | System Generated (GRN-XXXXXX) |
| | | Date | Date | System Generated / Date Picker |
| | | Status | Enum | Default: 'Paid' (Receipt Status) |
| **Crushing & Processing** | Create Batch | Batch ID | String | System Generated (BATCH-YYYY-XXX) |
| | | Raw Material | Enum | Select (Feldspar, Quartz, Kaolin, Mica) |
| | | Input Quantity | Number | Number Input (kg) |
| | | Machine Assigned| Enum | Select (Crusher Unit-1, 2, 3) |
| | | Output Grade | Enum | Select (Grade A, B, C) |
| | | Output Quantity | Number | Number Input (Updated on completion) |
| | | Processing Date | Date | Date Picker |
| | | Status | Enum | Pending, Processing, Completed |
| **Assaying & Testing** | New Sample | Sample ID | String | System Generated (QC-YYYY-XXX) |
| | | Linked Batch | String | Select from Processing Batches |
| | | Test Type | Enum | Select (Chemical, Physical, Complete) |
| | | Lab Name | Enum | Select (SGS, Intertek, Bureau Veritas) |
| | | Purity / Result | String | Text/Number Input (Updated on result) |
| | | Submitted Date | Date | System Generated / Date Picker |
| | | Notes | String | Textarea |
| | | Status | Enum | Pending, Approved, Rejected |
| **Inspection & Cert.** | Schedule | Inspection ID | String | System Generated (INS-YYYY-XXX) |
| | | Batch ID | String | Select from Processing Batches |
| | | Inspector Name | Enum | Select (Assigned Staff) |
| | | Inspection Type | Enum | Select (Pre-Shipment, Quality, Audit) |
| | | Scheduled Date | Date | Date Picker |
| | | Scheduled Time | Time | Time Picker |
| | | Observations | String | Textarea |
| | | Status | Enum | Pending, Approved, Rejected |
| **Bagging & Warehouse** | Create Entry | Bagging ID | String | System Generated (BAG-YYYY-XXX) |
| | | Batch ID | String | Select from Processing Batches |
| | | Number of Bags | Number | Number Input |
| | | Weight Per Bag | Number | Number Input (Default: 50kg) |
| | | Total Weight | Number | Auto-calculated (Bags * Weight) |
| | | Warehouse Loc. | Enum | Select (Warehouse-A Bay-1, etc.) |
| | | Bagging Date | Date | Date Picker |
| | | Status | Enum | Default: Completed |
| **Loading & Dispatch** | Create Dispatch| Dispatch ID | String | System Generated (DSP-YYYY-XXX) |
| | | Batch ID | String | Select from Processing Batches |
| | | Container / Truck| String | Text Input (e.g., MSCU1234567) |
| | | Loading Weight | Number | Number Input (kg) |
| | | Destination | Enum | Select (Ports: Mumbai, Chennai, etc.) |
| | | Dispatch Date | Date | Date Picker |
| | | Driver Name | String | Text Input |
| | | Contact Number | String | Text Input |
| | | Status | Enum | Loaded, In-Transit, Delivered |
| **Weighbridge** | Inbound Log | Vehicle Number | String | Text Input |
| | | Supplier | String | Text Input |
| | | Gross Weight | Number | Number Input |
| | | Tare Weight | Number | Number Input |
| | | Net Weight | Number | Auto-calculated |
| | Outbound Log | Vehicle/Cont. No | String | Text Input |
| | | Destination | String | Text Input |
| | | Loaded Weight | Number | Number Input |
| | | Timestamp | DateTime | System Generated |
| **Transportation** | Add Transp. | Company Name | String | Text Input |
| | | Contact Person | String | Text Input |
| | | Phone | String | Text Input |
| | | Email | String | Text Input |
| | | VAT Number | String | Text Input |
| | Trip Assign | Trip ID | String | System Generated |
| | | Transporter | String | Select from Transporters |
| | | Dispatch ID | String | Select from Dispatch Records |
| | | Route | String | Text Input |
| | | Freight Cost | Number | Number Input (Multi-currency supported) |
| **Export Documentation**| Init Shipment | Shipment ID | String | Text Input |
| | | Customer | String | Text Input |
| | | Destination | String | Text Input |
| | Docs Status | Comm. Invoice | Enum | Pending, Available |
| | | Packing List | Enum | Pending, Available |
| | | Cert. of Origin | Enum | Pending, Available |
| | | Bill of Lading | Enum | Pending, Available |
| **Invoices & Financials**| Create Invoice| Invoice Number | String | Text Input / System Gen |
| | | Customer Name | String | Text Input |
| | | Date | Date | Date Picker |
| | | Currency | Enum | Select (USD, NGN, AED, INR) |
| | | Line Items | Array | Grid (Desc, Qty, Rate, Total) |
| | | Total Amount | Number | Auto-calculated |
| | | status | Enum | Draft, Sent, Paid, Overdue |
| **Inventory & Trace.** | Trace Detail | Batch ID | String | Read-Only (Linked Search) |
| | | Supplier Origin | String | Read-Only (Linked to Yard Intake) |
| | | GRN Number | String | Read-Only |
| | | Test Status | Enum | Read-Only (Linked to Quality) |
| | Loss/Variance | Input Qty | Number | Read-Only |
| | | Output Qty | Number | Read-Only |
| | | Loss Weight | Number | Auto-calculated |
| | | Reason | String | Text Input (e.g., Processing loss) |

---
*Note: This table represents the operational frontend schema as implemented in the wireframe. Backend implementation may require additional metadata such as `createdAt`, `updatedAt`, and `userID` records.*
