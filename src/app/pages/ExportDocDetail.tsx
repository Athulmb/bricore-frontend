import { useState } from 'react';
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
import { FileText, Download, Upload, Eye, X, ArrowLeft, Globe, ShieldCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useExportDocDetailQuery, useUpdateExportDocStatus, useDeleteExportDocFile } from '../hooks/useExportDocs';

const documentTypes = [
    { name: 'Commercial Invoice', key: 'commercialInvoice' },
    { name: 'Packing List', key: 'packingList' },
    { name: 'Certificate of Origin', key: 'certificateOfOrigin' },
    { name: 'Inspection Certificate', key: 'inspectionCert' },
    { name: 'Bill of Lading', key: 'billOfLading' },
    { name: 'Customs Documents', key: 'customsDocs' },
];

export function ExportDocDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    
    const { data: shipment, isLoading } = useExportDocDetailQuery(id || '');
    const updateExportDocStatus = useUpdateExportDocStatus();
    const deleteExportDocFile = useDeleteExportDocFile();

    const [uploadState, setUploadState] = useState<{ shipmentId: string, id: string, docKey: string } | null>(null);

    if (isLoading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-[#E8491F]" />
                    <p className="text-gray-500 font-medium">Loading shipment records...</p>
                </div>
            </div>
        );
    }

    if (!shipment) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Shipment Not Found</h2>
                    <p className="text-gray-500 mb-6">The shipment ID {id} does not exist.</p>
                    <Button onClick={() => navigate('/export-documentation')} className="bg-[#E8491F] text-white">
                        Back to List
                    </Button>
                </div>
            </div>
        );
    }

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !uploadState) return;

        const { shipmentId, id: dbId, docKey } = uploadState;
        const toastId = toast.loading('Uploading document...');

        try {
            await updateExportDocStatus.mutateAsync({ shipmentId, id: dbId, docKey, file });
            toast.success('Document uploaded and marked as Available', { id: toastId });
        } catch (error) {
            toast.error('Upload failed. Please try again.', { id: toastId });
        } finally {
            setUploadState(null);
            event.target.value = '';
        }
    };

    const triggerUpload = (shipmentId: string, dbId: string, docKey: string) => {
        setUploadState({ shipmentId, id: dbId, docKey });
        document.getElementById('detail-file-input')?.click();
    };

    const handleDocDelete = async (dbId: string, docKey: string, shipmentId: string) => {
        const toastId = toast.loading('Removing document...');
        try {
            await deleteExportDocFile.mutateAsync({ id: dbId, docKey, shipmentId });
            toast.success('Document removed', { id: toastId });
        } catch (error) {
            toast.error('Failed to remove document', { id: toastId });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 mb-2">
                <Button variant="ghost" size="sm" onClick={() => navigate('/export-documentation')}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to List
                </Button>
            </div>

            <PageHeader
                title={shipment.shipmentId}
                description={`${shipment.clientName || shipment.customer} • Destination: ${shipment.destination}`}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2 bg-white border border-gray-200">
                    <div className="p-5 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-900">Required Documentation</h3>
                    </div>
                    <div className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="pl-5">Document Type</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Version</TableHead>
                                    <TableHead className="pr-5 text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {documentTypes.map((docType) => {
                                    const docStatus = shipment.documents[docType.key];
                                    const isAvailable = docStatus && typeof docStatus === 'string' && docStatus.startsWith('/uploads/');

                                    return (
                                        <TableRow key={docType.key}>
                                            <TableCell className="pl-5 font-medium">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-4 w-4 text-gray-400" />
                                                    {docType.name}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge status={docStatus} />
                                            </TableCell>
                                            <TableCell className="text-gray-600">
                                                {isAvailable ? 'v1.2' : '-'}
                                            </TableCell>
                                            <TableCell className="pr-5 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {isAvailable ? (
                                                        <>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => window.open(`http://localhost:5001${docStatus}`, '_blank')}
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => {
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
                                                                onClick={() => handleDocDelete(shipment.id, docType.key, shipment.shipmentId)}
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => triggerUpload(shipment.shipmentId, shipment.id, docType.key)}
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
                    </div>
                </Card>

                <Card className="bg-white border border-gray-200 p-6 space-y-6 self-start">
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Compliance Status</p>
                        <StatusBadge status={shipment.status} />
                    </div>

                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Client</p>
                        <p className="font-medium text-lg text-gray-900">{shipment.customer}</p>
                    </div>

                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Destination</p>
                        <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-blue-500" />
                            <p className="font-medium text-gray-900">{shipment.destination}</p>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                        <Button
                            className="w-full bg-[#E8491F] hover:bg-[#803d1f] text-white"
                            onClick={() => toast.success('Compliance review initiated')}
                        >
                            <ShieldCheck className="h-4 w-4 mr-2" />
                            Certify Shipment
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full mt-2 border-gray-200"
                            onClick={() => {
                                toast.success('Exporting all documents to Zip...');
                            }}
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Export All Docs (Zip)
                        </Button>
                    </div>
                </Card>
            </div>

            <input
                type="file"
                id="detail-file-input"
                className="hidden"
                onChange={handleFileUpload}
            />
        </div>
    );
}
