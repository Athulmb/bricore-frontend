import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import { toast } from 'sonner';

export interface MaterialWeight {
  name: string;
  grossWeight: number;
  tareWeight: number;
  netWeight: number;
}

export interface YardIntakeRecord {
  id: string;
  grnNumber: string;
  supplierName: string;
  supplier: string; // Used in UI fallback
  vehicleNumber: string;
  materialType: string | string[] | MaterialWeight[];
  mineralType?: string | string[] | MaterialWeight[];
  grossWeight: number;
  tareWeight: number;
  netWeight: number;
  status: string;
  createdAt: string;
  customerName?: string;
  date?: string;
  avatar?: string;
}

/**
 * Hook for fetching all Yard Intake records
 */
export const useYardIntakeQuery = () => {
  return useQuery({
    queryKey: ['yard-intake'],
    queryFn: async () => {
      const response = await api.get('/yard-intake');
      return response.data.map((item: any) => ({
        ...item,
        id: item._id,
        mineralType: item.materialType,
        supplier: item.supplierName,
        customerName: item.customerName || 'N/A',
        avatar: item.supplierName?.[0] || '?'
      })) as YardIntakeRecord[];
    },
  });
};

/**
 * Hook for creating a new Yard Intake record
 */
export const useCreateYardIntake = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newRecord: Partial<YardIntakeRecord>) => {
      const response = await api.post('/yard-intake', newRecord);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['yard-intake'] });
      toast.success('Yard Intake record created successfully');
    },
    onError: (error: any) => {
      console.error('Error creating yard intake:', error);
      toast.error(error.response?.data?.message || 'Failed to create record');
    },
  });
};
/**
 * Hook for updating an existing Yard Intake record
 */
export const useUpdateYardIntake = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<YardIntakeRecord> }) => {
      const response = await api.patch(`/yard-intake/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yard-intake'] });
      toast.success('Yard Intake record updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update record');
    },
  });
};

/**
 * Hook for deleting a Yard Intake record
 */
export const useDeleteYardIntake = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/yard-intake/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yard-intake'] });
      toast.success('Yard Intake record deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete record');
    },
  });
};
