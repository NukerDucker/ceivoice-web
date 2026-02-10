const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export interface TicketResponse {
  id: string;
  title: string;
  description?: string;
  category?: string;
  status: 'SUBMITTED' | 'IN_PROGRESS' | 'RESOLVED' | 'CRITICAL';
  createdAt: string;
  updatedAt: string;
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
}

export const getTickets = async () => {
  const token = localStorage.getItem("accessToken");
  if (!token) throw new Error("No access token found");

  const response = await fetch(`${API_URL}/tickets`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      window.location.href = "/login";
    }
    throw new Error(data.error || "Failed to fetch tickets");
  }

  return data;
};

export const getTicketById = async (id: string) => {
  const token = localStorage.getItem("accessToken");
  if (!token) throw new Error("No access token found");

  const response = await fetch(`${API_URL}/tickets/${id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      window.location.href = "/login";
    }
    throw new Error(data.error || "Failed to fetch ticket");
  }

  return data;
};
