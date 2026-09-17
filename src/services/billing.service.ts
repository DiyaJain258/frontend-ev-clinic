import api from './api';

export const billingService = {
    getInvoices: async (params?: { date?: string; patientName?: string }) => {
        return api.get('/billing/invoices', { params });
    },

    getAccountingDashboardStats: async () => {
        return api.get('/billing/dashboard-stats');
    },

    getPendingItems: async (patientId: number) => {
        return api.get(`/billing/pending/${patientId}`);
    },

    createInvoice: async (data: any) => {
        return api.post('/billing', data);
    },

    updateInvoiceStatus: async (id: string, status: string, paymentMethod?: string) => {
        return api.patch(`/billing/invoices/${id}`, { status, paymentMethod });
    },

    markItemOutside: async (id: number, type: string) => {
        return api.patch(`/billing/pending/${type}/${id}/outside`);
    }
};
