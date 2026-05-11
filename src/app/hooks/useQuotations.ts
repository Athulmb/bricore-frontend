import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import { toast } from 'sonner';

export interface QuotationItem {
  description: string;
  quantity: number;
  rate: number;
  total: number;
}

export interface QuotationRecord {
  id: string;
  quotationNo: string;
  client: string;
  date: string;
  validUntil: string;
  amount: number;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired';
  lineItems: QuotationItem[];
  subtotal: number;
  vat: number;
  discount: number;
  notes: string;
  avatar: string;
  currency: string;
  subject?: string;
  salesPerson?: string;
}

export const useQuotationsQuery = () => {
  return useQuery({
    queryKey: ['quotations'],
    queryFn: async () => {
      const response = await api.get('/quotations');
      return response.data.map((item: any) => ({
        ...item,
        id: item._id,
        client: item.customerName,
        date: item.dateTime,
        lineItems: item.lineItems,
        vat: item.taxAmount,
        discount: item.discountAmount,
        avatar: item.customerName?.substring(0, 2).toUpperCase() || '??'
      })) as QuotationRecord[];
    },
  });
};

export const useCreateQuotation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (quotation: Partial<QuotationRecord>) => {
      const response = await api.post('/quotations', {
        quotationNo: quotation.quotationNo,
        customerName: quotation.client,
        amount: quotation.amount,
        dateTime: quotation.date || new Date().toISOString(),
        validUntil: quotation.validUntil,
        status: quotation.status || 'Draft',
        items: quotation.lineItems,
        subtotal: quotation.subtotal,
        taxAmount: quotation.vat,
        discountAmount: quotation.discount,
        notes: quotation.notes,
        currency: quotation.currency,
        subject: quotation.subject,
        salesPerson: quotation.salesPerson
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast.success('Quotation created');
    },
  });
};

export const useUpdateQuotation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<QuotationRecord> }) => {
      const response = await api.patch(`/quotations/${id}`, {
        quotationNo: data.quotationNo,
        customerName: data.client,
        amount: data.amount,
        status: data.status,
        items: data.lineItems,
        subtotal: data.subtotal,
        taxAmount: data.vat,
        discountAmount: data.discount,
        notes: data.notes,
        validUntil: data.validUntil,
        currency: data.currency,
        subject: data.subject,
        salesPerson: data.salesPerson
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast.success('Quotation updated');
    },
  });
};

export const useDeleteQuotation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/quotations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast.success('Quotation deleted');
    },
  });
};

export const useSendQuotationEmail = () => {
  return useMutation({
    mutationFn: async ({ id, customTo, customSubject, customBody }: { id: string, customTo?: string, customSubject?: string, customBody?: string }) => {
      const response = await api.post(`/quotations/${id}/send-email`, { customTo, customSubject, customBody });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Quotation email sent successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send quotation email');
    },
  });
};
