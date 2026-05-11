import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import { toast } from 'sonner';

export interface InventoryLog {
  id: string;
  batchId: string;
  inputQuantity: number;
  outputQuantity: number;
  reason: string;
  timestamp: string;
}

export interface StockItem {
  id: number | string;
  warehouseLocation: string;
  mineralType: string;
  grade: string;
  bags: number;
  totalWeight: number;
  lastUpdate: string;
}

export const useInventoryQuery = () => {
  return useQuery({
    queryKey: ['inventory-data'],
    queryFn: async () => {
      // Current implementation is mock/localStorage based in Context, but we'll prepare for API
      const response = await api.get('/inventory/stock').catch(() => ({ data: [] }));
      
      // Fallback to mock data if API fails or returns empty for now
      if (response.data.length === 0) {
        return [
          { id: 1, warehouseLocation: 'Warehouse-A, Bay-1', mineralType: 'Feldspar', grade: 'Grade A', bags: 680, totalWeight: 34000, lastUpdate: '2026-02-12 10:30' },
          { id: 2, warehouseLocation: 'Warehouse-A, Bay-2', mineralType: 'Quartz', grade: 'Grade B', bags: 420, totalWeight: 21000, lastUpdate: '2026-02-12 09:15' },
        ] as StockItem[];
      }

      return response.data.map((item: any) => ({
        ...item,
        id: item._id
      })) as StockItem[];
    },
  });
};

export const useInventoryLogsQuery = () => {
  return useQuery({
    queryKey: ['inventory-logs'],
    queryFn: async () => {
      const response = await api.get('/inventory/logs');
      return response.data.map((item: any) => ({
        ...item,
        id: item._id,
        inputQuantity: item.inputQty,
        outputQuantity: item.outputQty
      })) as InventoryLog[];
    },
  });
};

export const useAddInventoryLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (log: Partial<InventoryLog>) => {
      const response = await api.post('/inventory/logs', {
        batchId: log.batchId,
        inputQty: log.inputQuantity,
        outputQty: log.outputQuantity,
        reason: log.reason
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-logs'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-data'] });
      toast.success('Inventory log added');
    },
  });
};

export const useDeleteInventoryLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/inventory/logs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-logs'] });
      toast.success('Inventory log deleted');
    },
  });
};
