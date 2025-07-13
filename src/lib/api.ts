// API configuration and utilities
const API_BASE_URL = 'http://localhost:5000';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface BusinessEntry {
  date: string;
  companyName: string;
  accountName: string;
  subAccount?: string;
  particulars: string;
  saleQ: number;
  purchaseQ: number;
  credit: number;
  debit: number;
  staff: string;
  user: string;
}

// Create new business entry
export const createBusinessEntry = async (entry: BusinessEntry): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/business/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(entry),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      data,
      message: 'Entry created successfully'
    };
  } catch (error) {
    console.error('API Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create entry'
    };
  }
};