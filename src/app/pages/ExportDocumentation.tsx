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
import { FileText, Download, Upload, Eye, CheckCircle, Plus, X, ExternalLink, Globe, ShieldCheck } from 'lucide-react';
import {
  useCreateExportDoc,
  useDeleteExportDoc,
  useExportDocsQuery,
  useUpdateExportDocStatus
} from '../hooks/useExportDocs';
import {
  useDispatchQuery
} from '../hooks/useDispatch';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

export function ExportDocumentation() {
  const navigate = useNavigate();

  // Queries
  const { data: exportDocs = [], isLoading: isLoadingExport } = useExportDocsQuery();
  const { data: dispatchRecords = [], isLoading: isLoadingDispatch } = useDispatchQuery();

  // Mutations
  const createMutation = useCreateExportDoc();
  const deleteMutation = useDeleteExportDoc();
  const updateStatusMutation = useUpdateExportDocStatus();

  const isLoading = isLoadingExport || isLoadingDispatch;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [shipmentToDelete, setShipmentToDelete] = useState<number | null>(null);
  const [uploadState, setUploadState] = useState<{ shipmentId: string, id: string, docKey: string } | null>(null);
  const generateShipmentId = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(100 + Math.random() * 900);
    return `SHP-${year}-${random}`;
  };

  const [formData, setFormData] = useState({
    shipmentId: '',
    dispatchId: '',
    customer: '',
    destination: '',
  });

  const openNewShipmentModal = () => {
    setFormData({
      shipmentId: generateShipmentId(),
      dispatchId: '',
      customer: '',
      destination: '',
    });
    setIsModalOpen(true);
  };

  const documentTypes = [
    { name: 'Commercial Invoice', key: 'commercialInvoice' },
    { name: 'Packing List', key: 'packingList' },
    { name: 'Certificate of Origin', key: 'certificateOfOrigin' },
    { name: 'Inspection Certificate', key: 'inspectionCert' },
    { name: 'Bill of Lading', key: 'billOfLading' },
    { name: 'Customs Documents', key: 'customsDocs' },
  ];

  const handleCreateShipment = async () => {
    if (!formData.customer || !formData.destination) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await createMutation.mutateAsync({
        ...formData,
        documents: {
          commercialInvoice: 'Pending',
          packingList: 'Pending',
          certificateOfOrigin: 'Pending',
          inspectionCert: 'Pending',
          billOfLading: 'Pending',
          customsDocs: 'Pending',
        },
        status: 'In Progress'
      });
      setIsModalOpen(false);
    } catch (error) {
      // Mutation handles toast
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !uploadState) return;

    const { shipmentId, id, docKey } = uploadState;
    const toastId = toast.loading('Uploading document...');

    try {
      await updateStatusMutation.mutateAsync({ shipmentId, id, docKey, file });
      toast.success('Document uploaded successfully', { id: toastId });
    } catch (error) {
      toast.error('Upload failed. Please try again.', { id: toastId });
    } finally {
      setUploadState(null);
      event.target.value = '';
    }
  };

  const triggerUpload = (shipmentId: string, id: string, docKey: string) => {
    setUploadState({ shipmentId, id, docKey });
    document.getElementById('hidden-file-input')?.click();
  };

  const handleDocDelete = async (id: string, docKey: string, shipmentId: string) => {
    toast.info('Document deletion will be available in next update');
  };

  const handleDelete = async () => {
    if (shipmentToDelete) {
      try {
        await deleteMutation.mutateAsync(shipmentToDelete.toString());
        setIsDeleteConfirmOpen(false);
        setShipmentToDelete(null);
        if (selectedRecord?.id === shipmentToDelete) {
          setSelectedRecord(null);
        }
      } catch (error) {
        // Mutation handles toast
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-[#974926]" />
          <p className="text-gray-500 font-medium">Loading export records...</p>
        </div>
      </div>
    );
  }


  const pendingDocsCount = exportDocs.reduce((acc: number, curr: any) => {
    const pendingInShipment = Object.values(curr.documents).filter(status => typeof status === 'string' && !status.startsWith('/uploads/')).length;
    return acc + pendingInShipment;
  }, 0);

  const completedShipments = exportDocs.filter((s: any) => s.status === 'Completed').length;

  return (
    <div>
      <PageHeader
        title="Export Documentation"
        description="Manage shipping documents and export certificates"
        action={{
          label: 'New Shipment Ready',
          icon: Plus,
          onClick: openNewShipmentModal,
        }}
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card className="p-4 bg-white border border-gray-200">
          <p className="text-sm text-gray-600">Active Shipments</p>
          <p className="text-2xl font-semibold mt-1">{exportDocs.length}</p>
        </Card>
        <Card className="p-4 bg-white border border-gray-200">
          <p className="text-sm text-gray-600">Pending Documents</p>
          <p className="text-2xl font-semibold mt-1">{pendingDocsCount}</p>
        </Card>
        <Card className="p-4 bg-white border border-gray-200">
          <p className="text-sm text-gray-600">Completed Shipments</p>
          <p className="text-2xl font-semibold mt-1">{completedShipments}</p>
        </Card>
        <Card className="p-4 bg-white border border-gray-200">
          <p className="text-sm text-gray-600">Compliance Rate</p>
          <p className="text-2xl font-semibold mt-1">99.2%</p>
        </Card>
      </div>

      {exportDocs.map((shipment: any) => (
        <Card
          key={shipment.id}
          className="bg-white border border-gray-200 mb-6 cursor-pointer hover:border-[#974926] transition-all overflow-hidden"
          onClick={() => setSelectedRecord(shipment)}
        >
          <div className="p-5 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-900">{shipment.shipmentId}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {dispatchRecords.find(d => d.dispatchId === shipment.dispatchId)?.supplierName || shipment.customer} • Destination: {shipment.destination}
                  {shipment.dispatchId && (
                    <span className="ml-2 px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium border border-blue-100">
                      Batch: {dispatchRecords.find(d => d.dispatchId === shipment.dispatchId)?.batchId || 'N/A'}
                    </span>
                  )}
                </p>
              </div>
              <StatusBadge status={shipment.status} />
            </div>
          </div>

          <div className="p-5">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documentTypes.map((docType) => {
                  const docStatus = shipment.documents[docType.key as keyof typeof shipment.documents];
                  return (
                    <TableRow key={docType.key}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          {docType.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={docStatus} />
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {docStatus && docStatus.startsWith('/uploads/') ? 'v1.2' : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {docStatus && docStatus.startsWith('/uploads/') ? (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(`http://localhost:5001${docStatus}`, '_blank');
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const link = document.createElement('a');
                                  link.href = `http://localhost:5001${docStatus}`;
                                  link.download = docStatus.split('/').pop() || 'document';
                                  link.click();
                                }}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDocDelete(shipment.id, docType.key, shipment.shipmentId);
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                triggerUpload(shipment.shipmentId, shipment.id, docType.key);
                              }}
                            >
                              <Upload className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" onClick={() => toast.success('Bulk upload initiated')}>
                <Upload className="h-4 w-4 mr-2" />
                Bulk Upload
              </Button>
              <Button variant="outline" size="sm" onClick={() => toast.success('Generation initiated')}>
                <FileText className="h-4 w-4 mr-2" />
                Generate All
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="ml-auto"
                onClick={() => toast.success('Shipment marked completed')}
                disabled={Object.values(shipment.documents).some(s => typeof s === 'string' && !s.startsWith('/uploads/'))}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Shipment Complete
              </Button>
            </div>
          </div>
        </Card>
      ))}

      {/* Detail Panel */}
      {selectedRecord && (
        <div className="fixed inset-y-0 right-0 w-[500px] bg-[#1a1a1a] text-white shadow-2xl z-50 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <h2 className="font-semibold">{selectedRecord.shipmentId}</h2>
              <button
                className="text-gray-400 hover:text-white"
                onClick={() => navigate(`/export-documentation/${selectedRecord.shipmentId}`)}
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
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Compliance Status</p>
              <StatusBadge status={selectedRecord.status} />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Client</p>
                <p className="font-medium text-lg">{selectedRecord.customer}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Destination</p>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-blue-400" />
                  <p className="font-medium">{selectedRecord.destination}</p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-700">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Document Readiness</p>
              <div className="space-y-3">
                {Object.entries(selectedRecord.documents).map(([key, status]) => (
                  <div key={key} className="flex items-center justify-between p-2 bg-gray-800/50 rounded border border-gray-700">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    </div>
                    <StatusBadge status={status as string} />
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-gray-700">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Actions</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 bg-transparent border-gray-600 text-white hover:bg-gray-800" onClick={() => toast.success('Certifying all documents')}>
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Certify All
                </Button>
                <Button variant="outline" size="sm" className="flex-1 bg-transparent border-gray-600 text-white hover:bg-gray-800" onClick={() => toast.success('Exporting files to Zip')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Zip
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2 bg-transparent border-gray-600 text-white hover:bg-gray-800"
                onClick={() => toast.success('Opening upload dialog')}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Additional Doc
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="w-full mt-2"
                onClick={() => {
                  setShipmentToDelete(selectedRecord.id);
                  setIsDeleteConfirmOpen(true);
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Delete Shipment
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Export Shipment Documentation</DialogTitle>
            <DialogDescription>Initialize documentation tracking for a new shipment</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="shipment-id">Shipment ID (System Generated)</Label>
              <Input
                id="shipment-id"
                value={formData.shipmentId}
                readOnly
                className="bg-gray-50 flex-1 font-mono"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dispatch-link">Link to Dispatch Record</Label>
              <Select
                onValueChange={(v) => {
                  const dispatch = dispatchRecords.find(d => d.dispatchId === v);
                  if (dispatch) {
                    setFormData({
                      ...formData,
                      dispatchId: v,
                      customer: dispatch.supplierName || '',
                      destination: dispatch.destination || ''
                    });
                  }
                }}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select a dispatch record..." />
                </SelectTrigger>
                <SelectContent>
                  {dispatchRecords.map(d => (
                    <SelectItem key={d.id} value={d.dispatchId}>
                      {d.dispatchId} ({d.supplierName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* <div className="grid gap-2">
              <Label htmlFor="customer">Client</Label>
              <Input
                id="customer"
                placeholder="Enter client name..."
                value={formData.customer}
                onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
              />
            </div> */}
            <div className="grid gap-2">
              <Label htmlFor="destination">Destination</Label>
              <Input
                id="destination"
                placeholder="Enter destination country/port..."
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateShipment}>Initialize Docs</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this shipment record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <input
        type="file"
        id="hidden-file-input"
        className="hidden"
        onChange={handleFileUpload}
      />
    </div>
  );
}
