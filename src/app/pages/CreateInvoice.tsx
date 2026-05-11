import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../components/ui/select';
import {
    Plus,
    X,
    Trash2,
    Save,
    ArrowLeft,
    Info,
    Building2,
    Calendar,
    CreditCard,
    FileText,
    Package
} from 'lucide-react';
import {
    useYardIntakeQuery
} from '../hooks/useYardIntake';
import {
    useInvoicesQuery,
    useCreateInvoice
} from '../hooks/useInvoices';
import {
    useExportDocsQuery
} from '../hooks/useExportDocs';
import {
    useDispatchQuery
} from '../hooks/useDispatch';
import {
    useProcessingQuery
} from '../hooks/useProcessing';
import { useQuotationsQuery } from '../hooks/useQuotations';
import { Loader2, Quote } from 'lucide-react';

import { useSettingsQuery } from '../hooks/useSettings';
import { useClientsQuery } from '../hooks/useClients';
import { currencies, CurrencyCode } from '../context/CurrencyContext';
import { toast } from 'sonner';
import { Combobox } from '../components/ui/combobox';

export function CreateInvoice() {
    const navigate = useNavigate();
    const { data: companySettings, isLoading: isLoadingSettings } = useSettingsQuery();
    const { data: clients = [], isLoading: isLoadingClients } = useClientsQuery();

    const [currency, setCurrency] = useState<CurrencyCode>('AED');

    const formatCurrency = (amount: number, includeSymbol = true) => {
        let currencyCode = currency || companySettings?.currency || 'AED';

        // Safety check
        if (currencyCode && (currencyCode as string).length > 3) {
            currencyCode = (currencyCode as string).substring(0, 3).toUpperCase() as CurrencyCode;
        }

        try {
            return new Intl.NumberFormat('en-GH', {
                style: includeSymbol ? 'currency' : 'decimal',
                currency: currencyCode,
            }).format(amount);
        } catch (error) {
            return new Intl.NumberFormat('en-GH', {
                style: includeSymbol ? 'currency' : 'decimal',
                currency: 'AED',
            }).format(amount);
        }
    };


    // Queries
    const { data: yardIntake = [], isLoading: isLoadingYard } = useYardIntakeQuery();
    const { data: exportDocs = [], isLoading: isLoadingExport } = useExportDocsQuery();
    const { data: dispatchRecords = [], isLoading: isLoadingDispatch } = useDispatchQuery();
    const { data: processingBatches = [], isLoading: isLoadingProc } = useProcessingQuery();

    // Mutations
    const createMutation = useCreateInvoice();
    const { data: quotations = [], isLoading: isLoadingQuotations } = useQuotationsQuery();

    const [selectedQuotationId, setSelectedQuotationId] = useState<string>('');

    const isLoading = isLoadingYard || isLoadingExport || isLoadingDispatch || isLoadingProc || isLoadingSettings || isLoadingClients || isLoadingQuotations;


    const [creationMode, setCreationMode] = useState<'quotation' | 'manual' | null>(null);

    const [formData, setFormData] = useState({
        clientId: '',
        shipmentId: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        poNumber: '',
        paymentTerms: 'net30',
        notes: ''
    });

    const [lineItems, setLineItems] = useState<any[]>([]);

    const [discountType, setDiscountType] = useState<'Percentage' | 'Fixed'>('Percentage');
    const [discountValue, setDiscountValue] = useState(0);
    const [vatPercentage, setVatPercentage] = useState(7.5);

    useEffect(() => {
        if (companySettings) {
            setDiscountType(companySettings.defaultDiscountType || 'Percentage');
            setDiscountValue(companySettings.defaultDiscountValue || 0);
            setVatPercentage(companySettings.vatPercentage || 7.5);
            if (companySettings.currency) {
                setCurrency(companySettings.currency);
            }
        }
    }, [companySettings]);

    const selectedClient = useMemo(() => {
        if (!formData.clientId || !clients.length) return null;
        return clients.find((c: any) => (c.id || c._id)?.toString() === formData.clientId);
    }, [clients, formData.clientId]);

    const availableYardIntakes = useMemo(() => {
        if (!selectedClient) return [];
        const clientName = (selectedClient.name || '').trim().toLowerCase();

        return (yardIntake || []).filter(item => {
            const customerName = (item.customerName || '').trim().toLowerCase();
            const supplier = (item.supplier || '').trim().toLowerCase();
            return (customerName === clientName || supplier === clientName) && item.status !== 'Invoiced';
        });
    }, [yardIntake, selectedClient]);

    const availableExportDocs = useMemo(() => {
        if (!selectedClient) return [];
        const clientName = (selectedClient.name || '').trim().toLowerCase();

        return exportDocs.filter((expDoc: any) => {
            // Check direct customer name
            const customerName = (expDoc.customer || '').trim().toLowerCase();
            if (customerName === clientName) return true;

            // Check linked dispatch supplier name for traceability
            if (expDoc.dispatchId) {
                const dispatch = dispatchRecords.find((d: any) => d.dispatchId === expDoc.dispatchId);
                if (dispatch) {
                    const supplierName = (dispatch.supplierName || '').trim().toLowerCase();
                    if (supplierName === clientName) return true;
                }
            }

            return false;
        });
    }, [exportDocs, selectedClient, dispatchRecords]);

    const shipmentData = useMemo(() => {
        if (!formData.shipmentId) return null;
        const shipment = exportDocs.find((d: any) => d.shipmentId === formData.shipmentId);
        if (!shipment || !shipment.dispatchId) {
            return shipment ? { shipment, dispatch: null, batch: null, minerals: [] } : null;
        }

        const dispatch = dispatchRecords.find((d: any) => d.dispatchId === shipment.dispatchId);
        if (!dispatch) return { shipment, dispatch: null, batch: null, minerals: [] };

        const batch = processingBatches.find(b => b.batchId === dispatch.batchId);
        const batchObj = batch as any;
        const minerals = batch
            ? (Array.isArray(batch.rawMaterial) ? batch.rawMaterial
                : (Array.isArray(batchObj.mineralType) ? batchObj.mineralType
                    : (Array.isArray(batchObj.materialType) ? batchObj.materialType
                        : [batch.rawMaterial || batchObj.mineralType || batchObj.materialType])))
            : [];

        // Filter out undefined/null minerals
        const validMinerals = minerals.filter((m: any) => m !== undefined && m !== null);

        return { shipment, dispatch, batch, minerals: validMinerals };
    }, [formData.shipmentId, exportDocs, dispatchRecords, processingBatches]);

    const yardIntakeOptions = useMemo(() => {
        const existingProducts = new Set(lineItems.filter(li => li.description).map(li => li.description));

        let allMinerals: string[] = [];
        if (shipmentData && (shipmentData.minerals ?? []).length > 0) {
            allMinerals = shipmentData.minerals as string[];
        } else {
            // Fallback to all client intakes only if no shipment is selected or has no minerals
            allMinerals = availableYardIntakes.flatMap(item => {
                const types = item.mineralType;
                if (!types) return [];
                const array = Array.isArray(types) ? types : [types];
                return array.map((t: any) => {
                    if (typeof t === 'string') return t;
                    return t?.name || t?.material || 'Unknown';
                });
            });
        }

        const uniqueTypes = Array.from(new Set(allMinerals));

        return uniqueTypes
            .filter(type => !existingProducts.has(type))
            .map(type => ({
                label: type,
                value: type
            }));
    }, [availableYardIntakes, lineItems, shipmentData]);

    const handleYardIntakeSelect = (id: number, selectedValue: string) => {
        const isAlreadyAdded = lineItems.some(li => li.description === selectedValue && li.id !== id);
        if (isAlreadyAdded) {
            toast.warning(`${selectedValue} is already added to the line items.`);
            return;
        }

        const item = availableYardIntakes.find((yi: any) => {
            const mType = yi.mineralType;
            if (!mType) return false;

            if (Array.isArray(mType)) {
                return (mType as any[]).some((t: any) => {
                    if (typeof t === 'string') return t === selectedValue;
                    return t && typeof t === 'object' && (t.name === selectedValue || t.material === selectedValue);
                });
            }
            if (typeof mType === 'string') return mType === selectedValue;
            return mType && typeof mType === 'object' && ((mType as any).name === selectedValue || (mType as any).material === selectedValue);
        });

        if (item) {
            setLineItems(lineItems.map(li => {
                if (li.id === id) {
                    return {
                        ...li,
                        description: selectedValue,
                        quantity: 1,
                        amount: 1 * li.rate
                    };
                }
                return li;
            }));
            toast.success(`Imported product: ${selectedValue}`);
        } else {
            setLineItems(lineItems.map(li => {
                if (li.id === id) {
                    return {
                        ...li,
                        description: selectedValue,
                        quantity: 1,
                        amount: 1 * li.rate
                    };
                }
                return li;
            }));
        }
    };

    const handleLoadYardIntakes = (forceReset = false) => {
        if (!availableYardIntakes.length) {
            toast.error('No available Yard Intake records found for this client.');
            if (forceReset) setLineItems([]);
            return;
        }

        const currentItems = forceReset ? [] : lineItems;
        const existingProducts = new Set(currentItems.filter(li => li.description).map(li => li.description));
        const uniqueMineralsToLoad: string[] = [];
        const seenMinerals = new Set();

        if (shipmentData && shipmentData.minerals.length > 0) {
            shipmentData.minerals.forEach((mineral: string) => {
                if (!seenMinerals.has(mineral) && !existingProducts.has(mineral)) {
                    uniqueMineralsToLoad.push(mineral);
                    seenMinerals.add(mineral);
                }
            });
        } else {
            availableYardIntakes.forEach(item => {
                const mineralType = item.mineralType;
                if (!mineralType) return;

                const minerals = Array.isArray(mineralType) ? mineralType : [mineralType];
                minerals.forEach((m) => {
                    const mineral = typeof m === 'string' ? m : (m as any)?.name || (m as any)?.material;
                    if (mineral && !seenMinerals.has(mineral) && !existingProducts.has(mineral)) {
                        uniqueMineralsToLoad.push(mineral);
                        seenMinerals.add(mineral);
                    }
                });
            });
        }

        if (uniqueMineralsToLoad.length === 0) {
            if (!forceReset) toast.info('All available products are already in the line items.');
            if (forceReset) setLineItems([]);
            return;
        }

        const newItems = uniqueMineralsToLoad.map((mineral, index) => ({
            id: Date.now() + index,
            description: mineral,
            quantity: 1,
            rate: 0,
            amount: 0
        }));

        setLineItems([...currentItems, ...newItems]);
        if (!forceReset) toast.info(`Added ${newItems.length} unique products.`);
    };

    useEffect(() => {
        // Clear items when client selection changes to prepare for new shipment selection
        // BUT don't do it if we're in quotation mode, as we just populated them
        if (creationMode !== 'quotation') {
            setLineItems([]);
        }
    }, [formData.clientId, creationMode]);

    useEffect(() => {
        // Auto-populate line items when shipment is selected
        if (formData.shipmentId && shipmentData) {
            if (shipmentData.minerals && shipmentData.minerals.length > 0) {
                const newItems = shipmentData.minerals.map((mineral: string, index: number) => ({
                    id: Date.now() + index,
                    description: mineral,
                    quantity: 1,
                    rate: 0,
                    amount: 0
                }));
                setLineItems(newItems);
                toast.success(`Loaded ${newItems.length} products from shipment: ${formData.shipmentId}`);
            } else {
                setLineItems([]);
            }
        }
    }, [formData.shipmentId, shipmentData]);

    const addLineItem = () => {
        setLineItems([
            ...lineItems,
            { id: Date.now(), description: '', quantity: 1, rate: 0, amount: 0 }
        ]);
    };

    const removeLineItem = (id: number) => {
        if (lineItems.length > 1) {
            setLineItems(lineItems.filter(item => item.id !== id));
        }
    };

    const updateLineItem = (id: number, field: string, value: any) => {
        setLineItems(lineItems.map(item => {
            if (item.id === id) {
                const updated = { ...item, [field]: value };
                if (field === 'quantity' || field === 'rate') {
                    updated.amount = updated.quantity * updated.rate;
                }
                return updated;
            }
            return item;
        }));
    };

    const subtotal = useMemo(() => {
        return lineItems.reduce((sum, item) => sum + item.amount, 0);
    }, [lineItems]);

    const discount = useMemo(() => {
        if (discountType === 'Percentage') {
            return subtotal * (discountValue / 100);
        }
        return discountValue;
    }, [subtotal, discountType, discountValue]);

    const tax = useMemo(() => {
        return (subtotal - discount) * (vatPercentage / 100);
    }, [subtotal, discount, vatPercentage]);

    const total = useMemo(() => {
        return subtotal - discount + tax;
    }, [subtotal, discount, tax]);

    const handleQuotationSelect = (quotationId: string) => {
        setSelectedQuotationId(quotationId);
        const quotation = quotations.find((q: any) => q.id === quotationId);
        if (quotation) {
            // Find client by name (case-insensitive and trimmed)
            const qClientName = (quotation.client || '').trim().toLowerCase();
            const client = clients.find((c: any) => (c.name || '').trim().toLowerCase() === qClientName);

            if (client) {
                setFormData(prev => ({ ...prev, clientId: (client.id || client._id).toString() }));
            } else {
                toast.warning(`Client "${quotation.client}" not found in database. Please select client manually.`);
                // We still want to show the items, so we need a clientId to trigger the render
                // Let's not set it automatically if not found, user must pick.
            }

            // Set currency
            if (quotation.currency) {
                setCurrency(quotation.currency as CurrencyCode);
            }

            // Populate line items
            const newItems = quotation.lineItems.map((item: any, index: number) => ({
                id: Date.now() + index,
                description: item.description,
                quantity: item.quantity,
                rate: item.rate,
                amount: item.total || (item.quantity * item.rate)
            }));
            setLineItems(newItems);

            // Populate financial details
            setDiscountValue(quotation.discount || 0);
            if (quotation.subtotal > 0) {
                const calculatedVat = (quotation.vat / (quotation.subtotal - (quotation.discount || 0))) * 100;
                setVatPercentage(parseFloat(calculatedVat.toFixed(1)));
            }

            // Notes
            setFormData(prev => ({ ...prev, notes: quotation.notes || '' }));

            toast.success(`Imported data from Quotation ${quotation.quotationNo}`);
        }
    };

    const handleCreateInvoice = async () => {
        const invalidItems = lineItems.some(item => !item.description || item.quantity <= 0 || item.rate <= 0);

        const isShipmentRequired = creationMode !== 'quotation';
        if (!formData.clientId || (isShipmentRequired && !formData.shipmentId) || total <= 0 || invalidItems) {
            toast.error(
                !formData.clientId ? 'Please select a client.' :
                (isShipmentRequired && !formData.shipmentId) ? 'Please select a shipment reference.' :
                total <= 0 ? 'Invoice total must be greater than zero.' :
                'Please ensure all line items have description, quantity, and rate.'
            );
            return;
        }

        const newInvoice = {
            invoiceNo: `INV-${Math.floor(100000 + Math.random() * 900000)}`,
            client: selectedClient?.name || 'Unknown',
            clientId: formData.clientId,
            shipmentId: formData.shipmentId || 'N/A',
            amount: total,
            subtotal: subtotal,
            discount: discount,
            vat: tax,
            dateTime: new Date(formData.invoiceDate).toISOString(),
            status: 'Pending' as 'Pending',
            avatar: (selectedClient?.name || 'U').charAt(0).toUpperCase(),
            lineItems: lineItems.map(item => ({
                description: item.description,
                quantity: item.quantity,
                rate: item.rate,
                total: item.amount
            })),
            currency: currency,
            quotationId: selectedQuotationId || undefined
        };

        try {
            await createMutation.mutateAsync(newInvoice as any);
            navigate('/invoices-financials');
        } catch (error) {
            // Mutation handles toast
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-[#974926]" />
                    <p className="text-gray-500 font-medium">Preparing invoice data...</p>
                </div>
            </div>
        );
    }


    return (
        <div className="min-h-screen bg-slate-50/50 pb-20">
            {/* Sticky Top Header */}
            <div className="sticky top-0 z-10 bg-white border-b shadow-sm px-8 py-4 flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Create New Invoice</h1>
                        <p className="text-xs text-gray-500">Drafting invoice for approval and dispatch</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={() => navigate(-1)}>Discard Draft</Button>
                    <Button onClick={handleCreateInvoice} className="bg-[#203727] hover:bg-[#2d4d39] gap-2 px-6">
                        <Save className="h-4 w-4" />
                        Save & Finalize
                    </Button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 space-y-8">
                {/* Mode Selection */}
                {!creationMode && (
                    <div className="grid grid-cols-2 gap-8 max-w-4xl mx-auto pt-12">
                        <Card
                            className="p-8 border-2 border-dashed border-blue-200 hover:border-blue-500 hover:bg-blue-50/50 cursor-pointer transition-all group text-center"
                            onClick={() => setCreationMode('quotation')}
                        >
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                <Quote className="h-8 w-8 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">From Quotation</h3>
                            <p className="text-sm text-gray-500">Auto-populate all data from an existing approved quotation</p>
                        </Card>

                        <Card
                            className="p-8 border-2 border-dashed border-slate-200 hover:border-[#203727] hover:bg-slate-50 cursor-pointer transition-all group text-center"
                            onClick={() => setCreationMode('manual')}
                        >
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                <FileText className="h-8 w-8 text-slate-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Without Quotation</h3>
                            <p className="text-sm text-gray-500">Create a manual invoice or link to a shipment record</p>
                        </Card>
                    </div>
                )}

                {creationMode && (
                    <div className="grid grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Left Column: Form Info */}
                        <div className="col-span-8 space-y-8">
                            {creationMode === 'quotation' && (
                                <Card className="p-8 shadow-sm border-blue-200 bg-blue-50/10">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-2 text-blue-700">
                                            <Quote className="h-5 w-5" />
                                            <h3 className="font-bold uppercase tracking-wider text-sm">Select Quotation</h3>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => setCreationMode(null)} className="text-blue-600 hover:text-blue-800">
                                            Change Mode
                                        </Button>
                                    </div>

                                    <div className="space-y-3">
                                        <Select value={selectedQuotationId} onValueChange={handleQuotationSelect}>
                                            <SelectTrigger className="h-12 border-blue-200 focus:ring-blue-500 bg-white">
                                                <SelectValue placeholder="Which quotation are we invoicing?" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {quotations.map((q: any) => (
                                                    <SelectItem key={q.id} value={q.id}>
                                                        {q.quotationNo} - {q.client} ({q.currency} {q.amount.toLocaleString()})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </Card>
                            )}

                            {/* 1. Basic Info Card */}
                            <Card className="p-8 shadow-sm border-slate-200">
                                <div className="flex items-center gap-2 mb-6 text-[#203727]">
                                    <Info className="h-5 w-5" />
                                    <h3 className="font-bold uppercase tracking-wider text-sm">Invoice Essentials</h3>
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <Label className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                            <Building2 className="h-3 w-3" />
                                            Select Client
                                        </Label>
                                        <Select value={formData.clientId} onValueChange={(v) => setFormData({ ...formData, clientId: v })} disabled={creationMode === 'quotation' && !!formData.clientId}>
                                            <SelectTrigger className="h-12 border-slate-200 focus:ring-[#203727]">
                                                <SelectValue placeholder="Which client is this for?" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {clients.map((c: any) => (
                                                    <SelectItem key={c.id || c._id} value={(c.id || c._id).toString()}>
                                                        {c.name} ({c.tin})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {creationMode !== 'quotation' && (
                                        <div className="space-y-3">
                                            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                                <Calendar className="h-3 w-3" />
                                                Shipment Reference
                                            </Label>
                                            <Select value={formData.shipmentId} onValueChange={(v) => {
                                                setFormData({ ...formData, shipmentId: v });
                                            }}>
                                                <SelectTrigger className="h-12 border-slate-200 focus:ring-[#203727]">
                                                    <SelectValue placeholder="Linked Shipment ID" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {availableExportDocs.map((sh: any) => (
                                                        <SelectItem key={sh.id || sh._id} value={sh.shipmentId}>
                                                            {sh.shipmentId} {sh.destination ? `(${sh.destination})` : ''}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-3 gap-6 mt-8 pt-8 border-t border-slate-100">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-500 uppercase">Issue Date</Label>
                                        <Input
                                            type="date"
                                            value={formData.invoiceDate}
                                            onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                                            className="h-11 border-slate-200"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-500 uppercase">Due Date</Label>
                                        <Input
                                            type="date"
                                            value={formData.dueDate}
                                            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                            className="h-11 border-slate-200"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-500 uppercase">PO Number</Label>
                                        <Input
                                            placeholder="e.g. PO-8822"
                                            value={formData.poNumber}
                                            onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                                            className="h-11 border-slate-200 font-mono"
                                        />
                                    </div>
                                </div>
                            </Card>

                            {(formData.clientId || creationMode === 'quotation') && (
                                <>
                                    {lineItems.length > 0 ? (
                                        <>
                                            {/* 2. Line Items Card */}
                                            <Card className="shadow-sm border-slate-200 overflow-hidden">
                                                <div className="bg-slate-50/50 px-8 py-5 border-b flex items-center justify-between">
                                                    <div className="flex items-center gap-2 text-[#203727]">
                                                        <FileText className="h-5 w-5" />
                                                        <h3 className="font-bold uppercase tracking-wider text-sm">Line Items</h3>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {/* {availableYardIntakes.length > 0 && (
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleLoadYardIntakes()}
                                                            className="bg-white hover:bg-slate-100 text-[#974926] border-[#974926]/20 transition-all shadow-sm"
                                                        >
                                                            <Package className="h-4 w-4 mr-2" />
                                                            Load from Yard Intake
                                                        </Button>
                                                    )} */}
                                                        <Button type="button" variant="outline" size="sm" onClick={addLineItem} className="bg-white hover:bg-[#203727] hover:text-white transition-all shadow-sm">
                                                            <Plus className="h-4 w-4 mr-2" />
                                                            Add New Line
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="p-8">
                                                    <div className="grid grid-cols-12 gap-6 mb-4 px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                        <div className="col-span-6">Services / Products Description</div>
                                                        <div className="col-span-2 text-center">Qty</div>
                                                        <div className="col-span-2 text-right">Unit Rate</div>
                                                        <div className="col-span-2 text-right">Total ({currencies[currency].symbol})</div>
                                                    </div>

                                                    <div className="space-y-4">
                                                        {lineItems.map((item) => (
                                                            <div key={item.id} className="grid grid-cols-12 gap-6 items-center group animate-in fade-in slide-in-from-top-2 duration-300">
                                                                <div className="col-span-6">
                                                                    <Combobox
                                                                        options={yardIntakeOptions}
                                                                        value={item.description}
                                                                        onValueChange={(val: string) => handleYardIntakeSelect(item.id, val)}
                                                                        placeholder="Select Product"
                                                                        allowCustom
                                                                        onCustomAdd={(val: string) => updateLineItem(item.id, 'description', val)}
                                                                    />
                                                                </div>
                                                                <div className="col-span-2">
                                                                    <Input
                                                                        type="number"
                                                                        placeholder="0"
                                                                        value={item.quantity}
                                                                        onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                                                        onFocus={(e) => e.target.select()}
                                                                        className="h-11 text-center border-slate-200 focus:ring-[#203727]"
                                                                    />
                                                                </div>
                                                                <div className="col-span-2">
                                                                    <Input
                                                                        type="number"
                                                                        placeholder="0.00"
                                                                        value={item.rate}
                                                                        onChange={(e) => updateLineItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                                                                        onFocus={(e) => e.target.select()}
                                                                        className="h-11 text-right border-slate-200 focus:ring-[#203727]"
                                                                    />
                                                                </div>
                                                                <div className="col-span-2 flex items-center gap-3">
                                                                    <div className="flex-1 text-right font-mono font-bold text-slate-700 bg-slate-50/50 h-11 flex items-center justify-end px-4 rounded-md border border-slate-100 shadow-inner">
                                                                        {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                                    </div>
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => removeLineItem(item.id)}
                                                                        disabled={lineItems.length === 1}
                                                                        className="text-slate-300 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100 h-9 w-9"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </Card>

                                            {/* 3. Notes Card */}
                                            <Card className="p-8 shadow-sm border-slate-200 space-y-4">
                                                <Label className="text-xs font-black uppercase text-slate-400 tracking-widest block">Additional Notes & Terms</Label>
                                                <Textarea
                                                    placeholder="Include specific bank branch, cargo handling terms, or custom instructions..."
                                                    className="min-h-[120px] border-slate-200 focus:ring-[#203727] p-4"
                                                    value={formData.notes}
                                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                                />
                                            </Card>
                                        </>
                                    ) : (
                                        <div className="p-12 text-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                                            <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center shadow-sm mx-auto mb-4 border border-slate-100">
                                                <Package className="h-5 w-5 text-slate-300" />
                                            </div>
                                            <p className="text-slate-500 font-medium mb-1">No products found for this client</p>
                                            <p className="text-xs text-slate-400 mb-6 font-mono">Invoice may require manual entry or Yard Intake record creation</p>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={addLineItem}
                                                className="h-11 px-6 border-slate-200 hover:border-[#203727] hover:bg-slate-50 transition-all font-bold group"
                                            >
                                                <Plus className="h-4 w-4 mr-2 text-slate-400 group-hover:text-[#203727]" />
                                                Create Manual Line Item
                                            </Button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Right Column: Summaries & Previews */}
                        <div className="col-span-4 space-y-8">
                            {/* Bill To Preview Wrapper */}
                            <div className="bg-[#203727] rounded-2xl p-8 text-white shadow-xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-white/10 transition-all duration-700"></div>

                                <div className="relative z-10 space-y-6">
                                    <div>
                                        <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                                            Billing Details
                                        </h3>
                                        {selectedClient ? (
                                            <div className="space-y-4">
                                                <p className="text-2xl font-black">{selectedClient.name}</p>
                                                <div className="space-y-2 opacity-80 text-sm">
                                                    <p className="leading-relaxed border-l-2 border-white/20 pl-4">{selectedClient.address}</p>
                                                    <div className="flex items-center gap-2 pt-2">
                                                        <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] font-bold">TIN NUMBER</span>
                                                        <p className="font-mono text-xs">{selectedClient.tin}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 border border-white/10 rounded-xl bg-black/5">
                                                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                                                    <Building2 className="h-5 w-5 opacity-30" />
                                                </div>
                                                <p className="text-sm opacity-40 max-w-[180px]">Select a client to see billing preview</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-6 border-t border-white/10">
                                        <Label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] block mb-3">Invoice Currency</Label>
                                        <Select value={currency} onValueChange={(v: CurrencyCode) => setCurrency(v)}>
                                            <SelectTrigger className="w-full bg-white/5 border-white/10 h-12 hover:bg-white/10 transition-all">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.values(currencies).map((c: any) => (
                                                    <SelectItem key={c.code} value={c.code}>{c.label} ({c.symbol})</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {formData.clientId && lineItems.length > 0 && (
                                /* Financial Summary Card */
                                <div className="bg-[#1a1a1a] rounded-2xl p-8 text-white shadow-2xl space-y-8 sticky top-28">
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center text-slate-400 border-b border-white/5 pb-4">
                                            <span className="text-sm font-medium">Subtotal</span>
                                            <span className="font-mono text-lg">{formatCurrency(subtotal, false)}</span>
                                        </div>

                                        <div className="space-y-4 pt-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-slate-400">Apply Discount</span>
                                                <div className="flex gap-1 bg-white/5 p-1 rounded-lg">
                                                    <button
                                                        type="button"
                                                        onClick={() => setDiscountType('Percentage')}
                                                        className={`px-3 py-1 rounded text-[10px] uppercase font-black transition-all ${discountType === 'Percentage' ? 'bg-white text-black shadow-lg shadow-white/10' : 'text-slate-500 hover:text-white'}`}
                                                    >%</button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDiscountType('Fixed')}
                                                        className={`px-3 py-1 rounded text-[10px] uppercase font-black transition-all ${discountType === 'Fixed' ? 'bg-white text-black shadow-lg shadow-white/10' : 'text-slate-500 hover:text-white'}`}
                                                    >Fix</button>
                                                </div>
                                            </div>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    className="h-12 text-right font-mono bg-white/5 border-white/10 text-white focus:ring-[#203727] text-lg pl-10"
                                                    value={discountValue}
                                                    onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                                                />
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-20 hover:opacity-100 transition-opacity">
                                                    <CreditCard className="h-4 w-4" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-4 border-t border-white/5">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-slate-400">VAT Configuration (%)</span>
                                            </div>
                                            <Input
                                                type="number"
                                                step="0.1"
                                                className="h-12 text-right font-mono bg-white/5 border-white/10 text-white focus:ring-[#203727] text-lg"
                                                value={vatPercentage}
                                                onChange={(e) => setVatPercentage(parseFloat(e.target.value) || 0)}
                                            />
                                            <div className="flex justify-between text-sm font-bold text-[#974926] bg-[#974926]/10 px-4 py-2 rounded-lg">
                                                <span>VAT Amount:</span>
                                                <span>{formatCurrency(tax, false)}</span>
                                            </div>
                                        </div>

                                        <div className="pt-8 border-t-2 border-[#203727] flex justify-between items-end bg-gradient-to-t from-[#203727]/10 to-transparent -mx-8 px-8 pb-4">
                                            <div className="space-y-1">
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Grand Total Due</span>
                                                <div className="text-4xl font-black text-white">{formatCurrency(total, false)}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handleCreateInvoice}
                                        className="w-full h-14 text-base font-bold bg-[#203727] hover:bg-green-700 text-white shadow-xl shadow-green-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        Create & Download PDF
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
