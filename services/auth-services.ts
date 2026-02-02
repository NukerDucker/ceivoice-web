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