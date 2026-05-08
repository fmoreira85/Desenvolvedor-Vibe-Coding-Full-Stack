import { type ReactNode, useEffect } from "react";

import { useSessionStore } from "../../hooks/useSessionStore";
import { authApi } from "../../services/api/authApi";
import { isSupabaseAuthEnabled } from "../../services/supabase/client";

type SessionBootstrapProps = {
  children: ReactNode;
};

export const SessionBootstrap = ({ children }: SessionBootstrapProps) => {
  const setSession = useSessionStore((state) => state.setSession);
  const logout = useSessionStore((state) => state.logout);

  useEffect(() => {
    if (!isSupabaseAuthEnabled()) {
      return;
    }

    void authApi
      .hydrateSession()
      .then((payload) => {
        if (payload) {
          setSession(payload);
        }
      })
      .catch(() => logout());

    return authApi.onSessionChange((payload) => {
      if (payload) {
        setSession(payload);
        return;
      }

      logout();
    });
  }, [logout, setSession]);

  return <>{children}</>;
};
