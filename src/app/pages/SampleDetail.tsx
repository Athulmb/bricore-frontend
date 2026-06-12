import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { PageHeader } from '../components/common/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../components/ui/select';
import { FileText, Download, Upload, Eye, X, ArrowLeft, Beaker, CheckCircle, AlertTriangle, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Input as UIInput } from '../components/ui/input';
import { Label } from '../components/ui/label';

import { 
    useAssayingQuery, 
    useUpdateTestRecord, 
    useUploadTestDocument, 
    useDeleteTestDocument 
} from '../hooks/useAssaying';
import { useProcessingQuery } from '../hooks/useProcessing';
import { Loader2 } from 'lucide-react';

export function SampleDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    
    // Fetch data
    const { data: processingBatches = [] } = useProcessingQuery();
    const { data: testRecords = [], isLoading: isFetching } = useAssayingQuery(processingBatches);
    
    const updateMutation = useUpdateTestRecord();
    const uploadDocMutation = useUploadTestDocument();
    const deleteDocMutation = useDeleteTestDocument();

    const [sample, setSample] = useState<any>(null);
    const [uploadState, setUploadState] = useState<{ id: string, docKey: string } | null>(null);
    const [isAddDocOpen, setIsAddDocOpen] = useState(false);
    const [newDocName, setNewDocName] = useState('');
    const [isAddParamOpen, setIsAddParamOpen] = useState(false);
    const [newParamData, setNewParamData] = useState({
        parameter: '',
        specification: '',
        actual: '',
        status: 'Pass'
    });

    useEffect(() => {
        if (id && testRecords.length > 0) {
            const found = testRecords.find(r => r.sampleId === id || r.id === id);
            if (found) {
                setSample(found);
            }
        }
    }, [id, testRecords]);

    if (isFetching || !sample) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-[#E8491F]" />
                    <p className="text-gray-500 font-medium">Loading sample details...</p>
                </div>
            </div>
        );
    }

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !uploadState) return;

        const { id: dbId, docKey } = uploadState;

        try {
            await uploadDocMutation.mutateAsync({ id: dbId, docKey, file });
        } catch (error) {
            // Mutation handles toast
        } finally {
            setUploadState(null);
            event.target.value = '';
        }
    };

    const triggerUpload = (dbId: string, docKey: string) => {
        setUploadState({ id: dbId, docKey });
        document.getElementById('sample-file-input')?.click();
    };

    const handleDocDelete = async (dbId: string, docKey: string) => {
        try {
            await deleteDocMutation.mutateAsync({ id: dbId, docKey });
        } catch (error) {
            // Mutation handles toast
        }
    };

    const handleAddParam = async () => {
        if (!newParamData.parameter.trim()) {
            toast.error('Parameter name is required');
            return;
        }

        const updatedParams = [...(sample.qualityParameters || []), newParamData];

        try {
            await updateMutation.mutateAsync({ 
                id: sample.id, 
                data: { qualityParameters: updatedParams } 
            });
            setIsAddParamOpen(false);
            setNewParamData({ parameter: '', specification: '', actual: '', status: 'Pass' });
        } catch (error) {
            // Mutation handles toast
        }
    };

    const handleRemoveParam = async (index: number) => {
        const updatedParams = (sample.qualityParameters || []).filter((_: any, i: number) => i !== index);

        try {
            await updateMutation.mutateAsync({ 
                id: sample.id, 
                data: { qualityParameters: updatedParams } 
            });
        } catch (error) {
            // Mutation handles toast
        }
    };

    const handleAddDocType = async () => {
        if (!newDocName.trim()) return;

        const currentDocs = sample.documents || {};
        const updatedDocs = { ...currentDocs, [newDocName.trim()]: 'Pending' };

        try {
            await updateMutation.mutateAsync({ 
                id: sample.id, 
                data: { documents: updatedDocs } 
            });
            setIsAddDocOpen(false);
            setNewDocName('');
        } catch (error) {
            // Mutation handles toast
        }
    };

    const handleDocRemoveType = async (dbId: string, docKey: string) => {
        const currentDocs = sample.documents || {};
        const updatedDocs = { ...currentDocs };
        delete updatedDocs[docKey];

        try {
            await updateMutation.mutateAsync({ 
                id: dbId, 
                data: { documents: updatedDocs } 
            });
        } catch (error) {
            // Mutation handles toast
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 mb-2">
                <Button variant="ghost" size="sm" onClick={() => navigate('/assaying-testing')}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Laboratory
                </Button>
            </div>

            <PageHeader
                title={sample.sampleId}
                description={`${sample.mineralType} • Linked Batch: ${sample.linkedBatch}`}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    {/* Laboratory Test Results */}
                    <Card className="bg-white border border-gray-200">
                        <div className="p-5 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <Beaker className="h-4 w-4 text-[#E8491F]" />
                                Test Parameters & Results
                            </h3>
                            <Button variant="outline" size="sm" onClick={() => setIsAddParamOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" /> Add Parameter
                            </Button>
                        </div>
                        <div className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="pl-5">Parameter</TableHead>
                                        <TableHead>Specification</TableHead>
                                        <TableHead>Actual Value</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="pr-5 text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sample.qualityParameters?.length > 0 ? (
                                        sample.qualityParameters.map((param: any, idx: number) => (
                                            <TableRow key={idx}>
                                                <TableCell className="pl-5 font-medium">{param.parameter}</TableCell>
                                                <TableCell className="text-gray-600">{param.specification}</TableCell>
                                                <TableCell className="font-bold text-[#E8491F]">{param.actual}</TableCell>
                                                <TableCell className="pr-5">
                                                    <div className="flex items-center justify-between">
                                                        <span className={`inline-flex items-center gap-1 ${param.status === 'Pass' ? 'text-green-600' : 'text-red-600'}`}>
                                                            {param.status === 'Pass' ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                                                            {param.status}
                                                        </span>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 w-7 text-gray-400 hover:text-red-500"
                                                            onClick={() => handleRemoveParam(idx)}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                                No detailed parameters recorded for this sample.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>

                    {/* Size Distribution */}
                    {sample.sizeDistribution?.length > 0 && (
                        <Card className="bg-white border border-gray-200">
                            <div className="p-5 border-b border-gray-200">
                                <h3 className="font-semibold text-gray-900">Size Distribution Analysis</h3>
                            </div>
                            <div className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="pl-5">Size Range</TableHead>
                                            <TableHead>Percentage (%)</TableHead>
                                            <TableHead className="pr-5">Visual Load</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sample.sizeDistribution.map((size: any, idx: number) => (
                                            <TableRow key={idx}>
                                                <TableCell className="pl-5 font-medium">{size.size}</TableCell>
                                                <TableCell className="text-[#E8491F] font-semibold">{size.percentage}%</TableCell>
                                                <TableCell className="pr-5">
                                                    <div className="w-full bg-gray-100 rounded-full h-1.5 max-w-[100px]">
                                                        <div className="bg-[#E8491F] h-1.5 rounded-full" style={{ width: `${size.percentage}%` }} />
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </Card>
                    )}

                    <Card className="bg-white border border-gray-200">
                        <div className="p-5 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="font-semibold text-gray-900">Lab Certificates & Reports</h3>
                            <Button variant="outline" size="sm" onClick={() => setIsAddDocOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" /> Add Document Type
                            </Button>
                        </div>
                        <div className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="pl-5">Document Name</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="pr-5 text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {Object.entries(sample.documents || {}).map(([key, value]) => {
                                        const isAvailable = typeof value === 'string' && value.startsWith('/uploads/');
                                        const displayName = key.split('_').map(word => word.charAt(0) + word.slice(1)).join(' '); // Simple formatting if it was camelCase, though we'll use literal names now

                                        return (
                                            <TableRow key={key}>
                                                <TableCell className="pl-5 font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="h-4 w-4 text-gray-400" />
                                                        {key}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <StatusBadge status={isAvailable ? 'Available' : 'Pending'} />
                                                </TableCell>
                                                <TableCell className="pr-5 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {isAvailable ? (
                                                            <>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api').replace(/\/api$/, '');
                                                                        window.open(`${baseUrl}${value}`, '_blank');
                                                                    }}
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                                    onClick={() => handleDocDelete(sample.id, key)}
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            </>
                                                        ) : (
                                                            <div className="flex gap-1">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => triggerUpload(sample.id, key)}
                                                                >
                                                                    <Upload className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="text-red-400"
                                                                    onClick={() => handleDocRemoveType(sample.id, key)}
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {Object.keys(sample.documents || {}).length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center py-8 text-gray-500 italic">
                                                No documents defined. Click "Add Document Type" to get started.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                </div>

                {/* Right Column - Info Cards */}
                <div className="space-y-6">
                    <Card className="bg-white border border-gray-200 p-6 space-y-6 self-start">
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Test Status</p>
                            <StatusBadge status={sample.status} />
                        </div>

                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Laboratory</p>
                            <p className="font-medium text-lg text-gray-900">{sample.labName}</p>
                            <p className="text-xs text-gray-400">Partner Laboratory</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Submitted</p>
                                <p className="text-sm font-medium">{sample.submittedDate}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Result Date</p>
                                <p className="text-sm font-medium">{sample.resultDate}</p>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Notes</p>
                            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{sample.notes || 'No additional notes provided.'}</p>
                        </div>
                    </Card>

                    {/* Quick Result Summary */}
                    <Card className="bg-[#E8491F] text-white p-6 space-y-2">
                        <p className="text-xs opacity-70 uppercase tracking-wider">Main Result (Purity)</p>
                        <p className="text-3xl font-bold">{sample.purity}</p>
                        <p className="text-xs opacity-90 mt-2">Verified by Quality Control</p>
                    </Card>
                </div>
            </div>

            <input
                type="file"
                id="sample-file-input"
                className="hidden"
                onChange={handleFileUpload}
            />

            <Dialog open={isAddDocOpen} onOpenChange={setIsAddDocOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Required Document</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Document Name</Label>
                            <UIInput
                                placeholder="e.g. Moisture Report, Impurity Analysis"
                                value={newDocName}
                                onChange={(e) => setNewDocName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddDocType()}
                            />
                        </div>
                        <div className="text-xs text-gray-500">
                            Suggested: Certificate of Analysis (COA), Lab Test Report, Spec Sheet
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddDocOpen(false)}>Cancel</Button>
                        <Button className="bg-[#E8491F]" onClick={handleAddDocType}>Add Placeholder</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isAddParamOpen} onOpenChange={setIsAddParamOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Test Parameter</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                        <div className="col-span-2 space-y-2">
                            <Label>Parameter Name</Label>
                            <UIInput
                                placeholder="e.g. Purity, Moisture, Iron Content"
                                value={newParamData.parameter}
                                onChange={(e) => setNewParamData({ ...newParamData, parameter: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Specification</Label>
                            <UIInput
                                placeholder="e.g. >= 99%"
                                value={newParamData.specification}
                                onChange={(e) => setNewParamData({ ...newParamData, specification: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Actual Value</Label>
                            <UIInput
                                placeholder="e.g. 99.2%"
                                value={newParamData.actual}
                                onChange={(e) => setNewParamData({ ...newParamData, actual: e.target.value })}
                            />
                        </div>
                        <div className="col-span-2 space-y-2">
                            <Label>Status</Label>
                            <Select
                                value={newParamData.status}
                                onValueChange={(v: string) => setNewParamData({ ...newParamData, status: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Pass">Pass</SelectItem>
                                    <SelectItem value="Fail">Fail</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddParamOpen(false)}>Cancel</Button>
                        <Button className="bg-[#E8491F]" onClick={handleAddParam}>Add Parameter</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
