import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Download, Send, Printer, Building, Phone, Mail, ChevronDown } from 'lucide-react';
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

import { useInvoicesQuery, useUpdateInvoice } from '../hooks/useInvoices';
import { Loader2 } from 'lucide-react';
import { useCurrency, currencies, CurrencyCode } from '../context/CurrencyContext';
import logo from '../../assets/logo-02 1.png';

import { useSettingsQuery } from '../hooks/useSettings';
import { useClientsQuery } from '../hooks/useClients';

export function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Queries
  const { data: invoices = [], isLoading: isLoadingInvoices } = useInvoicesQuery();
  const { data: companySettings, isLoading: isLoadingSettings } = useSettingsQuery();
  const { data: clients = [], isLoading: isLoadingClients } = useClientsQuery();
  const updateMutation = useUpdateInvoice();

  const isLoading = isLoadingInvoices || isLoadingSettings || isLoadingClients;

  const formatCurrency = (amount: number, includeSymbol = true, invoiceCurrency?: string) => {
    let currencyCode = invoiceCurrency || companySettings?.currency || 'AED';

    // Safety check
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

  const invoice = invoices.find(inv => inv.invoiceId === id || inv.id === id || inv.invoiceNo === id);



  if (!invoice) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Invoice not found</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate('/invoices-financials')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
      </div>
    );
  }


  const handlePrint = () => {
    window.print();
  };

  const handleUpdateStatus = async (newStatus: 'Pending' | 'Paid' | 'Overdue') => {
    try {
      await updateMutation.mutateAsync({
        id: invoice.id,
        data: { status: newStatus }
      });
    } catch (error) {
      // Mutation handles toast
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-[#E8491F]" />
          <p className="text-gray-500 font-medium">Loading invoice details...</p>
        </div>
      </div>
    );
  }


  const handleDownloadPDF = () => {
    const doc = new jsPDF() as any;
    const currencyCode: CurrencyCode = ((invoice.currency as CurrencyCode) || (companySettings?.currency as CurrencyCode) || 'AED') as CurrencyCode;
    const currentCurr = currencies[currencyCode] || currencies['AED'];
    const bank = currentCurr.bankDetails;

    // Header
    doc.setFillColor(13, 13, 13); // #0D0D0D
    doc.rect(0, 0, 210, 45, 'F');

    // Add Logo to PDF
    try {
      doc.addImage(logo, 'PNG', 20, 10, 30, 30);
    } catch (e) {
      console.error('Error adding logo to PDF', e);
    }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text(companySettings?.name.toUpperCase() || 'GME', 55, 20);
    doc.setFontSize(8);
    doc.text(`RC No: ${companySettings?.rcNumber} | TIN Number: ${companySettings?.tin}`, 55, 28);
    doc.text(`${companySettings?.email} | ${companySettings?.phone}`, 55, 34);

    doc.setTextColor(13, 13, 13);
    doc.setFontSize(20);
    doc.text('INVOICE', 196, 20, { align: 'right' });

    // Client Details
    doc.setTextColor(13, 13, 13);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO:', 20, 55);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.text(invoice.client, 20, 62);

    const clientRef = clients.find((c: any) => c.name === invoice.client);
    if (clientRef) {
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      const splitAddr = doc.splitTextToSize(clientRef.address, 70);
      doc.text(splitAddr, 20, 68);
      doc.text(`TIN Number: ${clientRef.tin}`, 20, 68 + (splitAddr.length * 5));
    }

    // Invoice Box
    doc.setDrawColor(200, 200, 200);
    doc.rect(130, 50, 65, 32);
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Invoice No:`, 135, 58);
    doc.text(`Date:`, 135, 66);
    doc.text(`Shipment ID:`, 135, 74);

    doc.setTextColor(0, 0, 0);
    doc.text(invoice.invoiceNo, 190, 58, { align: 'right' });
    doc.text(invoice.date, 190, 66, { align: 'right' });
    doc.text(invoice.shipmentId, 190, 74, { align: 'right' });

    // Table
    autoTable(doc, {
      startY: 125,
      head: [['Description', 'Qty', 'Rate', 'Amount']],
      body: (invoice.lineItems || []).map((item: any) => [
        item.description,
        item.quantity || item.qty,
        formatCurrency(item.rate, false, invoice.currency),
        formatCurrency((item.quantity || item.qty) * item.rate, false, invoice.currency)
      ]),
      headStyles: { fillColor: [13, 13, 13] },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { halign: 'center', cellWidth: 20 },
        2: { halign: 'right', cellWidth: 35 },
        3: { halign: 'right', cellWidth: 35 },
      },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;

    // Totals
    const totalsX = 140;
    doc.setFontSize(10);
    doc.text(`Subtotal:`, totalsX, finalY);
    doc.text(formatCurrency(invoice.subtotal || invoice.amount, false, invoice.currency), 195, finalY, { align: 'right' });

    doc.text(`Discount:`, totalsX, finalY + 8);
    doc.text(`-${formatCurrency(invoice.discount || 0, false, invoice.currency)}`, 195, finalY + 8, { align: 'right' });

    doc.setTextColor(151, 73, 38);
    doc.text(`VAT (${companySettings?.vatPercentage}%):`, totalsX, finalY + 16);
    doc.text(formatCurrency(invoice.vat || 0, false, invoice.currency), 195, finalY + 16, { align: 'right' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(13, 13, 13);
    doc.text(`TOTAL AMOUNT:`, totalsX, finalY + 28);
    doc.text(formatCurrency(invoice.amount, false, invoice.currency), 195, finalY + 28, { align: 'right' });

    // Bank Details
    const bankY = finalY + 45;
    doc.setFillColor(245, 245, 245);
    doc.rect(20, bankY, 175, 30, 'F');
    doc.setTextColor(13, 13, 13);
    doc.setFontSize(10);
    doc.text('PAYMENT INFORMATION', 25, bankY + 8);
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    doc.text(`Bank: ${bank.bankName} | A/C: ${bank.accountNumber}`, 25, bankY + 16);
    doc.text(`Name: ${bank.accountName}`, 25, bankY + 22);
    if (bank.routingNumber) doc.text(bank.routingNumber, 110, bankY + 16);

    doc.save(`${invoice.invoiceNo}.pdf`);
    toast.success('PDF Downloaded successfully');
  };

  const handleSendEmail = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: 'Preparing email...',
        success: `Invoice sent successfully to ${invoice.client}`,
        error: 'Failed to send email',
      }
    );
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen print:p-0 print:bg-white">
      {/* Action Bar - Hidden during print */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/invoices-financials')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Invoices
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <Select value={invoice.status} onValueChange={handleUpdateStatus}>
            <SelectTrigger className="w-[120px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Paid">Paid</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Overdue">Overdue</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleSendEmail}>
            <Send className="h-4 w-4 mr-2" />
            Send Email
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button size="sm" onClick={handlePrint} className="bg-[#E8491F] hover:bg-[#C93D18] text-white">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {/* Invoice Document */}
      <Card className="max-w-[1000px] mx-auto shadow-xl border-0 overflow-hidden print:shadow-none print:max-w-full">
        {/* Dark Green Header */}
        <div className="bg-[#0D0D0D] text-white p-12 flex justify-between items-start">
          <div className="flex flex-col gap-6 items-start">
            <div className="shrink-0">
              <img src={logo} alt="GME Logo" className="h-20 w-auto" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">{companySettings?.name.toUpperCase() || 'GME'}</h1>
              <p className="text-sm opacity-90">Mineral Processing & Export Company</p>
              <p className="text-xs opacity-75">RC: {companySettings?.rcNumber} | TIN Number: {companySettings?.tin}</p>
              <div className="flex flex-col gap-1 text-xs opacity-80 pt-2">
                <span className="flex items-center gap-2">
                  <Mail className="h-3 w-3" /> {companySettings?.email}
                </span>
                <span className="flex items-center gap-2">
                  <Phone className="h-3 w-3" /> {companySettings?.phone}
                </span>
                <span className="flex items-center gap-2">
                  <Building className="h-3 w-3" /> {companySettings?.address}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-4xl font-light tracking-widest text-slate-300">INVOICE</h2>
          </div>
        </div>

        <div className="p-12 bg-white">
          {/* Bill To & Details Grid */}
          <div className="grid grid-cols-12 gap-12 mb-16">
            <div className="col-span-7">
              <h3 className="text-sm font-bold text-gray-900 mb-6 uppercase tracking-wider">BILL TO:</h3>
              <div className="space-y-1 text-gray-700">
                <p className="text-lg font-bold text-gray-900">{invoice.client}</p>
                {(() => {
                  const clientRef = clients.find((c: any) => c.name === invoice.client);
                  return clientRef ? (
                    <>
                      <p className="max-w-md">{clientRef.address}</p>
                      <p className="text-sm">TIN Number: {clientRef.tin}</p>
                    </>
                  ) : null;
                })()}
              </div>
            </div>
            <div className="col-span-1"></div>
            <div className="col-span-4">
              <div className="border border-slate-200 rounded-lg p-6 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Invoice Number:</span>
                  <span className="font-bold text-gray-900">{invoice.invoiceNo}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Invoice Date:</span>
                  <span className="font-medium">{invoice.date}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Shipment ID:</span>
                  <span className="font-medium">{invoice.shipmentId}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Status:</span>
                  <StatusBadge status={invoice.status} />
                </div>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="mb-12 border rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-[#0D0D0D]">
                <TableRow className="hover:bg-transparent border-0">
                  <TableHead className="text-white font-bold h-12 uppercase text-xs tracking-wider px-6">Description</TableHead>
                  <TableHead className="text-white font-bold h-12 uppercase text-xs tracking-wider text-center px-6">Qty</TableHead>
                  <TableHead className="text-white font-bold h-12 uppercase text-xs tracking-wider text-right px-6">Rate</TableHead>
                  <TableHead className="text-white font-bold h-12 uppercase text-xs tracking-wider text-right px-6">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(invoice.lineItems || []).map((item: any, index: number) => (
                  <TableRow key={index} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                    <TableCell className="font-medium text-gray-900 py-4 px-6">{item.description}</TableCell>
                    <TableCell className="text-center py-4 px-6">{item.quantity || item.qty}</TableCell>
                    <TableCell className="text-right py-4 px-6 text-slate-600 font-medium">{formatCurrency(item.rate, true, invoice.currency)}</TableCell>
                    <TableCell className="text-right py-4 px-6 font-bold text-gray-900">{formatCurrency((item.quantity || item.qty) * item.rate, true, invoice.currency)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Totals Section */}
          <div className="flex justify-end mb-16 px-6">
            <div className="w-80 space-y-4 text-right">
              <div className="flex justify-between text-slate-600">
                <span className="text-base">Subtotal:</span>
                <span className="font-bold text-gray-900">{formatCurrency(invoice.subtotal || invoice.amount, true, invoice.currency)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span className="text-base">Discount:</span>
                <span className="font-bold text-gray-900">-{formatCurrency(invoice.discount || 0, true, invoice.currency)}</span>
              </div>
              <div className="flex justify-between text-[#E8491F]">
                <span className="text-base font-semibold">VAT ({companySettings?.vatPercentage}%):</span>
                <span className="font-bold">{formatCurrency(invoice.vat || 0, true, invoice.currency)}</span>
              </div>
              <div className="pt-4 border-t-2 border-slate-100 flex justify-between items-baseline">
                <span className="text-xl font-bold text-[#0D0D0D]">Total Amount:</span>
                <span className="text-xl font-black text-[#0D0D0D]">{formatCurrency(invoice.amount, true, invoice.currency)}</span>
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="mt-20 px-4">
            <h4 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider underline underline-offset-4 decoration-[#E8491F]">Payment Information:</h4>
            <div className="bg-slate-50 p-6 rounded-lg border border-slate-100 text-sm">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <p className="text-slate-500 text-xs">BANK DETAILS</p>
                  {(() => {
                    const invCurr = (invoice.currency as CurrencyCode) || (companySettings?.currency as CurrencyCode) || 'AED';
                    const bankInfo = (currencies[invCurr] || currencies['AED']).bankDetails;
                    return (
                      <>
                        <p className="font-bold">{bankInfo.bankName}</p>
                        <p><span className="text-slate-500">A/C Name:</span> {bankInfo.accountName}</p>
                        <p><span className="text-slate-500">A/C No:</span> {bankInfo.accountNumber}</p>
                        {bankInfo.routingNumber && (
                          <p><span className="text-slate-500">Swift/Routing:</span> {bankInfo.routingNumber}</p>
                        )}
                      </>
                    );
                  })()}
                </div>
                <div className="space-y-2">
                  <p className="text-slate-500 text-xs">TERMS</p>
                  <ul className="text-xs text-slate-600 space-y-1">
                    <li>• Payment due within 30 days</li>
                    <li>• Please quote invoice # in reference</li>
                    <li>• 2% monthly late fee applies</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dark Green Footer */}
        <div className="bg-[#0D0D0D] text-white p-8 mt-12 text-center">
          <p className="text-sm font-bold mb-2">{companySettings?.name || 'GME'}</p>
          <p className="text-xs text-slate-500 max-w-[200px]">
            Mineral Processing & Export • Registered in Nigeria (RC: {companySettings?.rcNumber})
          </p>
        </div>
      </Card>

      {/* Spacer for print */}
      <div className="h-12 print:hidden"></div>
    </div>
  );
}
