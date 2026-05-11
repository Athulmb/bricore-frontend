import { useState } from 'react';
import { useNavigate } from 'react-router';
import { PageHeader } from '../components/common/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Plus, Eye, Download } from 'lucide-react';

import { useInvoicesQuery, useCreateInvoice } from '../hooks/useInvoices';
import { useSettingsQuery } from '../hooks/useSettings';
import { useClientsQuery } from '../hooks/useClients';
import { Loader2 } from 'lucide-react';
import { CurrencyCode } from '../context/CurrencyContext';

export function InvoicesFinancials() {
  const navigate = useNavigate();
  const formatCurrency = (amount: number, includeSymbol = true, customCurrency?: string) => {
    let currencyCode = customCurrency || companySettings?.currency || 'AED';

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

  const { data: invoices = [], isLoading: isLoadingInvoices } = useInvoicesQuery();
  const { data: companySettings, isLoading: isLoadingSettings } = useSettingsQuery();
  const { data: clients = [], isLoading: isLoadingClients } = useClientsQuery();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredInvoices = invoices.filter(inv =>
    inv.invoiceId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.client?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isLoading = isLoadingInvoices || isLoadingSettings || isLoadingClients;

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-[#974926]" />
          <p className="text-gray-500 font-medium">Loading financial records...</p>
        </div>
      </div>
    );
  }


  return (
    <div>
      <PageHeader
        title="Invoices & Financials"
        description="Manage invoices, billing, and financial tracking"
        action={{
          label: 'Create Invoice',
          icon: Plus,
          onClick: () => setIsModalOpen(true),
        }}
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card className="p-4 bg-white border border-gray-200">
          <p className="text-sm text-gray-600">Total Revenue (Month)</p>
          <p className="text-2xl font-semibold mt-1">
            {formatCurrency(invoices.reduce((acc, curr) => acc + (curr.status === 'Paid' ? curr.amount : 0), 0))}
          </p>
        </Card>
        <Card className="p-4 bg-white border border-gray-200">
          <p className="text-sm text-gray-600">Pending Invoices</p>
          <p className="text-2xl font-semibold mt-1">
            {formatCurrency(invoices.reduce((acc, curr) => acc + (curr.status === 'Pending' ? curr.amount : 0), 0))}
          </p>
        </Card>
        <Card className="p-4 bg-white border border-gray-200">
          <p className="text-sm text-gray-600">Overdue Amount</p>
          <p className="text-2xl font-semibold mt-1 text-red-600">
            {formatCurrency(invoices.reduce((acc, curr) => acc + (curr.status === 'Overdue' ? curr.amount : 0), 0))}
          </p>
        </Card>
        <Card className="p-4 bg-white border border-gray-200">
          <p className="text-sm text-gray-600">Invoice Count</p>
          <p className="text-2xl font-semibold mt-1">{invoices.length}</p>
        </Card>
      </div>

      <Tabs defaultValue="invoices" className="space-y-6">
        <TabsList>
          <TabsTrigger value="invoices">All Invoices</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices">
          <Card className="bg-white border border-gray-200">
            <div className="p-5 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900">Invoice Records</h3>
                <Input
                  type="text"
                  placeholder="Search invoices..."
                  className="w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice No.</TableHead>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow
                    key={invoice.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => navigate(`/invoices-financials/${invoice.id}`)}
                  >
                    <TableCell className="font-medium text-[#974926]">{invoice.invoiceId}</TableCell>
                    <TableCell>{invoice.client}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(invoice.amount, true, invoice.currency)}</TableCell>
                    <TableCell className="text-gray-600">{invoice.date}</TableCell>
                    <TableCell><StatusBadge status={invoice.status} /></TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/invoices-financials/${invoice.id}`);
                        }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>


        <TabsContent value="pending">
          <Card className="bg-white border border-gray-200 p-8 text-center">
            <p className="text-gray-600">Pending invoices will be displayed here</p>
          </Card>
        </TabsContent>

        <TabsContent value="paid">
          <Card className="bg-white border border-gray-200 p-8 text-center">
            <p className="text-gray-600">Paid invoices will be displayed here</p>
          </Card>
        </TabsContent>

        <TabsContent value="overdue">
          <Card className="bg-white border border-gray-200 p-8 text-center">
            <p className="text-gray-600">Overdue invoices will be displayed here</p>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create New Invoice</DialogTitle>
            <DialogDescription>Generate invoice with automatic cost calculation</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invoice-no">Invoice Number</Label>
              <Input id="invoice-no" placeholder="Auto-generated" disabled className="bg-gray-100" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client">Client Name</Label>
              <Select>
                <SelectTrigger id="client">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global Industries Ltd</SelectItem>
                  <SelectItem value="euro">Euro Minerals GmbH</SelectItem>
                  <SelectItem value="asia">Asia Pacific Trading</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="shipment">Linked Shipment</Label>
              <Select>
                <SelectTrigger id="shipment">
                  <SelectValue placeholder="Select shipment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="s1">SHP-2026-001</SelectItem>
                  <SelectItem value="s2">SHP-2026-002</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="issue-date">Issue Date</Label>
              <Input id="issue-date" type="date" />
            </div>

            <div className="col-span-2 border-t pt-4 mt-4">
              <h4 className="font-semibold mb-3">Cost Breakdown</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between p-2 bg-gray-50 rounded">
                  <span>Crushing Charges</span>
                  <span className="font-medium">₹12,500</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-50 rounded">
                  <span>Assaying Fees</span>
                  <span className="font-medium">₹3,200</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-50 rounded">
                  <span>Inspection Fees</span>
                  <span className="font-medium">₹2,800</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-50 rounded">
                  <span>Bagging Charges</span>
                  <span className="font-medium">₹8,900</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-50 rounded">
                  <span>Yard Handling</span>
                  <span className="font-medium">₹5,400</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-50 rounded">
                  <span>Transportation</span>
                  <span className="font-medium">₹15,000</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-50 rounded">
                  <span>Documentation</span>
                  <span className="font-medium">₹1,500</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-50 rounded">
                  <span>Freight</span>
                  <span className="font-medium">₹22,000</span>
                </div>
              </div>
              <div className="flex justify-between p-3 bg-blue-50 rounded mt-3 font-semibold">
                <span>Total Amount</span>
                <span className="text-blue-600">₹71,300</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={() => setIsModalOpen(false)}>Generate Invoice</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}