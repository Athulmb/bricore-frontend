import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import { toast } from 'sonner';

export interface DispatchRecord {
  id: string;
  dispatchId: string;
  batchId: string;
  container: string;
  loadingWeight: number;
  destination: string;
  dispatchDate: string;
  deliveryDate: string;
  supplierName: string;
  customerName: string;
  status: 'Loaded' | 'In Transit' | 'Delivered' | 'Pending';
  driverName?: string;
  contactNumber?: string;
}

export const useDispatchQuery = () => {
  return useQuery({
    queryKey: ['dispatch-records'],
    queryFn: async () => {
      const response = await api.get('/loading-dispatch');
      return response.data.map((item: any) => ({
        ...item,
        id: item._id,
        container: item.containerNumber
      })) as DispatchRecord[];
    },
  });
};

export const useCreateDispatchRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (record: Partial<DispatchRecord>) => {
      const response = await api.post('/loading-dispatch', {
        dispatchId: record.dispatchId,
        batchId: record.batchId,
        containerNumber: record.container,
        loadingWeight: record.loadingWeight,
        destination: record.destination,
        dispatchDate: record.dispatchDate,
        deliveryDate: record.deliveryDate || '-',
        supplierName: record.supplierName || 'N/A',
        customerName: record.customerName || 'N/A',
        status: record.status || 'Loaded'
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispatch-records'] });
      // Also invalidate inventory/yard intake as dispatch affects them
      queryClient.invalidateQueries({ queryKey: ['yard-intake'] });
      toast.success('Dispatch record created');
    },
  });
};

export const useUpdateDispatchRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DispatchRecord> }) => {
      const response = await api.patch(`/loading-dispatch/${id}`, {
        containerNumber: data.container,
        loadingWeight: data.loadingWeight,
        destination: data.destination,
        deliveryDate: data.deliveryDate,
        status: data.status,
        supplierName: data.supplierName,
        customerName: data.customerName
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispatch-records'] });
      toast.success('Dispatch record updated');
    },
  });
};

export const useDeleteDispatchRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/loading-dispatch/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispatch-records'] });
      toast.success('Dispatch record deleted');
    },
  });
};
