import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import { toast } from 'sonner';

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoiceRecord {
  id: string;
  invoiceId: string;
  invoiceNo: string;
  shipmentId: string;
  client: string;
  date: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Overdue';
  lineItems: InvoiceItem[];
  subtotal: number;
  vat: number;
  discount: number;
  tin: string;
  avatar: string;
  quotationId?: string;
  currency?: string;
}

export const useInvoicesQuery = () => {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const response = await api.get('/invoices');
      return response.data.map((item: any) => ({
        ...item,
        id: item._id,
        client: item.customerName,
        date: item.dateTime,
        lineItems: item.lineItems,
        vat: item.taxAmount,
        discount: item.discountAmount,
        tin: item.tin || item.vatNumber,
        avatar: item.customerName?.substring(0, 2).toUpperCase() || '??',
        quotationId: item.quotationId,
        currency: item.currency
      })) as InvoiceRecord[];
    },
  });
};

export const useCreateInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoice: Partial<InvoiceRecord>) => {
      const response = await api.post('/invoices', {
        invoiceId: invoice.invoiceId,
        invoiceNo: invoice.invoiceNo,
        shipmentId: invoice.shipmentId,
        quotationId: invoice.quotationId,
        currency: invoice.currency,
        customerName: invoice.client,
        amount: invoice.amount,
        dateTime: invoice.date || new Date().toISOString(),
        status: invoice.status || 'Pending',
        items: invoice.lineItems,
        subtotal: invoice.subtotal,
        taxAmount: invoice.vat,
        discount: invoice.discount,
        tin: invoice.tin
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice created');
    },
  });
};

export const useUpdateInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InvoiceRecord> }) => {
      const response = await api.patch(`/invoices/${id}`, {
        invoiceNo: data.invoiceNo,
        shipmentId: data.shipmentId,
        customerName: data.client,
        amount: data.amount,
        status: data.status,
        items: data.lineItems,
        subtotal: data.subtotal,
        taxAmount: data.vat,
        discount: data.discount,
        tin: data.tin
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice updated');
    },
  });
};

export const useDeleteInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/invoices/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice deleted');
    },
  });
};
