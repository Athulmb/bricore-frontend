import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Download, Send, Printer, Building, Phone, Mail } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { StatusBadge } from '../components/common/StatusBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../components/ui/select';

import { useQuotationsQuery, useUpdateQuotation, QuotationRecord, useSendQuotationEmail } from '../hooks/useQuotations';
import { Loader2 } from 'lucide-react';
import { currencies, CurrencyCode } from '../context/CurrencyContext';
import logo from '../../assets/gme_logo.png';
import { useSettingsQuery } from '../hooks/useSettings';
import { useClientsQuery } from '../hooks/useClients';
import api from '../api';
import { SendEmailDialog } from '../components/quotations/SendEmailDialog';

export function QuotationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: quotations = [], isLoading: isLoadingQuotations } = useQuotationsQuery();
  const { data: companySettings, isLoading: isLoadingSettings } = useSettingsQuery();
  const { data: clients = [], isLoading: isLoadingClients } = useClientsQuery();
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const updateMutation = useUpdateQuotation();
  const sendEmailMutation = useSendQuotationEmail();

  const isLoading = isLoadingQuotations || isLoadingSettings || isLoadingClients;

  const quotation = quotations.find(q => q.id === id || q.quotationNo === id);

  const formatCurrency = (amount: number, includeSymbol = true, useCode = false) => {
    if (useCode && quotation?.currency) {
      return `${quotation.currency} ${new Intl.NumberFormat('en-GH', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount)}`;
    }
    return new Intl.NumberFormat('en-GH', {
      style: includeSymbol ? 'currency' : 'decimal',
      currency: quotation?.currency || companySettings?.currency || 'AED',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-[#974926]" />
        <p className="ml-4 text-gray-500 font-medium">Loading quotation details...</p>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Quotation not found</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate('/quotations')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
      </div>
    );
  }

  const handleUpdateStatus = async (newStatus: string) => {
    if (!quotation) return;
    try {
      await updateMutation.mutateAsync({
        id: quotation.id,
        data: { status: newStatus as any }
      });
    } catch (error) { }
  };

  const handleDownloadPDF = () => {
    if (!quotation) return;
    const doc = new jsPDF() as any;
    const currencyCode = (quotation?.currency || companySettings?.currency || 'AED') as CurrencyCode;

    // Header
    doc.setFillColor(32, 55, 39);
    doc.rect(0, 0, 210, 45, 'F');
    try { doc.addImage(logo, 'PNG', 20, 10, 30, 30); } catch (e) { }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text(companySettings?.name.toUpperCase() || 'GME', 55, 20);
    doc.setFontSize(8);
    doc.text(`RC No: ${companySettings?.rcNumber} | TIN Number: ${companySettings?.tin}`, 55, 28);
    doc.text(`${companySettings?.email} | ${companySettings?.phone}`, 55, 34);

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

    // Client
    doc.setTextColor(32, 55, 39);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('QUOTATION FOR:', 20, 55);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.text(quotation.client, 20, 62);

    const clientRef = clients.find((c: any) => c.name === quotation.client);
    if (clientRef) {
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      const splitAddr = doc.splitTextToSize(clientRef.address, 70);
      doc.text(splitAddr, 20, 68);
    }


    // Table
    autoTable(doc, {
      startY: 110,
      head: [['Description', 'Qty', 'Rate', 'Amount']],
      body: (quotation.lineItems || []).map((item: any) => [
        item.description,
        item.quantity,
        formatCurrency(item.rate, true, true),
        formatCurrency(item.total || (item.quantity * item.rate), true, true)
      ]),
      headStyles: { fillColor: [32, 55, 39] },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);

    doc.text('Subtotal:', 140, finalY);
    doc.text(formatCurrency(quotation.subtotal || quotation.amount, false, true), 196, finalY, { align: 'right' });

    if (quotation.discount > 0) {
      doc.text('Discount:', 140, finalY + 7);
      doc.text(`-${formatCurrency(quotation.discount, false, true)}`, 196, finalY + 7, { align: 'right' });
    }

    if (quotation.vat > 0) {
      doc.text('VAT:', 140, finalY + 14);
      doc.text(formatCurrency(quotation.vat, false, true), 196, finalY + 14, { align: 'right' });
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(32, 55, 39);
    doc.text('TOTAL AMOUNT:', 110, finalY + 25);
    doc.text(formatCurrency(quotation.amount, true, true), 196, finalY + 25, { align: 'right' });

    if (quotation.notes) {
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('Notes:', 20, finalY + 40);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const splitNotes = doc.splitTextToSize(quotation.notes, 170);
      doc.text(splitNotes, 20, finalY + 47);
    }

    doc.save(`${quotation.quotationNo}.pdf`);
    toast.success('PDF Downloaded');
  };

  const handleBackendDownload = async () => {
    if (!quotation) return;
    try {
      const response = await api.get(`/quotations/${quotation.id}/download`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Quotation_${quotation.quotationNo}.pdf`);
      document.body.appendChild(link);
      link.click();
      toast.success('PDF Downloaded from backend');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download PDF');
    }
  };

  const handleSendEmail = async () => {
    setIsEmailDialogOpen(true);
  };


  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate('/quotations')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <div className="flex items-center gap-3">
          <Select value={quotation.status} onValueChange={handleUpdateStatus}>
            <SelectTrigger className="w-[120px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Sent">Sent</SelectItem>
              <SelectItem value="Accepted">Accepted</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleBackendDownload}>
            <Download className="h-4 w-4 mr-2" /> Download PDF
          </Button>
          <Button 
            size="sm" 
            onClick={handleSendEmail} 
            disabled={sendEmailMutation.isPending}
            className="bg-[#203727] hover:bg-[#2d4d39] text-white"
          >
            {sendEmailMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Mail className="h-4 w-4 mr-2" />
            )}
            Email Client
          </Button>
          <Button size="sm" onClick={() => window.print()} className="bg-[#974926] hover:bg-[#7d3c1f] text-white">
            <Printer className="h-4 w-4 mr-2" /> Print
          </Button>
        </div>
      </div>

      <Card className="max-w-[1000px] mx-auto shadow-xl border-0 overflow-hidden bg-white">
        <div className="bg-[#203727] text-white p-12 flex justify-between items-start">
          <div className="space-y-4">
            <img src={logo} alt="GME Logo" className="h-20 w-auto" />
            <div>
              <h1 className="text-3xl font-bold">{companySettings?.name.toUpperCase() || 'GME'}</h1>
              <p className="text-sm opacity-80">{companySettings?.address}</p>
              <p className="text-xs opacity-70">RC: {companySettings?.rcNumber} | TIN: {companySettings?.tin}</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-4xl font-light tracking-widest opacity-50">QUOTATION</h2>
          </div>
        </div>

        <div className="p-12">
          <div className="grid grid-cols-2 gap-12 mb-12">
            <div>
              <h3 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-wider">QUOTATION FOR:</h3>
              <div className="flex items-center gap-3">
                <p className="text-xl font-bold text-gray-900">{quotation.client}</p>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-slate-400 hover:text-[#203727] hover:bg-[#203727]/10" 
                  onClick={handleSendEmail}
                  title="Send via Email"
                >
                  <Mail className="h-4 w-4" />
                </Button>
              </div>
              {(() => {
                const client = clients.find((c: any) => c.name === quotation.client);
                return client ? <p className="text-gray-600 mt-2">{client.address}</p> : null;
              })()}
            </div>
            <div className="bg-slate-50 p-6 rounded-lg border border-slate-100 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Number:</span>
                <span className="font-bold">{quotation.quotationNo}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Date:</span>
                <span>{new Date(quotation.date).toLocaleDateString()}</span>
              </div>
              {quotation.validUntil && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Valid Until:</span>
                  <span>{new Date(quotation.validUntil).toLocaleDateString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Status:</span>
                <StatusBadge status={quotation.status} />
              </div>
              {quotation.salesPerson && (
                <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
                  <span className="text-slate-500">Sales Person:</span>
                  <span className="font-medium text-gray-900">{quotation.salesPerson}</span>
                </div>
              )}
            </div>
          </div>

          {quotation.subject && (
            <div className="mb-8 p-6 bg-slate-50/50 rounded-xl border-l-4 border-[#203727] shadow-sm">
              <h4 className="text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">Quotation Subject</h4>
              <p className="text-lg font-bold text-gray-900">{quotation.subject}</p>
            </div>
          )}

          <div className="border rounded-lg overflow-hidden mb-8">
            <Table>
              <TableHeader className="bg-[#203727]">
                <TableRow>
                  <TableHead className="text-white px-6">Description</TableHead>
                  <TableHead className="text-white text-center">Qty</TableHead>
                  <TableHead className="text-white text-right">Rate</TableHead>
                  <TableHead className="text-white text-right px-6">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotation.lineItems.map((item: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="px-6 py-4 font-medium">{item.description}</TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.rate, true, true)}</TableCell>
                    <TableCell className="text-right px-6 font-bold">{formatCurrency(item.total || (item.quantity * item.rate), true, true)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end">
            <div className="w-64 space-y-3 text-right">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal:</span>
                <span className="font-bold text-gray-900">{formatCurrency(quotation.subtotal || quotation.amount, true, true)}</span>
              </div>
              {quotation.discount > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Discount:</span>
                  <span className="font-bold text-gray-900">-{formatCurrency(quotation.discount, true, true)}</span>
                </div>
              )}
              {quotation.vat > 0 && (
                <div className="flex justify-between text-[#974926]">
                  <span>VAT:</span>
                  <span className="font-bold">{formatCurrency(quotation.vat, true, true)}</span>
                </div>
              )}
              <div className="pt-4 border-t-2 flex justify-between items-baseline">
                <span className="text-lg font-bold text-[#203727]">Total:</span>
                <span className="text-3xl font-black text-[#203727]">{formatCurrency(quotation.amount, true, true)}</span>
              </div>
            </div>
          </div>

          {quotation.notes && (
            <div className="mt-12 bg-slate-50 p-6 rounded-lg border border-slate-100">
              <h4 className="text-xs font-bold text-gray-400 mb-2 uppercase">Notes:</h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{quotation.notes}</p>
            </div>
          )}
        </div>
      </Card>

      <SendEmailDialog
        isOpen={isEmailDialogOpen}
        onClose={() => setIsEmailDialogOpen(false)}
        quotation={quotation}
        clientEmail={clients.find((c: any) => c.name === quotation.client)?.email}
      />
    </div>
  );
}
