import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import { toast } from 'sonner';

export interface BaggingRecord {
  id: string;
  baggingId: string;
  batchId: string;
  numberOfBags: number;
  weightPerBag: number;
  totalWeight: number;
  warehouseLocation: string;
  baggingDate: string;
  supplierName: string;
  customerName: string;
  status: 'Completed' | 'Pending';
}

export const useBaggingQuery = (processingBatches: any[] = []) => {
  return useQuery({
    queryKey: ['bagging-records'],
    queryFn: async () => {
      const response = await api.get('/bagging-warehouse');
      return response.data.map((item: any) => {
        const linkedBatch = processingBatches.find(b => b.batchId === item.batchId);
        return {
          ...item,
          id: item._id,
          supplierName: item.supplierName && item.supplierName !== 'N/A' ? item.supplierName : (linkedBatch?.supplierName || 'N/A'),
          customerName: item.customerName && item.customerName !== 'N/A' ? item.customerName : (linkedBatch?.customerName || 'N/A')
        };
      }) as BaggingRecord[];
    },
  });
};

export const useCreateBaggingRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newRecord: Partial<BaggingRecord>) => {
      const response = await api.post('/bagging-warehouse', newRecord);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bagging-records'] });
      toast.success('Bagging record created');
    },
  });
};

export const useUpdateBaggingRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<BaggingRecord> }) => {
      const response = await api.patch(`/bagging-warehouse/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bagging-records'] });
      toast.success('Bagging record updated');
    },
  });
};

export const useDeleteBaggingRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/bagging-warehouse/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bagging-records'] });
      toast.success('Bagging record deleted');
    },
  });
};
