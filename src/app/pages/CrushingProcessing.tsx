import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
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
import { Plus, Eye, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { 
  useProcessingQuery, 
  useCreateProcessingBatch, 
  useUpdateProcessingBatch, 
  useDeleteProcessingBatch 
} from '../hooks/useProcessing';


import { useSettingsQuery } from '../hooks/useSettings';
import { useYardIntakeQuery } from '../hooks/useYardIntake';
import { useClientsQuery } from '../hooks/useClients';

export function CrushingProcessing() {
  const { data: companySettings, isLoading: isLoadingSettings } = useSettingsQuery();
  const { data: yardIntake = [], isLoading: isLoadingYard } = useYardIntakeQuery();
  const { data: clients = [], isLoading: isLoadingClients } = useClientsQuery();

  const { data: processingBatches = [], isLoading: isFetching, isError } = useProcessingQuery();
  const createMutation = useCreateProcessingBatch();
  const updateMutation = useUpdateProcessingBatch();
  const deleteMutation = useDeleteProcessingBatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    rawMaterial: [] as string[],
    quantity: location.state?.quantity || 0,
    machineAssigned: '',
    outputGrade: '',
    processingDate: new Date().toISOString().split('T')[0],
    sourceGRN: location.state?.grnReference || '',
    supplierName: location.state?.supplierName || 'N/A',
    customerName: location.state?.customerName || 'N/A',
  });

  const [isModalOpen, setIsModalOpen] = useState(!!location.state?.rawMaterial);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (location.state && ((location.state as any).rawMaterial || (location.state as any).materials)) {
      const state = location.state as any;
      const rawMaterials = state.materials || [state.rawMaterial];
      const materialNames = rawMaterials.map((m: any) => typeof m === 'string' ? m : m.name).filter(Boolean);
      
      setFormData(prev => ({
        ...prev,
        rawMaterial: materialNames,
        quantity: state.quantity || 0,
        sourceGRN: state.grnReference || '',
        supplierName: state.supplierName || 'N/A',
        customerName: state.customerName || 'N/A',
      }));
      setIsModalOpen(true);
    }
  }, [location.state]);

  const handleEdit = (batch: any) => {
    const rawMaterials = Array.isArray(batch.rawMaterial) ? batch.rawMaterial : (batch.rawMaterial ? [batch.rawMaterial] : []);
    const materialNames = rawMaterials.map((m: any) => typeof m === 'string' ? m : m.name).filter(Boolean);

    setFormData({
      rawMaterial: materialNames,
      quantity: batch.quantity || 0,
      machineAssigned: batch.machineAssigned,
      outputGrade: batch.outputGrade,
      processingDate: batch.processingDate,
      sourceGRN: batch.grnReference || '',
      supplierName: batch.supplierName || 'N/A',
      customerName: batch.customerName || 'N/A',
    });
    setEditingId(batch.id);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (batchToDelete) {
      await deleteMutation.mutateAsync(batchToDelete);
      setIsDeleteConfirmOpen(false);
      setBatchToDelete(null);
    }
  };

  const handleCreateBatch = async () => {
    if (formData.rawMaterial.length === 0 || !formData.machineAssigned || !formData.outputGrade || formData.quantity <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      if (isEditMode && editingId) {
        await updateMutation.mutateAsync({
          id: editingId.toString(),
          data: {
            rawMaterial: formData.rawMaterial,
            inputQuantity: formData.quantity,
            machineAssigned: formData.machineAssigned,
            outputGrade: formData.outputGrade,
            processingDate: formData.processingDate,
            grnReference: formData.sourceGRN,
            supplierName: formData.supplierName,
            customerName: formData.customerName,
          }
        });
      } else {
        const newBatch = {
          batchId: `BATCH-2026-${Math.floor(100 + Math.random() * 900)}`,
          rawMaterial: formData.rawMaterial,
          inputQuantity: formData.quantity,
          machineAssigned: formData.machineAssigned,
          outputGrade: formData.outputGrade,
          outputQuantity: 0,
          processingDate: formData.processingDate,
          status: 'Pending' as const,
          grnReference: formData.sourceGRN,
          supplierName: formData.supplierName,
          customerName: formData.customerName,
        };
        await createMutation.mutateAsync(newBatch);
      }

      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      // Mutations handle their own toast errors
    }
  };

  const resetForm = () => {
    setFormData({
      rawMaterial: [],
      quantity: 0,
      machineAssigned: '',
      outputGrade: '',
      processingDate: new Date().toISOString().split('T')[0],
      sourceGRN: '',
      supplierName: 'N/A',
      customerName: 'N/A'
    });
    setIsEditMode(false);
    setEditingId(null);
  };

  return (
    <div>
      <PageHeader
        title="Crushing & Processing"
        description="Manage processing batches and production operations"
        action={{
          label: 'New Batch',
          icon: Plus,
          onClick: () => setIsModalOpen(true),
        }}
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card className="p-4 bg-white border border-gray-200">
          <p className="text-sm text-gray-600">Today's Production</p>
          <p className="text-2xl font-semibold mt-1">
            {(processingBatches || []).reduce((acc, curr) => acc + (curr.status === 'Completed' ? curr.outputQuantity : 0), 0).toLocaleString()} kg
          </p>
        </Card>
        <Card className="p-4 bg-white border border-gray-200">
          <p className="text-sm text-gray-600">Active Batches</p>
          <p className="text-2xl font-semibold mt-1">
            {(processingBatches || []).filter(b => b.status === 'Processing').length}
          </p>
        </Card>
        <Card className="p-4 bg-white border border-gray-200">
          <p className="text-sm text-gray-600">Total Batches</p>
          <p className="text-2xl font-semibold mt-1">{(processingBatches || []).length}</p>
        </Card>
        <Card className="p-4 bg-white border border-gray-200">
          <p className="text-sm text-gray-600">Output Efficiency</p>
          <p className="text-2xl font-semibold mt-1">97.5%</p>
        </Card>
      </div>

      <Card className="bg-white border border-gray-200">
        <div className="p-5 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">Processing Batches</h3>
            <Input
              type="text"
              placeholder="Search batches..."
              className="w-64"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Batch ID</TableHead>
              <TableHead>Company</TableHead>
              {/* <TableHead>Client</TableHead> */}
              <TableHead>Raw Material</TableHead>
              <TableHead>Input Qty (kg)</TableHead>
              <TableHead>Assigned Machine</TableHead>
              <TableHead>Output Grade</TableHead>
              <TableHead>Output Qty (kg)</TableHead>
              <TableHead>Processing Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isFetching ? (
              <TableRow>
                <TableCell colSpan={10} className="h-32 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-[#974926]" />
                    <span>Loading processing batches...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={10} className="h-32 text-center text-red-500">
                  Error loading batches. Please try again.
                </TableCell>
              </TableRow>
            ) : processingBatches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="h-32 text-center text-gray-400">
                  No batches found.
                </TableCell>
              </TableRow>
            ) : (
              processingBatches.map((batch) => (
                <TableRow
                  key={batch.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => navigate(`/crushing-processing/${batch.batchId}`)}
                >
                  <TableCell className="font-medium text-[#974926]">
                    {batch.batchId}
                  </TableCell>
                  <TableCell>{batch.supplierName}</TableCell>
                  <TableCell>
                    {Array.isArray(batch.rawMaterial) 
                      ? batch.rawMaterial.map((m: any) => typeof m === 'string' ? m : m.name).join(', ') 
                      : (typeof batch.rawMaterial === 'string' ? batch.rawMaterial : (batch.rawMaterial as any)?.name || batch.rawMaterial)}
                  </TableCell>
                  <TableCell>{(batch.quantity || 0).toLocaleString()}</TableCell>
                  <TableCell>{batch.machineAssigned || batch.machine}</TableCell>
                  <TableCell>{batch.outputGrade}</TableCell>
                  <TableCell className="font-medium">
                    {batch.outputQuantity > 0 ? batch.outputQuantity.toLocaleString() : '-'}
                  </TableCell>
                  <TableCell className="text-gray-600">{batch.processingDate}</TableCell>
                  <TableCell>
                    <StatusBadge status={batch.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/crushing-processing/${batch.batchId}`)}>
                        <Eye className="h-4 w-4 text-gray-400" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(batch)}>
                        <span className="text-gray-400">✎</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setBatchToDelete(batch.id);
                          setIsDeleteConfirmOpen(true);
                        }}
                      >
                        <X className="h-4 w-4 text-red-400" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={(open) => {
        setIsModalOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Processing Batch' : 'Create Processing Batch'}</DialogTitle>
            <DialogDescription>
              {isEditMode ? 'Update the details of the existing batch' : 'Start a new crushing and processing batch'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="batch-id">Batch ID</Label>
              <Input id="batch-id" placeholder="Auto-generated" disabled className="bg-gray-100" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="source-grn">Source GRN (from Yard Intake)</Label>
              <Select
                value={formData.sourceGRN}
                onValueChange={(v) => {
                  const selectedIntake = (yardIntake || []).find((i: any) => i.grnNumber === v);
                  if (selectedIntake) {
                    const rawMaterials = Array.isArray(selectedIntake.mineralType || selectedIntake.materialType)
                      ? (selectedIntake.mineralType || selectedIntake.materialType) as any[]
                      : [selectedIntake.mineralType || selectedIntake.materialType].filter(Boolean);
                    
                    const materialNames = rawMaterials.map((m: any) => typeof m === 'string' ? m : m.name).filter(Boolean);

                    setFormData({
                      ...formData,
                      sourceGRN: v,
                      rawMaterial: materialNames,
                      quantity: selectedIntake.netWeight || 0,
                      supplierName: selectedIntake.supplierName || selectedIntake.supplier || 'N/A',
                      customerName: selectedIntake.customerName || 'N/A'
                    });
                  } else {
                    setFormData({ ...formData, sourceGRN: v });
                  }
                }}
              >
                <SelectTrigger id="source-grn">
                  <SelectValue placeholder="Select GRN" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Manual Entry)</SelectItem>
                  {(yardIntake || []).map((intake: any) => (
                    <SelectItem key={intake.id} value={intake.grnNumber}>
                      {intake.grnNumber} - {intake.supplierName || intake.supplier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Raw Material</Label>
              <div className="flex flex-wrap gap-1 mb-2 border rounded-md p-2 min-h-[42px] bg-white">
                {formData.rawMaterial.length === 0 && (
                  <span className="text-gray-400 text-sm">Select materials...</span>
                )}
                {formData.rawMaterial.map((type) => (
                  <span
                    key={type}
                    className="inline-flex items-center gap-1 bg-[#974926] text-white px-2 py-0.5 rounded text-sm"
                  >
                    {type}
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          rawMaterial: formData.rawMaterial.filter(t => t !== type)
                        })
                      }
                      className="hover:text-red-200"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <Select
                onValueChange={(v) => {
                  if (!formData.rawMaterial.includes(v)) {
                    setFormData({
                      ...formData,
                      rawMaterial: [...formData.rawMaterial, v]
                    });
                  }
                }}
              >
                <SelectTrigger id="raw-material">
                  <SelectValue placeholder={formData.rawMaterial.length > 0 ? "Add more..." : "Select material"} />
                </SelectTrigger>
                <SelectContent>
                  {(() => {
                    const selectedIntake = (yardIntake || []).find((i: any) => i.grnNumber === formData.sourceGRN);
                    const availableMaterials = selectedIntake
                      ? (Array.isArray(selectedIntake.mineralType || selectedIntake.materialType)
                        ? (selectedIntake.mineralType || selectedIntake.materialType)
                        : [selectedIntake.mineralType || selectedIntake.materialType].filter(Boolean))
                      : (companySettings?.materialTypes || []);

                    return (
                      <>
                        {availableMaterials.map((item: any) => {
                          const type = typeof item === 'string' ? item : item.name;
                          return (
                            <SelectItem key={type} value={type} disabled={formData.rawMaterial.includes(type)}>
                              {type}
                            </SelectItem>
                          );
                        })}
                      </>
                    );
                  })()}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Input Quantity (kg)</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="22000"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="machine">Assigned Machine</Label>
              <Select
                value={formData.machineAssigned}
                onValueChange={(v) => setFormData({ ...formData, machineAssigned: v })}
              >
                <SelectTrigger id="machine">
                  <SelectValue placeholder="Select machine" />
                </SelectTrigger>
                <SelectContent>
                  {(companySettings?.machines || []).map((machine: string) => (
                    <SelectItem key={machine} value={machine}>{machine}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="output-grade">Target Output Grade</Label>
              <Select
                value={formData.outputGrade}
                onValueChange={(v) => setFormData({ ...formData, outputGrade: v })}
              >
                <SelectTrigger id="output-grade">
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Grade A">Grade A</SelectItem>
                  <SelectItem value="Grade B">Grade B</SelectItem>
                  <SelectItem value="Grade C">Grade C</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier">Company Name</Label>
              <Select
                value={formData.supplierName === 'N/A' ? '' : formData.supplierName}
                onValueChange={(v) => setFormData({ ...formData, supplierName: v })}
              >
                <SelectTrigger id="supplier">
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="N/A">N/A</SelectItem>
                  {(clients || []).map((client: any) => (
                    <SelectItem key={client.id} value={client.name}>{client.name}</SelectItem>
                  ))}
                  {formData.supplierName !== 'N/A' && !(clients || []).some((c: any) => c.name === formData.supplierName) && (
                    <SelectItem value={formData.supplierName}>{formData.supplierName}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* <div className="space-y-2">
              <Label htmlFor="customer">Client Name</Label>
              <Select
                value={formData.customerName === 'N/A' ? '' : formData.customerName}
                onValueChange={(v) => setFormData({ ...formData, customerName: v })}
              >
                <SelectTrigger id="customer">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="N/A">N/A</SelectItem>
                  {(clients || []).filter(c => c.type === 'Customer' || c.type === 'Both' || c.type === 'Supplier').map((client) => (
                    <SelectItem key={client.id} value={client.name}>{client.name}</SelectItem>
                  ))}
                  {formData.customerName !== 'N/A' && !(clients || []).some(c => c.name === formData.customerName) && (
                    <SelectItem value={formData.customerName}>{formData.customerName}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div> */}

            <div className="space-y-2">
              <Label htmlFor="date">Processing Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.processingDate}
                onChange={(e) => setFormData({ ...formData, processingDate: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateBatch}>
              {isEditMode ? 'Save Changes' : 'Create Batch'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this processing batch? This action cannot be undone.
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