import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import { toast } from 'sonner';

export interface WeighbridgeRecord {
  id: string;
  vehicleNo: string;
  supplier?: string;
  destination?: string;
  grossWeight?: number;
  tareWeight?: number;
  tare?: number;
  loadedWeight?: number;
  net?: number;
  time: string;
  type: 'Inbound' | 'Outbound';
  status: string;
}

export const useWeighbridgeQuery = () => {
  return useQuery({
    queryKey: ['weighbridge'],
    queryFn: async () => {
      const response = await api.get('/weighbridge');
      return response.data.map((item: any) => ({
        ...item,
        id: item._id,
        supplier: item.supplierName,
        time: item.dateTime,
        net: item.netWeight
      })) as WeighbridgeRecord[];
    },
  });
};

export const useAddWeighbridgeInbound = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (record: Partial<WeighbridgeRecord>) => {
      const response = await api.post('/weighbridge', {
        vehicleNo: record.vehicleNo,
        supplierName: record.supplier,
        grossWeight: record.grossWeight,
        tareWeight: record.tareWeight,
        netWeight: record.net,
        dateTime: record.time,
        type: 'Inbound',
        status: record.status || 'Completed'
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weighbridge'] });
      toast.success('Inbound weighbridge record added');
    },
  });
};

export const useAddWeighbridgeOutbound = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (record: Partial<WeighbridgeRecord>) => {
      const response = await api.post('/weighbridge', {
        vehicleNo: record.vehicleNo,
        destination: record.destination,
        loadedWeight: record.loadedWeight,
        dateTime: record.time,
        type: 'Outbound',
        status: record.status || 'Dispatched'
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weighbridge'] });
      toast.success('Outbound weighbridge record added');
    },
  });
};
