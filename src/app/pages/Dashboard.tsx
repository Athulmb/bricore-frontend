import { KPICard } from '../components/common/KPICard';
import { PageHeader } from '../components/common/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { Card } from '../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  TruckIcon,
  Hammer,
  ShipIcon,
  DollarSign,
  Package,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useYardIntakeQuery } from '../hooks/useYardIntake';
import { useProcessingQuery } from '../hooks/useProcessing';
import { useDispatchQuery } from '../hooks/useDispatch';
import { useBaggingQuery } from '../hooks/useBagging';
import { useInvoicesQuery } from '../hooks/useInvoices';
import { useInventoryQuery } from '../hooks/useInventory';


const throughputData = [
  { month: 'Jan', intake: 2400, processing: 2200, export: 2100 },
  { month: 'Feb', intake: 2600, processing: 2400, export: 2300 },
  { month: 'Mar', intake: 2900, processing: 2700, export: 2600 },
  { month: 'Apr', intake: 3100, processing: 2900, export: 2800 },
  { month: 'May', intake: 3300, processing: 3100, export: 3000 },
  { month: 'Jun', intake: 3500, processing: 3300, export: 3200 },
];

const revenueData = [
  { month: 'Jan', revenue: 45000, cost: 32000 },
  { month: 'Feb', revenue: 52000, cost: 35000 },
  { month: 'Mar', revenue: 61000, cost: 38000 },
  { month: 'Apr', revenue: 58000, cost: 36000 },
  { month: 'May', revenue: 67000, cost: 40000 },
  { month: 'Jun', revenue: 73000, cost: 42000 },
];

export function Dashboard() {
  // Queries
  const { data: yardIntake = [], isLoading: isLoadingYard } = useYardIntakeQuery();
  const { data: processingBatches = [], isLoading: isLoadingProcessing } = useProcessingQuery();
  const { data: dispatchRecords = [], isLoading: isLoadingDispatch } = useDispatchQuery();
  const { data: baggingRecords = [], isLoading: isLoadingBagging } = useBaggingQuery(processingBatches);
  const { data: invoices = [], isLoading: isLoadingInvoices } = useInvoicesQuery();
  const { data: inventoryData = [], isLoading: isLoadingInventory } = useInventoryQuery();

  const isLoading = isLoadingYard || isLoadingProcessing || isLoadingDispatch || isLoadingBagging || isLoadingInvoices || isLoadingInventory;

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-[#974926]" />
          <p className="text-gray-500 font-medium">Aggregating operational data...</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };


  // Live Metrics
  const totalIntake = (yardIntake || []).reduce((acc, curr) => acc + (curr.netWeight || 0), 0);
  const totalProcessing = (processingBatches || []).reduce((acc, curr) => acc + (curr.quantity || 0), 0);
  const activeShipments = (dispatchRecords || []).filter(r => r.status === 'In Transit').length;
  const pendingInvoicesAmount = (invoices || [])
    .filter(i => i.status === 'Pending')
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const totalInventoryWeight = (inventoryData || []).reduce((acc, curr) => acc + (curr.totalWeight || 0), 0);
  const totalRevenue = (invoices || [])
    .filter(i => i.status === 'Paid')
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);

  // Derive recent activities from context (Combined)
  const recentActivities = [
    ...(yardIntake || []).slice(-2).map(r => ({
      id: `intake-${r.id}`,
      type: 'Intake Recorded',
      reference: r.grnNumber,
      description: `${r.mineralType} from ${r.supplier}`,
      timestamp: 'Recently',
      status: 'Completed'
    })),
    ...(processingBatches || []).slice(-2).map(r => ({
      id: `batch-${r.id}`,
      type: 'Processing Started',
      reference: r.batchId,
      description: `${(r.quantity || 0).toLocaleString()} kg of ${r.rawMaterial}`,
      timestamp: 'Recently',
      status: r.status
    })),
  ].sort((a, b: any) => b.id.localeCompare(a.id)).slice(0, 5);


  return (
    <div>
      <PageHeader
        title="Operations Dashboard"
        description="Real-time overview of mineral operations and business metrics"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
        <KPICard
          title="Total Intake Volume"
          value={`${(totalIntake / 1000).toFixed(1)} MT`}
          icon={TruckIcon}
          trend={{ value: 'Real-time', isPositive: true }}
        />
        <KPICard
          title="Processing Volume"
          value={`${(totalProcessing / 1000).toFixed(1)} MT`}
          icon={Hammer}
          subtitle="Cumulative"
          trend={{ value: 'Live', isPositive: true }}
        />
        <KPICard
          title="Active Shipments"
          value={activeShipments.toString()}
          icon={ShipIcon}
          subtitle="In transit"
        />
        <KPICard
          title="Pending Receivables"
          value={formatCurrency(pendingInvoicesAmount)}
          icon={DollarSign}
          trend={{ value: `${invoices.filter(i => i.status === 'Pending').length} pending`, isPositive: false }}
        />
        <KPICard
          title="Inventory Stock"
          value={`${(totalInventoryWeight / 1000).toFixed(1)} MT`}
          icon={Package}
          subtitle={`Across ${inventoryData.length} locations`}
        />
        <KPICard
          title="Total Revenue (Paid)"
          value={formatCurrency(totalRevenue)}
          icon={TrendingUp}
          trend={{ value: 'Live Updates', isPositive: true }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="p-5 bg-white border border-gray-200">
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            Throughput Trend (MT)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={throughputData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="intake"
                stroke="#374151"
                strokeWidth={2}
                name="Intake"
              />
              <Line
                type="monotone"
                dataKey="processing"
                stroke="#059669"
                strokeWidth={2}
                name="Processing"
              />
              <Line
                type="monotone"
                dataKey="export"
                stroke="#1d4ed8"
                strokeWidth={2}
                name="Export"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5 bg-white border border-gray-200">
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            Revenue vs Cost
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="#059669" name="Revenue" />
              <Bar dataKey="cost" fill="#991b1b" name="Cost" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="bg-white border border-gray-200">
        <div className="p-5 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">Recent Activities</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(recentActivities || []).map((activity) => (
              <TableRow key={activity.id}>
                <TableCell className="font-medium">{activity.type}</TableCell>
                <TableCell className="text-blue-600 font-mono text-xs">{activity.reference}</TableCell>
                <TableCell>{activity.description}</TableCell>
                <TableCell className="text-gray-600">{activity.timestamp}</TableCell>
                <TableCell>
                  <StatusBadge status={activity.status} />
                </TableCell>
              </TableRow>
            ))}
            {recentActivities.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  No recent activities recorded.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
