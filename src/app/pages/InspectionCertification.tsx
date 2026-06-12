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
import { Plus, Eye, Upload, FileCheck, X, ExternalLink, ClipboardCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';
import { 
  useInspectionQuery, 
  useCreateInspectionRecord, 
  useUpdateInspectionRecord, 
  useDeleteInspectionRecord 
} from '../hooks/useInspection';
import { useProcessingQuery } from '../hooks/useProcessing';

import { useSettingsQuery } from '../hooks/useSettings';

export function InspectionCertification() {
  const { data: companySettings, isLoading: isLoadingSettings } = useSettingsQuery();

  const { data: processingBatches = [] } = useProcessingQuery();
  const { data: inspectionRecords = [], isLoading: isFetching, isError } = useInspectionQuery(processingBatches);
  
  const createMutation = useCreateInspectionRecord();
  const updateMutation = useUpdateInspectionRecord();
  const deleteMutation = useDeleteInspectionRecord();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const navigate = useNavigate();

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await updateMutation.mutateAsync({
        id,
        data: {
          status: newStatus as any,
          completedDate: newStatus === 'Approved' ? new Date().toISOString().split('T')[0] : undefined
        }
      });
      setSelectedRecord((prev: any) => prev?.id === id ? { ...prev, status: newStatus } : prev);
    } catch (error) {
       // Mutation handles toast
    }
  };

  const [formData, setFormData] = useState({
    batchId: '',
    inspectorName: '',
    inspectionType: '',
    scheduledDate: '',
    observations: '',
    supplierName: 'N/A',
    customerName: 'N/A',
  });

  const handleScheduleInspection = async () => {
    if (!formData.batchId || !formData.inspectorName || !formData.inspectionType || !formData.scheduledDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const newRecord = {
        inspectionId: `INS-2026-${Math.floor(100 + Math.random() * 900)}`,
        batchId: formData.batchId,
        inspectorName: formData.inspectorName,
        inspectionType: formData.inspectionType,
        scheduledDate: formData.scheduledDate,
        supplierName: formData.supplierName,
        customerName: formData.customerName,
        completedDate: '-',
        observations: formData.observations || '-',
        status: 'Pending' as const,
      };

      await createMutation.mutateAsync(newRecord);
      setIsModalOpen(false);
      setFormData({ 
        batchId: '', inspectorName: '', inspectionType: '', scheduledDate: '', 
        observations: '', supplierName: 'N/A', customerName: 'N/A' 
      });
    } catch (error) {
      // Mutation handles toast
    }
  };

  return (
    <div>
      <PageHeader
        title="Inspection & Certification"
        description="Manage quality inspections and generate certification documents"
        action={{
          label: 'Schedule Inspection',
          icon: Plus,
          onClick: () => setIsModalOpen(true),
        }}
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card className="p-4 bg-white border border-gray-200">
          <p className="text-sm text-gray-600">Pending Inspections</p>
          <p className="text-2xl font-semibold mt-1">
            {inspectionRecords.filter(r => r.status === 'Pending').length}
          </p>
        </Card>
        <Card className="p-4 bg-white border border-gray-200">
          <p className="text-sm text-gray-600">Completed This Week</p>
          <p className="text-2xl font-semibold mt-1">
            {inspectionRecords.filter(r => r.status === 'Approved').length}
          </p>
        </Card>
        <Card className="p-4 bg-white border border-gray-200">
          <p className="text-sm text-gray-600">Certificates Issued</p>
          <p className="text-2xl font-semibold mt-1">45</p>
        </Card>
        <Card className="p-4 bg-white border border-gray-200">
          <p className="text-sm text-gray-600">Rejection Rate</p>
          <p className="text-2xl font-semibold mt-1">2.1%</p>
        </Card>
      </div>

      <Card className="bg-white border border-gray-200 mb-6">
        <div className="p-5 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">Inspection Records</h3>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Inspection ID</TableHead>
              <TableHead>Batch ID</TableHead>
              <TableHead>Company</TableHead>
              {/* <TableHead>Client</TableHead> */}
              <TableHead>Inspector Name</TableHead>
              <TableHead>Inspection Type</TableHead>
              <TableHead>Scheduled Date</TableHead>
              <TableHead>Completed Date</TableHead>
              <TableHead>Observations</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isFetching ? (
              <TableRow>
                <TableCell colSpan={10} className="h-32 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-[#E8491F]" />
                    <span>Loading inspections...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={10} className="h-32 text-center text-red-500">
                  Error loading inspections. Please try again.
                </TableCell>
              </TableRow>
            ) : inspectionRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="h-32 text-center text-gray-400">
                  No inspections found.
                </TableCell>
              </TableRow>
            ) : (
              inspectionRecords.map((record) => (
                <TableRow
                  key={record.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => setSelectedRecord(record)}
                >
                  <TableCell className="font-medium text-blue-600">
                    {record.inspectionId}
                  </TableCell>
                  <TableCell className="text-blue-600">{record.batchId}</TableCell>
                  <TableCell>{record.supplierName}</TableCell>
                  <TableCell>{record.inspectorName}</TableCell>
                  <TableCell>{record.inspectionType}</TableCell>
                  <TableCell className="text-gray-600">{record.scheduledDate}</TableCell>
                  <TableCell className="text-gray-600">{record.completedDate}</TableCell>
                  <TableCell className="max-w-xs truncate">{record.observations}</TableCell>
                  <TableCell>
                    <StatusBadge status={record.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <FileCheck className="h-4 w-4" />
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
              <h2 className="font-semibold">{selectedRecord.inspectionId}</h2>
              <button
                className="text-gray-400 hover:text-white"
                onClick={() => navigate(`/inspection-certification/${selectedRecord.inspectionId}`)}
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
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Inspection Type</p>
                <p className="font-medium">{selectedRecord.inspectionType}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Inspector</p>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-gray-600 flex items-center justify-center text-[10px]">
                    {selectedRecord.inspectorName.charAt(0)}
                  </div>
                  <p className="font-medium">{selectedRecord.inspectorName}</p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-700">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Observations</p>
              <p className="text-sm text-gray-300 leading-relaxed bg-gray-800/50 p-3 rounded-lg border border-gray-700">
                {selectedRecord.observations}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-6 border-t border-gray-700">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Scheduled Date</p>
                <p className="text-sm">{selectedRecord.scheduledDate}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Completed Date</p>
                <p className="text-sm">{selectedRecord.completedDate}</p>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-700">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Actions</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-transparent border-gray-600 text-white hover:bg-gray-800"
                  onClick={() => handleUpdateStatus(selectedRecord.id, 'Completed')}
                  disabled={selectedRecord.status === 'Completed' || selectedRecord.status === 'Approved'}
                >
                  <ClipboardCheck className="h-4 w-4 mr-2" />
                  Complete Inspection
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-transparent border-gray-600 text-white hover:bg-gray-800"
                  onClick={() => handleUpdateStatus(selectedRecord.id, 'Approved')}
                  disabled={selectedRecord.status !== 'Completed' && selectedRecord.status !== 'Pending'}
                >
                  <FileCheck className="h-4 w-4 mr-2" />
                  Issue Certificate
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}


      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Schedule New Inspection</DialogTitle>
            <DialogDescription>
              Create an inspection record and assign inspector
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="inspection-id">Inspection ID</Label>
              <Input id="inspection-id" placeholder="Auto-generated" disabled className="bg-gray-100" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="batch">Batch ID</Label>
              <Select onValueChange={(v) => {
                const batch = processingBatches.find(b => b.batchId === v);
                setFormData({
                  ...formData,
                  batchId: v,
                  supplierName: batch?.supplierName || 'N/A',
                  customerName: batch?.customerName || 'N/A'
                });
              }}>
                <SelectTrigger id="batch">
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
              <Label htmlFor="inspector">Inspector Name</Label>
              <Select onValueChange={(v) => setFormData({ ...formData, inspectorName: v })}>
                <SelectTrigger id="inspector">
                  <SelectValue placeholder="Assign inspector" />
                </SelectTrigger>
                <SelectContent>
                  {companySettings.inspectors && companySettings.inspectors.length > 0 ? (
                    companySettings.inspectors.map((inspector: string) => (
                      <SelectItem key={inspector} value={inspector}>{inspector}</SelectItem>
                    ))
                  ) : (
                    <>
                      <SelectItem value="Robert Johnson">Robert Johnson</SelectItem>
                      <SelectItem value="Sarah Williams">Sarah Williams</SelectItem>
                      <SelectItem value="Michael Chen">Michael Chen</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Inspection Type</Label>
              <Select onValueChange={(v) => setFormData({ ...formData, inspectionType: v })}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {(companySettings.inspectionTypes || []).map((type: string) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduled">Scheduled Date</Label>
              <Input
                id="scheduled"
                type="date"
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Scheduled Time</Label>
              <Input id="time" type="time" />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="observations">Observations / Notes</Label>
              <Textarea
                id="observations"
                placeholder="Enter inspection observations..."
                rows={4}
                value={formData.observations}
                onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleScheduleInspection}>
              Schedule Inspection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
