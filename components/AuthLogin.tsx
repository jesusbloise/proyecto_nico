import React, { useMemo, useState } from "react";
import { KeyRound, Loader, LogIn, UserPlus, Mail } from "lucide-react";

type ApiUser = {
  email: string;
  role: "admin" | "user";
  credits: number;
  usedCredits?: number;
};

type LoginResult =
  | { ok: true; token: string; user: ApiUser }
  | { ok: false; message: string };

type Props = {
  onLoginSuccess: (user: ApiUser, token: string) => void;
  onGoRegister: () => void;
};

const TOKEN_KEY = "mpn_token_v1";
const SUPPORT_EMAIL = "hello@mediapronamer.com";
const API_BASE = (import.meta as any).env?.VITE_API_BASE || "";

async function apiLogin(email: string, password: string): Promise<LoginResult> {
  try {
    const r = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await r.json().catch(() => null);

    if (!r.ok) {
      return { ok: false, message: data?.message || "LOGIN FAILED." };
    }

    if (!data?.ok || typeof data?.token !== "string" || !data?.user) {
      return { ok: false, message: "BAD SERVER RESPONSE." };
    }

    return { ok: true, token: data.token, user: data.user as ApiUser };
  } catch {
    return { ok: false, message: "SERVER OFFLINE." };
  }
}

export const AuthLogin: React.FC<Props> = ({ onLoginSuccess, onGoRegister }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [status, setStatus] = useState<"IDLE" | "CHECKING" | "ERROR">("IDLE");
  const [errorMsg, setErrorMsg] = useState("");

  const disabled = useMemo(() => {
    return status === "CHECKING" || !email.trim() || !password.trim();
  }, [status, email, password]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;

    setStatus("CHECKING");
    setErrorMsg("");

    setTimeout(async () => {
      const res = await apiLogin(email.trim(), password);

      if (!res.ok) {
        setStatus("ERROR");
        if ("message" in res) setErrorMsg(res.message);
        return;
      }

      sessionStorage.setItem(TOKEN_KEY, res.token);

      setStatus("IDLE");
      onLoginSuccess(res.user, res.token);
    }, 650);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-neon-dark">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-neon-dark to-neon-pink/10"></div>
        <div
          className="absolute w-[200%] h-[100%] left-[-50%] bottom-0 origin-bottom"
          style={{
            transform: "perspective(500px) rotateX(60deg)",
            backgroundSize: "40px 40px",
            backgroundImage: `
              linear-gradient(to right, rgba(0, 255, 255, 0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 106, 193, 0.1) 1px, transparent 1px)
            `,
            animation: "gridMove 20s linear infinite",
          }}
        ></div>
        <style>{`
          @keyframes gridMove {
            0% { transform: perspective(500px) rotateX(60deg) translateY(0); }
            100% { transform: perspective(500px) rotateX(60deg) translateY(40px); }
          }
        `}</style>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-neon-panel/90 backdrop-blur-md border-2 border-neon-pink shadow-[0_0_20px_rgba(255,106,193,0.3)] p-8 rounded-lg relative overflow-hidden mt-12">
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] opacity-20"></div>

          <div className="relative z-10 text-center">
            <h1 className="font-retro text-2xl text-neon-pink mb-2 tracking-tighter drop-shadow-md">
              LOGIN
            </h1>
            <p className="font-code text-neon-cyan text-sm mb-6 tracking-widest opacity-80 border-b border-neon-cyan/30 pb-4">
              MEDIA PRO NAMER // ACCESS
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="text-left">
                <label className="block text-xs font-tech text-neon-pink/70 mb-1 ml-1">
                  EMAIL:
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="w-full bg-black/50 border-2 border-neon-cyan/60 font-code text-center text-lg py-2 px-4 rounded focus:outline-none focus:border-neon-pink focus:shadow-neon-pink transition-all text-neon-cyan placeholder:text-neon-cyan/30"
                />
              </div>

              <div className="text-left">
                <label className="block text-xs font-tech text-neon-pink/70 mb-1 ml-1">
                  PASSWORD:
                </label>
                <div className="relative">
                  <KeyRound
                    className="absolute left-3 top-3 text-neon-cyan opacity-50"
                    size={18}
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="********"
                    className={`w-full bg-black/50 border-2 font-code text-center text-lg py-2 pl-10 pr-4 rounded focus:outline-none transition-all text-neon-cyan
                      ${
                        status === "ERROR"
                          ? "border-neon-pink/60 focus:border-neon-pink focus:shadow-neon-pink"
                          : "border-neon-cyan/60 focus:border-neon-pink focus:shadow-neon-pink"
                      }
                    `}
                  />
                </div>

                {status === "ERROR" && (
                  <p className="text-neon-pink/80 font-tech text-xs mt-2 text-center animate-pulse">
                    &gt; {errorMsg}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={disabled}
                className={`w-full font-retro text-sm py-4 border-2 transition-all relative overflow-hidden
                  ${
                    disabled
                      ? "opacity-60 cursor-not-allowed border-neon-pink/40 text-neon-pink/50"
                      : "bg-transparent border-neon-pink text-neon-pink hover:bg-neon-pink hover:text-black hover:shadow-[0_0_20px_#ff6ac1]"
                  }
                `}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {status === "CHECKING" ? (
                    <Loader className="animate-spin" size={16} />
                  ) : (
                    <LogIn size={16} />
                  )}
                  {status === "CHECKING" ? "AUTHENTICATING..." : "ENTER"}
                </span>
              </button>

              <button
                type="button"
                onClick={onGoRegister}
                className="w-full font-retro text-sm py-3 border-2 border-neon-cyan text-neon-cyan hover:bg-neon-cyan/20 hover:shadow-[0_0_10px_#00FFFF] transition-all"
              >
                <span className="flex items-center justify-center gap-2">
                  <UserPlus size={16} />
                  CREATE ACCOUNT
                </span>
              </button>
            </form>

            <div className="mt-6 border-t border-neon-cyan/20 pt-4 font-tech text-xs text-neon-cyan/70">
              <div className="flex items-center justify-center gap-2 text-neon-pink/70 mb-1">
                <Mail size={13} />
                FORGOT PASSWORD?
              </div>

              <div>
                Contact support at{" "}
                <a
                  href={`mailto:${SUPPORT_EMAIL}?subject=Password recovery - Media Pro Namer`}
                  className="text-neon-cyan hover:text-neon-pink transition-all underline underline-offset-4"
                >
                  {SUPPORT_EMAIL}
                </a>
              </div>
            </div>

            <div className="mt-4 font-tech text-xs text-gray-500">
              If you don&apos;t have credits, contact the administrator.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};