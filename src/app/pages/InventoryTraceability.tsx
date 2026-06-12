import { useNavigate } from 'react-router';
import { PageHeader } from '../components/common/PageHeader';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Search, TrendingDown, Loader2 } from 'lucide-react';
import { useInventoryQuery } from '../hooks/useInventory';
import { useProcessingQuery } from '../hooks/useProcessing';
import { useYardIntakeQuery } from '../hooks/useYardIntake';

export function InventoryTraceability() {
  const navigate = useNavigate();

  // Queries
  const { data: inventoryData = [], isLoading: isLoadingInv } = useInventoryQuery();
  const { data: processingBatches = [], isLoading: isLoadingProc } = useProcessingQuery();
  const { data: yardIntake = [], isLoading: isLoadingYard } = useYardIntakeQuery();

  const isLoading = isLoadingInv || isLoadingProc || isLoadingYard;


  // Combine data for traceability
  const batchTracking = processingBatches.map(batch => {
    // Find origin GRN if possible (mocked mapping)
    const origin = yardIntake.find(y => y.mineralType === batch.rawMaterial) || yardIntake[0];
    const inventory = inventoryData.find(i => i.mineralType === batch.rawMaterial) || inventoryData[0];

    return {
      id: batch.id,
      batchId: batch.batchId,
      supplier: origin?.supplier || 'Unknown',
      grnNo: origin?.grnNumber || 'N/A',
      processingDate: batch.processingDate,
      testStatus: batch.status === 'Completed' ? 'Passed' : batch.status,
      warehouse: inventory?.warehouseLocation || 'Pending',
      shipmentId: 'SHP-2026-TBD',
      destination: 'TBD'
    };
  });

  const totalBatches = processingBatches.length;
  const activeBatches = processingBatches.filter(b => b.status === 'Processing').length;
  const totalStockValue = (inventoryData.reduce((acc, curr) => acc + curr.totalWeight, 0) * 0.25); // Placeholder value calculation

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-[#E8491F]" />
          <p className="text-gray-500 font-medium">Loading inventory data...</p>
        </div>
      </div>
    );
  }

  <div>
    <PageHeader
      title="Inventory & Traceability"
      description="Track batch movement from intake to export with full traceability"
    />

    <div className="grid grid-cols-4 gap-4 mb-6">
      <Card className="p-4 bg-white border border-gray-200">
        <p className="text-sm text-gray-600">Total Batches</p>
        <p className="text-2xl font-semibold mt-1">{totalBatches}</p>
      </Card>
      <Card className="p-4 bg-white border border-gray-200">
        <p className="text-sm text-gray-600">Active Batches</p>
        <p className="text-2xl font-semibold mt-1">{activeBatches}</p>
      </Card>
      <Card className="p-4 bg-white border border-gray-200">
        <p className="text-sm text-gray-600">Inventory Stock</p>
        <p className="text-2xl font-semibold mt-1">{(totalStockValue / 10).toFixed(1)} MT</p>
      </Card>
      <Card className="p-4 bg-white border border-gray-200">
        <p className="text-sm text-gray-600">Avg. Loss Rate</p>
        <p className="text-2xl font-semibold mt-1">2.4%</p>
      </Card>
    </div>

    <Card className="bg-white border border-gray-200 mb-6">
      <div className="p-5 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">Batch Traceability</h3>
          <div className="flex gap-2">
            <Input type="text" placeholder="Enter Batch ID or GRN..." className="w-80" />
            <Button>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Batch ID</TableHead>
            <TableHead>Company Origin</TableHead>
            <TableHead>GRN Number</TableHead>
            <TableHead>Processing Date</TableHead>
            <TableHead>Test Status</TableHead>
            <TableHead>Warehouse Location</TableHead>
            <TableHead>Shipment ID</TableHead>
            <TableHead>Final Destination</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {batchTracking.map((batch) => (
            <TableRow
              key={batch.id}
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => navigate(`/batch-detail/${batch.batchId}`)}
            >
              <TableCell className="font-medium text-[#059669]">{batch.batchId}</TableCell>
              <TableCell>{batch.supplier}</TableCell>
              <TableCell className="text-gray-800">{batch.grnNo}</TableCell>
              <TableCell className="text-gray-600">{batch.processingDate}</TableCell>
              <TableCell className="text-blue-600 font-medium">{batch.testStatus}</TableCell>
              <TableCell>{batch.warehouse}</TableCell>
              <TableCell className="text-blue-600">{batch.shipmentId}</TableCell>
              <TableCell>{batch.destination}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>

    <Card className="bg-white border border-gray-200">
      <div className="p-5 border-b border-gray-200">
        <h3 className="text-base font-semibold text-gray-900">Loss & Variance Report</h3>
      </div>
      <div className="p-5">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Batch ID</TableHead>
              <TableHead>Input Quantity (kg)</TableHead>
              <TableHead>Output Quantity (kg)</TableHead>
              <TableHead>Loss (kg)</TableHead>
              <TableHead>Loss %</TableHead>
              <TableHead>Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {processingBatches.filter(b => b.outputQuantity > 0).map(batch => {
              const loss = (batch.quantity ?? batch.inputQuantity ?? 0) - batch.outputQuantity;
              const lossPercent = ((loss / (batch.quantity ?? batch.inputQuantity ?? 1)) * 100).toFixed(1);
              return (
                <TableRow key={batch.id}>
                  <TableCell className="font-medium text-blue-600">{batch.batchId}</TableCell>
                  <TableCell>{(batch.quantity ?? batch.inputQuantity ?? 0).toLocaleString()}</TableCell>
                  <TableCell>{batch.outputQuantity.toLocaleString()}</TableCell>
                  <TableCell className="text-red-600 font-medium">{loss.toLocaleString()}</TableCell>
                  <TableCell className="flex items-center gap-1 text-red-600">
                    <TrendingDown className="h-4 w-4" />
                    {lossPercent}%
                  </TableCell>
                  <TableCell className="text-gray-600">Processing loss</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  </div>
}