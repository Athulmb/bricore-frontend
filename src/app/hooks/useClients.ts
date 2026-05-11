import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import { toast } from 'sonner';

export interface Client {
    id: number | string;
    name: string;
    address: string;
    tin: string;
    phone: string;
    email: string;
    registrationDate: string;
    status: 'Active' | 'Onboarding' | 'Inactive';
    primaryContact: string;
    industry: string;
    type: 'Supplier' | 'Customer' | 'Both';
}

export const CLIENTS_QUERY_KEY = ['clients'];

export const useClientsQuery = () => {
    return useQuery({
        queryKey: CLIENTS_QUERY_KEY,
        queryFn: async () => {
            const response = await api.get('/clients', { withCredentials: true });
            return response.data.map((client: any) => ({
                ...client,
                id: client._id || client.id
            }));
        },
    });
};

export const useCreateClient = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: any) => {
            const response = await api.post('/clients', data, { withCredentials: true });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CLIENTS_QUERY_KEY });
            toast.success('Client created successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create client');
        },
    });
};

export const useUpdateClient = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string | number; data: any }) => {
            const response = await api.patch(`/clients/${id}`, data, { withCredentials: true });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CLIENTS_QUERY_KEY });
            toast.success('Client updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update client');
        },
    });
};

export const useDeleteClient = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string | number) => {
            await api.delete(`/clients/${id}`, { withCredentials: true });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CLIENTS_QUERY_KEY });
            toast.success('Client deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete client');
        },
    });
};
