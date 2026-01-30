export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'ADMIN' | 'LIBRARIAN' | 'MEMBER';
}

export interface Book {
  id: number;
  isbn: string;
  title: string;
  author: string;
  description: string;
  categories: string;
  total_copies: number;
  available_copies: number;
  created_at: string;
  updated_at: string;
}

export interface Loan {
  id: number;
  user_id: number;
  book_id: number;
  issued_at: string;
  due_at: string;
  returned_at: string | null;
  status: 'ISSUED' | 'RETURNED' | 'OVERDUE';
  renew_count: number;
  book_title?: string;
  user_name?: string;
}

export interface Reservation {
  id: number;
  user_id: number;
  book_id: number;
  created_at: string;
  status: 'ACTIVE' | 'FULFILLED' | 'CANCELLED';
  book_title?: string;
  user_name?: string;
}

export interface SearchResult extends Book {
  score: number;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface ApiError {
  error: string;
}
