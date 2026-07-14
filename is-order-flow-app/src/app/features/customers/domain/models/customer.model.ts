export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CustomerFilterParams {
  page?: number;
  per_page?: number;
}

export interface CreateCustomerRequest {
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
}

export interface UpdateCustomerRequest extends CreateCustomerRequest {}
