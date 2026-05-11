import { useState } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Plus, Eye, Package, X, ExternalLink, QrCode, MapPin, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';
import { 
  useBaggingQuery, 
  useCreateBaggingRecord, 
  useUpdateBaggingRecord, 
  useDeleteBaggingRecord 
} from '../hooks/useBagging';
import { useProcessingQuery } from '../hooks/useProcessing';

import { useInventoryQuery } from '../hooks/useInventory';
import { useSettingsQuery } from '../hooks/useSettings';

export function BaggingWarehousing() {
  const { data: inventoryData = [], isLoading: isLoadingInventory } = useInventoryQuery();
  const { data: companySettings, isLoading: isLoadingSettings } = useSettingsQuery();

  const { data: processingBatches = [] } = useProcessingQuery();
  const { data: baggingRecords = [], isLoading: isFetching, isError } = useBaggingQuery(processingBatches);
  
  const createMutation = useCreateBaggingRecord();
  const updateMutation = useUpdateBaggingRecord();
  const deleteMutation = useDeleteBaggingRecord();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    batchId: '',
    numberOfBags: 0,
    weightPerBag: 50,
    warehouseLocation: '',
    baggingDate: new Date().toISOString().split('T')[0],
    supplierName: 'N/A',
    customerName: 'N/A',
  });

  const handleCreateBagging = async () => {
    if (!formData.batchId || formData.numberOfBags <= 0 || !formData.warehouseLocation) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const totalWeight = formData.numberOfBags * formData.weightPerBag;

      const newRecord = {
        baggingId: `BAG-2026-${Math.floor(100 + Math.random() * 900)}`,
        batchId: formData.batchId,
        supplierName: formData.supplierName,
        customerName: formData.customerName,
        numberOfBags: formData.numberOfBags,
        weightPerBag: formData.weightPerBag,
        totalWeight: totalWeight,
        warehouseLocation: formData.warehouseLocation,
        baggingDate: formData.baggingDate,
        status: 'Completed' as const,
      };

      await createMutation.mutateAsync(newRecord);
      setIsModalOpen(false);
      setFormData({ 
        batchId: '', numberOfBags: 0, weightPerBag: 50, warehouseLocation: '', 
        baggingDate: new Date().toISOString().split('T')[0], supplierName: 'N/A', customerName: 'N/A' 
      });
    } catch (error) {
       // Mutation handles toast
    }
  };

  return (
    <div>
      <PageHeader
        title="Bagging & Warehousing"
        description="Manage bagging operations and warehouse inventory"
        action={{
          label: 'New Bagging Entry',
          icon: Plus,
          onClick: () => setIsModalOpen(true),
        }}
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card className="p-4 bg-white border border-gray-200">
          <p className="text-sm text-gray-600">Total Inventory</p>
          <p className="text-2xl font-semibold mt-1">
            {(inventoryData.reduce((acc, curr) => acc + curr.totalWeight, 0) / 1000).toFixed(1)} MT
          </p>
        </Card>
        <Card className="p-4 bg-white border border-gray-200">
          <p className="text-sm text-gray-600">Total Bags</p>
          <p className="text-2xl font-semibold mt-1">
            {inventoryData.reduce((acc, curr) => acc + curr.bags, 0).toLocaleString()}
          </p>
        </Card>
        <Card className="p-4 bg-white border border-gray-200">
          <p className="text-sm text-gray-600">Warehouse Utilization</p>
          <p className="text-2xl font-semibold mt-1">67%</p>
        </Card>
        <Card className="p-4 bg-white border border-gray-200">
          <p className="text-sm text-gray-600">Bagging Efficiency</p>
          <p className="text-2xl font-semibold mt-1">98.2%</p>
        </Card>
      </div>

      <Tabs defaultValue="bagging" className="space-y-6">
        <TabsList>
          <TabsTrigger value="bagging">Bagging Operations</TabsTrigger>
          <TabsTrigger value="inventory">Warehouse Inventory</TabsTrigger>
          <TabsTrigger value="movements">Movement History</TabsTrigger>
        </TabsList>

        <TabsContent value="bagging">
          <Card className="bg-white border border-gray-200">
            <div className="p-5 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">Bagging Records</h3>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bagging ID</TableHead>
                  <TableHead>Batch ID</TableHead>
                  <TableHead>Company</TableHead>
                  {/* <TableHead>Client</TableHead> */}
                  <TableHead>Number of Bags</TableHead>
                  <TableHead>Weight per Bag (kg)</TableHead>
                  <TableHead>Total Weight (kg)</TableHead>
                  <TableHead>Warehouse Location</TableHead>
                  <TableHead>Bagging Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isFetching ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-32 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        <span>Loading bagging records...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : isError ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-32 text-center text-red-500">
                      Error loading records. Please try again.
                    </TableCell>
                  </TableRow>
                ) : baggingRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-32 text-center text-gray-400">
                      No bagging records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  baggingRecords.map((record) => (
                    <TableRow
                      key={record.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => setSelectedRecord({ ...record, type: 'bagging' })}
                    >
                      <TableCell className="font-medium text-blue-600">
                        {record.baggingId}
                      </TableCell>
                      <TableCell className="text-blue-600">{record.batchId}</TableCell>
                      <TableCell>{record.supplierName}</TableCell>
                      <TableCell>{record.numberOfBags}</TableCell>
                      <TableCell>{record.weightPerBag}</TableCell>
                      <TableCell className="font-medium">
                        {record.totalWeight.toLocaleString()}
                      </TableCell>
                      <TableCell>{record.warehouseLocation}</TableCell>
                      <TableCell className="text-gray-600">{record.baggingDate}</TableCell>
                      <TableCell>
                        <StatusBadge status={record.status} />
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="inventory">
          <Card className="bg-white border border-gray-200">
            <div className="p-5 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">Current Warehouse Stock</h3>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Warehouse Location</TableHead>
                  <TableHead>Mineral Type</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Number of Bags</TableHead>
                  <TableHead>Total Weight (kg)</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryData.map((item) => (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => setSelectedRecord({ ...item, type: 'inventory' })}
                  >
                    <TableCell className="font-medium">{item.warehouseLocation}</TableCell>
                    <TableCell>{item.mineralType}</TableCell>
                    <TableCell>{item.grade}</TableCell>
                    <TableCell>{item.bags}</TableCell>
                    <TableCell className="font-medium">
                      {item.totalWeight.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-gray-600">{item.lastUpdate}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Package className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="movements">
          <Card className="bg-white border border-gray-200 p-8 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Movement history will be displayed here</p>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detail Panel */}
      {selectedRecord && (
        <div className="fixed inset-y-0 right-0 w-[500px] bg-[#1a1a1a] text-white shadow-2xl z-50 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <h2 className="font-semibold">
                {selectedRecord.type === 'bagging' ? selectedRecord.baggingId : selectedRecord.warehouseLocation}
              </h2>
              {selectedRecord.type === 'bagging' && (
                <button
                  className="text-gray-400 hover:text-white"
                  onClick={() => navigate(`/bagging-warehousing/${selectedRecord.baggingId}`)}
                >
                  <ExternalLink className="h-4 w-4" />
                </button>
              )}
            </div>
            <button onClick={() => setSelectedRecord(null)} className="text-gray-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Status</p>
              <StatusBadge status={selectedRecord.status || 'Active'} />
            </div>

            {selectedRecord.type === 'bagging' ? (
              <>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Batch ID</p>
                    <p className="font-medium text-blue-400">{selectedRecord.batchId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Warehouse</p>
                    <p className="font-medium">{selectedRecord.warehouseLocation}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Weight</p>
                    <p className="text-lg font-bold">{selectedRecord.totalWeight.toLocaleString()} kg</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Bag Count</p>
                    <p className="text-lg font-bold">{selectedRecord.numberOfBags} bags</p>
                  </div>
                </div>
                <div className="pt-6 border-t border-gray-700">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Bagging Specification</p>
                  <p className="text-sm">Weight per bag: {selectedRecord.weightPerBag} kg</p>
                  <p className="text-sm text-gray-400 mt-1">Date recorded: {selectedRecord.baggingDate}</p>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Mineral Type</p>
                    <p className="font-medium">{selectedRecord.mineralType}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Grade</p>
                    <p className="font-medium text-orange-400">{selectedRecord.grade}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Stock Weight</p>
                    <p className="text-lg font-bold">{(selectedRecord.totalWeight / 1000).toFixed(2)} MT</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Bags</p>
                    <p className="text-lg font-bold">{selectedRecord.bags.toLocaleString()} bags</p>
                  </div>
                </div>
                <div className="pt-6 border-t border-gray-700">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Location Information</p>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    {selectedRecord.warehouseLocation}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Last updated: {selectedRecord.lastUpdate}</p>
                </div>
              </>
            )}

            <div className="pt-6 border-t border-gray-700">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Operations</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-transparent border-gray-600 text-white hover:bg-gray-800"
                  onClick={() => toast.success('Labels sent to printer successfully!')}
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  Print Labels
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-transparent border-gray-600 text-white hover:bg-gray-800"
                  onClick={() => toast.success('Transfer initiated successfully!')}
                >
                  <Package className="h-4 w-4 mr-2" />
                  Initiate Transfer
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}


      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Bagging Entry</DialogTitle>
            <DialogDescription>
              Record bagging operation and assign warehouse location
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bagging-id">Bagging ID</Label>
              <Input id="bagging-id" placeholder="Auto-generated" disabled className="bg-gray-100" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="batch-select">Select Batch</Label>
              <Select onValueChange={(v) => {
                const batch = processingBatches.find(b => b.batchId === v);
                setFormData({
                  ...formData,
                  batchId: v,
                  supplierName: batch?.supplierName || 'N/A',
                  customerName: batch?.customerName || 'N/A'
                });
              }}>
                <SelectTrigger id="batch-select">
                  <SelectValue placeholder="Select batch" />
                </SelectTrigger>
                <SelectContent>
                  {processingBatches.map(batch => (
                    <SelectItem key={batch.id} value={batch.batchId}>{batch.batchId}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier-name">Company Name</Label>
              <Input id="supplier-name" value={formData.supplierName} disabled className="bg-gray-100" />
            </div>

            {/* <div className="space-y-2">
              <Label htmlFor="customer-name">Client Name</Label>
              <Input id="customer-name" value={formData.customerName} disabled className="bg-gray-100" />
            </div> */}

            <div className="space-y-2">
              <Label htmlFor="num-bags">Number of Bags</Label>
              <Input
                id="num-bags"
                type="number"
                placeholder="440"
                value={formData.numberOfBags}
                onChange={(e) => setFormData({ ...formData, numberOfBags: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight-bag">Weight per Bag (kg)</Label>
              <Input
                id="weight-bag"
                type="number"
                placeholder="50"
                value={formData.weightPerBag}
                onChange={(e) => setFormData({ ...formData, weightPerBag: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="total-weight">Total Weight (kg)</Label>
              <Input
                id="total-weight"
                placeholder="Auto-calculated"
                disabled
                className="bg-gray-100"
                value={(formData.numberOfBags * formData.weightPerBag).toLocaleString()}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="warehouse">Warehouse Location</Label>
              <Select onValueChange={(v) => setFormData({ ...formData, warehouseLocation: v })}>
                <SelectTrigger id="warehouse">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {(companySettings?.warehouses || []).map(w => (
                    <SelectItem key={w} value={w}>{w}</SelectItem>
                  ))}
                  {(companySettings?.warehouses || []).length === 0 && (
                    <p className="text-xs text-center py-2 text-gray-500">No warehouses defined in Settings</p>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bagging-date">Bagging Date</Label>
              <Input
                id="bagging-date"
                type="date"
                value={formData.baggingDate}
                onChange={(e) => setFormData({ ...formData, baggingDate: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateBagging}>
              Create Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
