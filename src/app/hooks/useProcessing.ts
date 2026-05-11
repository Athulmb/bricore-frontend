import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import { toast } from 'sonner';
import { MaterialWeight } from './useYardIntake';

export interface ProcessingBatch {
  id: string;
  batchId: string;
  rawMaterial: string | string[] | MaterialWeight[];
  inputQuantity: number;
  quantity?: number; // Aliased for legacy UI
  machineAssigned: string;
  machine?: string;   // Aliased for legacy UI
  outputGrade: string;
  outputQuantity: number;
  processingDate: string;
  processingTime?: string;
  supplierName: string;
  customerName: string;
  grnReference: string;
  sourceGRN?: string; // Alias
  status: 'Pending' | 'In Progress' | 'Completed' | 'Processing' | 'Quality Check';
  operator?: string;
  supervisor?: string;
  equipmentUsed?: string[];
  qualityApproved?: {
    isApproved: boolean;
    remarks: string;
    approvedBy?: string;
    approvalDate?: string;
  };
  processStages?: any[];
  qualityParameters?: any[];
  sizeDistribution?: any[];
  createdAt: string;
}

export const useProcessingQuery = () => {
  return useQuery({
    queryKey: ['processing-batches'],
    queryFn: async () => {
      const response = await api.get('/crushing-processing');
      return response.data.map((item: any) => ({
        ...item,
        id: item._id,
        quantity: item.inputQuantity,
        machine: item.machineAssigned,
        supplierName: item.supplierName || 'N/A',
        customerName: item.customerName || 'N/A'
      })) as ProcessingBatch[];
    },
  });
};

export const useCreateProcessingBatch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newBatch: Partial<ProcessingBatch>) => {
      const response = await api.post('/crushing-processing', newBatch);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ 'processing-batches'] });
      toast.success('Processing batch created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create batch');
    },
  });
};

export const useUpdateProcessingBatch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ProcessingBatch> }) => {
      const response = await api.patch(`/crushing-processing/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processing-batches'] });
      toast.success('Batch updated successfully');
    },
  });
};

export const useDeleteProcessingBatch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/crushing-processing/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processing-batches'] });
      toast.success('Batch deleted successfully');
    },
  });
};
