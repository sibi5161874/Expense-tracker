import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import type { AuthError, Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

// Required once at module load so a browser tab left open by a cancelled/interrupted auth
// session (e.g. the app was backgrounded mid-flow) gets dismissed instead of lingering.
WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  /** True for a session created via `signInAnonymously` — no email/password set yet, so
   * the account can't be recovered if the device is wiped. Screens use this to prompt
   * upgrading to a full account (see Settings). */
  isAnonymous: boolean;
  signUp: (
    email: string,
    password: string
  ) => Promise<{ user: User | null; session: Session | null; error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null; cancelled?: boolean }>;
  /** Opt-in, not automatic — creates a real `auth.uid()` (existing RLS policies need no
   * changes) so the app is usable immediately with zero login friction. Requires
   * "Anonymous Sign-Ins" enabled in the Supabase dashboard (Authentication → Providers). */
  signInAnonymously: () => Promise<{ error: AuthError | null }>;
  resetPasswordForEmail: (email: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mirrors apps/web/src/contexts/AuthContext.tsx. Google OAuth here (see signInWithGoogle
// below) needs the app's own URL scheme ("moneymanager", set in app.json) registered as an
// authorized redirect URL in the Supabase dashboard (Authentication → URL Configuration) —
// that's a dashboard setting, not something this code can configure itself.
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
    const { data, error } = await supabase.auth.signUp({ email, password });
    // `session` tells the caller apart "account created, confirmation email sent" (null) from
    // "account created and already signed in" (present — confirm-email is off on this
    // project) — previously discarded, so the signup screen always showed "check your email"
    // even when the account was already fully active.
    return { user: data.user, session: data.session, error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  // supabase-js can't redirect a browser it doesn't own, so this asks for the provider URL
  // only (skipBrowserRedirect), opens it in an OS-level auth browser tab via expo-web-browser
  // (which — unlike a WebView — shares cookies with the system browser, so an already-signed-
  // in Google account completes without retyping a password), then hands the redirect's
  // tokens to setSession once the tab closes back into the app via its own URL scheme.
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

    const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    return { error };
  };

  const signInAnonymously = async () => {
    const { error } = await supabase.auth.signInAnonymously();
    return { error };
  };

  const resetPasswordForEmail = async (email: string) => {
    const redirectUri = AuthSession.makeRedirectUri({ scheme: "moneymanager", path: "auth/callback" });
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUri,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
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
