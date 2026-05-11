# Quality Control, Inspection, and Warehousing Workflow

This document provides a comprehensive overview of the **Assaying & Testing**, **Inspection & Certification**, and **Bagging & Warehousing** modules within the GME Operations application. It covers their respective purposes, key features, data structures, and how they seamlessly fit into the post-processing operational pipeline.

---

## 1. Assaying & Testing

**Source:** `src/app/pages/AssayingTesting.tsx`

### Overview
This module manages quality control samples and laboratory test results. After processing batches are completed, samples are extracted and sent to accredited partner laboratories for chemical and physical analysis to determine purity and sizing.

### Key Features
- **Sample Submission:** Create new sample records linked directly to an existing Processing Batch to maintain origin traceability.
- **Laboratory Assignment:** Select specific laboratories from the predefined company settings.
- **Result Updating:** Record detailed test results including overall Purity percentage and Pass/Fail status for various Chemical Parameters and Size Distributions.
- **Status Lifecycle:** Tracks samples through Pending, Approved, and Rejected statuses.
- **KPI Dashboards:** Real-time visibility into Pending Tests, Weekly Approvals, Rejections, and Average Turnaround time.
- **Report Generation:** View or print detailed laboratory analysis reports.

### Data Structure (Test Record)
- `sampleId`: Automatically generated tracker (e.g., `QC-2026-123`).
- `linkedBatch`: Cross-reference to the corresponding Crushing & Processing batch.
- `mineralType` / `testType` / `labName`: Core context variables.
- `purity`: Final assessed purity (%).
- `qualityParameters`: Array of specific chemical parameters, specifications, actuals, and pass/fail states.
- `sizeDistribution`: Array of size ranges, percentages, and weights.
- `status`: Pending, Approved, or Rejected.

---

## 2. Inspection & Certification

**Source:** `src/app/pages/InspectionCertification.tsx`

### Overview
Once materials have been tested and approved for quality, they undergo formal inspection to ensure they meet the regulatory and customer standards before bagging or shipment. This module is used to schedule these inspections and issue certificates.

### Key Features
- **Inspection Scheduling:** Schedule an inspection against a specific Batch ID, assign an Inspector, select an Inspection Type, and set a Date/Time.
- **Observations Tracking:** Record detailed observations and notes made by the inspector during the inspection.
- **Certification Issuance:** Transition status from Pending -> Completed -> Approved. Marking an inspection as "Approved" represents the issuance of a quality certificate.
- **KPI Dashboards:** Displays Pending Inspections, Completed This Week, Certificates Issued, and Rejection Rate.

### Data Structure (Inspection Record)
- `inspectionId`: Automatically generated tracker (e.g., `INS-2026-123`).
- `batchId`: Cross-reference to the corresponding Crushing & Processing batch.
- `inspectorName`: The assigned internal or third-party inspector.
- `inspectionType`: The type of inspection performed (drawn from company settings).
- `scheduledDate` / `completedDate`: Timeline tracking.
- `observations`: Free-text notes from the inspector.
- `status`: Pending, Completed, Approved.

---

## 3. Bagging & Warehousing

**Source:** `src/app/pages/BaggingWarehousing.tsx`

### Overview
The Bagging & Warehousing module tracks the physical packaging of the materials and their placement into specific warehouse locations, constituting the final step before Loading & Dispatch. It acts as both a record of operations and a live inventory ledger.

### Key Features
- **Bagging Operations:** Records the conversion of a processing batch into distinct bags, calculating the Total Weight based on Number of Bags and Weight per Bag.
- **Warehouse Assignment:** Assign the bagged materials directly to tracked Warehouse Locations defined in company settings.
- **Warehouse Inventory (Stock):** Provides a consolidated, real-time view of current warehouse stock aggregated by Location, Mineral Type, and Grade.
- **Operations UI:** Enables printing QR/Barcode shipping labels and initiating location transfers directly from the detail pane.
- **KPI Dashboards:** Tracks Total Inventory (MT), Total Bags, Warehouse Utilization (%), and Bagging Efficiency.

### Data Structure
**Bagging Record:**
- `baggingId`: Automatically generated tracker (e.g., `BAG-2026-123`).
- `batchId`: Cross-reference to the originating processing batch.
- `numberOfBags` / `weightPerBag` / `totalWeight`: Quantitative metrics for tracking.
- `warehouseLocation`: The assigned physical storage zone.
- `baggingDate`: The date of the operation.

**Inventory Data (Aggregated):**
- `warehouseLocation`: The distinct warehouse zone.
- `mineralType` / `grade`: The material classification.
- `bags` / `totalWeight`: Current live stock balances.

---

## The Integrated Workflow

These three modules form a continuous chain of custody after a raw material has been crushed and processed:

1. **Test (Assaying & Testing):** A completed processing batch implies newly crushed material exists. A sample is extracted from this batch (`linkedBatch`), sent to an assigned `labName`, and analyzed. Once the `purity` and sizing data is returned, the batch is certified with an `Approved` status.
2. **Inspect (Inspection & Certification):** With chemical and physical properties verified, an inspector is assigned to verify the batch visually or logistically before packaging. An inspection is scheduled, executed, and ultimately `Approved`—generating a certificate.
3. **Bag (Bagging & Warehousing):** Following a successful inspection and certification, the loose bulk batch is bagged. The system tracks how many bags were produced, calculates the total processed weight, and assigns the bags to a concrete `warehouseLocation`, instantly updating the live `Total Inventory` balance.
