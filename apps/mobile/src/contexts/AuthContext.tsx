import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Platform, Linking } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import type { AuthError, Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAnonymous: boolean;
  signUp: (
    email: string,
    password: string
  ) => Promise<{ user: User | null; session: Session | null; error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null; cancelled?: boolean }>;
  signInAnonymously: () => Promise<{ error: AuthError | null }>;
  resetPasswordForEmail: (email: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const handleDeepLink = async ({ url }: { url: string }) => {
      try {
        if (!url || !url.includes("auth/callback")) return;
        const parsed = new URL(url);
        const params = new URLSearchParams(parsed.hash ? parsed.hash.slice(1) : parsed.search);
        const code = params.get("code");
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        if (code) {
          const { data } = await supabase.auth.exchangeCodeForSession(code);
          if (data?.session) {
            setSession(data.session);
            setUser(data.user);
          }
        } else if (accessToken && refreshToken) {
          const { data } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
          if (data?.session) {
            setSession(data.session);
            setUser(data.user);
          }
        }
      } catch {
        // Ignore deep link parse errors
      }
    };

    const linkSub = Linking.addEventListener("url", handleDeepLink);

    return () => {
      subscription.unsubscribe();
      linkSub.remove();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
    if (!error && data?.session) {
      setSession(data.session);
      setUser(data.user);
    }
    return { user: data.user, session: data.session, error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (!error && data?.session) {
      setSession(data.session);
      setUser(data.user);
    }
    return { error };
  };

  const signInWithGoogle = async (): Promise<{ error: Error | null; cancelled?: boolean }> => {
    const redirectUri = AuthSession.makeRedirectUri({ scheme: "moneymanager", path: "auth/callback" });

    if (Platform.OS === "web") {
      const webRedirect = typeof window !== "undefined" ? `${window.location.origin}/dashboard` : redirectUri;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: webRedirect },
      });
      return { error };
    }

    const { data, error: urlError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectUri, skipBrowserRedirect: true },
    });
    if (urlError || !data.url) return { error: urlError ?? new Error("Couldn't start Google sign-in.") };

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);
    if (result.type !== "success" || !result.url) {
      return result.type === "cancel" || result.type === "dismiss"
        ? { error: null, cancelled: true }
        : { error: new Error("Google sign-in failed.") };
    }

    try {
      const url = new URL(result.url);
      const params = new URLSearchParams(url.hash ? url.hash.slice(1) : url.search);
      const code = params.get("code");
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");

      if (code) {
        const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (!exchangeError && exchangeData?.session) {
          setSession(exchangeData.session);
          setUser(exchangeData.user);
          return { error: null };
        }
        if (exchangeError) return { error: exchangeError };
      }

      if (accessToken && refreshToken) {
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (!sessionError && sessionData?.session) {
          setSession(sessionData.session);
          setUser(sessionData.user);
          return { error: null };
        }
        if (sessionError) return { error: sessionError };
      }
    } catch (parseErr) {
      return { error: parseErr instanceof Error ? parseErr : new Error("Failed to parse Google sign-in response.") };
    }

    return { error: new Error("Google sign-in didn't return a session.") };
  };

  const signInAnonymously = async () => {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (!error && data?.session) {
      setSession(data.session);
      setUser(data.user);
    }
    return { error };
  };

  const resetPasswordForEmail = async (email: string) => {
    const redirectUri = AuthSession.makeRedirectUri({ scheme: "moneymanager", path: "auth/callback" });
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: redirectUri,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isAnonymous: user?.is_anonymous === true,
        signUp,
        signIn,
        signInWithGoogle,
        signInAnonymously,
        resetPasswordForEmail,
        signOut,
      }}
    >
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
