import { createContext } from "react";
import type { User } from "@supabase/supabase-js";

export interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

/**
 * 컴포넌트가 아닌 값은 .tsx에서 내보내면 Fast Refresh가 깨진다(react-refresh 규칙).
 * 그래서 컨텍스트 객체와 타입만 이 파일에 둔다.
 */
export const AuthContext = createContext<AuthContextValue | null>(null);
