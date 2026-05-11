# Yard Intake and Crushing & Processing Workflow

This document provides a comprehensive overview of the **Yard Intake** and **Crushing & Processing** modules within the GME Operations application. It covers their respective purposes, key features, data structures, and the integration workflow between the two modules.

## 1. Yard Intake

**Source:** `src/app/pages/YardIntakeNew.tsx`

### Overview
The Yard Intake module is responsible for managing the receipt of raw materials into the facility. For every new intake, a **Goods Receipt Note (GRN)** is generated to keep track of the supplier, vehicle, material type, and the net weight of the materials received.

### Key Features
- **GRN Management:** Create, edit, duplicate, and delete GRN records.
- **Weight Calculation:** Captures Gross Weight and Tare Weight to automatically calculate Net Weight (`Net Weight = Gross Weight - Tare Weight`).
- **Dynamic Entities:** Users can dynamically add new Suppliers and Material Types directly from the intake form if they do not already exist in the system.
- **Bulk Actions & Export:** Support for selecting multiple intake records to export as a CSV file or print.
- **Direct Processing:** A "Process" action is available on individual GRN records, which seamlessly transitions the materials into the Crushing & Processing pipeline.
- **KPI Dashboards:** Visual tracking of Total Receipt (weight/count) and Orders Status (e.g., Paid, Refunded).

### Data Structure (GRN Record)
- `id`: Unique identifier
- `grnNumber`: Auto-generated identifier (e.g., `GRN-123456`)
- `supplier`: Supplier Name
- `vehicleNumber`: Vehicle/Truck identifier
- `mineralType`: Type of material received (e.g., Iron Ore, Bauxite)
- `grossWeight` / `tareWeight` / `netWeight`: Weight metrics in kg
- `date`: Date of intake
- `status`: Payment/Intake status (e.g., Paid)

---

## 2. Crushing & Processing

**Source:** `src/app/pages/CrushingProcessing.tsx`

### Overview
The Crushing & Processing module governs the production operations. It tracks the transformation of raw materials (received via Yard Intake) into processed output grades using assigned machinery. 

### Key Features
- **Batch Management:** Create and edit processing batches associated with specific Source GRNs.
- **Machine Assignment:** Allocate specific crushing or processing machines from company settings to a batch.
- **Output Tracking:** Track the Input Quantity against the Output Quantity to monitor crushing efficiency and assign an Output Grade (e.g., Grade A, Grade B).
- **KPI Dashboards:** Monitor Today's Production (Completed output quantity), Active Batches, Total Batches, and overall Output Efficiency.
- **Lifecycle Status:** Track batches through their operational lifecycle (e.g., Pending, Processing, Completed).

### Data Structure (Processing Batch)
- `id`: Unique identifier
- `batchId`: Auto-generated batch identifier (e.g., `BATCH-2026-123`)
- `grnReference`: Link back to the Source GRN from Yard Intake
- `rawMaterial`: Type of material being processed
- `quantity` (Input): Amount of material entering the machine
- `machineAssigned`: The machine allocated for this batch
- `outputGrade`: Target quality of the output
- `outputQuantity`: Final processed weight
- `processingDate`: Scheduled or actual processing date
- `supplierName` / `customerName`: Associated entities
- `status`: Current stage of processing

---

## 3. Integration Workflow (Yard Intake -> Crushing)

The real power of these two modules lies in their tight integration, designed to reduce manual data entry and maintain accurate traceability from receipt to production.

### Step-by-Step Flow

1. **Material Arrival:** A vehicle arrives at the yard. The operator logs the intake via the **Yard Intake** module, capturing the supplier, vehicle, and calculating the net weight. A GRN is created.
2. **Initiating Processing:**
   - **From Yard Intake:** The user clicks the **"Process"** button on the specific GRN record's details panel.
   - **Data Handoff:** The application navigates the user to the Crushing & Processing module and passes the intake context via router state (`rawMaterial`, `quantity`, `grnNumber`, `supplierName`).
3. **Batch Creation:** The Crushing & Processing creation modal opens automatically, with the **Raw Material**, **Input Quantity**, **Source GRN**, and **Supplier Name** pre-filled from the selected yard intake record.
4. **Alternative Source Linking:** If a user initiates a new workflow directly from the Crushing module, they can select a **Source GRN** from a dropdown. This action triggers an automatic lookup, instantly populating the batch details based on the stored Yard Intake data.
5. **Execution:** The operator assigns a machine, specifies a target output grade, and saves the batch. The raw material is now actively logged in the production queue.

This closed-loop system ensures that all processed materials can be traced back directly to their origin inbound vehicle and supplier.
