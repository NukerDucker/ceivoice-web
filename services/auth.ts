// Simulate a backend delay
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const mockLogin = async (values: any) => {
  await delay(1500); // Simulate network lag

  // Logic to test "error" states
  if (values.email === "error@test.com") {
    throw new Error("Invalid credentials");
  }

  return { success: true, user: { id: "1", name: "Guest User" } };
};

export type RegisterPayload = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type RegisterResponse = {
  token?: string;
  user?: {
    user_id: string;
    email: string;
    name: string;
    role: string;
    is_assignee: boolean;
  };
  error?: string;
  message?: string;
};

export const registerUser = async (payload: RegisterPayload) => {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data: RegisterResponse = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.error || data?.message || "Registration failed";
    throw new Error(message);
  }

  return data;
};