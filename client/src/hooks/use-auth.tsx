import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
  useQueryClient,
} from "@tanstack/react-query";
import type { 
  User, 
  RegisterUser, 
  LoginPhone, 
  LoginPassword, 
  VerifyCode, 
  ChangePassword, 
  ResetPassword, 
  GuestLogin 
} from "@shared/schema";
import { apiRequest } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  sessionId: string | null;
  isGuest: boolean;
  registerMutation: UseMutationResult<{ userId: number; message: string }, Error, RegisterUser>;
  verifyRegistrationMutation: UseMutationResult<{ user: User; sessionId: string }, Error, VerifyCode>;
  sendLoginCodeMutation: UseMutationResult<{ message: string }, Error, LoginPhone>;
  verifyLoginMutation: UseMutationResult<{ user: User; sessionId: string }, Error, VerifyCode>;
  loginPasswordMutation: UseMutationResult<{ user: User; sessionId: string }, Error, LoginPassword>;
  guestLoginMutation: UseMutationResult<{ user: User; sessionId: string }, Error, GuestLogin>;
  changePasswordMutation: UseMutationResult<{ message: string }, Error, ChangePassword>;
  sendPasswordResetMutation: UseMutationResult<{ message: string }, Error, LoginPhone>;
  resetPasswordMutation: UseMutationResult<{ message: string }, Error, ResetPassword>;
  logoutMutation: UseMutationResult<{ message: string }, Error, void>;
  logout: () => void;
  setSession: (user: User, sessionId: string) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sessionId, setSessionId] = useState<string | null>(() => {
    return localStorage.getItem('sessionId');
  });

  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      if (!sessionId) return null;
      try {
        const res = await apiRequest("GET", "/api/auth/user", undefined, {
          Authorization: `Bearer ${sessionId}`,
        });
        if (res.status === 401) {
          localStorage.removeItem('sessionId');
          setSessionId(null);
          return null;
        }
        return await res.json();
      } catch (error) {
        localStorage.removeItem('sessionId');
        setSessionId(null);
        return null;
      }
    },
    enabled: !!sessionId,
  });

  const isGuest = user?.isGuest || false;

  const setSession = (newUser: User, newSessionId: string) => {
    setSessionId(newSessionId);
    localStorage.setItem('sessionId', newSessionId);
    queryClient.setQueryData(["/api/auth/user"], newUser);
  };

  const logout = () => {
    setSessionId(null);
    localStorage.removeItem('sessionId');
    queryClient.setQueryData(["/api/auth/user"], null);
    queryClient.clear();
  };

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterUser) => {
      const res = await apiRequest("POST", "/api/auth/register", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Verification code sent",
        description: "Please check your phone for the verification code.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const verifyRegistrationMutation = useMutation({
    mutationFn: async (data: VerifyCode) => {
      const res = await apiRequest("POST", "/api/auth/verify", data);
      return await res.json();
    },
    onSuccess: (result) => {
      setSession(result.user, result.sessionId);
      toast({
        title: "Account created successfully",
        description: "Welcome to Disc Golf Scorekeeper!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const sendLoginCodeMutation = useMutation({
    mutationFn: async (data: LoginPhone) => {
      const res = await apiRequest("POST", "/api/auth/login/code", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Login code sent",
        description: "Please check your phone for the login code.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send code",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const verifyLoginMutation = useMutation({
    mutationFn: async (data: VerifyCode) => {
      const res = await apiRequest("POST", "/api/auth/login/verify", data);
      return await res.json();
    },
    onSuccess: (result) => {
      setSession(result.user, result.sessionId);
      toast({
        title: "Logged in successfully",
        description: "Welcome back!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const loginPasswordMutation = useMutation({
    mutationFn: async (data: LoginPassword) => {
      const res = await apiRequest("POST", "/api/auth/login/password", data);
      return await res.json();
    },
    onSuccess: (result) => {
      setSession(result.user, result.sessionId);
      toast({
        title: "Logged in successfully",
        description: "Welcome back!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const guestLoginMutation = useMutation({
    mutationFn: async (data: GuestLogin) => {
      const res = await apiRequest("POST", "/api/auth/guest", data);
      return await res.json();
    },
    onSuccess: (result) => {
      setSession(result.user, result.sessionId);
      toast({
        title: "Playing as guest",
        description: `Welcome ${result.user.firstName}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Guest login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: ChangePassword) => {
      const res = await apiRequest("POST", "/api/auth/change-password", data, {
        Authorization: `Bearer ${sessionId}`,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Password changed",
        description: "Your password has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Password change failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const sendPasswordResetMutation = useMutation({
    mutationFn: async (data: LoginPhone) => {
      const res = await apiRequest("POST", "/api/auth/password-reset/code", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Reset code sent",
        description: "Please check your phone for the password reset code.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send reset code",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetPassword) => {
      const res = await apiRequest("POST", "/api/auth/password-reset/verify", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Password reset successful",
        description: "Your password has been reset. Please log in with your new password.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Password reset failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      if (!sessionId) return { message: "Already logged out" };
      const res = await apiRequest("POST", "/api/auth/logout", undefined, {
        Authorization: `Bearer ${sessionId}`,
      });
      return await res.json();
    },
    onSuccess: () => {
      logout();
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
    },
    onError: () => {
      // Even if the server request fails, we should still logout locally
      logout();
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        sessionId,
        isGuest,
        registerMutation,
        verifyRegistrationMutation,
        sendLoginCodeMutation,
        verifyLoginMutation,
        loginPasswordMutation,
        guestLoginMutation,
        changePasswordMutation,
        sendPasswordResetMutation,
        resetPasswordMutation,
        logoutMutation,
        logout,
        setSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}