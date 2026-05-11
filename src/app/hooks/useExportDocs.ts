import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import { toast } from 'sonner';

export const EXPORT_DOCS_QUERY_KEY = ['exportDocs'];

export const useExportDocsQuery = () => {
    return useQuery({
        queryKey: EXPORT_DOCS_QUERY_KEY,
        queryFn: async () => {
            const response = await api.get('/export-documentation', { withCredentials: true });
            return response.data;
        },
    });
};

export const useCreateExportDoc = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: any) => {
            const response = await api.post('/export-documentation', data, { withCredentials: true });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: EXPORT_DOCS_QUERY_KEY });
            toast.success('Export document created successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create export document');
        },
    });
};

export const useUpdateExportDoc = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const response = await api.patch(`/export-documentation/${id}`, data, { withCredentials: true });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: EXPORT_DOCS_QUERY_KEY });
            toast.success('Export document updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update export document');
        },
    });
};

export const useDeleteExportDoc = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/export-documentation/${id}`, { withCredentials: true });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: EXPORT_DOCS_QUERY_KEY });
            toast.success('Export document deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete export document');
        },
    });
};

export const useExportDocDetailQuery = (shipmentId: string) => {
    return useQuery({
        queryKey: [...EXPORT_DOCS_QUERY_KEY, shipmentId],
        queryFn: async () => {
            const response = await api.get(`/export-documentation/shipment/${shipmentId}`, { withCredentials: true });
            return {
                ...response.data,
                id: response.data._id
            };
        },
        enabled: !!shipmentId
    });
};

export const useUpdateExportDocStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ shipmentId, id, docKey, file }: { shipmentId: string; id: string; docKey: string; file: File }) => {
            const formData = new FormData();
            formData.append('document', file);

            const response = await api.post(`/export-documentation/upload/${id}/${docKey}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                withCredentials: true
            });
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: EXPORT_DOCS_QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: [...EXPORT_DOCS_QUERY_KEY, variables.shipmentId] });
        }
    });
};

export const useDeleteExportDocFile = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, docKey, shipmentId }: { id: string; docKey: string; shipmentId: string }) => {
            const response = await api.delete(`/export-documentation/document/${id}/${docKey}`, { withCredentials: true });
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: EXPORT_DOCS_QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: [...EXPORT_DOCS_QUERY_KEY, variables.shipmentId] });
        }
    });
};
