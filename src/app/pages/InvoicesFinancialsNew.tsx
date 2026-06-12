import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
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
import { Plus, Download, X, ExternalLink, DollarSign, TrendingUp, FileText, Clock, Trash2, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { currencies, CurrencyCode } from '../context/CurrencyContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useInvoicesQuery } from '../hooks/useInvoices';
import { Loader2 } from 'lucide-react';


import { useSettingsQuery } from '../hooks/useSettings';
import { useClientsQuery } from '../hooks/useClients';

export function InvoicesFinancials() {
  const navigate = useNavigate();
  const { data: invoices = [], isLoading: isLoadingInvoices } = useInvoicesQuery();
  const { data: companySettings, isLoading: isLoadingSettings } = useSettingsQuery();
  const { data: clients = [], isLoading: isLoadingClients } = useClientsQuery();

  const isLoading = isLoadingInvoices || isLoadingSettings || isLoadingClients;

  const formatCurrency = (amount: number, includeSymbol = true, customCurrency?: string) => {
    let currencyCode = customCurrency || companySettings?.currency || 'AED';

    // Safety check for currency code length
    if (currencyCode && (currencyCode as string).length > 3) {
      currencyCode = (currencyCode as string).substring(0, 3).toUpperCase();
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


  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);


  const handleRowClick = (invoice: any) => {
    navigate(`/invoices-financials/${invoice.invoiceNo}`);
  };

  const closePanel = () => {
    setSelectedRecord(null);
  };

  const toggleSelectItem = (id: string) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const stats = useMemo(() => {
    const total = invoices.reduce((acc, inv) => acc + (inv.amount || 0), 0);
    const paid = invoices.filter(inv => inv.status === 'Paid').reduce((acc, inv) => acc + (inv.amount || 0), 0);
    const pending = invoices.filter(inv => inv.status === 'Pending').reduce((acc, inv) => acc + (inv.amount || 0), 0);
    const overdue = invoices.filter(inv => inv.status === 'Overdue').reduce((acc, inv) => acc + (inv.amount || 0), 0);

    const paidPercent = total > 0 ? (paid / total) * 100 : 0;
    const pendingPercent = total > 0 ? (pending / total) * 100 : 0;
    const overduePercent = total > 0 ? (overdue / total) * 100 : 0;

    const avgValue = invoices.length > 0 ? total / invoices.length : 0;

    // Calculate Top Clients
    const clientMap: Record<string, { total: number, count: number, avatar: string }> = {};
    invoices.forEach(inv => {
      if (!clientMap[inv.client]) {
        clientMap[inv.client] = { total: 0, count: 0, avatar: inv.avatar || inv.client.substring(0, 2).toUpperCase() };
      }
      clientMap[inv.client].total += (inv.amount || 0);
      clientMap[inv.client].count += 1;
    });

    const topClients = Object.entries(clientMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return {
      total,
      paid,
      pending,
      overdue,
      paidPercent,
      pendingPercent,
      overduePercent,
      avgValue,
      topClients
    };
  }, [invoices]);

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-[#E8491F]" />
          <p className="text-gray-500 font-medium">Loading financial records...</p>
        </div>
      </div>
    );
  }

  const downloadInvoice = (invoice: any) => {
    const doc = new jsPDF() as any;
    const invCurrCode = (invoice.currency as CurrencyCode) || (companySettings?.currency as CurrencyCode) || 'AED';
    const currentCurr = currencies[invCurrCode] || currencies['AED'];
    const bank = currentCurr.bankDetails;

    // Company Header with GME Branding
    doc.setFillColor(13, 13, 13); // #0D0D0D - GME Deep Green
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text(companySettings?.name.toUpperCase() || 'BRITCORE', 14, 20);

    doc.setFontSize(10);
    doc.text(`RC No: ${companySettings?.rcNumber} | TIN Number: ${companySettings?.tin}`, 14, 28);
    doc.text(`${companySettings?.email} | ${companySettings?.phone}`, 14, 34);


    // Invoice Title
    doc.setTextColor(13, 13, 13);
    doc.setFontSize(20);
    doc.text('INVOICE', 196, 20, { align: 'right' });

    // Invoice Details Box
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Invoice Number: ${invoice.invoiceNo}`, 196, 28, { align: 'right' });
    doc.text(`Invoice Date: ${invoice.date}, 2026`, 196, 34, { align: 'right' });
    doc.text(`Shipment ID: ${invoice.shipmentId}`, 196, 40, { align: 'right' });

    // Bill To Section
    doc.setTextColor(13, 13, 13);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO:', 14, 55);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.text(invoice.client, 14, 62);

    const clientFound = clients.find((c: any) => c.name === invoice.client);
    if (clientFound) {
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      const splitAddress = doc.splitTextToSize(clientFound.address, 90);
      doc.text(splitAddress, 14, 68);
      doc.text(`TIN Number: ${clientFound.tin}`, 14, 68 + (splitAddress.length * 5));
    }

    // Line Items Table
    const tableData = (invoice.lineItems || []).map((item: any) => [
      item.description,
      item.quantity,
      formatCurrency(item.rate, true, invoice.currency),
      formatCurrency(item.quantity * item.rate, true, invoice.currency)
    ]);

    autoTable(doc, {
      startY: 95,
      head: [['Description', 'Qty', 'Rate', 'Amount']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [13, 13, 13],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold',
      },
    });

    // Totals Section
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    const totalsX = 145;

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('Subtotal:', totalsX, finalY);
    doc.text('Discount:', totalsX, finalY + 7);
    doc.text('VAT (7.5%):', totalsX, finalY + 14);

    doc.setDrawColor(13, 13, 13);
    doc.setLineWidth(0.5);
    doc.line(totalsX, finalY + 17, 196, finalY + 17);

    doc.setFontSize(11);
    doc.setTextColor(13, 13, 13);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL AMOUNT:', totalsX, finalY + 24);

    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.text(formatCurrency(invoice.subtotal || invoice.amount, false, invoice.currency), 196, finalY, { align: 'right' });
    doc.text(`-${formatCurrency(invoice.discount || 0, false, invoice.currency)}`, 196, finalY + 7, { align: 'right' });
    doc.text(formatCurrency(invoice.vat || 0, false, invoice.currency), 196, finalY + 14, { align: 'right' });

    doc.setFontSize(12);
    doc.setTextColor(13, 13, 13);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(invoice.amount, false, invoice.currency), 196, finalY + 24, { align: 'right' });

    // Bank Details
    const bankY = finalY + 35;
    doc.setFillColor(245, 245, 245);
    doc.rect(14, bankY, 182, 30, 'F');

    doc.setTextColor(13, 13, 13);
    doc.setFontSize(10);
    doc.text('PAYMENT INFORMATION', 18, bankY + 8);

    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'normal');
    doc.text(`Bank Name: ${bank.bankName}`, 18, bankY + 14);
    doc.text(`Account Name: ${bank.accountName}`, 18, bankY + 20);
    doc.text(`Account Number: ${bank.accountNumber}`, 18, bankY + 26);
    if (bank.routingNumber) {
      doc.text(`${bank.routingNumber}`, 110, bankY + 26);
    }

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Thank you for your business!', 105, 280, { align: 'center' });

    doc.save(`${invoice.invoiceNo}.pdf`);
  };

  return (
    <div className="flex h-full gap-6">
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Invoices & Financials</h1>
            <p className="text-sm text-gray-500 mt-1">Manage invoices, payments, and financial records</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={() => toast.success('Exporting invoice data...')}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              size="sm"
              className="bg-[#0D0D0D] hover:bg-[#1A1A1A]"
              onClick={() => navigate('/invoices-financials/new')}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Invoice
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
                <TableHead className="text-gray-600 font-medium">Invoice #</TableHead>
                <TableHead className="text-gray-600 font-medium">Client</TableHead>
                <TableHead className="text-gray-600 font-medium">Shipment</TableHead>
                <TableHead className="text-gray-600 font-medium">Status</TableHead>
                <TableHead className="text-gray-600 font-medium">Amount</TableHead>
                <TableHead className="text-gray-600 font-medium">Date</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow
                  key={invoice.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleRowClick(invoice)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      checked={selectedItems.includes(invoice.id)}
                      onChange={() => toggleSelectItem(invoice.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium text-gray-900">
                    #{invoice.invoiceNo}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
                        {invoice.avatar}
                      </div>
                      <span className="text-gray-900">{invoice.client}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-[#E8491F] font-medium">{invoice.shipmentId}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1 text-sm ${invoice.status === 'Paid' ? 'text-green-600' :
                      invoice.status === 'Pending' ? 'text-orange-600' : 'text-gray-600'
                      }`}>
                      {invoice.status === 'Paid' && '✓'}
                      {invoice.status === 'Pending' && '○'}
                      {invoice.status}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium text-gray-900">
                    {formatCurrency(invoice.amount, true, invoice.currency)}
                  </TableCell>
                  <TableCell className="text-gray-600">{invoice.date}</TableCell>
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

        {/* Selection Actions */}
        {selectedItems.length > 0 && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-[#0D0D0D] text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-4 z-40">
            <button onClick={() => setSelectedItems([])}>
              <X className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium">Selected: {selectedItems.length}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="bg-white text-[#0D0D0D] hover:bg-gray-100" onClick={() => toast.success('Exporting selected...')}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button size="sm" variant="outline" className="bg-white text-[#0D0D0D] hover:bg-gray-100" onClick={() => toast.success('Printing selected...')}>
                Print
              </Button>
              <Button size="sm" variant="outline" className="bg-white text-[#0D0D0D] hover:bg-gray-100" onClick={() => toast.success('Emails queued...')}>
                Send Email
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar - Financial Stats */}
      <div className="w-80 flex-shrink-0 space-y-6">
        {/* Revenue Overview */}
        <Card className="p-6">
          <div className="text-center mb-6">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-4">Total Revenue</p>
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
                  stroke="#E8491F"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${(stats.paidPercent / 100) * 352} 352`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                <p className="text-lg font-bold text-center leading-tight">{formatCurrency(stats.total)}</p>
                <p className="text-[10px] text-gray-500 mt-1">Overall</p>
              </div>
            </div>
          </div>
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Paid invoices</p>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3 text-green-600" />
                  <span className="text-base font-semibold text-gray-900">{formatCurrency(stats.paid)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Pending</p>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-orange-600" />
                  <span className="text-base font-semibold text-gray-900">{formatCurrency(stats.pending)}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Payment Status */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Payment Status</h3>
            <button className="text-sm text-gray-500">This month ▼</button>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-700">Paid</span>
              </div>
              <span className="text-sm font-medium">{stats.paidPercent.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${stats.paidPercent}%` }}></div>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                <span className="text-sm text-gray-700">Pending</span>
              </div>
              <span className="text-sm font-medium">{stats.pendingPercent.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: `${stats.pendingPercent}%` }}></div>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-sm text-gray-700">Overdue</span>
              </div>
              <span className="text-sm font-medium">{stats.overduePercent.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${stats.overduePercent}%` }}></div>
            </div>
          </div>
        </Card>

        {/* Financial Overview */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Overview</h3>
            <button className="text-sm text-gray-500">This month ▼</button>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-50">
              <p className="text-xs text-gray-500">Avg. invoice value</p>
              <p className="text-sm font-semibold text-gray-900">{formatCurrency(stats.avgValue)}</p>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-gray-50">
              <p className="text-xs text-gray-500">Total billed</p>
              <p className="text-sm font-semibold text-gray-900">{formatCurrency(stats.total)}</p>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-gray-50">
              <p className="text-xs text-gray-500">Total invoices</p>
              <p className="text-sm font-semibold text-gray-900">{invoices.length}</p>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-gray-50">
              <p className="text-xs text-gray-500">Avg. payment time</p>
              <p className="text-sm font-semibold text-gray-900">3.2 days</p>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-gray-50">
              <p className="text-xs text-gray-500">Default rate</p>
              <p className="text-sm font-semibold text-gray-900">0.8%</p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500">Outstanding</p>
              <p className="text-sm font-semibold text-gray-900">{formatCurrency(stats.pending + stats.overdue)}</p>
            </div>
          </div>
        </Card>

        {/* Top Clients */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Top Clients</h3>
            <button className="text-sm text-gray-500">This month ▼</button>
          </div>
          <div className="space-y-3">
            {stats.topClients.map((client, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                    {client.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{client.name}</p>
                    <p className="text-xs text-gray-500">{client.count} invoices</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-[#E8491F]">{formatCurrency(client.total)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Detail Panel */}
      {selectedRecord && (
        <div className="fixed inset-y-0 right-0 w-[500px] bg-[#1a1a1a] text-white shadow-2xl z-50 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <h2 className="font-semibold">Invoice #{selectedRecord.invoiceNo}</h2>
              <button
                className="text-gray-400 hover:text-white"
                onClick={() => navigate(`/invoices-financials/${selectedRecord.invoiceNo}`)}
              >
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>
            <button onClick={closePanel} className="text-gray-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Client Info */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="h-4 w-4 rounded-full bg-gray-600 flex items-center justify-center text-xs">
                  {selectedRecord.avatar}
                </div>
                <p className="font-medium">{selectedRecord.client}</p>
              </div>
              <p className="text-sm text-gray-400">client@company.com</p>
              <p className="text-sm text-gray-400">+1 (555) 123-4567</p>
            </div>

            {/* Invoice Details */}
            <div>
              <h3 className="font-medium text-sm mb-4">Invoice Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Shipment ID</span>
                  <span className="font-medium">{selectedRecord.shipmentId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Issue Date</span>
                  <span className="font-medium">{selectedRecord.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status</span>
                  <span className={`font-medium ${selectedRecord.status === 'Paid' ? 'text-green-400' : 'text-orange-400'
                    }`}>
                    {selectedRecord.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Amount */}
            <div className="border-t border-gray-700 pt-4">
              <div className="flex justify-between mb-4">
                <span className="text-sm">Total Amount:</span>
                <span className="text-2xl font-bold">{formatCurrency(selectedRecord.amount, true, selectedRecord.currency)}</span>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-transparent border-gray-600 text-white hover:bg-gray-800"
                  onClick={() => downloadInvoice(selectedRecord)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button variant="outline" size="sm" className="bg-transparent border-gray-600 text-white hover:bg-gray-800">
                  Print
                </Button>
                <Button variant="outline" size="sm" className="bg-transparent border-gray-600 text-white hover:bg-gray-800">
                  Send
                </Button>
                <button className="px-2 text-gray-400 hover:text-white">•••</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}