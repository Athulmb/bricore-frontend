import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import { toast } from 'sonner';

export const SETTINGS_QUERY_KEY = ['settings'];

export const useSettingsQuery = (options = {}) => {
    return useQuery({
        queryKey: SETTINGS_QUERY_KEY,
        queryFn: async () => {
            const response = await api.get('/company-settings', { withCredentials: true });
            return response.data;
        },
        ...options
    });
};

export const useUpdateSettings = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: any) => {
            const response = await api.patch('/company-settings', data, { withCredentials: true });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY });
            toast.success('Settings updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update settings');
        },
    });
};
