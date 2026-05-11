import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
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
    useQuotationsQuery,
    useCreateQuotation,
    useUpdateQuotation
} from '../hooks/useQuotations';
import { Loader2 } from 'lucide-react';
import { useSettingsQuery } from '../hooks/useSettings';
import { useClientsQuery } from '../hooks/useClients';
import { currencies, CurrencyCode } from '../context/CurrencyContext';
import { toast } from 'sonner';
import { Combobox } from '../components/ui/combobox';
import { SendEmailDialog } from '../components/quotations/SendEmailDialog';

export function CreateQuotation() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;

    const { data: companySettings, isLoading: isLoadingSettings } = useSettingsQuery();
    const { data: clients = [], isLoading: isLoadingClients } = useClientsQuery();
    const { data: quotations = [] } = useQuotationsQuery();

    const [currency, setCurrency] = useState<CurrencyCode>('AED');
    const [status, setStatus] = useState<string>('Draft');
    const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
    const [createdQuotation, setCreatedQuotation] = useState<any>(null);

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

    // Mutations
    const createMutation = useCreateQuotation();
    const updateMutation = useUpdateQuotation();

    const [formData, setFormData] = useState({
        clientId: '',
        quotationDate: new Date().toISOString().split('T')[0],
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: '',
        subject: '',
        salesPerson: ''
    });

    const [lineItems, setLineItems] = useState<any[]>([
        { id: Date.now(), description: '', quantity: 1, rate: 0, amount: 0 }
    ]);

    const [discountType, setDiscountType] = useState<'Percentage' | 'Fixed'>('Percentage');
    const [discountValue, setDiscountValue] = useState(0);
    const [vatPercentage, setVatPercentage] = useState(7.5);

    useEffect(() => {
        if (companySettings) {
            setVatPercentage(companySettings.vatPercentage || 7.5);
            if (companySettings.currency) {
                setCurrency(companySettings.currency);
            }
        }
    }, [companySettings]);

    useEffect(() => {
        if (isEdit && quotations.length > 0) {
            const quotation = quotations.find((q: any) => q.id === id);
            if (quotation) {
                setFormData({
                    clientId: clients.find((c: any) => c.name === quotation.client)?.id || '',
                    quotationDate: new Date(quotation.date).toISOString().split('T')[0],
                    validUntil: quotation.validUntil ? new Date(quotation.validUntil).toISOString().split('T')[0] : '',
                    notes: quotation.notes || '',
                    subject: quotation.subject || '',
                    salesPerson: quotation.salesPerson || ''
                });
                setLineItems(quotation.lineItems.map((item: any, idx: number) => ({
                    id: Date.now() + idx,
                    description: item.description,
                    quantity: item.quantity,
                    rate: item.rate,
                    amount: item.total
                })));
                setCurrency(quotation.currency as CurrencyCode || 'AED');
                setStatus(quotation.status);
                setDiscountValue(quotation.discount || 0);
                setVatPercentage(quotation.vat ? (quotation.vat / (quotation.subtotal - (quotation.discount || 0))) * 100 : 7.5);
            }
        }
    }, [isEdit, id, quotations, clients]);

    const selectedClient = useMemo(() => {
        if (!formData.clientId || !clients.length) return null;
        return clients.find((c: any) => (c.id || c._id)?.toString() === formData.clientId);
    }, [clients, formData.clientId]);

    const materialOptions = useMemo(() => {
        return (companySettings?.materialTypes || []).map((m: string) => ({
            label: m,
            value: m
        }));
    }, [companySettings?.materialTypes]);

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

    const handleSaveQuotation = async () => {
        const invalidItems = lineItems.some(item => !item.description || item.quantity <= 0 || item.rate < 0);

        if (!formData.clientId || total < 0 || invalidItems) {
            toast.error('Please fill in all required fields and ensure all line items have description and quantity.');
            return;
        }

        const quotationData = {
            quotationNo: isEdit ? quotations.find((q: any) => q.id === id)?.quotationNo : `QTN-${Math.floor(100000 + Math.random() * 900000)}`,
            client: selectedClient?.name || 'Unknown',
            amount: total,
            subtotal: subtotal,
            discount: discount,
            vat: tax,
            date: new Date(formData.quotationDate).toISOString(),
            validUntil: formData.validUntil ? new Date(formData.validUntil).toISOString() : undefined,
            status: status as any,
            lineItems: lineItems.map(item => ({
                description: item.description,
                quantity: item.quantity,
                rate: item.rate,
                total: item.amount
            })),
            currency: currency,
            notes: formData.notes,
            subject: formData.subject,
            salesPerson: formData.salesPerson
        };

        try {
            if (isEdit) {
                await updateMutation.mutateAsync({ id: id as string, data: quotationData as any });
                navigate('/quotations');
            } else {
                const result = await createMutation.mutateAsync(quotationData as any);
                setCreatedQuotation(result);
                setIsEmailDialogOpen(true);
            }
        } catch (error) {}
    };

    if (isLoadingSettings || isLoadingClients) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-[#974926]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20">
            <div className="sticky top-0 z-10 bg-white border-b shadow-sm px-8 py-4 flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">{isEdit ? 'Edit Quotation' : 'Create New Quotation'}</h1>
                        <p className="text-xs text-gray-500">Drafting quotation for client review</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={() => navigate(-1)}>Discard</Button>
                    <Button onClick={handleSaveQuotation} className="bg-[#203727] hover:bg-[#2d4d39] gap-2 px-6">
                        <Save className="h-4 w-4" />
                        {isEdit ? 'Update Quotation' : 'Save Quotation'}
                    </Button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 space-y-8">
                <div className="grid grid-cols-12 gap-8">
                    <div className="col-span-8 space-y-8">
                        <Card className="p-8 shadow-sm border-slate-200">
                            <div className="flex items-center gap-2 mb-6 text-[#203727]">
                                <Info className="h-5 w-5" />
                                <h3 className="font-bold uppercase tracking-wider text-sm">Quotation Details</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                        <Building2 className="h-3 w-3" />
                                        Select Client
                                    </Label>
                                    <Select value={formData.clientId} onValueChange={(v) => setFormData({ ...formData, clientId: v })}>
                                        <SelectTrigger className="h-12 border-slate-200 focus:ring-[#203727]">
                                            <SelectValue placeholder="Which client is this for?" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {clients.map((c: any) => (
                                                <SelectItem key={c.id} value={c.id.toString()}>
                                                    {c.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                        Salesperson / Handler
                                    </Label>
                                    <Select value={formData.salesPerson} onValueChange={(v) => setFormData({ ...formData, salesPerson: v })}>
                                        <SelectTrigger className="h-12 border-slate-200 focus:ring-[#203727]">
                                            <SelectValue placeholder="Who is handling this?" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(companySettings?.salesPersons || []).map((s: string) => (
                                                <SelectItem key={s} value={s}>
                                                    {s}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="mt-8 space-y-3">
                                <Label className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                    Quotation Subject
                                </Label>
                                <Input
                                    placeholder="Enter a brief subject for this quotation..."
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    className="h-12 border-slate-200 focus:ring-[#203727]"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-slate-100">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-500 uppercase">Quotation Date</Label>
                                    <Input
                                        type="date"
                                        value={formData.quotationDate}
                                        onChange={(e) => setFormData({ ...formData, quotationDate: e.target.value })}
                                        className="h-11 border-slate-200"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-500 uppercase">Valid Until</Label>
                                    <Input
                                        type="date"
                                        value={formData.validUntil}
                                        onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                                        className="h-11 border-slate-200"
                                    />
                                </div>
                            </div>
                        </Card>

                        <Card className="shadow-sm border-slate-200 overflow-hidden">
                            <div className="bg-slate-50/50 px-8 py-5 border-b flex items-center justify-between">
                                <div className="flex items-center gap-2 text-[#203727]">
                                    <FileText className="h-5 w-5" />
                                    <h3 className="font-bold uppercase tracking-wider text-sm">Line Items</h3>
                                </div>
                                <Button type="button" variant="outline" size="sm" onClick={addLineItem} className="bg-white hover:bg-[#203727] hover:text-white transition-all shadow-sm">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Item
                                </Button>
                            </div>

                            <div className="p-8">
                                <div className="grid grid-cols-12 gap-6 mb-4 px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <div className="col-span-6">Description</div>
                                    <div className="col-span-2 text-center">Qty</div>
                                    <div className="col-span-2 text-right">Unit Rate</div>
                                    <div className="col-span-2 text-right">Total</div>
                                </div>

                                <div className="space-y-4">
                                    {lineItems.map((item) => (
                                        <div key={item.id} className="grid grid-cols-12 gap-6 items-center group animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="col-span-6">
                                                <Combobox
                                                    options={materialOptions}
                                                    value={item.description}
                                                    onValueChange={(v) => updateLineItem(item.id, 'description', v)}
                                                    placeholder="Select or enter material..."
                                                    allowCustom
                                                    onCustomAdd={(v) => updateLineItem(item.id, 'description', v)}
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <Input
                                                    type="number"
                                                    placeholder="0"
                                                    value={item.quantity}
                                                    onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                                    className="h-11 text-center border-slate-200 focus:ring-[#203727]"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <Input
                                                    type="number"
                                                    placeholder="0.00"
                                                    value={item.rate}
                                                    onChange={(e) => updateLineItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                                                    className="h-11 text-right border-slate-200 focus:ring-[#203727]"
                                                />
                                            </div>
                                            <div className="col-span-2 flex items-center gap-3">
                                                <div className="flex-1 text-right font-mono font-bold text-slate-700 bg-slate-50/50 h-11 flex items-center justify-end px-4 rounded-md border border-slate-100">
                                                    {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeLineItem(item.id)}
                                                    disabled={lineItems.length === 1}
                                                    className="text-slate-300 hover:text-red-600 h-9 w-9"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>

                        <Card className="p-8 shadow-sm border-slate-200 space-y-4">
                            <Label className="text-xs font-black uppercase text-slate-400 tracking-widest block">Notes & Terms</Label>
                            <Textarea
                                placeholder="Include any specific terms, validity conditions, or payment schedules..."
                                className="min-h-[120px] border-slate-200 focus:ring-[#203727] p-4"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </Card>
                    </div>

                    <div className="col-span-4 space-y-8">
                        <div className="bg-[#203727] rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
                            <div className="relative z-10 space-y-6">
                                <div>
                                    <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4">Quotation Settings</h3>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs text-white/60">Currency</Label>
                                            <Select value={currency} onValueChange={(v: CurrencyCode) => setCurrency(v)}>
                                                <SelectTrigger className="bg-white/5 border-white/10 h-12">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.values(currencies).map((c: any) => (
                                                        <SelectItem key={c.code} value={c.code}>{c.label} ({c.symbol})</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs text-white/60">Status</Label>
                                            <Select value={status} onValueChange={setStatus}>
                                                <SelectTrigger className="bg-white/5 border-white/10 h-12">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Draft">Draft</SelectItem>
                                                    <SelectItem value="Sent">Sent</SelectItem>
                                                    <SelectItem value="Accepted">Accepted</SelectItem>
                                                    <SelectItem value="Rejected">Rejected</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#1a1a1a] rounded-2xl p-8 text-white shadow-2xl space-y-8 sticky top-28">
                            <div className="space-y-6">
                                <div className="flex justify-between items-center text-slate-400 border-b border-white/5 pb-4">
                                    <span className="text-sm font-medium">Subtotal</span>
                                    <span className="font-mono text-lg">{formatCurrency(subtotal, false)}</span>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-400">VAT (%)</span>
                                        <span className="text-sm font-bold text-[#974926]">{formatCurrency(tax, false)}</span>
                                    </div>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        className="h-12 text-right font-mono bg-white/5 border-white/10 text-white"
                                        value={vatPercentage}
                                        onChange={(e) => setVatPercentage(parseFloat(e.target.value) || 0)}
                                    />
                                </div>

                                <div className="pt-8 border-t-2 border-[#203727] flex justify-between items-end">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Value</span>
                                        <div className="text-4xl font-black text-white">{formatCurrency(total, false)}</div>
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={handleSaveQuotation}
                                className="w-full h-14 text-base font-bold bg-[#203727] hover:bg-green-700 text-white shadow-xl transition-all"
                            >
                                {isEdit ? 'Update Quotation' : 'Create Quotation'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
            <SendEmailDialog
                isOpen={isEmailDialogOpen}
                onClose={() => navigate('/quotations')}
                quotation={createdQuotation}
                clientEmail={selectedClient?.email}
                onSuccess={() => navigate('/quotations')}
            />
        </div>
    );
}
