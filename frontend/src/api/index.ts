import api from './client';
import { AuthResponse, Book, Loan, Reservation, SearchResult, User } from '../types';

// Auth APIs
export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
  },
  register: async (email: string, password: string, full_name: string): Promise<{ user: User }> => {
    const { data } = await api.post('/auth/register', { email, password, full_name });
    return data;
  },
};

// Books APIs
export const booksApi = {
  getAll: async (query?: string): Promise<{ books: Book[] }> => {
    const { data } = await api.get('/books', { params: query ? { q: query } : {} });
    return data;
  },
  getById: async (id: number): Promise<{ book: Book }> => {
    const { data } = await api.get(`/books/${id}`);
    return data;
  },
  create: async (book: Partial<Book>): Promise<{ book: Book }> => {
    const { data } = await api.post('/books', book);
    return data;
  },
  update: async (id: number, book: Partial<Book>): Promise<{ book: Book }> => {
    const { data } = await api.patch(`/books/${id}`, book);
    return data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/books/${id}`);
  },
};

// Loans APIs
export const loansApi = {
  getAll: async (filters?: { user_id?: number; status?: string }): Promise<{ loans: Loan[] }> => {
    const { data } = await api.get('/loans', { params: filters });
    return data;
  },
  issue: async (user_id: number, book_id: number): Promise<{ loan: Loan }> => {
    const { data } = await api.post('/loans/issue', { user_id, book_id });
    return data;
  },
  return: async (loan_id: number): Promise<{ message: string }> => {
    const { data } = await api.post('/loans/return', { loan_id });
    return data;
  },
  renew: async (loan_id: number): Promise<{ loan: Loan }> => {
    const { data } = await api.post('/loans/renew', { loan_id });
    return data;
  },
};

// Reservations APIs
export const reservationsApi = {
  getAll: async (filters?: { user_id?: number; status?: string }): Promise<{ reservations: Reservation[] }> => {
    const { data } = await api.get('/reservations', { params: filters });
    return data;
  },
  create: async (user_id: number, book_id: number): Promise<{ reservation: Reservation }> => {
    const { data } = await api.post('/reservations', { user_id, book_id });
    return data;
  },
  cancel: async (id: number): Promise<void> => {
    await api.post(`/reservations/${id}/cancel`);
  },
};

// Search APIs
export const searchApi = {
  semantic: async (query: string, limit?: number): Promise<{ results: SearchResult[] }> => {
    const { data } = await api.post('/search/semantic', { query, limit });
    return data;
  },
  suggest: async (prefix: string): Promise<{ suggestions: string[] }> => {
    const { data } = await api.get('/search/suggest', { params: { prefix } });
    return data;
  },
};

// Recommendations APIs
export const recommendationsApi = {
  forUser: async (userId: number): Promise<{ recommendations: Book[] }> => {
    const { data } = await api.get(`/recommendations/user/${userId}`);
    return data;
  },
  similar: async (bookId: number): Promise<{ similar: Book[] }> => {
    const { data } = await api.get(`/recommendations/similar/${bookId}`);
    return data;
  },
};

// Inventory APIs
export const inventoryApi = {
  lowStock: async (threshold?: number): Promise<{ books: Book[]; count: number }> => {
    const { data } = await api.get('/inventory/low-stock', { params: { threshold } });
    return data;
  },
};

// Notifications APIs
export const notificationsApi = {
  sendDueReminders: async (): Promise<{ dueSoonSent: number; overdueSent: number; errors: number }> => {
    const { data } = await api.post('/notifications/send-due-reminders');
    return data;
  },
};

// Health API
export const healthApi = {
  check: async (): Promise<{ status: string; timestamp: string }> => {
    const { data } = await api.get('/health');
    return data;
  },
};
