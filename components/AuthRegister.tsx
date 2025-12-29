import React, { useMemo, useState } from "react";
import { Loader, UserPlus, LogIn } from "lucide-react";

type ApiUser = {
  email: string;
  role: "admin" | "user";
  credits: number;
  usedCredits?: number;
};

type RegisterResult =
  | { ok: true; token: string; user: ApiUser }
  | { ok: false; message: string };

type Props = {
  onRegisterSuccess: (user: ApiUser, token: string) => void;
  onGoLogin: () => void;
};

const TOKEN_KEY = "mpn_token_v1";
const API_BASE = (import.meta as any).env?.VITE_API_BASE || "";

async function apiRegister(
  email: string,
  password: string
): Promise<RegisterResult> {
  try {
    const r = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await r.json().catch(() => null);

    if (!r.ok) {
      return { ok: false, message: data?.message || "REGISTER FAILED." };
    }

    if (!data?.ok || typeof data?.token !== "string" || !data?.user) {
      return { ok: false, message: "BAD SERVER RESPONSE." };
    }

    return { ok: true, token: data.token, user: data.user as ApiUser };
  } catch {
    return { ok: false, message: "SERVER OFFLINE." };
  }
}

export const AuthRegister: React.FC<Props> = ({
  onRegisterSuccess,
  onGoLogin,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const [status, setStatus] = useState<"IDLE" | "CHECKING" | "ERROR">("IDLE");
  const [errorMsg, setErrorMsg] = useState("");

  const passwordHint = useMemo(() => {
    if (!password && !password2) return "";
    if (password.length > 0 && password.length < 6)
      return "PASSWORD MUST BE AT LEAST 6 CHARACTERS.";
    if (password2.length > 0 && password !== password2)
      return "PASSWORDS DO NOT MATCH.";
    return "";
  }, [password, password2]);

  const disabled = useMemo(() => {
    if (status === "CHECKING") return true;
    if (!email.trim() || !password.trim() || !password2.trim()) return true;
    if (password !== password2) return true;
    if (password.length < 6) return true;
    return false;
  }, [status, email, password, password2]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;

    setStatus("CHECKING");
    setErrorMsg("");

    setTimeout(async () => {
      const res = await apiRegister(email.trim(), password);

      if (!res.ok) {
        setStatus("ERROR");
        if ("message" in res) setErrorMsg(res.message);
        return;
      }

  sessionStorage.setItem(TOKEN_KEY, res.token);


      setStatus("IDLE");
      onRegisterSuccess(res.user, res.token);
    }, 650);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-neon-dark">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-neon-dark to-neon-pink/10"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-neon-panel/90 backdrop-blur-md border-2 border-neon-cyan shadow-[0_0_20px_rgba(0,255,255,0.25)] p-8 rounded-lg relative overflow-hidden mt-12">
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] opacity-20"></div>

          <div className="relative z-10 text-center">
            <h1 className="font-retro text-2xl text-neon-cyan mb-2 tracking-tighter drop-shadow-md">
              REGISTER
            </h1>
            <p className="font-code text-neon-pink text-sm mb-6 tracking-widest opacity-80 border-b border-neon-pink/30 pb-4">
              MEDIA PRO NAMER // CREATE USER
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="text-left">
                <label className="block text-xs font-tech text-neon-cyan/70 mb-1 ml-1">
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
                <label className="block text-xs font-tech text-neon-cyan/70 mb-1 ml-1">
                  PASSWORD:
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="min 6 chars"
                  className="w-full bg-black/50 border-2 border-neon-pink/50 font-code text-center text-lg py-2 px-4 rounded focus:outline-none focus:border-neon-cyan focus:shadow-neon-cyan transition-all text-neon-pink"
                />
              </div>

              <div className="text-left">
                <label className="block text-xs font-tech text-neon-cyan/70 mb-1 ml-1">
                  REPEAT PASSWORD:
                </label>
                <input
                  type="password"
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  placeholder="repeat"
                  className="w-full bg-black/50 border-2 border-neon-pink/50 font-code text-center text-lg py-2 px-4 rounded focus:outline-none focus:border-neon-cyan focus:shadow-neon-cyan transition-all text-neon-pink"
                />

                {(status === "ERROR" || passwordHint) && (
                  <p className="text-red-500 font-tech text-xs mt-2 text-center animate-pulse">
                    &gt; {status === "ERROR" ? errorMsg : passwordHint}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={disabled}
                className={`w-full font-retro text-sm py-4 border-2 transition-all relative overflow-hidden
                  ${
                    disabled
                      ? "opacity-60 cursor-not-allowed border-neon-cyan/40 text-neon-cyan/50"
                      : "bg-transparent border-neon-cyan text-neon-cyan hover:bg-neon-cyan/20 hover:shadow-[0_0_10px_#00FFFF]"
                  }
                `}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {status === "CHECKING" ? (
                    <Loader className="animate-spin" size={16} />
                  ) : (
                    <UserPlus size={16} />
                  )}
                  {status === "CHECKING" ? "CREATING..." : "CREATE"}
                </span>
              </button>

              <button
                type="button"
                onClick={onGoLogin}
                className="w-full font-retro text-sm py-3 border-2 border-neon-pink text-neon-pink hover:bg-neon-pink hover:text-black hover:shadow-[0_0_20px_#ff6ac1] transition-all"
              >
                <span className="flex items-center justify-center gap-2">
                  <LogIn size={16} />
                  BACK TO LOGIN
                </span>
              </button>
            </form>

            <div className="mt-6 font-tech text-xs text-gray-500">
              New users start with 0 credits.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};



// import React, { useMemo, useState } from "react";
// import { Loader, UserPlus, LogIn } from "lucide-react";

// type ApiUser = {
//   email: string;
//   role: "admin" | "user";
//   credits: number;
//   usedCredits?: number;
// };

// type RegisterResult =
//   | { ok: true; token: string; user: ApiUser }
//   | { ok: false; message: string };

// type Props = {
//   onRegisterSuccess: (user: ApiUser) => void;
//   onGoLogin: () => void;
// };

// const TOKEN_KEY = "mpn_token_v1";
// const API_BASE = (import.meta as any).env?.VITE_API_BASE || "";

// async function apiRegister(email: string, password: string): Promise<RegisterResult> {
//   try {
//     const r = await fetch(`${API_BASE}/api/auth/register`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ email, password }),
//     });

//     const data = await r.json().catch(() => null);

//     if (!r.ok) {
//       return { ok: false, message: data?.message || "REGISTER FAILED." };
//     }

//     // esperado: { ok:true, token, user:{ email, role, credits, usedCredits? } }
//     if (!data?.ok || !data?.token || !data?.user) {
//       return { ok: false, message: "BAD SERVER RESPONSE." };
//     }

//     return { ok: true, token: data.token, user: data.user as ApiUser };
//   } catch {
//     return { ok: false, message: "SERVER OFFLINE." };
//   }
// }

// export const AuthRegister: React.FC<Props> = ({ onRegisterSuccess, onGoLogin }) => {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [password2, setPassword2] = useState("");

//   const [status, setStatus] = useState<"IDLE" | "CHECKING" | "ERROR">("IDLE");
//   const [errorMsg, setErrorMsg] = useState("");

//   const passwordHint = useMemo(() => {
//     if (!password && !password2) return "";
//     if (password.length > 0 && password.length < 6)
//       return "PASSWORD MUST BE AT LEAST 6 CHARACTERS.";
//     if (password2.length > 0 && password !== password2)
//       return "PASSWORDS DO NOT MATCH.";
//     return "";
//   }, [password, password2]);

//   const disabled = useMemo(() => {
//     if (status === "CHECKING") return true;
//     if (!email.trim() || !password.trim() || !password2.trim()) return true;
//     if (password !== password2) return true;
//     if (password.length < 6) return true;
//     return false;
//   }, [status, email, password, password2]);

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (disabled) return;

//     setStatus("CHECKING");
//     setErrorMsg("");

//     // delay visual igual al login
//     setTimeout(async () => {
//       const res = await apiRegister(email.trim(), password);

//       if (!res.ok) {
//         setStatus("ERROR");
//         if ("message" in res) setErrorMsg(res.message);
//         return;
//       }

//       localStorage.setItem(TOKEN_KEY, res.token);

//       setStatus("IDLE");
//       onRegisterSuccess(res.user);
//     }, 650);
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-neon-dark">
//       <div className="absolute inset-0 overflow-hidden pointer-events-none">
//         <div className="absolute inset-0 bg-gradient-to-b from-black via-neon-dark to-neon-pink/10"></div>
//       </div>

//       <div className="relative z-10 w-full max-w-md">
//         <div className="bg-neon-panel/90 backdrop-blur-md border-2 border-neon-cyan shadow-[0_0_20px_rgba(0,255,255,0.25)] p-8 rounded-lg relative overflow-hidden mt-12">
//           <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] opacity-20"></div>

//           <div className="relative z-10 text-center">
//             <h1 className="font-retro text-2xl text-neon-cyan mb-2 tracking-tighter drop-shadow-md">
//               REGISTER
//             </h1>
//             <p className="font-code text-neon-pink text-sm mb-6 tracking-widest opacity-80 border-b border-neon-pink/30 pb-4">
//               MEDIA PRO NAMER // CREATE USER
//             </p>

//             <form onSubmit={handleSubmit} className="space-y-5">
//               <div className="text-left">
//                 <label className="block text-xs font-tech text-neon-cyan/70 mb-1 ml-1">
//                   EMAIL:
//                 </label>
//                 <input
//                   type="email"
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   placeholder="you@email.com"
//                   className="w-full bg-black/50 border-2 border-neon-cyan/60 font-code text-center text-lg py-2 px-4 rounded focus:outline-none focus:border-neon-pink focus:shadow-neon-pink transition-all text-neon-cyan"
//                 />
//               </div>

//               <div className="text-left">
//                 <label className="block text-xs font-tech text-neon-cyan/70 mb-1 ml-1">
//                   PASSWORD:
//                 </label>
//                 <input
//                   type="password"
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   placeholder="min 6 chars"
//                   className="w-full bg-black/50 border-2 border-neon-pink/50 font-code text-center text-lg py-2 px-4 rounded focus:outline-none focus:border-neon-cyan focus:shadow-neon-cyan transition-all text-neon-pink"
//                 />
//               </div>

//               <div className="text-left">
//                 <label className="block text-xs font-tech text-neon-cyan/70 mb-1 ml-1">
//                   REPEAT PASSWORD:
//                 </label>
//                 <input
//                   type="password"
//                   value={password2}
//                   onChange={(e) => setPassword2(e.target.value)}
//                   placeholder="repeat"
//                   className="w-full bg-black/50 border-2 border-neon-pink/50 font-code text-center text-lg py-2 px-4 rounded focus:outline-none focus:border-neon-cyan focus:shadow-neon-cyan transition-all text-neon-pink"
//                 />

//                 {(status === "ERROR" || passwordHint) && (
//                   <p className="text-red-500 font-tech text-xs mt-2 text-center animate-pulse">
//                     &gt; {status === "ERROR" ? errorMsg : passwordHint}
//                   </p>
//                 )}
//               </div>

//               <button
//                 type="submit"
//                 disabled={disabled}
//                 className={`w-full font-retro text-sm py-4 border-2 transition-all relative overflow-hidden
//                   ${
//                     disabled
//                       ? "opacity-60 cursor-not-allowed border-neon-cyan/40 text-neon-cyan/50"
//                       : "bg-transparent border-neon-cyan text-neon-cyan hover:bg-neon-cyan/20 hover:shadow-[0_0_10px_#00FFFF]"
//                   }
//                 `}
//               >
//                 <span className="relative z-10 flex items-center justify-center gap-2">
//                   {status === "CHECKING" ? (
//                     <Loader className="animate-spin" size={16} />
//                   ) : (
//                     <UserPlus size={16} />
//                   )}
//                   {status === "CHECKING" ? "CREATING..." : "CREATE"}
//                 </span>
//               </button>

//               <button
//                 type="button"
//                 onClick={onGoLogin}
//                 className="w-full font-retro text-sm py-3 border-2 border-neon-pink text-neon-pink hover:bg-neon-pink hover:text-black hover:shadow-[0_0_20px_#ff6ac1] transition-all"
//               >
//                 <span className="flex items-center justify-center gap-2">
//                   <LogIn size={16} />
//                   BACK TO LOGIN
//                 </span>
//               </button>
//             </form>

//             <div className="mt-6 font-tech text-xs text-gray-500">
//               New users start with 0 credits.
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };
