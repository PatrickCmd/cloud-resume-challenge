// Mock authentication service
// In production, replace with real authentication (e.g., Supabase Auth)

export interface User {
  id: string;
  email: string;
  name: string;
  role: "owner" | "public";
}

// Mock owner credentials (in production, this would be server-side)
const OWNER_CREDENTIALS = {
  email: "p.walukagga@gmail.com",
  password: "admin123", // In production, never store passwords in code
};

const AUTH_STORAGE_KEY = "portfolio_auth_user";

// Simulate async API calls
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockAuthService = {
  async login(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
    await delay(500);

    if (email === OWNER_CREDENTIALS.email && password === OWNER_CREDENTIALS.password) {
      const user: User = {
        id: "owner-1",
        email: OWNER_CREDENTIALS.email,
        name: "Patrick Walukagga",
        role: "owner",
      };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      return { user, error: null };
    }

    return { user: null, error: "Invalid email or password" };
  },

  async logout(): Promise<void> {
    await delay(200);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  },

  async getCurrentUser(): Promise<User | null> {
    await delay(100);
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored) as User;
      } catch {
        return null;
      }
    }
    return null;
  },

  isOwner(user: User | null): boolean {
    return user?.role === "owner";
  },
};
