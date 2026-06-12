import { useState } from 'react';
import { useNavigate } from 'react-router';
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Plus, Search, Download, Filter, X, ExternalLink, Package, TrendingUp, TrendingDown, Clock, Eye, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Combobox } from '../components/ui/combobox';

import { useYardIntakeQuery, useCreateYardIntake, useUpdateYardIntake, useDeleteYardIntake, MaterialWeight } from '../hooks/useYardIntake';
import { useSettingsQuery, useUpdateSettings } from '../hooks/useSettings';
import { useClientsQuery, useCreateClient } from '../hooks/useClients';
import { useWeighbridgeQuery } from '../hooks/useWeighbridge';
import { Loader2 } from 'lucide-react';

export function YardIntake() {
  const navigate = useNavigate();

  // Queries
  const { data: yardIntake = [], isLoading: isLoadingIntake } = useYardIntakeQuery();
  const { data: companySettings, isLoading: isLoadingSettings } = useSettingsQuery();
  const { data: clients = [], isLoading: isLoadingClients } = useClientsQuery();
  const { data: weighbridgeRecords = [] } = useWeighbridgeQuery();

  const weighbridgeInbound = weighbridgeRecords.filter(r => r.type === 'Inbound');
  const weighbridgeOutbound = weighbridgeRecords.filter(r => r.type === 'Outbound');

  // Mutations
  const addYardIntakeMutation = useCreateYardIntake();
  const updateYardIntakeMutation = useUpdateYardIntake();
  const deleteYardIntakeMutation = useDeleteYardIntake();
  const updateSettingsMutation = useUpdateSettings();
  const addClientMutation = useCreateClient();

  const isLoading = isLoadingIntake || isLoadingSettings || isLoadingClients;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    supplier: '',
    vehicleNumber: '',
    mineralType: [] as MaterialWeight[],
    grossWeight: 0,
    tareWeight: 0,
    avatar: '',
  });

  // Modal State for New Material
  const [isAddMaterialModalOpen, setIsAddMaterialModalOpen] = useState(false);
  const [newMaterialName, setNewMaterialName] = useState('');

  const handleRowClick = (record: any) => {
    setSelectedRecord(record);
  };

  const closePanel = () => {
    setSelectedRecord(null);
  };

  const toggleSelectItem = (id: string) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleEdit = (record: any) => {
    setFormData({
      supplier: record.supplier || record.supplierName,
      vehicleNumber: record.vehicleNumber,
      mineralType: Array.isArray(record.materialType || record.mineralType) 
        ? (record.materialType || record.mineralType).map((m: any) => typeof m === 'string' ? { name: m, grossWeight: 0, tareWeight: 0, netWeight: 0 } : m)
        : [],
      grossWeight: record.grossWeight || 0,
      tareWeight: record.tareWeight || 0,
      avatar: record.avatar || ''
    });
    setEditingId(record.id);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (recordToDelete) {
      try {
        await deleteYardIntakeMutation.mutateAsync(recordToDelete);
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

  const handleCreateGRN = async () => {
    if (!formData.supplier || !formData.vehicleNumber || !formData.mineralType) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      if (isEditMode && editingId) {
        await updateYardIntakeMutation.mutateAsync({
          id: editingId,
          data: {
            supplier: formData.supplier,
            vehicleNumber: formData.vehicleNumber,
            mineralType: formData.mineralType,
            grossWeight: formData.grossWeight,
            tareWeight: formData.tareWeight,
            netWeight: formData.grossWeight - formData.tareWeight,
          }
        });
      } else {
        const newRecord = {
          grnNumber: `GRN-${Math.floor(100000 + Math.random() * 900000)}`,
          supplierName: formData.supplier,
          vehicleNumber: formData.vehicleNumber,
          materialType: formData.mineralType,
          grossWeight: formData.grossWeight,
          tareWeight: formData.tareWeight,
          netWeight: formData.grossWeight - formData.tareWeight,
          status: 'Pending',
        };
        await addYardIntakeMutation.mutateAsync(newRecord);
      }

      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      // Mutation handles toast
    }
  };

  const resetForm = () => {
    setFormData({ supplier: '', vehicleNumber: '', mineralType: [], grossWeight: 0, tareWeight: 0, avatar: '' });
    setIsEditMode(false);
    setEditingId(null);
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

  const handleExport = (ids?: string[]) => {
    const dataToExport = ids && ids.length > 0
      ? yardIntake.filter(item => ids.includes(item.id))
      : yardIntake;

    if (dataToExport.length === 0) {
      toast.error('No records to export');
      return;
    }

    const headers = ['GRN #', 'Company', 'Vehicle', 'Material', 'Net Weight (kg)', 'Date', 'Status'];
    const csvContent = [
      headers.join(','),
      ...dataToExport.map(item => {
        const materials = item.materialType || item.mineralType;
        const row = [
          item.grnNumber,
          item.supplier,
          item.vehicleNumber,
          Array.isArray(materials) 
            ? materials.map((m: any) => typeof m === 'string' ? m : m.name).join('; ') 
            : (materials || ''),
          item.netWeight,
          item.date,
          item.status
        ];
        return row.map(val => `"${val}"`).join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `yard_intake_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${dataToExport.length} records to CSV`);
  };

  const handlePrint = (record: any) => {
    // Basic print for record
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>GRN ${record.grnNumber}</title>
            <style>
              body { font-family: sans-serif; padding: 40px; }
              .header { border-bottom: 2px solid #333; margin-bottom: 20px; padding-bottom: 20px; display: flex; justify-content: space-between; }
              .section { margin-bottom: 20px; }
              .label { color: #666; font-size: 12px; text-transform: uppercase; }
              .value { font-size: 16px; font-weight: bold; margin-top: 4px; }
              .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div>
                <h1>GOODS RECEIPT NOTE</h1>
                <p>GME Interchange Operations</p>
              </div>
              <div style="text-align: right">
                <h2>#${record.grnNumber}</h2>
                <p>Date: ${record.date}</p>
              </div>
            </div>
            <div class="section">
              <div class="label">Company</div>
              <div class="value">${record.supplier}</div>
            </div>
            <div class="grid">
              <div class="section">
                <div class="label">Vehicle</div>
                <div class="value">${record.vehicleNumber}</div>
              </div>
              <div class="section">
                <div class="label">Material</div>
                <div class="value">${Array.isArray(record.materialType || record.mineralType) 
                  ? (record.materialType || record.mineralType).map((m: any) => typeof m === 'string' ? m : m.name).join(', ') 
                  : (record.materialType || record.mineralType || '')}</div>
              </div>
            </div>
            <div class="section" style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
              <div class="label">Net Weight</div>
              <div class="value" style="font-size: 24px;">${record.netWeight.toLocaleString()} kg</div>
            </div>
            <script>window.onload = () => { window.print(); window.close(); }</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleDuplicate = async (record: any) => {
    try {
      const newRecord = {
        ...record,
        grnNumber: `GRN-${Math.floor(100000 + Math.random() * 900000)}`,
      };
      delete (newRecord as any).id;
      await addYardIntakeMutation.mutateAsync(newRecord);
    } catch (error) {
      // Mutation handles toast
    }
  };

  const supplierOptions = (clients || [])
    .map((c: any) => ({ label: c.name, value: c.name }));

  const vehicleOptions = Array.from(new Set([
    ...(companySettings?.vehicles || []),
    ...(yardIntake || []).map(r => r.vehicleNumber),
    ...(weighbridgeInbound || []).map(r => r.vehicleNo),
    ...(weighbridgeOutbound || []).map(r => r.vehicleNo)
  ])).filter(Boolean).sort().map(v => ({ label: v!, value: v! }));

  const handleAddSupplier = async (name: string) => {
    try {
      await addClientMutation.mutateAsync({
        name,
        address: 'New Supplier',
        tin: 'N/A',
        phone: 'N/A',
        email: 'N/A',
        status: 'Onboarding',
        primaryContact: 'N/A',
        industry: 'Mining',
        type: 'Supplier'
      });
      setFormData(prev => ({ ...prev, supplier: name }));
    } catch (error) {
      // Mutation handles toast
    }
  };

  const handleAddMaterial = () => {
    setNewMaterialName('');
    setIsAddMaterialModalOpen(true);
  };

  const confirmAddMaterial = async () => {
    if (!newMaterialName.trim()) {
      toast.error('Please enter a material name');
      return;
    }

    const materialTypes = companySettings?.materialTypes || [];
    const normalizedNewMaterial = newMaterialName.trim();

    if (materialTypes.includes(normalizedNewMaterial)) {
      toast.error('This material type already exists');
      return;
    }

    try {
      await updateSettingsMutation.mutateAsync({
        materialTypes: [...materialTypes, normalizedNewMaterial]
      });
      
      setFormData(prev => ({ 
        ...prev, 
        mineralType: [...prev.mineralType, { name: normalizedNewMaterial, grossWeight: 0, tareWeight: 0, netWeight: 0 }] 
      }));
      
      setIsAddMaterialModalOpen(false);
      setNewMaterialName('');
      toast.success(`Material "${normalizedNewMaterial}" added successfully`);
    } catch (error) {
      // Mutation handles toast
    }
  };

  return (
    <div className="flex h-full gap-6">
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Yard Intake</h1>
            <p className="text-sm text-gray-500 mt-1">Manage material receipts and GRN records</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={() => handleExport()}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              size="sm"
              className="bg-[#0D0D0D] hover:bg-[#1A1A1A]"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Receipt
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4">
          <Button variant="outline" size="sm" className="rounded-full">
            Type
            <span className="ml-1 text-xs">▼</span>
          </Button>
          <Button variant="outline" size="sm" className="rounded-full">
            Status
            <span className="ml-1 text-xs">▼</span>
          </Button>
          <Button variant="outline" size="sm" className="rounded-full">
            Date
            <span className="ml-1 text-xs">▼</span>
          </Button>
          <Button variant="outline" size="sm" className="rounded-full">
            All filters
            <span className="ml-1 text-xs">▼</span>
          </Button>
        </div>

        {/* Table */}
        <Card className="flex-1 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-white border-b hover:bg-white">
                <TableHead className="w-12">
                  <input type="checkbox" className="rounded border-gray-300" />
                </TableHead>
                <TableHead className="text-gray-600 font-medium">GRN #</TableHead>
                <TableHead className="text-gray-600 font-medium">Company</TableHead>
                <TableHead className="text-gray-600 font-medium">Vehicle</TableHead>
                <TableHead className="text-gray-600 font-medium">Status</TableHead>
                <TableHead className="text-gray-600 font-medium">Material</TableHead>
                <TableHead className="text-gray-600 font-medium">Net Weight</TableHead>
                <TableHead className="text-gray-600 font-medium">Date</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(yardIntake || []).map((record) => (
                <TableRow
                  key={record.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleRowClick(record)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      checked={selectedItems.includes(record.id)}
                      onChange={() => toggleSelectItem(record.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium text-gray-900">
                    #{record.grnNumber}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
                        {record.avatar}
                      </div>
                      <span className="text-gray-900">{record.supplier}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-900">{record.vehicleNumber}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1 text-sm ${record.status === 'Paid' ? 'text-green-600' :
                      record.status === 'Refunded' ? 'text-orange-600' : 'text-gray-600'
                      }`}>
                      {record.status === 'Paid' && '✓'}
                      {record.status === 'Refunded' && '↻'}
                      {record.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded bg-gray-100 flex items-center justify-center">
                        <Package className="h-4 w-4 text-gray-600" />
                      </div>
                      <span className="text-gray-900 text-sm">
                        {(() => {
                          const materials = record.materialType || record.mineralType;
                          return Array.isArray(materials) 
                            ? materials.map((m: any) => typeof m === 'string' ? m : m.name).join(', ') 
                            : (materials || 'N/A');
                        })()}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-gray-900">
                    {record.netWeight.toLocaleString()} kg
                  </TableCell>
                  <TableCell className="text-gray-600">{record.date}</TableCell>
                  <TableCell>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRowClick(record)}
                      >
                        <Eye className="h-4 w-4 text-gray-400" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(record)}
                      >
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
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* Selection Actions */}
        {selectedItems.length > 0 && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-[#0D0D0D] text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-4">
            <button onClick={() => setSelectedItems([])}>
              <X className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium">Selected: {selectedItems.length}</span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="bg-white text-[#0D0D0D] hover:bg-gray-100"
                onClick={() => handleExport(selectedItems)}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button size="sm" variant="outline" className="bg-white text-[#0D0D0D] hover:bg-gray-100">
                Print
              </Button>
              <Button size="sm" variant="outline" className="bg-white text-[#0D0D0D] hover:bg-gray-100">
                Duplicate
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar - Stats */}
      <div className="w-80 flex-shrink-0 space-y-6">
        {/* Receipt Stats */}
        <Card className="p-6">
          <div className="text-center mb-6">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-4">Receipt of Goods</p>
            <div className="relative inline-flex">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#e5e7eb"
                  strokeWidth="12"
                  fill="none"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#0D0D0D"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${((yardIntake || []).length / 100) * 352} 352`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-2xl font-bold">{((yardIntake || []).length * 2.2).toFixed(1)}m</p>
                <p className="text-xs text-gray-500">{(yardIntake || []).length} total</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Status */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Orders Status</h3>
            <button className="text-sm text-gray-500">Active ▼</button>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-700">Paid</span>
              </div>
              <span className="text-sm font-medium">89%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '89%' }}></div>
            </div>
          </div>
        </Card>
      </div>

      {/* Detail Panel */}
      {selectedRecord && (
        <div className="fixed inset-y-0 right-0 w-[500px] bg-[#1a1a1a] text-white shadow-2xl z-50 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <h2 className="font-semibold">GRN #{selectedRecord.grnNumber}</h2>
              <button
                className="text-gray-400 hover:text-white"
                onClick={() => navigate(`/yard-intake/${selectedRecord.grnNumber}`)}
              >
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>
            <button onClick={closePanel} className="text-gray-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Supplier Info */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="h-4 w-4 rounded-full bg-gray-600 flex items-center justify-center text-xs">
                  {selectedRecord.avatar}
                </div>
                <p className="font-medium">{selectedRecord.supplier}</p>
              </div>
              <p className="text-sm text-gray-400">contact@supplier.com</p>
            </div>

            {/* Items */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-sm">Intake items</h3>
              </div>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <p className="text-sm">
                      {Array.isArray(selectedRecord.materialType || selectedRecord.mineralType) 
                        ? (selectedRecord.materialType || selectedRecord.mineralType).map((m: any) => typeof m === 'string' ? m : m.name).join(', ') 
                        : (selectedRecord.materialType || selectedRecord.mineralType || 'N/A')}
                    </p>
                    <p className="text-xs text-gray-400">Vehicle: {selectedRecord.vehicleNumber}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm font-medium">{selectedRecord.netWeight.toLocaleString()} kg</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Total */}
            <div className="border-t border-gray-700 pt-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm">Status:</span>
                <span className={`text-sm font-semibold ${selectedRecord.status === 'Paid' ? 'text-green-400' : 'text-orange-400'}`}>
                  {selectedRecord.status}
                </span>
              </div>
              <div className="flex justify-between mb-4">
                <span className="text-sm">Total Weight:</span>
                <span className="font-semibold">{selectedRecord.netWeight.toLocaleString()} kg</span>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-transparent border-gray-600 text-white hover:bg-gray-800"
                  onClick={() => handleExport([selectedRecord.id])}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-transparent border-gray-600 text-white hover:bg-gray-800"
                  onClick={() => handlePrint(selectedRecord)}
                >
                  Print
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-transparent border-gray-600 text-white hover:bg-gray-800"
                  onClick={() => handleDuplicate(selectedRecord)}
                >
                  Duplicate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-transparent border-gray-600 text-white hover:bg-gray-800"
                  onClick={() => navigate('/crushing-processing', {
                    state: {
                      rawMaterial: selectedRecord.mineralType,
                      quantity: selectedRecord.netWeight
                    }
                  })}
                >
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Process
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={(open) => {
        setIsModalOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Intake Record' : 'New Yard Intake Record'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <Label htmlFor="supplier">Company Name</Label>
              <Combobox
                options={supplierOptions}
                value={formData.supplier}
                onValueChange={(v) => setFormData({ ...formData, supplier: v })}
                placeholder="Select or add supplier"
                emptyText="Supplier not found"
                allowCustom
                onCustomAdd={handleAddSupplier}
              />
            </div>
            <div>
              <Label htmlFor="vehicle">Vehicle Number</Label>
              <Combobox
                options={vehicleOptions}
                value={formData.vehicleNumber}
                onValueChange={(v) => setFormData({ ...formData, vehicleNumber: v })}
                placeholder="Select or enter vehicle"
                emptyText="Vehicle not found"
                allowCustom
                onCustomAdd={(v) => setFormData({ ...formData, vehicleNumber: v })}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="material" className="mb-2 block">Materials & Weights</Label>
              <div className="border rounded-md overflow-hidden bg-gray-50/50">
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
                    {formData.mineralType.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4 text-gray-400 text-xs">
                          No materials added. Select from below.
                        </TableCell>
                      </TableRow>
                    ) : (
                      formData.mineralType.map((m, idx) => (
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
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              
              <div className="flex gap-2 mt-3">
                <Select
                  onValueChange={(v) => {
                    if (!formData.mineralType.find(m => m.name === v)) {
                      const newMinerals = [...formData.mineralType, { name: v, grossWeight: 0, tareWeight: 0, netWeight: 0 }];
                      setFormData({ ...formData, mineralType: newMinerals });
                    }
                  }}
                >
                  <SelectTrigger className="flex-1 h-9">
                    <SelectValue placeholder="Add another material..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(companySettings?.materialTypes || []).map((type: string) => (
                      <SelectItem key={type} value={type} disabled={!!formData.mineralType.find(m => m.name === type)}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9"
                  onClick={handleAddMaterial}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  New Type
                </Button>
              </div>
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
                <Label className="text-xs text-[#E8491F]">Total Net Weight</Label>
                <p className="text-lg font-bold text-[#E8491F]">{(formData.grossWeight - formData.tareWeight).toLocaleString()} <span className="text-xs font-normal opacity-70">kg</span></p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#0D0D0D] hover:bg-[#1A1A1A]"
              onClick={handleCreateGRN}
            >
              {isEditMode ? 'Save Changes' : 'Create GRN'}
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
              Are you sure you want to delete this intake record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add New Material Type Dialog */}
      <Dialog open={isAddMaterialModalOpen} onOpenChange={setIsAddMaterialModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Material Type</DialogTitle>
            <DialogDescription>
              Enter the name of the new material type to add it to your global settings.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="material-name">Material Name</Label>
              <Input
                id="material-name"
                value={newMaterialName}
                onChange={(e) => setNewMaterialName(e.target.value)}
                placeholder="e.g. Lead, Copper, Zinc"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') confirmAddMaterial();
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddMaterialModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-[#E8491F] hover:bg-[#C93D18] text-white"
              onClick={confirmAddMaterial}
              disabled={updateSettingsMutation.isPending}
            >
              {updateSettingsMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : 'Add Material'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
