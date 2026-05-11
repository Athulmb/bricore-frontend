import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import { toast } from 'sonner';
import { MaterialWeight } from './useYardIntake';

export interface QualityParameter {
  parameter: string;
  specification: string;
  actual: string;
  status: 'Pass' | 'Fail';
}

export interface SizeDistribution {
  size: string;
  percentage: number;
}

export interface TestRecord {
  id: string;
  sampleId: string;
  batchId: string;
  linkedBatch?: string;
  testType: string;
  labName: string;
  mineralType: string | string[] | MaterialWeight[];
  materialType?: string | string[] | MaterialWeight[];
  purity: string;
  submittedDate: string;
  resultDate: string;
  status: 'Pending' | 'Completed' | 'In Progress' | 'Approved' | 'Rejected';
  supplierName: string;
  customerName: string;
  documents?: Record<string, string>;
  qualityParameters?: QualityParameter[];
  sizeDistribution?: SizeDistribution[];
  notes?: string;
  avatar?: string;
  createdAt?: string;
}


export const useAssayingQuery = (processingBatches: any[] = []) => {
  return useQuery({
    queryKey: ['test-records'],
    queryFn: async () => {
      const response = await api.get('/assaying-testing');
      return response.data.map((item: any) => {
        const linkedBatch = processingBatches.find(b => b.batchId === item.batchId);
        return {
          ...item,
          id: item._id,
          linkedBatch: item.batchId,
          supplierName: item.supplierName && item.supplierName !== 'N/A' ? item.supplierName : (linkedBatch?.supplierName || 'N/A'),
          customerName: item.customerName && item.customerName !== 'N/A' ? item.customerName : (linkedBatch?.customerName || 'N/A')
        };
      }) as TestRecord[];
    },
  });
};

export const useCreateTestRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newRecord: Partial<TestRecord>) => {
      const response = await api.post('/assaying-testing', newRecord);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-records'] });
      toast.success('Test record created successfully');
    },
  });
};

export const useUpdateTestRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TestRecord> }) => {
      const response = await api.patch(`/assaying-testing/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-records'] });
      toast.success('Test record updated successfully');
    },
  });
};

export const useDeleteTestRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/assaying-testing/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-records'] });
      toast.success('Test record deleted');
    },
  });
};

export const useUploadTestDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, docKey, file }: { id: string; docKey: string; file: File }) => {
      const formData = new FormData();
      formData.append('document', file);
      const response = await api.post(`/assaying-testing/upload/${id}/${docKey}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-records'] });
      toast.success('Document uploaded');
    },
  });
};

export const useDeleteTestDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, docKey }: { id: string; docKey: string }) => {
      await api.delete(`/assaying-testing/document/${id}/${docKey}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-records'] });
      toast.success('Document deleted');
    },
  });
};
