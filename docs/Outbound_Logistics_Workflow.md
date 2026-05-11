# Outbound Logistics Workflow

This document provides a comprehensive overview of the **Bagging & Warehousing**, **Loading & Dispatch**, **Weighbridge**, and **Transportation Management** modules within the GME Operations application. It covers their respective purposes, key features, data structures, and how they seamlessly interact to manage the final stages of the supply chain.

---

## 1. Bagging & Warehousing

**Source:** `src/app/pages/BaggingWarehousing.tsx`

### Overview
The Bagging & Warehousing module bridges the gap between processing and shipping. It tracks the physical packaging of materials (from bulk to bags) and their subsequent assignment to specific warehouse locations, acting as the live inventory ledger.

### Key Features
- **Bagging Execution:** Convert processed bulk batches into distinct tracked bags. Calculates Total Weight based on bag counts and predefined sack weights.
- **Warehouse Placement:** Assign newly bagged materials to designated warehouse zones (defined in Company Settings).
- **Stock Tracking:** Provides a consolidated live view of Current Warehouse Stock, grouped by Location, Mineral Type, and Grade.
- **Operations UI:** Enables printing QR/Barcode labels for bags/pallets and initiating internal location transfers.

### Data Structure (Bagging Record & Inventory)
- `baggingId`: Operational tracker (e.g., `BAG-2026-123`).
- `batchId`: Cross-reference to the originating processing batch.
- `numberOfBags` / `weightPerBag` / `totalWeight`: Physical metrics.
- `warehouseLocation`: The active storage zone.
- *Stock Data:* Live sum aggregations (`bags`, `totalWeight`) per Location/Type.

---

## 2. Loading & Dispatch

**Source:** `src/app/pages/LoadingDispatch.tsx`

### Overview
This module handles the physical outloading of bagged or bulk materials onto vehicles/containers, generating the necessary shipping documentation and tracking shipments until delivery.

### Key Features
- **Dispatch Scheduling:** Select a processed/bagged `batchId`, assign a specific external `destination`, and allocate it to a `container` or vehicle.
- **Documentation Generation:** Automatically generates Loading Lists (for warehouse teams) and formal Dispatch Notes (for external drivers/customers).
- **Progress Tracking:** Tracks the lifecycle of the dispatch: Pending -> Loaded -> In-Transit -> Delivered.
- **KPI Dashboards:** Visibility into Pending Dispatches, In-Transit volumes, Delivered totals, and On-Time Delivery percentage.

### Data Structure (Dispatch Record)
- `dispatchId`: Shipment tracker (e.g., `DSP-2026-123`).
- `batchId`: The source material being loaded.
- `container`: Identifier for the shipping vessel, truck, or container.
- `loadingWeight`: Estimated or targeted weight to load.
- `destination` / `dispatchDate` / `deliveryDate` : Routing and timeline factors.
- `status`: Active shipment state.

---

## 3. Weighbridge

**Source:** `src/app/pages/Weighbridge.tsx`

### Overview
A critical checkpoint for both inbound raw materials and outbound finished goods. This module captures precise physical vehicle weights to verify declared quantities and generate official weight slips.

### Key Features
- **Dual Flow Tracking:** Maintains separate ledgers for Inbound Receipt (Gross/Tare/Net) and Outbound Dispatch (Loaded Weight).
- **Inbound Net Calculation:** Automatically calculates `Net Weight = Gross Weight - Tare Weight` for arriving supplier trucks.
- **Outbound Verification:** Records single-entry active `Loaded Weight` for departing dispatches to verify the `loadingWeight` declared earlier.
- **Action UI:** Allows operators to instantly Print official Weight Slips or Generate precise Reports.
- **Shared Entities:** Directly leverages vehicles arriving via Yard Intake or being loaded via Loading & Dispatch.

### Data Structure (Weighbridge Log)
- `vehicleNo`: License plate or container number.
- `Inbound Specific`: `supplier` name, `grossWeight`, `tareWeight`, `net`.
- `Outbound Specific`: `destination`, `loadedWeight`.
- `time`: Exact timestamp of the scale reading.

---

## 4. Transportation Management

**Source:** `src/app/pages/Transportation.tsx`

### Overview
This module manages the commercial and logistical relationship with external transport and logistics providers. It handles the database of approved transporters and the specific "Trips" assigned to them to move the Dispatch orders.

### Key Features
- **Transporter Database:** Maintain a registry of approved 3PL logistics providers, managing their contact details and VAT associations.
- **Trip Allocation:** Assign specific Dispatch orders (`dispatchId`) to contracted `transporters`.
- **Financial Tracking:** Capable of logging the negotiated `freight` cost for the allocated trip to assist with financial reconciliations.
- **Route & Driver Logic:** Captures exact `route` metrics and driver-specific assignments.
- **KPI Dashboards:** Tracks Active Transporters, Active Trips, Total Freight spend for the month, and Transporter On-Time Delivery scores.

### Data Structure
**Transporter Record:**
- `id` / `name` / `contactPerson` / `phone` / `email` / `vat`: Corporate registry details.

**Trip Assignment Record:**
- `tripId`: Internal tracker (e.g., `TRP-2026-123`).
- `transporterId` / `dispatchId`: Relational keys linking the vendor to the shipment.
- `vehicleNumber` / `route`: Operational factors.
- `freight`: Cost of transit.
- `startDate` / `endDate` / `status`: Lifecycle tracking.

---

## The Outbound Logistics Workflow

These four modules orchestrate the final phase of operations—moving materials out of the facility:

1. **Bag & Store (Bagging & Warehousing):** Following processing and inspection, the material is bagged, quantified, and vaulted into warehouse inventory.
2. **Authorize Dispatch (Loading & Dispatch):** A customer order comes in. Based on inventory, a dispatch is created linking to that stored batch. A container/truck is requested, and a destination is specified.
3. **Assign Transport & Verify Weight (Transportation & Weighbridge):** 
   - A commercial **Trip** is negotiated with a **Transporter** to physically move that Dispatch. The Transporter sends a vehicle.
   - The vehicle loads the cargo.
   - The loaded vehicle pulls onto the **Weighbridge**. The operator logs an *Outbound* weight record for the vehicle, capturing the exact `Loaded Weight`, printing a verified slip. The vehicle leaves the facility, and the dispatch transitions to "In-Transit".
