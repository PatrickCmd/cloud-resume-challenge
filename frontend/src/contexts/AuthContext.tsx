import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { mockAuthService, User } from "@/services/mockAuthService";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isOwner: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    mockAuthService.getCurrentUser().then((currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });
  }, []);

  const login = async (email: string, password: string): Promise<{ error: string | null }> => {
    const result = await mockAuthService.login(email, password);
    if (result.user) {
      setUser(result.user);
    }
    return { error: result.error };
  };

  const logout = async () => {
    await mockAuthService.logout();
    setUser(null);
  };

  const isOwner = mockAuthService.isOwner(user);

  return (
    <AuthContext.Provider value={{ user, isLoading, isOwner, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
