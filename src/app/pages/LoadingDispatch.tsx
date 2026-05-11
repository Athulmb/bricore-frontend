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
import { Plus, Eye, FileDown, ShipIcon, X, ExternalLink, Truck, ClipboardList, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';
import { Combobox } from '../components/ui/combobox';
import { 
  useDispatchQuery, 
  useCreateDispatchRecord, 
  useUpdateDispatchRecord, 
  useDeleteDispatchRecord 
} from '../hooks/useDispatch';
import { useProcessingQuery } from '../hooks/useProcessing';
import { useYardIntakeQuery } from '../hooks/useYardIntake';
import { useWeighbridgeQuery } from '../hooks/useWeighbridge';

import { useSettingsQuery } from '../hooks/useSettings';

export function LoadingDispatch() {
  const navigate = useNavigate();
  const { data: companySettings, isLoading: isLoadingSettings } = useSettingsQuery();


  // Queries
  const { data: dispatchRecords = [], isLoading: isLoadingDispatch } = useDispatchQuery();
  const { data: processingBatches = [] } = useProcessingQuery();
  const { data: yardIntake = [] } = useYardIntakeQuery();
  const { data: weighbridgeRecords = [] } = useWeighbridgeQuery();

  // Mutations
  const createMutation = useCreateDispatchRecord();
  const updateMutation = useUpdateDispatchRecord();
  const deleteMutation = useDeleteDispatchRecord();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);

  // Derived data
  const weighbridgeInbound = weighbridgeRecords.filter(r => r.type === 'Inbound');
  const weighbridgeOutbound = weighbridgeRecords.filter(r => r.type === 'Outbound');

  const [formData, setFormData] = useState({
    batchId: '',
    container: '',
    loadingWeight: 0,
    destination: '',
    dispatchDate: new Date().toISOString().split('T')[0],
    supplierName: 'N/A',
    customerName: 'N/A',
  });

  const handleEdit = (record: any) => {
    setFormData({
      batchId: record.batchId,
      container: record.container,
      loadingWeight: record.loadingWeight,
      destination: record.destination,
      dispatchDate: record.dispatchDate,
      supplierName: record.supplierName || 'N/A',
      customerName: record.customerName || 'N/A',
    });
    setEditingId(record.id);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (recordToDelete) {
      try {
        await deleteMutation.mutateAsync(recordToDelete);
        setIsDeleteConfirmOpen(false);
        setRecordToDelete(null);
        if (selectedRecord?.id === recordToDelete) {
          setSelectedRecord(null);
        }
      } catch (error) {
        // Mutation handles toast
      }
    }
  };

  const handleCreateDispatch = async () => {
    if (!formData.batchId || !formData.container || formData.loadingWeight <= 0 || !formData.destination) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      if (isEditMode && editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          data: formData
        });
      } else {
        const newRecord = {
          dispatchId: `DSP-2026-${Math.floor(100 + Math.random() * 900)}`,
          ...formData,
          deliveryDate: '-',
          status: 'Loaded' as const,
        };
        await createMutation.mutateAsync(newRecord);
      }

      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      // Mutation handles toast
    }
  };

  const resetForm = () => {
    setFormData({ batchId: '', container: '', loadingWeight: 0, destination: '', dispatchDate: new Date().toISOString().split('T')[0], supplierName: 'N/A', customerName: 'N/A' });
    setIsEditMode(false);
    setEditingId(null);
  };

  if (isLoadingDispatch) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          <p className="text-gray-500 font-medium">Loading dispatch records...</p>
        </div>
      </div>
    );
  }


  const vehicleOptions = Array.from(new Set([
    ...(companySettings?.vehicles || []),
    ...(yardIntake || []).map(r => r.vehicleNumber),
    ...(weighbridgeInbound || []).map(r => r.vehicleNo),
    ...(weighbridgeOutbound || []).map(r => r.vehicleNo)
  ])).filter(Boolean).sort().map(v => ({ label: v!, value: v! }));

  return (
    <div>
      <PageHeader
        title="Loading & Dispatch"
        description="Manage shipment loading operations and dispatch tracking"
        action={{
          label: 'Create Dispatch',
          icon: Plus,
          onClick: () => setIsModalOpen(true),
        }}
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card className="p-4 bg-white border border-gray-200">
          <p className="text-sm text-gray-600">Pending Dispatch</p>
          <p className="text-2xl font-semibold mt-1">
            {dispatchRecords.filter(r => r.status === 'Pending' || r.status === 'Loaded').length}
          </p>
        </Card>
        <Card className="p-4 bg-white border border-gray-200">
          <p className="text-sm text-gray-600">In Transit</p>
          <p className="text-2xl font-semibold mt-1">
            {dispatchRecords.filter(r => r.status === 'In-Transit').length}
          </p>
        </Card>
        <Card className="p-4 bg-white border border-gray-200">
          <p className="text-sm text-gray-600">Delivered Total</p>
          <p className="text-2xl font-semibold mt-1">
            {dispatchRecords.filter(r => r.status === 'Delivered').length}
          </p>
        </Card>
        <Card className="p-4 bg-white border border-gray-200">
          <p className="text-sm text-gray-600">On-Time Delivery</p>
          <p className="text-2xl font-semibold mt-1">94%</p>
        </Card>
      </div>

      <Card className="bg-white border border-gray-200">
        <div className="p-5 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">Dispatch Records</h3>
            <div className="flex gap-2">
              <Select>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="loaded">Loaded</SelectItem>
                  <SelectItem value="in-transit">In Transit</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="text"
                placeholder="Search dispatch..."
                className="w-64"
              />
            </div>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dispatch ID</TableHead>
              <TableHead>Batch ID</TableHead>
              <TableHead>Company</TableHead>
              {/* <TableHead>Client</TableHead> */}
              <TableHead>Container/Truck</TableHead>
              <TableHead>Loading Weight (kg)</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Dispatch Date</TableHead>
              <TableHead>Delivery Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dispatchRecords.map((record) => (
              <TableRow
                key={record.id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => setSelectedRecord(record)}
              >
                <TableCell className="font-medium text-blue-600">
                  {record.dispatchId}
                </TableCell>
                <TableCell className="text-blue-600">{record.batchId}</TableCell>
                <TableCell>{record.supplierName}</TableCell>
                {/* <TableCell>{record.customerName}</TableCell> */}
                <TableCell>{record.container}</TableCell>
                <TableCell className="font-medium">
                  {record.loadingWeight > 0 ? record.loadingWeight.toLocaleString() : '-'}
                </TableCell>
                <TableCell>{record.destination}</TableCell>
                <TableCell className="text-gray-600">{record.dispatchDate}</TableCell>
                <TableCell className="text-gray-600">{record.deliveryDate}</TableCell>
                <TableCell>
                  <StatusBadge status={record.status} />
                </TableCell>
                <TableCell>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedRecord(record)}>
                      <Eye className="h-4 w-4 text-gray-400" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(record)}>
                      <span className="text-gray-400">✎</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setRecordToDelete(record.id);
                        setIsDeleteConfirmOpen(true);
                      }}
                    >
                      <X className="h-4 w-4 text-red-400" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <FileDown className="h-4 w-4 text-gray-400" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Detail Panel */}
      {selectedRecord && (
        <div className="fixed inset-y-0 right-0 w-[500px] bg-[#1a1a1a] text-white shadow-2xl z-50 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <h2 className="font-semibold">{selectedRecord.dispatchId}</h2>
              <button
                className="text-gray-400 hover:text-white"
                onClick={() => navigate(`/loading-dispatch/${selectedRecord.dispatchId}`)}
              >
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>
            <button onClick={() => setSelectedRecord(null)} className="text-gray-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Status</p>
              <StatusBadge status={selectedRecord.status} />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Batch ID</p>
                <p className="font-medium text-blue-400">{selectedRecord.batchId}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Container / Truck</p>
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-gray-500" />
                  <p className="font-medium uppercase">{selectedRecord.container}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Loading Weight</p>
                <p className="text-lg font-bold">{selectedRecord.loadingWeight.toLocaleString()} kg</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Destination</p>
                <p className="font-medium">{selectedRecord.destination}</p>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-700">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Shipment Progress</p>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="relative flex flex-col items-center">
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    <div className="h-full w-0.5 bg-gray-700 mt-1"></div>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Dispatched from Source</p>
                    <p className="text-xs text-gray-500">{selectedRecord.dispatchDate}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="relative flex flex-col items-center">
                    <div className="h-3 w-3 rounded-full bg-gray-700"></div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Expected Arrival</p>
                    <p className="text-xs text-gray-500">{selectedRecord.deliveryDate}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-700">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Actions</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-transparent border-gray-600 text-white hover:bg-gray-800"
                  onClick={() => toast.success('Loading List generated successfully!')}
                >
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Loading List
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-transparent border-gray-600 text-white hover:bg-gray-800"
                  onClick={() => toast.success('Dispatch Note generated successfully!')}
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Dispatch Note
                </Button>
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="w-full mt-2"
                onClick={() => {
                  setRecordToDelete(selectedRecord.id);
                  setIsDeleteConfirmOpen(true);
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Delete Dispatch
              </Button>
            </div>
          </div>
        </div>
      )}


      <Dialog open={isModalOpen} onOpenChange={(open) => {
        setIsModalOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Dispatch' : 'Create New Dispatch'}</DialogTitle>
            <DialogDescription>
              {isEditMode ? 'Update dispatch details and container/truck assignment' : 'Schedule a new shipment dispatch and assign container/truck'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dispatch-id">Dispatch ID</Label>
              <Input id="dispatch-id" placeholder="Auto-generated" disabled className="bg-gray-100" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="batch-id">Select Batch</Label>
              <Select
                value={formData.batchId}
                onValueChange={(v) => {
                  const batch = processingBatches.find(b => b.batchId === v);
                  setFormData({
                    ...formData,
                    batchId: v,
                    supplierName: batch?.supplierName || 'N/A',
                    customerName: batch?.customerName || 'N/A'
                  });
                }}
              >
                <SelectTrigger id="batch-id">
                  <SelectValue placeholder="Select batch" />
                </SelectTrigger>
                <SelectContent>
                  {processingBatches.map(batch => (
                    <SelectItem key={batch.id} value={batch.batchId}>{batch.batchId} ({(batch.quantity ?? batch.inputQuantity ?? 0).toLocaleString()} kg)</SelectItem>
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
              <Label htmlFor="container">Container/Truck Number</Label>
              <Combobox
                options={vehicleOptions}
                value={formData.container}
                onValueChange={(v) => setFormData({ ...formData, container: v })}
                placeholder="Select or enter vehicle/container"
                emptyText="Vehicle/Container not found"
                allowCustom
                onCustomAdd={(v) => setFormData({ ...formData, container: v })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="loading-weight">Loading Weight (kg)</Label>
              <Input
                id="loading-weight"
                type="number"
                placeholder="22000"
                value={formData.loadingWeight}
                onChange={(e) => setFormData({ ...formData, loadingWeight: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="destination">Destination</Label>
              <Select
                value={formData.destination}
                onValueChange={(v) => setFormData({ ...formData, destination: v })}
              >
                <SelectTrigger id="destination">
                  <SelectValue placeholder="Select destination" />
                </SelectTrigger>
                <SelectContent>
                  {(companySettings?.destinations || []).map((dest: string) => (
                    <SelectItem key={dest} value={dest}>{dest}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dispatch-date">Dispatch Date</Label>
              <Input
                id="dispatch-date"
                type="date"
                value={formData.dispatchDate}
                onChange={(e) => setFormData({ ...formData, dispatchDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="driver">Driver Name</Label>
              <Input id="driver" placeholder="Enter driver name" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact">Contact Number</Label>
              <Input id="contact" placeholder="Enter contact number" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateDispatch}>
              <ShipIcon className="h-4 w-4 mr-2" />
              {isEditMode ? 'Save Changes' : 'Create Dispatch'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this dispatch record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
