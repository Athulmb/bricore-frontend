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
import { Textarea } from '../components/ui/textarea';
import { Plus, Eye, Upload, FileText, X, ExternalLink, Beaker, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';
import { 
  useAssayingQuery, 
  useCreateTestRecord, 
  useUpdateTestRecord, 
  useDeleteTestRecord,
  useUploadTestDocument,
  useDeleteTestDocument
} from '../hooks/useAssaying';
import { useProcessingQuery } from '../hooks/useProcessing';

import { useSettingsQuery } from '../hooks/useSettings';

export function AssayingTesting() {
  const { data: companySettings, isLoading: isLoadingSettings } = useSettingsQuery();

  const { data: processingBatches = [] } = useProcessingQuery();
  const { data: testRecords = [], isLoading: isFetching, isError } = useAssayingQuery(processingBatches);
  
  const createMutation = useCreateTestRecord();
  const updateMutation = useUpdateTestRecord();
  const deleteMutation = useDeleteTestRecord();
  const uploadDocMutation = useUploadTestDocument();
  const deleteDocMutation = useDeleteTestDocument();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [isUpdateResultOpen, setIsUpdateResultOpen] = useState(false);

  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    linkedBatch: '',
    testType: '',
    labName: '',
    notes: '',
    purity: '',
    status: 'Pending',
    qualityParameters: [] as any[],
    sizeDistribution: [] as any[],
    supplierName: 'N/A',
    customerName: 'N/A'
  });

  const handleEdit = (record: any) => {
    setFormData({
      linkedBatch: record.linkedBatch,
      testType: record.testType,
      labName: record.labName,
      notes: record.notes || '',
      purity: record.purity,
      status: record.status,
      qualityParameters: record.qualityParameters || [],
      sizeDistribution: record.sizeDistribution || [],
      supplierName: record.supplierName || 'N/A',
      customerName: record.customerName || 'N/A'
    });
    setEditingId(record.id);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (recordToDelete) {
      await deleteMutation.mutateAsync(recordToDelete.toString());
      setIsDeleteConfirmOpen(false);
      setRecordToDelete(null);
      if (selectedRecord?.id === recordToDelete) {
        setSelectedRecord(null);
      }
    }
  };

  const handleUpdateResult = async () => {
    if (selectedRecord) {
      await updateMutation.mutateAsync({
        id: selectedRecord.id,
        data: {
          purity: formData.purity,
          status: formData.status as any,
          qualityParameters: formData.qualityParameters,
          sizeDistribution: formData.sizeDistribution,
          resultDate: new Date().toISOString().split('T')[0]
        }
      });
      setIsUpdateResultOpen(false);
      setSelectedRecord((prev: any) => ({
        ...prev,
        purity: formData.purity,
        status: formData.status,
        qualityParameters: formData.qualityParameters,
        sizeDistribution: formData.sizeDistribution
      }));
    }
  };

  const handleCreateSample = async () => {
    if (!formData.linkedBatch || !formData.testType || !formData.labName) {
      toast.error('Please fill in all required fields');
      return;
    }

    const linkedBatchData = (processingBatches || []).find(b => b.batchId === formData.linkedBatch);

    try {
      if (isEditMode && editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          data: {
            linkedBatch: formData.linkedBatch,
            testType: formData.testType,
            labName: formData.labName,
            mineralType: linkedBatchData?.rawMaterial || 'Unknown',
            notes: formData.notes
          }
        });
      } else {
        const newRecord = {
          sampleId: `QC-2026-${Math.floor(100 + Math.random() * 900)}`,
          batchId: formData.linkedBatch,
          testType: formData.testType,
          labName: formData.labName,
          mineralType: linkedBatchData?.rawMaterial || 'Unknown',
          supplierName: linkedBatchData?.supplierName || 'N/A',
          customerName: linkedBatchData?.customerName || 'N/A',
          purity: '-',
          submittedDate: new Date().toISOString().split('T')[0],
          resultDate: '-',
          status: 'Pending' as const,
          notes: formData.notes
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
    setFormData({
      linkedBatch: '',
      testType: '',
      labName: '',
      notes: '',
      purity: '',
      status: 'Pending',
      qualityParameters: [],
      sizeDistribution: [],
      supplierName: 'N/A',
      customerName: 'N/A'
    });
    setIsEditMode(false);
    setEditingId(null);
  };

  return (
    <div>
      <PageHeader
        title="Assaying & Testing"
        description="Manage quality control samples and laboratory test results"
        action={{
          label: 'New Sample',
          icon: Plus,
          onClick: () => setIsModalOpen(true),
        }}
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card className="p-4 bg-white border border-gray-200">
          <p className="text-sm text-gray-600">Pending Tests</p>
          <p className="text-2xl font-semibold mt-1">
            {testRecords.filter(r => r.status === 'Pending').length}
          </p>
        </Card>
        <Card className="p-4 bg-white border border-gray-200">
          <p className="text-sm text-gray-600">Approved This Week</p>
          <p className="text-2xl font-semibold mt-1">
            {testRecords.filter(r => r.status === 'Approved').length}
          </p>
        </Card>
        <Card className="p-4 bg-white border border-gray-200">
          <p className="text-sm text-gray-600">Rejected</p>
          <p className="text-2xl font-semibold mt-1">
            {testRecords.filter(r => r.status === 'Rejected').length}
          </p>
        </Card>
        <Card className="p-4 bg-white border border-gray-200">
          <p className="text-sm text-gray-600">Average Turnaround</p>
          <p className="text-2xl font-semibold mt-1">2.3 days</p>
        </Card>
      </div>

      <Card className="bg-white border border-gray-200">
        <div className="p-5 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">Test Records</h3>
            <div className="flex gap-2">
              <Select>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="text"
                placeholder="Search samples..."
                className="w-64"
              />
            </div>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sample ID</TableHead>
              <TableHead>Linked Batch</TableHead>
              <TableHead>Company</TableHead>
              {/* <TableHead>Client</TableHead> */}
              <TableHead>Test Type</TableHead>
              <TableHead>Lab Name</TableHead>
              <TableHead>Mineral Type</TableHead>
              <TableHead>Purity</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Result Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isFetching ? (
              <TableRow>
                <TableCell colSpan={11} className="h-32 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <span>Loading test records...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={11} className="h-32 text-center text-red-500">
                  Error loading test records. Please try again.
                </TableCell>
              </TableRow>
            ) : testRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="h-32 text-center text-gray-400">
                  No test records found.
                </TableCell>
              </TableRow>
            ) : (
              testRecords.map((record) => (
                <TableRow
                  key={record.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => setSelectedRecord(record)}
                >
                  <TableCell
                    className="font-medium text-blue-600 hover:underline cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/assaying-testing/${record.id}`);
                    }}
                  >
                    {record.sampleId}
                  </TableCell>
                  <TableCell className="text-blue-600">{record.linkedBatch}</TableCell>
                  <TableCell>{record.supplierName}</TableCell>
                  <TableCell>{record.testType}</TableCell>
                  <TableCell>{record.labName}</TableCell>
                  <TableCell>
                    {(() => {
                      const materials = record.materialType || record.mineralType;
                      return Array.isArray(materials) 
                        ? materials.map((m: any) => typeof m === 'string' ? m : m.name).join(', ') 
                        : (materials || 'N/A');
                    })()}
                  </TableCell>
                  <TableCell className="font-medium">{record.purity}</TableCell>
                  <TableCell className="text-gray-600">{record.submittedDate}</TableCell>
                  <TableCell className="text-gray-600">{record.resultDate}</TableCell>
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/assaying-testing/${record.id}`)}
                      >
                        <FileText className="h-4 w-4 text-gray-400" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Detail Panel */}
      {selectedRecord && (
        <div className="fixed inset-y-0 right-0 w-[500px] bg-[#1a1a1a] text-white shadow-2xl z-50 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <h2 className="font-semibold">{selectedRecord.sampleId}</h2>
              <button
                className="text-gray-400 hover:text-white"
                onClick={() => navigate(`/assaying-testing/${selectedRecord.id}`)}
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
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Linked Batch</p>
                <p className="font-medium text-blue-400">#{selectedRecord.linkedBatch}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Mineral Type</p>
                <p className="font-medium">
                  {(() => {
                    const materials = selectedRecord.materialType || selectedRecord.mineralType;
                    return Array.isArray(materials) 
                      ? materials.map((m: any) => typeof m === 'string' ? m : m.name).join(', ') 
                      : (materials || 'N/A');
                  })()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Test Type</p>
                <p className="font-medium">{selectedRecord.testType}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Purity / Result</p>
                <p className="font-medium text-green-400 text-lg">{selectedRecord.purity}</p>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-700">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Laboratory Information</p>
              <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                <div className="h-10 w-10 rounded bg-gray-700 flex items-center justify-center">
                  <Beaker className="h-5 w-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">{selectedRecord.labName}</p>
                  <p className="text-xs text-gray-400">Accredited Partner</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-6 border-t border-gray-700">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Submission Date</p>
                <p className="text-sm">{selectedRecord.submittedDate}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Result Date</p>
                <p className="text-sm">{selectedRecord.resultDate}</p>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-700">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Actions</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 bg-transparent border-gray-600 text-white hover:bg-gray-800">
                  <FileText className="h-4 w-4 mr-2" />
                  View Report
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-transparent border-gray-600 text-white hover:bg-gray-800"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, purity: selectedRecord.purity, status: selectedRecord.status }));
                    setIsUpdateResultOpen(true);
                  }}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Update Result
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
                Delete Sample
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
            <DialogTitle>{isEditMode ? 'Edit Quality Test Sample' : 'Create Quality Test Sample'}</DialogTitle>
            <DialogDescription>
              {isEditMode ? 'Update the details of the laboratory test sample' : 'Submit a new sample for laboratory testing'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="sample-id">Sample ID</Label>
              <Input id="sample-id" placeholder="Auto-generated" disabled className="bg-gray-100" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="linked-batch">Linked Batch</Label>
              <Select
                value={formData.linkedBatch}
                onValueChange={(v) => {
                  const batch = processingBatches.find(b => b.batchId === v);
                  setFormData({
                    ...formData,
                    linkedBatch: v,
                    supplierName: batch?.supplierName || 'N/A',
                    customerName: batch?.customerName || 'N/A'
                  });
                }}
              >
                <SelectTrigger id="linked-batch">
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
              <Label htmlFor="test-type">Test Type</Label>
              <Select
                value={formData.testType}
                onValueChange={(v) => setFormData({ ...formData, testType: v })}
              >
                <SelectTrigger id="test-type">
                  <SelectValue placeholder="Select test type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Chemical Analysis">Chemical Analysis</SelectItem>
                  <SelectItem value="Physical Analysis">Physical Analysis</SelectItem>
                  <SelectItem value="Complete Analysis">Complete Analysis</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lab">Laboratory Name</Label>
              <Select
                value={formData.labName}
                onValueChange={(v) => setFormData({ ...formData, labName: v })}
              >
                <SelectTrigger id="lab">
                  <SelectValue placeholder="Select lab" />
                </SelectTrigger>
                <SelectContent>
                  {(companySettings?.laboratories || []).map((lab: string) => (
                    <SelectItem key={lab} value={lab}>{lab}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="notes">Test Requirements / Notes</Label>
              <Textarea
                id="notes"
                placeholder="Enter specific test requirements or notes..."
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSample}>
              {isEditMode ? 'Save Changes' : 'Submit Sample'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Result Modal */}
      <Dialog open={isUpdateResultOpen} onOpenChange={setIsUpdateResultOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Test Result</DialogTitle>
            <DialogDescription>
              Enter final purity results and update status for {selectedRecord?.sampleId}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Purity (%)</Label>
              <Input
                value={formData.purity}
                onChange={(e) => setFormData({ ...formData, purity: e.target.value })}
                placeholder="e.g. 98.5%"
              />
            </div>
            <div className="space-y-2">
              <Label>Final Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Chemical Parameters</h4>
                <Button variant="outline" size="sm" onClick={() => setFormData({
                  ...formData,
                  qualityParameters: [...formData.qualityParameters, { parameter: '', specification: '', actual: '', status: 'Pass' }]
                })}>
                  <Plus className="h-4 w-4 mr-2" /> Add
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-2">
                {formData.qualityParameters.map((param: any, index: number) => (
                  <div key={index} className="flex gap-2 bg-gray-50 p-2 rounded border border-gray-200 items-end">
                    <div className="flex-1 space-y-1">
                      <Label className="text-[10px]">Parameter</Label>
                      <Input className="h-8 text-xs bg-white" value={param.parameter} onChange={(e) => {
                        const newParams = [...formData.qualityParameters];
                        newParams[index].parameter = e.target.value;
                        setFormData({ ...formData, qualityParameters: newParams });
                      }} />
                    </div>
                    <div className="flex-1 space-y-1">
                      <Label className="text-[10px]">Specification</Label>
                      <Input className="h-8 text-xs bg-white" value={param.specification} onChange={(e) => {
                        const newParams = [...formData.qualityParameters];
                        newParams[index].specification = e.target.value;
                        setFormData({ ...formData, qualityParameters: newParams });
                      }} />
                    </div>
                    <div className="w-16 space-y-1">
                      <Label className="text-[10px]">Actual</Label>
                      <Input className="h-8 text-xs bg-white" value={param.actual} onChange={(e) => {
                        const newParams = [...formData.qualityParameters];
                        newParams[index].actual = e.target.value;
                        setFormData({ ...formData, qualityParameters: newParams });
                      }} />
                    </div>
                    <div className="w-20 space-y-1">
                      <Label className="text-[10px]">Status</Label>
                      <Select
                        value={param.status}
                        onValueChange={(v) => {
                          const newParams = [...formData.qualityParameters];
                          newParams[index].status = v;
                          setFormData({ ...formData, qualityParameters: newParams });
                        }}
                      >
                        <SelectTrigger className="h-8 text-[10px] bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pass">Pass</SelectItem>
                          <SelectItem value="Fail">Fail</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400" onClick={() => {
                      setFormData({ ...formData, qualityParameters: formData.qualityParameters.filter((_: any, i: number) => i !== index) });
                    }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Size Distribution</h4>
                <Button variant="outline" size="sm" onClick={() => setFormData({
                  ...formData,
                  sizeDistribution: [...formData.sizeDistribution, { size: '', percentage: 0, weight: 0 }]
                })}>
                  <Plus className="h-4 w-4 mr-2" /> Add
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-2">
                {formData.sizeDistribution.map((size: any, index: number) => (
                  <div key={index} className="flex gap-2 items-center bg-gray-50 p-2 rounded border border-gray-200">
                    <Input className="flex-1 h-8 text-xs bg-white" placeholder="Range (e.g. +10mm)" value={size.size} onChange={(e) => {
                      const newSizes = [...formData.sizeDistribution];
                      newSizes[index].size = e.target.value;
                      setFormData({ ...formData, sizeDistribution: newSizes });
                    }} />
                    <Input className="w-16 h-8 text-xs bg-white" type="number" placeholder="%" value={size.percentage} onChange={(e) => {
                      const newSizes = [...formData.sizeDistribution];
                      newSizes[index].percentage = parseFloat(e.target.value) || 0;
                      setFormData({ ...formData, sizeDistribution: newSizes });
                    }} />
                    <span className="text-xs text-gray-500">%</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400" onClick={() => {
                      setFormData({ ...formData, sizeDistribution: formData.sizeDistribution.filter((_: any, i: number) => i !== index) });
                    }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateResultOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateResult} className="bg-blue-600 hover:bg-blue-700 text-white">
              Update Result
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
              Are you sure you want to delete this quality test sample? This action cannot be undone.
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
