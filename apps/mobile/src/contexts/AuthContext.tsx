import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
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

    return () => subscription.unsubscribe();
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

    const url = new URL(result.url);
    const params = new URLSearchParams(url.hash ? url.hash.slice(1) : url.search);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    if (!accessToken || !refreshToken) {
      return { error: new Error("Google sign-in didn't return a session.") };
    }

    const { data: sessionData, error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    if (!error && sessionData?.session) {
      setSession(sessionData.session);
      setUser(sessionData.user);
    }
    return { error };
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
