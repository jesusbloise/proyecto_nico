import React, { useState } from "react";
import { Shield, Key, Loader } from "lucide-react";

interface LicenseGateProps {
  onUnlock: (key: string) => void;
}

export const LicenseGate: React.FC<LicenseGateProps> = ({ onUnlock }) => {
  const [inputKey, setInputKey] = useState("");
  const [status, setStatus] = useState<"IDLE" | "CHECKING" | "ERROR" | "SUCCESS">(
    "IDLE"
  );
  const [errorMsg, setErrorMsg] = useState("");

  // CONFIGURACIÓN: Reemplaza esto con tu link real de Lemon Squeezy o Gumroad
  const PURCHASE_LINK =
    "https://tu-tienda.lemonsqueezy.com/checkout/buy/tu-producto";

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputKey.trim()) return;

    setStatus("CHECKING");
    setErrorMsg("");

    // --- SIMULACIÓN DE VALIDACIÓN ---
    setTimeout(() => {
      const cleanKey = inputKey.trim().toUpperCase();

      // Simulación: Aceptamos claves que empiecen con "NEON-" o tengan largo > 10
      const isValid = cleanKey.startsWith("NEON-") || cleanKey.length > 10;

      if (isValid) {
        setStatus("SUCCESS");
        setTimeout(() => {
          onUnlock(cleanKey);
        }, 1500);
      } else {
        setStatus("ERROR");
        setErrorMsg("INVALID ACCESS CODE. ACCESS DENIED.");
      }
    }, 2000);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-neon-dark"
      style={{
        // ✅ Fallback para que no quede negro sin contenido si Tailwind/custom tokens no cargan
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        position: "relative",
        overflow: "hidden",
        background: "#05060a",
        color: "#e8ecf1",
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial",
      }}
    >
      {/* CSS Cyber Grid Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Horizon Glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-neon-dark to-neon-pink/10"></div>

        {/* Perspective Grid */}
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
        {/* Terminal Box */}
        <div
          className="bg-neon-panel/90 backdrop-blur-md border-2 border-neon-pink shadow-[0_0_20px_rgba(255,106,193,0.3)] p-8 rounded-lg relative overflow-hidden mt-12"
          style={{
            // ✅ Fallback caja visible
            background: "rgba(15, 16, 22, 0.9)",
            border: "2px solid rgba(255,106,193,0.65)",
            borderRadius: 12,
            padding: 24,
            boxShadow: "0 0 20px rgba(255,106,193,0.25)",
            position: "relative",
            overflow: "hidden",
            marginTop: 40,
          }}
        >
          {/* Scanline inside box */}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] opacity-20"></div>

          <div className="relative z-10 text-center">
            <h1
              className="font-retro text-2xl text-neon-pink mb-2 tracking-tighter drop-shadow-md"
              style={{ color: "#ff6ac1", marginBottom: 8 }}
            >
              RESTRICTED AREA
            </h1>
            <p
              className="font-code text-neon-cyan text-sm mb-6 tracking-widest opacity-80 border-b border-neon-cyan/30 pb-4"
              style={{
                color: "#22d3ee",
                opacity: 0.85,
                paddingBottom: 16,
                marginBottom: 20,
                borderBottom: "1px solid rgba(34,211,238,0.25)",
              }}
            >
              MEDIA PRO NAMER // SECURE ACCESS
            </p>

            <form onSubmit={handleVerify} className="space-y-6">
              <div className="text-left">
                <label
                  className="block text-xs font-tech text-neon-pink/70 mb-1 ml-1"
                  style={{ display: "block", fontSize: 12, marginBottom: 6 }}
                >
                  ENTER LICENSE KEY:
                </label>
                <div className="relative" style={{ position: "relative" }}>
                  <Key
                    className="absolute left-3 top-3 text-neon-cyan opacity-50"
                    size={18}
                    style={{
                      position: "absolute",
                      left: 12,
                      top: 12,
                      opacity: 0.6,
                      color: "#22d3ee",
                    }}
                  />
                  <input
                    type="text"
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                    className={`w-full bg-black/50 border-2 font-code text-center text-lg py-2 pl-10 pr-4 rounded focus:outline-none transition-all uppercase placeholder-gray-700
                      ${
                        status === "ERROR"
                          ? "border-red-500 text-red-500 focus:shadow-[0_0_10px_red]"
                          : "border-neon-cyan text-neon-cyan focus:border-neon-pink focus:shadow-neon-pink"
                      }
                    `}
                    style={{
                      width: "100%",
                      background: "rgba(0,0,0,0.45)",
                      borderRadius: 10,
                      border:
                        status === "ERROR"
                          ? "2px solid #ef4444"
                          : "2px solid rgba(34,211,238,0.6)",
                      color: status === "ERROR" ? "#ef4444" : "#22d3ee",
                      padding: "10px 14px 10px 40px",
                      outline: "none",
                      textTransform: "uppercase",
                      textAlign: "center",
                      fontSize: 18,
                    }}
                  />
                </div>
                {status === "ERROR" && (
                  <p
                    className="text-red-500 font-tech text-xs mt-2 text-center animate-pulse"
                    style={{
                      color: "#ef4444",
                      marginTop: 10,
                      fontSize: 12,
                      textAlign: "center",
                    }}
                  >
                    &gt; {errorMsg}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={status === "CHECKING" || status === "SUCCESS"}
                className={`w-full font-retro text-sm py-4 border-2 transition-all group relative overflow-hidden
                  ${
                    status === "SUCCESS"
                      ? "bg-green-500 border-green-500 text-black"
                      : "bg-transparent border-neon-pink text-neon-pink hover:bg-neon-pink hover:text-black hover:shadow-[0_0_20px_#ff6ac1]"
                  }
                `}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: 10,
                  border:
                    status === "SUCCESS"
                      ? "2px solid #22c55e"
                      : "2px solid rgba(255,106,193,0.8)",
                  background: status === "SUCCESS" ? "#22c55e" : "transparent",
                  color: status === "SUCCESS" ? "#000" : "#ff6ac1",
                  cursor:
                    status === "CHECKING" || status === "SUCCESS"
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                <span
                  className="relative z-10 flex items-center justify-center gap-2"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  {status === "CHECKING" && (
                    <Loader className="animate-spin" size={16} />
                  )}
                  {status === "CHECKING"
                    ? "VERIFYING..."
                    : status === "SUCCESS"
                    ? "ACCESS GRANTED"
                    : "INITIALIZE SYSTEM"}
                </span>
              </button>
            </form>

            <div className="mt-8 pt-4 border-t border-gray-800" style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <p
                className="font-tech text-gray-500 text-xs mb-2"
                style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, marginBottom: 8 }}
              >
                DON'T HAVE AN ACCESS CODE?
              </p>
              <a
                href={PURCHASE_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-neon-cyan font-code text-sm hover:text-white hover:underline transition-colors"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  color: "#22d3ee",
                  textDecoration: "none",
                }}
              >
                <Shield size={14} /> PURCHASE LICENSE_V1.0
              </a>
            </div>
          </div>
        </div>

        <div
          className="text-center mt-4 font-tech text-xs text-gray-600"
          style={{ textAlign: "center", marginTop: 14, fontSize: 12, color: "rgba(255,255,255,0.35)" }}
        >
          SYSTEM ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
        </div>
      </div>
    </div>
  );
};


// import React, { useState } from 'react';
// import { Shield, Key, Loader } from 'lucide-react';

// interface LicenseGateProps {
//   onUnlock: (key: string) => void;
// }

// export const LicenseGate: React.FC<LicenseGateProps> = ({ onUnlock }) => {
//   const [inputKey, setInputKey] = useState('');
//   const [status, setStatus] = useState<'IDLE' | 'CHECKING' | 'ERROR' | 'SUCCESS'>('IDLE');
//   const [errorMsg, setErrorMsg] = useState('');

//   // CONFIGURACIÓN: Reemplaza esto con tu link real de Lemon Squeezy o Gumroad
//   const PURCHASE_LINK = "https://tu-tienda.lemonsqueezy.com/checkout/buy/tu-producto";

//   const handleVerify = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!inputKey.trim()) return;

//     setStatus('CHECKING');
//     setErrorMsg('');

//     // --- SIMULACIÓN DE VALIDACIÓN ---
//     setTimeout(() => {
//         const cleanKey = inputKey.trim().toUpperCase();
        
//         // Simulación: Aceptamos claves que empiecen con "NEON-"
//         const isValid = cleanKey.startsWith('NEON-') || cleanKey.length > 10;

//         if (isValid) {
//             setStatus('SUCCESS');
//             setTimeout(() => {
//                 onUnlock(cleanKey);
//             }, 1500);
//         } else {
//             setStatus('ERROR');
//             setErrorMsg('INVALID ACCESS CODE. ACCESS DENIED.');
//         }
//     }, 2000); 
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-neon-dark">
//         {/* CSS Cyber Grid Background */}
//         <div className="absolute inset-0 overflow-hidden pointer-events-none">
//             {/* Horizon Glow */}
//             <div className="absolute inset-0 bg-gradient-to-b from-black via-neon-dark to-neon-pink/10"></div>
            
//             {/* Perspective Grid */}
//             <div 
//                 className="absolute w-[200%] h-[100%] left-[-50%] bottom-0 origin-bottom"
//                 style={{
//                     transform: 'perspective(500px) rotateX(60deg)',
//                     backgroundSize: '40px 40px',
//                     backgroundImage: `
//                         linear-gradient(to right, rgba(0, 255, 255, 0.1) 1px, transparent 1px),
//                         linear-gradient(to bottom, rgba(255, 106, 193, 0.1) 1px, transparent 1px)
//                     `,
//                     animation: 'gridMove 20s linear infinite'
//                 }}
//             ></div>
            
//             <style>{`
//                 @keyframes gridMove {
//                     0% { transform: perspective(500px) rotateX(60deg) translateY(0); }
//                     100% { transform: perspective(500px) rotateX(60deg) translateY(40px); }
//                 }
//             `}</style>
//         </div>

//         <div className="relative z-10 w-full max-w-md">
            
//             {/* Terminal Box */}
//             <div className="bg-neon-panel/90 backdrop-blur-md border-2 border-neon-pink shadow-[0_0_20px_rgba(255,106,193,0.3)] p-8 rounded-lg relative overflow-hidden mt-12">
//                 {/* Scanline inside box */}
//                 <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] opacity-20"></div>

//                 <div className="relative z-10 text-center">
//                     <h1 className="font-retro text-2xl text-neon-pink mb-2 tracking-tighter drop-shadow-md">RESTRICTED AREA</h1>
//                     <p className="font-code text-neon-cyan text-sm mb-6 tracking-widest opacity-80 border-b border-neon-cyan/30 pb-4">
//                         MEDIA PRO NAMER // SECURE ACCESS
//                     </p>

//                     <form onSubmit={handleVerify} className="space-y-6">
//                         <div className="text-left">
//                             <label className="block text-xs font-tech text-neon-pink/70 mb-1 ml-1">ENTER LICENSE KEY:</label>
//                             <div className="relative">
//                                 <Key className="absolute left-3 top-3 text-neon-cyan opacity-50" size={18} />
//                                 <input 
//                                     type="text" 
//                                     value={inputKey}
//                                     onChange={(e) => setInputKey(e.target.value)}
//                                     placeholder="XXXX-XXXX-XXXX-XXXX"
//                                     className={`w-full bg-black/50 border-2 font-code text-center text-lg py-2 pl-10 pr-4 rounded focus:outline-none transition-all uppercase placeholder-gray-700
//                                         ${status === 'ERROR' ? 'border-red-500 text-red-500 focus:shadow-[0_0_10px_red]' : 'border-neon-cyan text-neon-cyan focus:border-neon-pink focus:shadow-neon-pink'}
//                                     `}
//                                 />
//                             </div>
//                             {status === 'ERROR' && (
//                                 <p className="text-red-500 font-tech text-xs mt-2 text-center animate-pulse">> {errorMsg}</p>
//                             )}
//                         </div>

//                         <button 
//                             type="submit"
//                             disabled={status === 'CHECKING' || status === 'SUCCESS'}
//                             className={`w-full font-retro text-sm py-4 border-2 transition-all group relative overflow-hidden
//                                 ${status === 'SUCCESS' 
//                                     ? 'bg-green-500 border-green-500 text-black' 
//                                     : 'bg-transparent border-neon-pink text-neon-pink hover:bg-neon-pink hover:text-black hover:shadow-[0_0_20px_#ff6ac1]'
//                                 }
//                             `}
//                         >
//                             <span className="relative z-10 flex items-center justify-center gap-2">
//                                 {status === 'CHECKING' && <Loader className="animate-spin" size={16}/>}
//                                 {status === 'CHECKING' ? 'VERIFYING...' : status === 'SUCCESS' ? 'ACCESS GRANTED' : 'INITIALIZE SYSTEM'}
//                             </span>
//                         </button>
//                     </form>

//                     <div className="mt-8 pt-4 border-t border-gray-800">
//                         <p className="font-tech text-gray-500 text-xs mb-2">DON'T HAVE AN ACCESS CODE?</p>
//                         <a 
//                             href={PURCHASE_LINK}
//                             target="_blank"
//                             rel="noopener noreferrer"
//                             className="inline-flex items-center gap-2 text-neon-cyan font-code text-sm hover:text-white hover:underline transition-colors"
//                         >
//                             <Shield size={14} /> PURCHASE LICENSE_V1.0
//                         </a>
//                     </div>
//                 </div>
//             </div>

//              <div className="text-center mt-4 font-tech text-xs text-gray-600">
//                 SYSTEM ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
//             </div>
//         </div>
//     </div>
//   );
// };