import { createBrowserRouter } from "react-router";
import { MainLayout } from "./components/layout/MainLayout";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { QuotationsManagement } from "./pages/QuotationsManagement";
import { QuotationDetail } from "./pages/QuotationDetail";
import { CreateQuotation } from "./pages/CreateQuotation";
import { YardIntake } from "./pages/YardIntakeNew";
import { YardIntakeDetail } from "./pages/YardIntakeDetail";
import { CrushingProcessing } from "./pages/CrushingProcessing";
import { BatchDetail } from "./pages/BatchDetail";
import { AssayingTesting } from "./pages/AssayingTesting";
import { InspectionCertification } from "./pages/InspectionCertification";
import { BaggingWarehousing } from "./pages/BaggingWarehousing";
import { LoadingDispatch } from "./pages/LoadingDispatch";
import { Weighbridge } from "./pages/Weighbridge";
import { Transportation } from "./pages/Transportation";
import { ExportDocumentation } from "./pages/ExportDocumentation";
import { ExportDocDetail } from "./pages/ExportDocDetail";
import { InvoicesFinancials } from "./pages/InvoicesFinancialsNew";
import { InvoiceDetail } from "./pages/InvoiceDetail";
import { CreateInvoice } from "./pages/CreateInvoice";
import { InventoryTraceability } from "./pages/InventoryTraceability";
import { Reports } from "./pages/Reports";
import { UserManagement } from "./pages/UserManagement";
import { ClientManagement } from "./pages/ClientManagement";
import { VehicleManagement } from "./pages/VehicleManagement";
import { MaterialManagement } from "./pages/MaterialManagement";
import { Settings } from "./pages/Settings";
import { ContactUs } from "./pages/ContactUs";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { ComingSoon } from "./pages/ComingSoon";
import { SampleDetail } from "./pages/SampleDetail";

const GlobalErrorBoundary = () => <ErrorBoundary />;

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/",
    Component: ProtectedRoute,
    errorElement: <GlobalErrorBoundary />,
    children: [
      {
        path: "/",
        Component: MainLayout,
        children: [
          { index: true, Component: Dashboard },
          { path: "yard-intake", Component: YardIntake },
          { path: "yard-intake/:id", Component: YardIntakeDetail },
          { path: "crushing-processing", Component: CrushingProcessing },
          { path: "crushing-processing/:id", Component: BatchDetail },
          { path: "assaying-testing", Component: AssayingTesting },
          { path: "assaying-testing/:id", Component: SampleDetail },
          { path: "inspection-certification", Component: InspectionCertification },
          { path: "inspection-certification/:id", Component: ComingSoon },
          { path: "bagging-warehousing", Component: BaggingWarehousing },
          { path: "bagging-warehousing/:id", Component: ComingSoon },
          { path: "loading-dispatch", Component: LoadingDispatch },
          { path: "loading-dispatch/:id", Component: ComingSoon },
          { path: "weighbridge", Component: Weighbridge },
          { path: "transportation", Component: Transportation },
          { path: "transportation/:id", Component: ComingSoon },
          { path: "export-documentation", Component: ExportDocumentation },
          { path: "export-documentation/:id", Component: ExportDocDetail },
          { path: "invoices-financials", Component: InvoicesFinancials },
          { path: "invoices-financials/new", Component: CreateInvoice },
          { path: "invoices-financials/:id", Component: InvoiceDetail },
          { path: "quotations", Component: QuotationsManagement },
          { path: "quotations/new", Component: CreateQuotation },
          { path: "quotations/edit/:id", Component: CreateQuotation },
          { path: "quotations/:id", Component: QuotationDetail },
          { path: "inventory-traceability", Component: InventoryTraceability },
          { path: "inventory-traceability/:id", Component: BatchDetail },
          { path: "reports", Component: ComingSoon },
          { path: "client-management", Component: ClientManagement },
          { path: "vehicle-management", Component: VehicleManagement },
          { path: "material-management", Component: MaterialManagement },
          { path: "user-management", Component: UserManagement },
          { path: "settings", Component: Settings },
          { path: "contact-us", Component: ContactUs },
        ],
      },
    ],
  },
]);