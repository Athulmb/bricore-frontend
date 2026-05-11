# Administration, Finance & Operations Management

This document provides a comprehensive overview of the administrative, financial, tracking, and configuration modules within the GME Operations application. It covers their respective purposes, key features, data structures, and how they provide the backbone for the operational workflows.

---

## 1. Export Documentation

**Source:** `src/app/pages/ExportDocumentation.tsx`

### Overview
Manages the generation, uploading, and tracking of critical international shipping documents and compliance certificates for export shipments.

### Key Features
- **Shipment Tracking:** Links external customer and destination details to a unique, system-generated Shipment ID.
- **Document Checklist:** Mandates tracking of core export documents: Commercial Invoice, Packing List, Certificate of Origin, Inspection Certificate, Bill of Lading, and Customs Documents.
- **Status Workflows:** Tracks each document status (Pending, Uploaded, Certified).
- **Secure Handling:** Provides UI to upload physical scans, preview documents securely, generate ZIP exports, and certify a shipment as Complete.

---

## 2. Invoices & Financials

**Source:** `src/app/pages/InvoicesFinancialsNew.tsx`

### Overview
A comprehensive financial tracking system for invoicing clients, monitoring payments, tracking overdue accounts, and analyzing revenue.

### Key Features
- **Invoice Generation & Export:** Generates highly detailed PDF invoices featuring company branding, tax (VAT) configurations, dynamic line items, and bank transfer instructions.
- **Payment Lifecycle:** Tracks statuses such as Pending, Paid, and Overdue.
- **Revenue Analytics:** Provides real-time metrics on Total Billed, Avg. Payment Time, Default Rate, and Outstanding balances. Top Clients are automatically calculated by revenue.
- **Bulk Operations:** Features multi-select capabilities for bulk exporting, printing, or sending email reminders.

---

## 3. Inventory & Traceability

**Source:** `src/app/pages/InventoryTraceability.tsx`

### Overview
Provides an absolute audit trail for materials passing through the GME facility, linking raw inbound material to outbound export shipments.

### Key Features
- **End-to-End Tracking:** Correlates a Processing Batch ID back to its original Supplier, GRN Number (Yard Intake), through its Quality Testing status, into the Warehouse Location, and out to the Final Destination Shipment ID.
- **Variance Analytics:** Identifies processing efficiency by comparing Input Weights, Output Weights, and calculating precise Loss/Variance Percentages.
- **KPI Dashboards:** Tracks Total Active Batches vs Inventory Stock Value.

---

## 4. Client Management

**Source:** `src/app/pages/ClientManagement.tsx`

### Overview
A centralized CRM database tracking the external partners, suppliers, and customers that interact with GME operations.

### Key Features
- **Structured Onboarding:** A guided 3-step registration process to capture Company Details, Primary Contacts, and Compliance Info (VAT/Address).
- **Client Categorization:** Sorts entities cleanly by Industry and Type (Supplier, Customer, or Both/Contractor).
- **Client Profiling:** A detailed slide-out profile view summarizing registration dates, direct contact information, compliance details, and overall relationship status.

---

## 5. User & Access Management

**Source:** `src/app/pages/UserManagement.tsx`

### Overview
The internal security and personnel management interface controlling system access and permissions.

### Key Features
- **Role-Based Access Control (RBAC):** Assigns users to highly specific operational roles (Admin, Operations Manager, Finance, Yard Operator, Lab Tech, Inspector) dictating their system permissions.
- **Audit Trails:** A foundational tab designated for recording activity logs and system audits.
- **Session Tracking:** Tracks active sessions and last login timestamps for security compliance.

---

## 6. Settings

**Source:** `src/app/pages/Settings.tsx`

### Overview
The central configuration hub that drives global system behaviors, default dropdown values, and business compliance logic.

### Key Features
- **Company Identity:** Global management of Company Name, RC Number, core Address, and contact info, cascading to generated PDFs and invoices.
- **Financial Defaults:** Standardize default VAT Percentages and Discount structures globally.
- **List Management:** Dynamically manage all Dropdown/Combobox lists used across the entire application:
  - Labs, Inspection Types, Equipment, Vehicles, Material Types, Inspectors, Destinations, Warehouses.
- **Preference Controls:** Manage notification rules limit (Email Digests vs Live Alerts), Security rules (2FA, Session timeouts), and System rules (Timezones, Backup intervals).

---

## 7. Contact Us

**Source:** `src/app/pages/ContactUs.tsx`

### Overview
The public or partner-facing portal presenting formal communication channels and facility mapping.

### Key Features
- **Facility Operations Info:** Provides operating hours, emergency contact numbers, direct email channels, and formal headquarters addressing.
- **Direct Messaging:** A structured pipeline for inquiries, support requests, or partnership discussions linking directly into the system.
