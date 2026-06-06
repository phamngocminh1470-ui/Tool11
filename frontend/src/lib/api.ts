const getApiBaseUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  const cleanUrl = envUrl.replace(/\/$/, "");
  return cleanUrl.endsWith("/api") ? cleanUrl : `${cleanUrl}/api`;
};

const API_BASE_URL = getApiBaseUrl();


function getHeaders(isMultipart = false) {
  const token = typeof window !== "undefined" ? localStorage.getItem("studyos_token") : null;
  const headers: Record<string, string> = {};
  
  if (!isMultipart) {
    headers["Content-Type"] = "application/json";
  }
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  return headers;
}

async function handleResponse(response: Response) {
  if (!response.ok) {
    let errMsg = "Đã xảy ra lỗi hệ thống";
    try {
      const errData = await response.json();
      errMsg = errData.detail || errData.message || errMsg;
    } catch {
      // ignore
    }
    throw new Error(errMsg);
  }
  return response.json();
}

export const api = {
  // --- AUTH ---
  async login(credentials: any) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(credentials),
    });
    return handleResponse(res);
  },

  async register(data: any) {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async verifyOtp(data: { email: string; otp: string }) {
    const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async forgotPassword(email: string) {
    const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ email }),
    });
    return handleResponse(res);
  },

  async resetPassword(data: any) {
    const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async loginGoogle(email: string, name: string, avatarUrl?: string) {
    const res = await fetch(`${API_BASE_URL}/auth/login-google`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ email, name, avatar_url: avatarUrl }),
    });
    return handleResponse(res);
  },

  async loginGithub(email: string, name: string, avatarUrl?: string) {
    const res = await fetch(`${API_BASE_URL}/auth/login-github`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ email, name, avatar_url: avatarUrl }),
    });
    return handleResponse(res);
  },

  async updateProfile(data: { full_name?: string; avatar_url?: string }) {
    const res = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async changePassword(data: any) {
    const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // --- DASHBOARD ---
  async getDashboardStats() {
    const res = await fetch(`${API_BASE_URL}/dashboard/stats`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async getDashboardCharts() {
    const res = await fetch(`${API_BASE_URL}/dashboard/charts`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // --- FILES / UPLOAD ---
  async uploadFile(file: File, progressCallback?: (percent: number) => void) {
    const formData = new FormData();
    formData.append("file", file);

    // Using XMLHttpRequest for upload progress support
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API_BASE_URL}/files/upload`);
      
      const token = typeof window !== "undefined" ? localStorage.getItem("studyos_token") : null;
      if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      }

      if (progressCallback && xhr.upload) {
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            progressCallback(percent);
          }
        });
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch {
            resolve({ message: "Upload thành công" });
          }
        } else {
          try {
            const err = JSON.parse(xhr.responseText);
            reject(new Error(err.detail || "Upload file thất bại"));
          } catch {
            reject(new Error("Upload file thất bại"));
          }
        }
      };

      xhr.onerror = () => reject(new Error("Lỗi kết nối mạng"));
      xhr.send(formData);
    });
  },

  async getDocuments(q?: string) {
    const url = q ? `${API_BASE_URL}/files/list?q=${encodeURIComponent(q)}` : `${API_BASE_URL}/files/list`;
    const res = await fetch(url, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async renameDocument(docId: number, name: string) {
    const res = await fetch(`${API_BASE_URL}/files/${docId}/rename`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ name }),
    });
    return handleResponse(res);
  },

  async deleteDocument(docId: number) {
    const res = await fetch(`${API_BASE_URL}/files/${docId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async getAnalysisStatus(docId: number) {
    const res = await fetch(`${API_BASE_URL}/files/${docId}/status`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // --- AI SERVICES ---
  async getSummary(docId: number) {
    const res = await fetch(`${API_BASE_URL}/ai-services/summary/${docId}`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async getKnowledgeMap(docId: number) {
    const res = await fetch(`${API_BASE_URL}/ai-services/knowledge-map/${docId}`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async getFlashcards(docId: number) {
    const res = await fetch(`${API_BASE_URL}/ai-services/flashcards/${docId}`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async reviewFlashcard(data: { flashcard_id: number; box_level: number }) {
    const res = await fetch(`${API_BASE_URL}/ai-services/flashcards/review`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async getQuizzes(docId: number) {
    const res = await fetch(`${API_BASE_URL}/ai-services/quizzes/${docId}`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // --- EXAM MODE ---
  async startExam(data: { document_id: number; num_questions: number; difficulty: string; type?: string }) {
    const res = await fetch(`${API_BASE_URL}/ai-services/exam/start`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async submitExam(data: { exam_id: number; answers: Array<{ quiz_id: number; answer: string }>; duration_seconds: number; tab_switch_count: number }) {
    const res = await fetch(`${API_BASE_URL}/ai-services/exam/submit`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // --- AI TUTOR (CHAT) ---
  async askTutor(data: { document_id: number; message: string; history: Array<{ role: string; content: string }> }) {
    const res = await fetch(`${API_BASE_URL}/ai-services/tutor/chat`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // --- PAYMENT ---
  async checkout(data: { tier: string; gateway: string }) {
    const res = await fetch(`${API_BASE_URL}/payment/checkout`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async triggerPaymentSuccessCallback(orderId: string) {
    const res = await fetch(`${API_BASE_URL}/payment/callback/${orderId}`, {
      method: "POST",
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // --- AFFILIATE ---
  async getAffiliateStats() {
    const res = await fetch(`${API_BASE_URL}/affiliate/stats`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async requestWithdrawal() {
    const res = await fetch(`${API_BASE_URL}/affiliate/withdraw`, {
      method: "POST",
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // --- ADMIN PANEL ---
  async adminGetUsers() {
    const res = await fetch(`${API_BASE_URL}/admin/users`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async adminUpdateUser(userId: number, data: { role?: string; tier?: string; is_verified?: boolean }) {
    const res = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async adminGetStats() {
    const res = await fetch(`${API_BASE_URL}/admin/stats`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async adminGetLogs() {
    const res = await fetch(`${API_BASE_URL}/admin/system-logs`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse(res);
  }
};
