import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
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
import { Plus, Download, X, ExternalLink, DollarSign, FileText, Clock, Trash2, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { currencies, CurrencyCode } from '../context/CurrencyContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useQuotationsQuery, useDeleteQuotation, QuotationRecord } from '../hooks/useQuotations';
import { Loader2 } from 'lucide-react';
import { useSettingsQuery } from '../hooks/useSettings';
import { useClientsQuery } from '../hooks/useClients';
import api from '../api';
import { SendEmailDialog } from '../components/quotations/SendEmailDialog';
import { Mail } from 'lucide-react';

export function QuotationsManagement() {
  const navigate = useNavigate();
  const { data: quotations = [], isLoading: isLoadingQuotations } = useQuotationsQuery();
  const { data: companySettings, isLoading: isLoadingSettings } = useSettingsQuery();
  const { data: clients = [], isLoading: isLoadingClients } = useClientsQuery();
  const deleteMutation = useDeleteQuotation();

  const isLoading = isLoadingQuotations || isLoadingSettings || isLoadingClients;

  const formatCurrency = (amount: number, includeSymbol = true, useCode = false, customCurrency?: string) => {
    let currencyCode = customCurrency || companySettings?.currency || 'AED';

    // Safety check for currency code (extract first 3 letters if it's longer/symbolic)
    if (currencyCode && currencyCode.length > 3) {
      currencyCode = currencyCode.substring(0, 3).toUpperCase();
    }

    try {
      if (useCode) {
        return `${currencyCode} ${new Intl.NumberFormat('en-GH', {
          style: 'decimal',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(amount)}`;
      }
      return new Intl.NumberFormat('en-GH', {
        style: includeSymbol ? 'currency' : 'decimal',
        currency: currencyCode,
      }).format(amount);
    } catch (error) {
      console.warn(`Invalid currency code: ${currencyCode}, falling back to AED`);
      return new Intl.NumberFormat('en-GH', {
        style: includeSymbol ? 'currency' : 'decimal',
        currency: 'AED',
      }).format(amount);
    }
  };

  const [selectedRecord, setSelectedRecord] = useState<QuotationRecord | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);

  const handleRowClick = (quotation: any) => {
    setSelectedRecord(quotation);
  };

  const closePanel = () => {
    setSelectedRecord(null);
  };

  const toggleSelectItem = (id: string) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredQuotations = useMemo(() => {
    return quotations.filter(q =>
      q.quotationNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.client?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [quotations, searchTerm]);

  const stats = useMemo(() => {
    const total = quotations.reduce((acc, q) => acc + (q.amount || 0), 0);
    const draft = quotations.filter(q => q.status === 'Draft').reduce((acc, q) => acc + (q.amount || 0), 0);
    const sent = quotations.filter(q => q.status === 'Sent').reduce((acc, q) => acc + (q.amount || 0), 0);
    const accepted = quotations.filter(q => q.status === 'Accepted').reduce((acc, q) => acc + (q.amount || 0), 0);

    const totalCount = quotations.length;
    const acceptedPercent = totalCount > 0 ? (quotations.filter(q => q.status === 'Accepted').length / totalCount) * 100 : 0;

    return {
      total,
      draft,
      sent,
      accepted,
      acceptedPercent,
      totalCount
    };
  }, [quotations]);

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-[#974926]" />
          <p className="text-gray-500 font-medium">Loading quotations...</p>
        </div>
      </div>
    );
  }

  const downloadQuotation = (quotation: any) => {
    const doc = new jsPDF() as any;
    const currencyCodeFromSettings = (companySettings?.currency as CurrencyCode) || 'AED';
    const currentCurr = currencies[currencyCodeFromSettings] || currencies['AED'];
    const bank = currentCurr.bankDetails;

    // Company Header
    doc.setFillColor(32, 55, 39);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text(companySettings?.name.toUpperCase() || 'GME', 14, 20);
    doc.setFontSize(10);
    doc.text(`RC No: ${companySettings?.rcNumber} | TIN Number: ${companySettings?.tin}`, 14, 28);
    doc.text(`${companySettings?.email} | ${companySettings?.phone}`, 14, 34);

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text('QUOTATION', 196, 20, { align: 'right' });

    // Details
    doc.setFontSize(9);
    doc.setTextColor(200, 200, 200);
    doc.text(`Quotation No: ${quotation.quotationNo}`, 196, 26, { align: 'right' });
    doc.text(`Date: ${new Date(quotation.date).toLocaleDateString()}`, 196, 32, { align: 'right' });
    if (quotation.validUntil) {
      doc.text(`Valid Until: ${new Date(quotation.validUntil).toLocaleDateString()}`, 196, 38, { align: 'right' });
    }

    // Bill To
    doc.setTextColor(32, 55, 39);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('QUOTATION FOR:', 14, 55);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.text(quotation.client, 14, 62);

    const clientFound = clients.find((c: any) => c.name === quotation.client);
    if (clientFound) {
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      const splitAddress = doc.splitTextToSize(clientFound.address, 90);
      doc.text(splitAddress, 14, 68);
    }

    // Table
    const tableData = (quotation.lineItems || []).map((item: any) => [
      item.description,
      item.quantity,
      formatCurrency(item.rate, true, true, quotation.currency),
      formatCurrency((item.quantity * item.rate), true, true, quotation.currency)
    ]);

    autoTable(doc, {
      startY: 95,
      head: [['Description', 'Qty', 'Rate', 'Amount']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [32, 55, 39], textColor: [255, 255, 255] },
    });

    // Totals
    const finalY = (doc as any).lastAutoTable.finalY + 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);

    doc.text('Subtotal:', 140, finalY);
    doc.text(formatCurrency(quotation.subtotal || quotation.amount, false, true, quotation.currency), 196, finalY, { align: 'right' });

    if (quotation.discount > 0) {
      doc.text('Discount:', 140, finalY + 7);
      doc.text(`-${formatCurrency(quotation.discount, false, true, quotation.currency)}`, 196, finalY + 7, { align: 'right' });
    }

    if (quotation.vat > 0) {
      doc.text('VAT:', 140, finalY + 14);
      doc.text(formatCurrency(quotation.vat, false, true, quotation.currency), 196, finalY + 14, { align: 'right' });
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(32, 55, 39);
    doc.text('TOTAL AMOUNT:', 110, finalY + 25);
    doc.text(formatCurrency(quotation.amount, true, true, quotation.currency), 196, finalY + 25, { align: 'right' });

    if (quotation.notes) {
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('Notes:', 14, finalY + 40);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const splitNotes = doc.splitTextToSize(quotation.notes, 170);
      doc.text(splitNotes, 14, finalY + 47);
    }

    doc.save(`${quotation.quotationNo}.pdf`);
  };

  const handleBackendDownload = async (quotationId: string, quotationNo: string) => {
    try {
      const response = await api.get(`/quotations/${quotationId}/download`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Quotation_${quotationNo}.pdf`);
      document.body.appendChild(link);
      link.click();
      toast.success('PDF Downloaded from backend');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download PDF');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this quotation?')) {
      try {
        await deleteMutation.mutateAsync(id);
        if (selectedRecord?.id === id) setSelectedRecord(null);
      } catch (error) { }
    }
  };

  return (
    <div className="flex h-full gap-6">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Quotations</h1>
            <p className="text-sm text-gray-500 mt-1">Manage sales inquiries and quotations</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate('/quotations/new')}>
              <Plus className="h-4 w-4 mr-2" />
              New Quotation
            </Button>
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search quotations..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#203727]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>

        <Card className="flex-1 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-white border-b hover:bg-white">
                <TableHead className="w-12">
                  <input type="checkbox" className="rounded border-gray-300" />
                </TableHead>
                <TableHead className="text-gray-600 font-medium">Quotation #</TableHead>
                <TableHead className="text-gray-600 font-medium">Client</TableHead>
                <TableHead className="text-gray-600 font-medium">Status</TableHead>
                <TableHead className="text-gray-600 font-medium">Amount</TableHead>
                <TableHead className="text-gray-600 font-medium">Date</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuotations.map((quotation) => (
                <TableRow
                  key={quotation.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleRowClick(quotation)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      checked={selectedItems.includes(quotation.id)}
                      onChange={() => toggleSelectItem(quotation.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium text-gray-900">
                    #{quotation.quotationNo}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
                        {quotation.avatar}
                      </div>
                      <span className="text-gray-900">{quotation.client}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1 text-sm ${quotation.status === 'Accepted' ? 'text-green-600' :
                      quotation.status === 'Draft' ? 'text-gray-600' :
                        quotation.status === 'Sent' ? 'text-blue-600' : 'text-red-600'
                      }`}>
                      {quotation.status}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium text-gray-900">
                    {formatCurrency(quotation.amount, true, false, quotation.currency)}
                  </TableCell>
                  <TableCell className="text-gray-600">{new Date(quotation.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <button className="text-gray-400 hover:text-gray-600">
                      •••
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* <div className="w-80 flex-shrink-0 space-y-6">
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Quotation Stats</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Total Value</span>
              <span className="font-bold">{formatCurrency(stats.total)}</span>
            </div>
            <div className="flex justify-between items-center text-green-600">
              <span className="text-sm">Accepted</span>
              <span className="font-bold">{formatCurrency(stats.accepted)}</span>
            </div>
            <div className="flex justify-between items-center text-blue-600">
              <span className="text-sm">Sent</span>
              <span className="font-bold">{formatCurrency(stats.sent)}</span>
            </div>
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-500">Conversion Rate</span>
                <span className="text-xs font-bold">{stats.acceptedPercent.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${stats.acceptedPercent}%` }}></div>
              </div>
            </div>
          </div>
        </Card>
      </div> */}

      {selectedRecord && (
        <div className="fixed inset-y-0 right-0 w-[500px] bg-[#1a1a1a] text-white shadow-2xl z-50 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h2 className="font-semibold">Quotation #{selectedRecord.quotationNo}</h2>
            <button onClick={closePanel} className="text-gray-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <p className="text-sm text-gray-400 mb-1">Client</p>
              <p className="font-medium text-lg">{selectedRecord.client}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">Date</p>
                <p className="font-medium">{new Date(selectedRecord.date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Valid Until</p>
                <p className="font-medium">{selectedRecord.validUntil ? new Date(selectedRecord.validUntil).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-400 mb-2">Line Items</p>
              <div className="space-y-2">
                {selectedRecord.lineItems.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm bg-white/5 p-2 rounded">
                    <span>{item.description} (x{item.quantity})</span>
                    <span>{formatCurrency(item.total, true, true, selectedRecord.currency)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-700 pt-4 space-y-2">
              <div className="flex justify-between text-sm text-gray-400">
                <span>Subtotal:</span>
                <span>{formatCurrency(selectedRecord.subtotal || selectedRecord.amount, true, true, selectedRecord.currency)}</span>
              </div>
              {selectedRecord.discount > 0 && (
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Discount:</span>
                  <span>-{formatCurrency(selectedRecord.discount, true, true, selectedRecord.currency)}</span>
                </div>
              )}
              {selectedRecord.vat > 0 && (
                <div className="flex justify-between text-sm text-gray-400">
                  <span>VAT:</span>
                  <span>{formatCurrency(selectedRecord.vat, true, true, selectedRecord.currency)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-gray-800 mb-6">
                <span className="text-sm">Total Amount:</span>
                <span className="text-2xl font-bold">{formatCurrency(selectedRecord.amount, true, true, selectedRecord.currency)}</span>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="bg-white text-black hover:bg-gray-200" onClick={() => handleBackendDownload(selectedRecord.id, selectedRecord.quotationNo)}>
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
                <Button variant="outline" size="sm" className="bg-[#203727] border-0 text-white hover:bg-[#2d4d39]" onClick={() => setIsEmailDialogOpen(true)}>
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
                <Button variant="outline" size="sm" className="bg-transparent border-gray-600 text-white hover:bg-gray-800" onClick={() => navigate(`/quotations/edit/${selectedRecord.id}`)}>
                  Edit
                </Button>
                <Button variant="outline" size="sm" className="bg-red-900/20 border-red-900/50 text-red-500 hover:bg-red-900/40" onClick={() => handleDelete(selectedRecord.id)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <SendEmailDialog
        isOpen={isEmailDialogOpen}
        onClose={() => setIsEmailDialogOpen(false)}
        quotation={selectedRecord}
        clientEmail={clients.find((c: any) => c.name === selectedRecord?.client)?.email}
      />
    </div>
  );
}
