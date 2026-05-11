import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, FileText, Package, Truck, User, Calendar, MapPin, Scale, CheckCircle, Pencil, X, TrendingUp, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { StatusBadge } from '../components/common/StatusBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { useYardIntakeQuery, useUpdateYardIntake, useCreateYardIntake, MaterialWeight } from '../hooks/useYardIntake';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

const printStyles = `
  @media print {
    .print-hidden {
      display: none !important;
    }
    .print-only {
      display: block !important;
    }
    body {
      background: white !important;
      color: black !important;
      font-size: 12pt;
    }
    .main-content {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
    }
    .card {
      border: 1px solid #ddd !important;
      box-shadow: none !important;
      break-inside: avoid;
      margin-bottom: 20px !important;
      padding: 15px !important;
    }
    .grid {
      display: block !important;
    }
    .col-span-2, .col-span-1 {
      width: 100% !important;
    }
    button, .btn, [role="combobox"], [role="button"] {
      display: none !important;
    }
    .bg-gray-50, .bg-[#f5f0ed], .bg-[#f5f5f5] {
      background-color: #f9f9f9 !important;
      border: 1px solid #eee !important;
    }
    .text-[#974926] {
      color: #000 !important;
    }
  }
  .print-only {
    display: none;
  }
`;

export function YardIntakeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Queries
  const { data: yardIntake = [], isLoading: isFetching } = useYardIntakeQuery();
  const createMutation = useCreateYardIntake();
  const updateMutation = useUpdateYardIntake();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Find record
  const existingRecord = yardIntake.find((r: any) => r.grnNumber === id || r.id === id);

  const [formData, setFormData] = useState({
    supplier: '',
    vehicleNumber: '',
    mineralType: [] as MaterialWeight[],
    grossWeight: 0,
    tareWeight: 0,
    status: 'Completed'
  });

  // Effect to sync form data when record is loaded
  useEffect(() => {
    if (existingRecord) {
      const materials = existingRecord.materialType || existingRecord.mineralType;
      setFormData({
        supplier: existingRecord.supplierName || existingRecord.supplier || '',
        vehicleNumber: existingRecord.vehicleNumber || '',
        mineralType: Array.isArray(materials) 
          ? materials.map((m: any) => typeof m === 'string' ? { name: m, grossWeight: 0, tareWeight: 0, netWeight: 0 } : m)
          : [],
        grossWeight: existingRecord.grossWeight || 0,
        tareWeight: existingRecord.tareWeight || 0,
        status: existingRecord.status || 'Completed'
      });
    }
  }, [existingRecord]);

  if (isFetching) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-[#974926]" />
          <p className="text-gray-500 font-medium">Loading receipt details...</p>
        </div>
      </div>
    );
  }

  if (!isFetching && !existingRecord) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold text-gray-900">Record Not Found</h2>
        <p className="text-gray-500 mt-2">The requested GRN does not exist or has been removed.</p>
        <Button className="mt-4" onClick={() => navigate('/yard-intake')}>
          Back to Yard Intake
        </Button>
      </div>
    );
  }


  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const record = existingRecord;
    if (!record) return;
    const headers = ['Field', 'Value'];
    const materials = record.materialType || record.mineralType || '';
    const rows = [
      ['GRN #', record.grnNumber],
      ['Company', record.supplier],
      ['Vehicle', record.vehicleNumber],
      ['Material', Array.isArray(materials) ? materials.map((m: any) => typeof m === 'string' ? m : m.name).join('; ') : materials],
      ['Net Weight', record.netWeight],
      ['Status', record.status],
      ['Date', record.date || '']
    ];
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GRN_${record.grnNumber}.csv`;
    link.click();
    toast.success('GRN exported to CSV');
  };

  const handleDuplicate = async () => {
    const record = existingRecord;
    if (!record) return;
    try {
      const response = await createMutation.mutateAsync({
        ...record,
        grnNumber: `GRN-${Math.floor(100000 + Math.random() * 900000)}`,
        date: new Date().toISOString(),
      });
      navigate(`/yard-intake/${response.grnNumber}`);
    } catch (error) {
      // Mutation handles toast
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    const record = existingRecord;
    if (record) {
      try {
        await updateMutation.mutateAsync({
          id: record.id,
          data: { status: newStatus as any }
        });
      } catch (error) {
        // Mutation handles toast
      }
    }
  };

  const handleSaveChanges = async () => {
    const record = existingRecord;
    if (record) {
      try {
        await updateMutation.mutateAsync({
          id: record.id,
          data: {
            supplierName: formData.supplier,
            vehicleNumber: formData.vehicleNumber,
            materialType: formData.mineralType,
            status: formData.status as any
          }
        });
        setIsEditModalOpen(false);
      } catch (error) {
        // Mutation handles toast
      }
    }
  };

  const calculateTotalWeights = (minerals: any[]) => {
    const gross = minerals.reduce((sum, m) => sum + (parseFloat(m.grossWeight) || 0), 0);
    const tare = minerals.reduce((sum, m) => sum + (parseFloat(m.tareWeight) || 0), 0);
    return { gross, tare, net: gross - tare };
  };

  const updateMaterialWeight = (index: number, field: 'grossWeight' | 'tareWeight', value: number) => {
    const newMinerals = [...formData.mineralType];
    newMinerals[index] = { 
      ...newMinerals[index], 
      [field]: value,
      netWeight: field === 'grossWeight' ? value - newMinerals[index].tareWeight : newMinerals[index].grossWeight - value
    };
    
    const totals = calculateTotalWeights(newMinerals);
    setFormData({ 
      ...formData, 
      mineralType: newMinerals,
      grossWeight: totals.gross,
      tareWeight: totals.tare
    });
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const recordMaterials = existingRecord ? (existingRecord.materialType || existingRecord.mineralType) : null;
  const intakeData = existingRecord ? {
    grnNumber: existingRecord.grnNumber,
    date: formatDate(existingRecord.date),
    time: (existingRecord.date && existingRecord.date.includes('T')) ? new Date(existingRecord.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A',
    supplier: existingRecord.supplier,
    supplierCode: 'N/A',
    supplierContact: 'N/A',
    supplierEmail: 'N/A',
    material: Array.isArray(recordMaterials) 
      ? recordMaterials.map((m: any) => typeof m === 'string' ? m : m.name).join(', ') 
      : (recordMaterials || 'N/A'),
    grade: 'N/A',
    vehicleNumber: existingRecord.vehicleNumber,
    driverName: 'N/A',
    driverPhone: 'N/A',
    grossWeight: existingRecord.netWeight + 6500,
    tareWeight: 6500,
    netWeight: existingRecord.netWeight,
    moisture: 'N/A',
    status: existingRecord.status,
    receivedBy: 'System',
    approvedBy: 'N/A',
    storageLocation: 'N/A',
    lotNumber: 'N/A',
    remarks: 'N/A',
    documents: [],
  } : {
    grnNumber: id || 'N/A',
    date: new Date().toLocaleDateString(),
    time: 'N/A',
    supplier: 'Record Not Found',
    supplierCode: 'N/A',
    supplierContact: 'N/A',
    supplierEmail: 'N/A',
    material: 'N/A',
    grade: 'N/A',
    vehicleNumber: 'N/A',
    driverName: 'N/A',
    driverPhone: 'N/A',
    grossWeight: 0,
    tareWeight: 0,
    netWeight: 0,
    moisture: 'N/A',
    status: 'Pending',
    receivedBy: 'N/A',
    approvedBy: 'N/A',
    storageLocation: 'N/A',
    lotNumber: 'N/A',
    remarks: 'No record data available.',
    documents: [] as any[],
  };

  return (
    <div className="p-6 space-y-6 main-content">
      <style>{printStyles}</style>

      {/* Print Only Header */}
      <div className="print-only mb-8 border-b-2 border-gray-900 pb-4">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">GOODS RECEIPT NOTE</h1>
            <p className="text-gray-600">GME Interchange Operations</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-xl">{intakeData.grnNumber}</p>
            <p className="text-sm text-gray-500">Date: {intakeData.date}</p>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between print-hidden">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/yard-intake')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Yard Intake
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{intakeData.grnNumber}</h1>
            <p className="text-sm text-gray-500 mt-1">Goods Receipt Note Details</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={intakeData.status} onValueChange={handleUpdateStatus}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Paid">Paid</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Refunded">Refunded</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <FileText className="h-4 w-4 mr-2" />
            Print GRN
          </Button>
          <Button size="sm" className="bg-[#974926] hover:bg-[#7d3c1f]" onClick={() => setIsEditModalOpen(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit Details
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left Column - Main Details */}
        <div className="col-span-2 space-y-6">
          {/* Basic Information */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-[#974926]" />
              Material Information
            </h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead className="text-xs">Material</TableHead>
                    <TableHead className="text-xs text-right">Gross (kg)</TableHead>
                    <TableHead className="text-xs text-right">Tare (kg)</TableHead>
                    <TableHead className="text-xs text-right">Net (kg)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.isArray(recordMaterials) ? (
                    recordMaterials.map((m: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell className="py-2 text-sm">{typeof m === 'string' ? m : m.name}</TableCell>
                        <TableCell className="py-2 text-sm text-right">{typeof m === 'string' ? '-' : m.grossWeight.toLocaleString()}</TableCell>
                        <TableCell className="py-2 text-sm text-right">{typeof m === 'string' ? '-' : m.tareWeight.toLocaleString()}</TableCell>
                        <TableCell className="py-2 text-sm text-right font-medium">{typeof m === 'string' ? '-' : m.netWeight.toLocaleString()}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                        {intakeData.material || 'N/A'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6 border-t pt-4">
              <div>
                <p className="text-sm text-gray-500">Lot Number</p>
                <p className="font-medium text-[#974926] mt-1">{intakeData.lotNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Storage Location</p>
                <p className="font-medium text-gray-900 mt-1">{intakeData.storageLocation}</p>
              </div>
            </div>
          </Card>

          {/* Weight Details */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Scale className="h-5 w-5 text-[#974926]" />
              Weight Measurements
            </h3>
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Gross Weight</p>
                <p className="text-2xl font-semibold text-gray-900 mt-2">{intakeData.grossWeight.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">kg</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Tare Weight</p>
                <p className="text-2xl font-semibold text-gray-900 mt-2">{intakeData.tareWeight.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">kg</p>
              </div>
              <div className="text-center p-4 bg-[#f5f0ed] rounded-lg border border-[#974926]/20">
                <p className="text-sm text-[#974926]">Net Weight</p>
                <p className="text-2xl font-semibold text-[#974926] mt-2">{intakeData.netWeight.toLocaleString()}</p>
                <p className="text-xs text-[#974926]/70 mt-1">kg</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Moisture Content</span>
                <span className="font-medium text-gray-900">{intakeData.moisture}</span>
              </div>
            </div>
          </Card>

          {/* Transport Details */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Truck className="h-5 w-5 text-[#974926]" />
              Transport Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Vehicle Number</p>
                <p className="font-medium text-gray-900 mt-1">{intakeData.vehicleNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Driver Name</p>
                <p className="font-medium text-gray-900 mt-1">{intakeData.driverName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Driver Contact</p>
                <p className="font-medium text-gray-900 mt-1">{intakeData.driverPhone}</p>
              </div>
            </div>
          </Card>

          {/* Documents */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#974926]" />
              Attached Documents
            </h3>
            <div className="space-y-4">
              {intakeData.documents.length > 0 ? intakeData.documents.map((doc, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-red-100 rounded flex items-center justify-center">
                      <FileText className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{doc.name}</p>
                      <p className="text-xs text-gray-500">{doc.type} • {doc.size}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">View</Button>
                </div>
              )) : (
                <p className="text-sm text-gray-500 italic">No documents attached.</p>
              )}
            </div>
          </Card>

          {/* Remarks */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Remarks & Notes</h3>
            <p className="text-sm text-gray-700 leading-relaxed">{intakeData.remarks}</p>
          </Card>
        </div>

        {/* Right Column - Summary */}
        <div className="space-y-6">
          {/* Timeline */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#974926]" />
              Receipt Timeline
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Receipt Date</p>
                <p className="font-medium text-gray-900 mt-1">{intakeData.date}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Receipt Time</p>
                <p className="font-medium text-gray-900 mt-1">{intakeData.time}</p>
              </div>
            </div>
          </Card>

          {/* Supplier Info */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-[#974926]" />
              Supplier Details
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Company Name</p>
                <p className="font-medium text-gray-900 mt-1">{intakeData.supplier}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Supplier Code</p>
                <p className="font-medium text-[#974926] mt-1">{intakeData.supplierCode}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Contact Number</p>
                <p className="font-medium text-gray-900 mt-1">{intakeData.supplierContact}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900 mt-1 text-xs break-all">{intakeData.supplierEmail}</p>
              </div>
            </div>
          </Card>

          {/* Approval Info */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-[#974926]" />
              Approval Details
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Received By</p>
                <p className="font-medium text-gray-900 mt-1">{intakeData.receivedBy}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Approved By</p>
                <p className="font-medium text-gray-900 mt-1">{intakeData.approvedBy}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <div className="mt-1">
                  <StatusBadge status={intakeData.status} />
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6 print-hidden">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={handleDuplicate}
              >
                <Package className="h-4 w-4 mr-2" />
                Duplicate Entry
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={handleExport}
              >
                <FileText className="h-4 w-4 mr-2" />
                Export to CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => navigate('/crushing-processing', {
                  state: {
                    rawMaterial: Array.isArray(intakeData.material) ? intakeData.material[0] : intakeData.material,
                    quantity: intakeData.netWeight,
                    materials: Array.isArray(intakeData.material) ? intakeData.material : [intakeData.material]
                  }
                })}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Move to Processing
              </Button>
            </div>
          </Card>
        </div>
      </div>
      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Intake Details</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2">
              <Label>Company Name</Label>
              <Input
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              />
            </div>
            <div>
              <Label>Vehicle Number</Label>
              <Input
                value={formData.vehicleNumber}
                onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <Label className="mb-2 block">Materials & Weights</Label>
              <div className="border rounded-md overflow-hidden bg-gray-50/50 mb-3">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-100/50 hover:bg-gray-100/50 h-8">
                      <TableHead className="text-xs h-8">Material</TableHead>
                      <TableHead className="text-xs h-8 w-24">Gross (kg)</TableHead>
                      <TableHead className="text-xs h-8 w-24">Tare (kg)</TableHead>
                      <TableHead className="text-xs h-8 w-24">Net (kg)</TableHead>
                      <TableHead className="text-xs h-8 w-8"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.mineralType.map((m, idx) => (
                      <TableRow key={idx} className="h-10">
                        <TableCell className="py-1 text-sm font-medium">{m.name}</TableCell>
                        <TableCell className="py-1">
                          <Input 
                            type="number" 
                            className="h-7 text-xs px-2"
                            value={m.grossWeight || ''}
                            onChange={(e) => updateMaterialWeight(idx, 'grossWeight', parseFloat(e.target.value) || 0)}
                          />
                        </TableCell>
                        <TableCell className="py-1">
                          <Input 
                            type="number" 
                            className="h-7 text-xs px-2"
                            value={m.tareWeight || ''}
                            onChange={(e) => updateMaterialWeight(idx, 'tareWeight', parseFloat(e.target.value) || 0)}
                          />
                        </TableCell>
                        <TableCell className="py-1 text-xs font-semibold">
                          {(m.grossWeight - m.tareWeight).toLocaleString()}
                        </TableCell>
                        <TableCell className="py-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-red-400 hover:text-red-600"
                            onClick={() => {
                              const newMinerals = formData.mineralType.filter((_, i) => i !== idx);
                              const totals = calculateTotalWeights(newMinerals);
                              setFormData({ ...formData, mineralType: newMinerals, grossWeight: totals.gross, tareWeight: totals.tare });
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Select
                onValueChange={(v) => {
                  if (!formData.mineralType.find(m => m.name === v)) {
                    setFormData({ ...formData, mineralType: [...formData.mineralType, { name: v, grossWeight: 0, tareWeight: 0, netWeight: 0 }] });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Add material" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Iron Ore Fines">Iron Ore Fines</SelectItem>
                  <SelectItem value="Quartz">Quartz</SelectItem>
                  <SelectItem value="Feldspar">Feldspar</SelectItem>
                  <SelectItem value="Bauxite">Bauxite</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Total Gross Weight</Label>
                <p className="text-lg font-semibold text-gray-900">{formData.grossWeight.toLocaleString()} <span className="text-xs font-normal text-gray-500">kg</span></p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Total Tare Weight</Label>
                <p className="text-lg font-semibold text-gray-900">{formData.tareWeight.toLocaleString()} <span className="text-xs font-normal text-gray-500">kg</span></p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-[#974926]">Total Net Weight</Label>
                <p className="text-lg font-bold text-[#974926]">{(formData.grossWeight - formData.tareWeight).toLocaleString()} <span className="text-xs font-normal opacity-70">kg</span></p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button className="bg-[#974926] hover:bg-[#7d3c1f] text-white" onClick={handleSaveChanges}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
