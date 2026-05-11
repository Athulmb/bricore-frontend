import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import { toast } from 'sonner';

export const TRANSPORTATION_QUERY_KEY = ['transportation'];
export const TRANSPORTERS_QUERY_KEY = ['transporters'];

export const useTransportationQuery = () => {
    return useQuery({
        queryKey: TRANSPORTATION_QUERY_KEY,
        queryFn: async () => {
            const response = await api.get('/transportation', { withCredentials: true });
            return response.data;
        },
    });
};

export const useCreateTransportation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: any) => {
            const response = await api.post('/transportation', data, { withCredentials: true });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TRANSPORTATION_QUERY_KEY });
            toast.success('Transportation record created');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create transportation record');
        },
    });
};

export const useUpdateTransportationStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, status }: { id: string | number; status: string }) => {
            const response = await api.put(`/transportation/${id}/status`, { status }, { withCredentials: true });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TRANSPORTATION_QUERY_KEY });
            toast.success('Transportation status updated');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update status');
        },
    });
};

// Transporters Management
export const useTransportersQuery = () => {
    return useQuery({
        queryKey: TRANSPORTERS_QUERY_KEY,
        queryFn: async () => {
            const response = await api.get('/transporters', { withCredentials: true });
            return response.data;
        },
    });
};

export const useCreateTransporter = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: any) => {
            const response = await api.post('/transporters', data, { withCredentials: true });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TRANSPORTERS_QUERY_KEY });
            toast.success('Transporter registered successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to register transporter');
        },
    });
};

export const useUpdateTransporter = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string | number; data: any }) => {
            const response = await api.put(`/transporters/${id}`, data, { withCredentials: true });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TRANSPORTERS_QUERY_KEY });
            toast.success('Transporter updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update transporter');
        },
    });
};

export const useDeleteTransporter = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string | number) => {
            await api.delete(`/transporters/${id}`, { withCredentials: true });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TRANSPORTERS_QUERY_KEY });
            toast.success('Transporter removed successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to remove transporter');
        },
    });
};
export const useAddTransporter = useCreateTransporter;

// Trips Management
export const useTripsQuery = () => {
    return useQuery({
        queryKey: ['trips'],
        queryFn: async () => {
            const response = await api.get('/transportation/trips', { withCredentials: true });
            return response.data;
        },
    });
};

export const useAddTrip = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: any) => {
            const response = await api.post('/transportation/trips', data, { withCredentials: true });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trips'] });
            toast.success('Trip created successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create trip');
        },
    });
};

export const useUpdateTrip = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string | number; data: any }) => {
            const response = await api.put(`/transportation/trips/${id}`, data, { withCredentials: true });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trips'] });
            toast.success('Trip updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update trip');
        },
    });
};

export const useDeleteTrip = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string | number) => {
            await api.delete(`/transportation/trips/${id}`, { withCredentials: true });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trips'] });
            toast.success('Trip deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete trip');
        },
    });
};
