import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ==================== Types ====================

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'university' | 'student';
  regNo?: string;
  universityId?: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface UniversityOption {
  id: string;
  name: string;
}

export interface Custodian {
  id: string;
  name: string;
  publicKey: string;
  endpoint?: string;
}

export interface Credential {
  id: number;
  credentialNo: string;
  studentId: number;
  universityId: number;
  degreeName: string;
  graduationYear: number;
  ipfsCID: string;
  fileHash: string;
  jsonHash: string;
  blockchainTx: string;
  status: string;
  createdAt: string;
  student?: {
    name: string;
    regNo: string;
  };
  university?: {
    name: string;
  };
}

export interface VerificationResult {
  valid: boolean;
  credential?: Credential;
  message: string;
}

// ==================== Auth APIs ====================

export const authAPI = {
  signupUniversity: async (data: {
    name: string;
    email: string;
    password: string;
    walletAddress?: string;
  }): Promise<AuthResponse> => {
    const res = await api.post('/api/auth/signup/university', data);
    return res.data;
  },

  signupStudent: async (data: {
    name: string;
    regNo: string;
    email: string;
    password: string;
    universityId: string;
  }): Promise<AuthResponse> => {
    const res = await api.post('/api/auth/signup/student', data);
    return res.data;
  },

  getUniversities: async (): Promise<UniversityOption[]> => {
    const res = await api.get('/api/auth/universities');
    return res.data.universities;
  },

  login: async (data: {
    email: string;
    password: string;
    role: 'university' | 'student';
  }): Promise<AuthResponse> => {
    const res = await api.post('/api/auth/login', data);
    return res.data;
  },
};

// ==================== Custodian APIs ====================

export const custodianAPI = {
  getAll: async (): Promise<Custodian[]> => {
    const res = await api.get('/api/custodians');
    return res.data.custodians;
  },
};

// ==================== Certificate APIs ====================

export const certificateAPI = {
  issue: async (formData: FormData): Promise<Credential> => {
    const res = await api.post('/api/certificates/issue', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data.credential;
  },

  list: async (): Promise<Credential[]> => {
    const res = await api.get('/api/certificates/list');
    return res.data.credentials;
  },

  getById: async (id: number): Promise<Credential> => {
    const res = await api.get(`/api/certificates/${id}`);
    return res.data;
  },

  verifyByFile: async (fileHash: string): Promise<VerificationResult> => {
    const res = await api.get(`/api/certificates/verify`, {
      params: { fileHash },
    });
    return res.data;
  },

  verifyByMetadata: async (jsonHash: string): Promise<VerificationResult> => {
    const res = await api.get(`/api/certificates/verify`, {
      params: { jsonHash },
    });
    return res.data;
  },

  downloadFile: async (cid: string): Promise<Blob> => {
    const res = await api.get(`/api/certificates/download/${cid}`, {
      responseType: 'blob',
    });
    return res.data;
  },
};

export default api;
