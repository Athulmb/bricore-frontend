import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Package, Activity, Beaker, CheckCircle, AlertTriangle, TrendingUp, Calendar, Pencil, FileText, Printer, Plus, Trash2, X, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { StatusBadge } from '../components/common/StatusBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useProcessingQuery, useUpdateProcessingBatch } from '../hooks/useProcessing';
import { useAssayingQuery } from '../hooks/useAssaying';

import { useSettingsQuery } from '../hooks/useSettings';

export function BatchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: companySettings, isLoading: isLoadingSettings } = useSettingsQuery();

  const [activeStepView, setActiveStepView] = useState<string | null>(null);

  // Fetch data
  const { data: processingBatches = [], isLoading: isLoadingProcessing } = useProcessingQuery();
  const { data: testRecords = [], isLoading: isLoadingAssaying } = useAssayingQuery(processingBatches);
  const updateMutation = useUpdateProcessingBatch();

  // Find record early (using optional chaining for safety during loading)
  const existingBatch = processingBatches.find(b => b.batchId === id);

  const [formData, setFormData] = useState({
    rawMaterial: (Array.isArray(existingBatch?.rawMaterial) ? existingBatch.rawMaterial : (existingBatch?.rawMaterial ? [existingBatch.rawMaterial] : [])) as any[],
    quantity: existingBatch?.inputQuantity || 0,
    machine: existingBatch?.machineAssigned || '',
    outputGrade: existingBatch?.outputGrade || '',
    status: existingBatch?.status || 'Pending',
    operator: existingBatch?.operator || '',
    supervisor: existingBatch?.supervisor || '',
    outputQuantity: existingBatch?.outputQuantity || 0,
    equipmentUsed: existingBatch?.equipmentUsed?.join(', ') || '',
    isApproved: existingBatch?.qualityApproved?.isApproved || false,
    remarks: existingBatch?.qualityApproved?.remarks || '',
    processStages: existingBatch?.processStages || [
      { stage: 'Primary Crushing', startTime: '08:00 AM', endTime: '02:00 PM', duration: '6 hrs', status: 'Completed' }
    ],
    qualityParameters: existingBatch?.qualityParameters || [
      { parameter: 'Iron Content (Fe)', specification: '62% ± 2%', actual: '62.8%', status: 'Pass' }
    ],
    sizeDistribution: existingBatch?.sizeDistribution || [
      { size: '+10mm', percentage: 5, weight: 1025 }
    ]
  });

  if (isLoadingProcessing || isLoadingAssaying) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-[#E8491F]" />
          <p className="text-gray-500 font-medium">Loading batch details...</p>
        </div>
      </div>
    );
  }

  if (!existingBatch) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Batch Not Found</h2>
          <p className="text-gray-500 mb-6">The batch ID {id} does not exist in our system.</p>
          <Button onClick={() => navigate('/crushing-processing')} className="bg-[#E8491F] text-white">
            Back to Processing
          </Button>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (existingBatch) {
      await updateMutation.mutateAsync({
        id: existingBatch.id,
        data: { status: newStatus as any }
      });
    }
  };

  const handleSaveChanges = async (advanceStatus?: string) => {
    if (existingBatch) {
      const updatedData: any = {
        rawMaterial: formData.rawMaterial,
        inputQuantity: formData.quantity,
        machineAssigned: formData.machine,
        outputGrade: formData.outputGrade,
        status: advanceStatus || formData.status,
        operator: formData.operator,
        supervisor: formData.supervisor,
        outputQuantity: formData.outputQuantity,
        equipmentUsed: formData.equipmentUsed.split(',').map((s: string) => s.trim()).filter((s: string) => s),
        qualityApproved: {
          isApproved: formData.isApproved,
          remarks: formData.remarks,
          approvedBy: 'Quality Control Team',
          approvalDate: new Date().toISOString()
        },
        processStages: formData.processStages,
        qualityParameters: formData.qualityParameters,
        sizeDistribution: formData.sizeDistribution
      };

      if (advanceStatus === 'Completed') {
        updatedData.processingDate = new Date().toISOString();
      }

      await updateMutation.mutateAsync({
        id: existingBatch.id,
        data: updatedData
      });

      if (advanceStatus) {
        setActiveStepView(advanceStatus);
      }
    }
  };

  // Find linked quality data
  const approvedTest = testRecords.filter(r => r.linkedBatch === (existingBatch?.batchId || id) && r.status === 'Approved')
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())[0];

  const batchData = {
    batchId: existingBatch?.batchId || id || 'N/A',
    status: existingBatch?.status || 'Pending',
    material: Array.isArray(existingBatch?.rawMaterial) 
      ? existingBatch.rawMaterial.map((m: any) => typeof m === 'string' ? m : m.name).join(', ') 
      : (typeof existingBatch?.rawMaterial === 'string' ? existingBatch.rawMaterial : (existingBatch?.rawMaterial as any)?.name || 'N/A'),
    grade: existingBatch?.outputGrade || 'N/A',
    sourceGRN: existingBatch?.sourceGRN || 'GRN-2026-001',
    inputWeight: existingBatch?.inputQuantity || 0,
    outputWeight: existingBatch?.outputQuantity || 0,
    recoveryRate: existingBatch?.inputQuantity && existingBatch?.outputQuantity
      ? ((existingBatch.outputQuantity / existingBatch.inputQuantity) * 100).toFixed(2)
      : '0.00',
    crushingDate: existingBatch?.processingDate ? new Date(existingBatch.processingDate).toLocaleDateString() : 'N/A',
    completionDate: existingBatch?.status === 'Completed' ? new Date().toLocaleDateString() : '--',
    processingTime: existingBatch?.processingTime || 'Underway',
    operator: existingBatch?.operator || 'Rajesh Kumar',
    supervisor: existingBatch?.supervisor || 'Anil Mehta',
    equipmentUsed: existingBatch?.equipmentUsed || ['Jaw Crusher - JC-01', 'Cone Crusher - CC-02', 'Vibrating Screen - VS-03'],
    processStages: existingBatch?.processStages?.length ? existingBatch.processStages : [
      { stage: 'Primary Crushing', startTime: '08:00 AM', endTime: '02:00 PM', duration: '6 hrs', status: 'Completed' },
      { stage: 'Secondary Crushing', startTime: '02:30 PM', endTime: '08:30 PM', duration: '6 hrs', status: 'Completed' },
      { stage: 'Screening', startTime: '09:00 PM', endTime: '11:00 PM', duration: '2 hrs', status: 'Completed' },
      { stage: 'Quality Testing', startTime: '11:30 PM', endTime: '02:00 AM', duration: '2.5 hrs', status: 'Completed' },
      { stage: 'Storage Transfer', startTime: '02:30 AM', endTime: '03:00 AM', duration: '0.5 hrs', status: 'Completed' },
    ],
    qualityParameters: approvedTest?.qualityParameters?.length 
      ? approvedTest.qualityParameters 
      : (existingBatch?.qualityParameters?.length ? existingBatch.qualityParameters : []),
    sizeDistribution: approvedTest?.sizeDistribution?.length 
      ? approvedTest.sizeDistribution 
      : (existingBatch?.sizeDistribution?.length ? existingBatch.sizeDistribution : []),
  };

  const steps = [
    { title: 'Preparation', icon: Package, statusKey: 'Pending' },
    { title: 'Crushing', icon: Activity, statusKey: 'Processing' },
    { title: 'Quality Check', icon: Beaker, statusKey: 'Quality Check' },
    { title: 'Finalization', icon: CheckCircle, statusKey: 'Completed' }
  ];

  const getStepStatus = (statusKey: string) => {
    const statusOrder = ['Pending', 'Processing', 'Quality Check', 'Completed'];
    const currentIdx = statusOrder.indexOf(batchData.status);
    const stepIdx = statusOrder.indexOf(statusKey);

    if (stepIdx < currentIdx) return 'Completed';
    if (stepIdx === currentIdx) return 'Current';
    return 'Pending';
  };

  const currentStep = activeStepView || batchData.status;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/crushing-processing')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Processing
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{batchData.batchId}</h1>
            <p className="text-sm text-gray-500 mt-1">Processing Batch Details</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={batchData.status} onValueChange={handleUpdateStatus}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Processing">Processing</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {/* Stepper */}
      <Card className="p-6 bg-white border-gray-100 shadow-sm">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-100 -translate-y-1/2 z-0" />
          {steps.map((step, index) => {
            const stepStatus = getStepStatus(step.statusKey);
            return (
              <div
                key={index}
                className="relative z-10 flex flex-col items-center gap-2 group cursor-pointer"
                onClick={() => setActiveStepView(step.statusKey)}
              >
                <div className={`h-12 w-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-sm ${stepStatus === 'Completed'
                  ? 'bg-[#E8491F] border-[#E8491F] text-white'
                  : currentStep === step.statusKey
                    ? 'bg-white border-[#E8491F] text-[#E8491F] ring-4 ring-[#E8491F]/10 animate-pulse'
                    : 'bg-white border-gray-200 text-gray-400 group-hover:border-gray-300 group-hover:text-gray-500'
                  } ${activeStepView === step.statusKey ? 'scale-110 !border-dashed' : ''}`}>
                  {stepStatus === 'Completed' ? <CheckCircle className="h-6 w-6" /> : <step.icon className="h-6 w-6" />}
                </div>
                <span className={`text-xs font-semibold transition-colors ${stepStatus === 'Completed' || stepStatus === 'Current' ? 'text-[#E8491F]' : 'text-gray-400'
                  }`}>
                  {step.title}
                </span>
                {batchData.status === step.statusKey && (
                  <span className="absolute -bottom-6 text-[10px] font-bold text-[#E8491F] whitespace-nowrap bg-[#E8491F]/10 px-2 py-0.5 rounded-full">
                    Active Status
                  </span>
                )}
                {activeStepView === step.statusKey && batchData.status !== step.statusKey && (
                  <span className="absolute -bottom-6 text-[10px] font-bold text-blue-600 whitespace-nowrap bg-blue-50 px-2 py-0.5 rounded-full">
                    Viewing Stage
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Wizard Active Step Inputs */}
      <Card className="p-6 border-[#E8491F]/20 bg-[#fdfaf9]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[#E8491F] text-white flex items-center justify-center">
              {steps.find(s => s.statusKey === currentStep)?.icon && (() => {
                const Icon = steps.find(s => s.statusKey === currentStep)!.icon;
                return <Icon className="h-5 w-5" />;
              })()}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {steps.find(s => s.statusKey === currentStep)?.title} Stage Inputs
              </h2>
              <p className="text-sm text-gray-500">Provide details for the current processing phase</p>
            </div>
          </div>
          {batchData.status !== 'Completed' && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleSaveChanges()}>
                Save Draft
              </Button>
              {currentStep === 'Pending' && (
                <Button className="bg-[#E8491F] hover:bg-[#C93D18] text-white" onClick={() => handleSaveChanges('Processing')}>
                  Start Crushing
                </Button>
              )}
              {currentStep === 'Processing' && (
                <Button className="bg-[#E8491F] hover:bg-[#C93D18] text-white" onClick={() => handleSaveChanges('Quality Check')}>
                  Move to Quality
                </Button>
              )}
              {currentStep === 'Quality Check' && (
                <Button className="bg-[#E8491F] hover:bg-[#C93D18] text-white" onClick={() => handleSaveChanges('Completed')}>
                  Finalize Batch
                </Button>
              )}
            </div>
          )}
        </div>

        {currentStep === 'Pending' && (
          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Raw Materials</Label>
              <div className="flex flex-wrap gap-1 mb-2 border rounded-md p-2 min-h-[42px] bg-white">
                {formData.rawMaterial.map((type: any) => (
                  <span
                    key={typeof type === 'string' ? type : (type as any).name}
                    className="inline-flex items-center gap-1 bg-[#E8491F] text-white px-2 py-0.5 rounded text-sm"
                  >
                    {typeof type === 'string' ? type : (type as any).name}
                    <button
                      type="button"
                      onClick={() => 
                        setFormData({ 
                          ...formData, 
                          rawMaterial: formData.rawMaterial.filter((t: string) => t !== type) 
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
                  if (!(formData.rawMaterial as any[]).map(m => typeof m === 'string' ? m : m.name).includes(v)) {
                    setFormData({ 
                      ...formData, 
                      rawMaterial: [...formData.rawMaterial, v] 
                    });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Add material" />
                </SelectTrigger>
                <SelectContent>
                  {(processingBatches.map(b => b.rawMaterial).flat()
                    .map(m => typeof m === 'string' ? m : m.name)
                    .filter((v, i, a) => v && a.indexOf(v) === i) || [])
                    .map((type: any) => (
                    <SelectItem key={type} value={type} disabled={(formData.rawMaterial as any[]).map(m => typeof m === 'string' ? m : m.name).includes(type)}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Operator Name</Label>
              <Input value={formData.operator} onChange={(e) => setFormData({ ...formData, operator: e.target.value })} placeholder="Enter operator name" />
            </div>
            <div className="space-y-2">
              <Label>Supervisor Name</Label>
              <Input value={formData.supervisor} onChange={(e) => setFormData({ ...formData, supervisor: e.target.value })} placeholder="Enter supervisor name" />
            </div>
            <div className="space-y-2">
              <Label>Machine/Equipment Used</Label>
              <Input value={formData.equipmentUsed} onChange={(e) => setFormData({ ...formData, equipmentUsed: e.target.value })} placeholder="JC-01, CC-02..." />
            </div>
          </div>
        )}

        {currentStep === 'Processing' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Detailed Process Stages</h4>
              <Button variant="outline" size="sm" onClick={() => setFormData({
                ...formData,
                processStages: [...formData.processStages, { stage: '', duration: '', status: 'Pending' }]
              })}>
                <Plus className="h-4 w-4 mr-2" /> Add Stage
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {formData.processStages.map((stage: any, index: number) => (
                <div key={index} className="flex gap-3 items-end bg-white p-4 rounded-lg border shadow-sm">
                  <div className="flex-1 space-y-2">
                    <Label className="text-xs">Stage Name</Label>
                    <Input value={stage.stage} onChange={(e) => {
                      const newStages = [...formData.processStages];
                      newStages[index].stage = e.target.value;
                      setFormData({ ...formData, processStages: newStages });
                    }} placeholder="e.g. Primary Crushing" />
                  </div>
                  <div className="w-32 space-y-2">
                    <Label className="text-xs">Duration</Label>
                    <Input value={stage.duration} onChange={(e) => {
                      const newStages = [...formData.processStages];
                      newStages[index].duration = e.target.value;
                      setFormData({ ...formData, processStages: newStages });
                    }} placeholder="6 hrs" />
                  </div>
                  <div className="w-40 space-y-2">
                    <Label className="text-xs">Status</Label>
                    <Select value={stage.status} onValueChange={(v) => {
                      const newStages = [...formData.processStages];
                      newStages[index].status = v;
                      setFormData({ ...formData, processStages: newStages });
                    }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Processing">Processing</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="ghost" size="icon" className="text-red-500" onClick={() => {
                    setFormData({ ...formData, processStages: formData.processStages.filter((_: any, i: number) => i !== index) });
                  }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 'Quality Check' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6 items-start bg-white p-6 rounded-lg border shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center gap-2 bg-green-50 p-3 rounded border border-green-100">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-[#E8491F]"
                    checked={formData.isApproved}
                    onChange={(e) => setFormData({ ...formData, isApproved: e.target.checked })}
                  />
                  <Label className="font-semibold text-green-900">Final Quality Approval</Label>
                </div>
                <div className="space-y-2">
                  <Label>Quality Remarks</Label>
                  <Input value={formData.remarks} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} placeholder="All parameters meet specifications..." />
                </div>
              </div>
              <div className="space-y-4">
                <Label className="font-medium">Output Grade</Label>
                <Select value={formData.outputGrade} onValueChange={(v) => setFormData({ ...formData, outputGrade: v })}>
                  <SelectTrigger><SelectValue placeholder="Select Grade" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Grade A+">Grade A+ (Premium)</SelectItem>
                    <SelectItem value="Grade A">Grade A</SelectItem>
                    <SelectItem value="Grade B">Grade B</SelectItem>
                    <SelectItem value="Standard">Standard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Chemical Parameters</h4>
                <Button variant="outline" size="sm" onClick={() => setFormData({
                  ...formData,
                  qualityParameters: [...formData.qualityParameters, { parameter: '', specification: '', actual: '', status: 'Pass' }]
                })}>
                  <Plus className="h-4 w-4 mr-2" /> Add Parameter
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {formData.qualityParameters.map((param: any, index: number) => (
                  <div key={index} className="flex gap-3 bg-white p-3 rounded border border-gray-100 shadow-sm items-end">
                    <div className="flex-1 space-y-1">
                      <Label className="text-[10px]">Parameter</Label>
                      <Input className="h-8 text-xs" value={param.parameter} onChange={(e) => {
                        const newParams = [...formData.qualityParameters];
                        newParams[index].parameter = e.target.value;
                        setFormData({ ...formData, qualityParameters: newParams });
                      }} />
                    </div>
                    <div className="w-24 space-y-1">
                      <Label className="text-[10px]">Actual</Label>
                      <Input className="h-8 text-xs" value={param.actual} onChange={(e) => {
                        const newParams = [...formData.qualityParameters];
                        newParams[index].actual = e.target.value;
                        setFormData({ ...formData, qualityParameters: newParams });
                      }} />
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400" onClick={() => {
                      setFormData({ ...formData, qualityParameters: formData.qualityParameters.filter((_: any, i: number) => i !== index) });
                    }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentStep === 'Completed' && (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 p-6 rounded-lg flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-green-900">Batch Finalized</h4>
                <p className="text-sm text-green-700">Verification complete. All data recorded.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <Card className="p-4 bg-white border-dashed">
                <Label>Final Output Quantity (MT)</Label>
                <div className="flex items-center gap-3 mt-2">
                  <Input
                    type="number"
                    value={formData.outputQuantity}
                    onChange={(e) => setFormData({ ...formData, outputQuantity: parseFloat(e.target.value) || 0 })}
                    className="text-xl font-bold h-12"
                  />
                  <Button onClick={() => handleSaveChanges()} className="h-12 bg-gray-900">Update weight</Button>
                </div>
              </Card>

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Final Size Distribution</h4>
                <div className="space-y-2">
                  {formData.sizeDistribution.map((size: any, index: number) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input className="flex-1 h-8 text-xs" value={size.size} onChange={(e) => {
                        const newSizes = [...formData.sizeDistribution];
                        newSizes[index].size = e.target.value;
                        setFormData({ ...formData, sizeDistribution: newSizes });
                      }} />
                      <Input className="w-20 h-8 text-xs" type="number" value={size.percentage} onChange={(e) => {
                        const newSizes = [...formData.sizeDistribution];
                        newSizes[index].percentage = parseFloat(e.target.value) || 0;
                        setFormData({ ...formData, sizeDistribution: newSizes });
                      }} />
                      <span className="text-xs text-gray-500">%</span>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="text-[10px]" onClick={() => setFormData({
                    ...formData,
                    sizeDistribution: [...formData.sizeDistribution, { size: '', percentage: 0, weight: 0 }]
                  })}>+ Add Range</Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Input Weight</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{batchData.inputWeight.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">MT</p>
            </div>
            <div className="h-12 w-12 bg-[#1A1A1A] rounded-lg flex items-center justify-center">
              <Package className="h-6 w-6 text-[#E8491F]" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Output Weight</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{batchData.outputWeight.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">MT</p>
            </div>
            <div className="h-12 w-12 bg-green-50 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Recovery Rate</p>
              <p className="text-2xl font-semibold text-green-600 mt-1">{batchData.recoveryRate}%</p>
              <p className="text-xs text-green-600 mt-1">Excellent</p>
            </div>
            <div className="h-12 w-12 bg-green-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Processing Time</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{batchData.processingTime}</p>
              <p className="text-xs text-gray-500 mt-1">Duration</p>
            </div>
            <div className="h-12 w-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Grid - Shown only when finalized */}
      {currentStep === 'Completed' && (
        <div className="grid grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="col-span-2 space-y-6">
            {/* Basic Information */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-[#E8491F]" />
                Batch Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Material Type</p>
                  <p className="font-medium text-gray-900 mt-1">{batchData.material}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Grade</p>
                  <p className="font-medium text-gray-900 mt-1">{batchData.grade}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Source GRN</p>
                  <p className="font-medium text-[#E8491F] mt-1">{batchData.sourceGRN}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Batch Status</p>
                  <div className="mt-1">
                    <StatusBadge status={batchData.status} />
                  </div>
                </div>
              </div>
            </Card>

            {/* Processing Timeline */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-[#E8491F]" />
                Processing Stages
              </h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Stage</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>End Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batchData.processStages.map((stage: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{stage.stage}</TableCell>
                      <TableCell className="text-gray-600">{stage.startTime}</TableCell>
                      <TableCell className="text-gray-600">{stage.endTime}</TableCell>
                      <TableCell className="font-medium text-[#E8491F]">{stage.duration}</TableCell>
                      <TableCell><StatusBadge status={stage.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>

            {/* Quality Parameters */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Beaker className="h-5 w-5 text-[#E8491F]" />
                Quality Test Results
              </h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parameter</TableHead>
                    <TableHead>Specification</TableHead>
                    <TableHead>Actual Value</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batchData.qualityParameters.map((param: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{param.parameter}</TableCell>
                      <TableCell className="text-gray-600">{param.specification}</TableCell>
                      <TableCell className="font-medium text-[#E8491F]">{param.actual}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          {param.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>

            {/* Size Distribution */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Size Distribution Analysis</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Size Range</TableHead>
                    <TableHead className="text-right">Percentage</TableHead>
                    <TableHead className="text-right">Weight (MT)</TableHead>
                    <TableHead>Distribution</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batchData.sizeDistribution.map((size: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{size.size}</TableCell>
                      <TableCell className="text-right font-medium text-[#E8491F]">{size.percentage}%</TableCell>
                      <TableCell className="text-right">{size.weight.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-[#E8491F] h-2 rounded-full"
                            style={{ width: `${size.percentage}%` }}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Timeline */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#E8491F]" />
                Processing Timeline
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Start Date</p>
                  <p className="font-medium text-gray-900 mt-1">{batchData.crushingDate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Completion Date</p>
                  <p className="font-medium text-gray-900 mt-1">{batchData.completionDate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Duration</p>
                  <p className="font-medium text-[#E8491F] mt-1">{batchData.processingTime}</p>
                </div>
              </div>
            </Card>

            {/* Personnel */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Personnel</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Operator</p>
                  <p className="font-medium text-gray-900 mt-1">{batchData.operator}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Supervisor</p>
                  <p className="font-medium text-gray-900 mt-1">{batchData.supervisor}</p>
                </div>
              </div>
            </Card>

            {/* Equipment Used */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Equipment Used</h3>
              <div className="space-y-2">
                {batchData.equipmentUsed.map((equipment: string, index: number) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{equipment}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Quality Summary */}
            <Card className={`p-6 border ${existingBatch?.qualityApproved?.isApproved ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
              <h3 className={`font-semibold mb-3 flex items-center gap-2 ${existingBatch?.qualityApproved?.isApproved ? 'text-green-900' : 'text-yellow-900'}`}>
                <CheckCircle className="h-5 w-5" />
                {existingBatch?.qualityApproved?.isApproved ? 'Quality Approved' : 'Quality Review Pending'}
              </h3>
              <p className={`text-sm ${existingBatch?.qualityApproved?.isApproved ? 'text-green-700' : 'text-yellow-700'}`}>
                {existingBatch?.qualityApproved?.remarks || 'All quality parameters meet specifications. Batch approved for next stage.'}
              </p>
              {existingBatch?.qualityApproved?.isApproved && (
                <div className="mt-4 pt-4 border-t border-green-200">
                  <p className="text-xs text-green-600">
                    Approved by: {existingBatch?.qualityApproved?.approvedBy || 'Quality Control Team'}<br />
                    Date: {existingBatch?.qualityApproved?.approvalDate ? new Date(existingBatch.qualityApproved.approvalDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              )}
            </Card>

            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Next Steps</h3>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  Create Bagging Record
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  Schedule Inspection
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  Generate Report
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
