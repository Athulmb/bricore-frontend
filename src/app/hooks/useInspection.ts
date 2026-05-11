import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import { toast } from 'sonner';

export interface InspectionRecord {
  id: string;
  inspectionId: string;
  batchId: string;
  inspectorName: string;
  inspectionType: string;
  scheduledDate: string;
  completedDate: string;
  observations: string;
  supplierName: string;
  customerName: string;
  status: 'Pending' | 'Completed' | 'In Progress';
}

export const useInspectionQuery = (processingBatches: any[] = []) => {
  return useQuery({
    queryKey: ['inspection-records'],
    queryFn: async () => {
      const response = await api.get('/inspection-certification');
      return response.data.map((item: any) => {
        const linkedBatch = processingBatches.find(b => b.batchId === item.batchId);
        return {
          ...item,
          id: item._id,
          supplierName: item.supplierName && item.supplierName !== 'N/A' ? item.supplierName : (linkedBatch?.supplierName || 'N/A'),
          customerName: item.customerName && item.customerName !== 'N/A' ? item.customerName : (linkedBatch?.customerName || 'N/A')
        };
      }) as InspectionRecord[];
    },
  });
};

export const useCreateInspectionRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newRecord: Partial<InspectionRecord>) => {
      const response = await api.post('/inspection-certification', newRecord);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspection-records'] });
      toast.success('Inspection record created');
    },
  });
};

export const useUpdateInspectionRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InspectionRecord> }) => {
      const response = await api.patch(`/inspection-certification/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspection-records'] });
      toast.success('Inspection record updated');
    },
  });
};

export const useDeleteInspectionRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/inspection-certification/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspection-records'] });
      toast.success('Inspection record deleted');
    },
  });
};
