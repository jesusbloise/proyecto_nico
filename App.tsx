import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Copy, Save, Zap, Key, LogOut, Shield } from "lucide-react";
import { NeonInput } from "./components/NeonInput";
import { NeonSelect } from "./components/NeonSelect";
import { SoundSelector } from "./components/SoundSelector";
import { OrderController } from "./components/OrderController";
import { NeonTooltip } from "./components/NeonTooltip";
import { LicenseGate } from "./components/LicenseGate";

// ✅ Auth screens
import { AuthLogin } from "./components/AuthLogin";
import { AuthRegister } from "./components/AuthRegister";

// ✅ Admin
import { AdminPanel } from "./components/AdminPanel";

import {
  TYPE_OPTIONS,
  RESOLUTION_OPTIONS,
  COLOR_SPACE_OPTIONS,
  CONTAINER_OPTIONS,
  COMPRESOR_OPTIONS,
  FRAMERATE_OPTIONS,
  ASPECT_RATIO_OPTIONS,
  LANGUAGE_OPTIONS,
  SUBTITLE_TYPE_OPTIONS,
  LUMINANCE_OPTIONS,
} from "./constants";
import { PRESETS, TokenKey } from "./types";

const DEFAULT_PRESET = "Archival";
const DEFAULT_ORDER: TokenKey[] = PRESETS[DEFAULT_PRESET];
const LICENSE_STORAGE_KEY = "mediaProNamerLicense";

const TOKEN_KEY = "mpn_token_v1"; // ✅ por pestaña (sessionStorage)

function getToken() {
  return sessionStorage.getItem(TOKEN_KEY) || "";
}
function setTokenStorage(tk: string) {
  sessionStorage.setItem(TOKEN_KEY, tk);
}
function clearTokenStorage() {
  sessionStorage.removeItem(TOKEN_KEY);
}

type SessionUser = { email: string; role: "admin" | "user"; credits: number };
type View = "main" | "admin";

async function chargeAndConfirm(filename: string, token: string) {
  const r = await fetch("/api/names/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ filename }),
  });

  const j = await r.json().catch(() => null);

  if (!r.ok || !j?.ok) {
    const msg = typeof j?.message === "string" ? j.message : "CANNOT GENERATE.";
    throw new Error(msg);
  }

  return j as {
    ok: true;
    filename: string;
    charged?: boolean;
    credits?: number;
    usedCredits?: number;
  };
}

const App: React.FC = () => {
  // --- LICENSE STATE ---
  const [isLicensed, setIsLicensed] = useState<boolean>(false);
  const [loadingLicense, setLoadingLicense] = useState(true);

  // ✅ AUTH STATE
  const [authView, setAuthView] = useState<"login" | "register">("login");
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [bootingSession, setBootingSession] = useState(true);

  // ✅ token por pestaña
  const [token, setToken] = useState<string>(() => getToken());

  // ✅ view (main/admin)
  const [view, setView] = useState<View>("main");

  // ✅ credit UX
  const [charging, setCharging] = useState(false);
  const [creditError, setCreditError] = useState<string>("");

  // ✅ filename cobrado por última vez (para NO cobrar repetido)
  const lastChargedFilenameRef = useRef<string>("");

  // --- APP STATE ---
  const [values, setValues] = useState<Record<TokenKey, string>>({
    id: "",
    "episode-reel": "",
    type: "NONE",
    language: "NONE",
    subtitles: "NONE",
    resolution: "NONE",
    "color-space": "NONE",
    luminance: "NONE",
    container: "NONE",
    compresor: "NONE",
    framerate: "NONE",
    "aspect-ratio": "NONE",
    sound: "NONE",
    date: "",
    version: "",
  });

  const [subtitleLang, setSubtitleLang] = useState<string>("NONE");
  const [soundSelection, setSoundSelection] = useState<string[]>([]);
  const [order, setOrder] = useState<TokenKey[]>(DEFAULT_ORDER);
  const [filename, setFilename] = useState("");
  const [preset, setPreset] = useState(DEFAULT_PRESET);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [exportKeyFeedback, setExportKeyFeedback] = useState(false);

  // ✅ 1) Load License + Settings
  useEffect(() => {
    const savedLicense = localStorage.getItem(LICENSE_STORAGE_KEY);
    if (savedLicense) setIsLicensed(true);
    setLoadingLicense(false);

    const storedData = localStorage.getItem("mediaProNamerData");
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        if (parsed.values) setValues((prev) => ({ ...prev, ...parsed.values }));
        if (parsed.order) setOrder(parsed.order);
        if (parsed.soundSelection) setSoundSelection(parsed.soundSelection);
        if (parsed.preset) setPreset(parsed.preset);
        if (parsed.subtitleLang) setSubtitleLang(parsed.subtitleLang);
      } catch (e) {
        console.error("Failed to load settings", e);
      }
    }
  }, []);

  // ✅ 2) Boot sesión desde /api/auth/me usando token de ESTA pestaña
  useEffect(() => {
    let alive = true;

    async function boot() {
      try {
        const tk = getToken();
        setToken(tk);

        if (!tk) {
          if (alive) setSessionUser(null);
          return;
        }

        const r = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${tk}` },
        });
        const j = await r.json().catch(() => null);

        if (!alive) return;

        if (!r.ok || !j?.ok || !j?.user) {
          clearTokenStorage();
          setToken("");
          setSessionUser(null);
          setAuthView("login");
          return;
        }

        setSessionUser({
          email: j.user.email,
          role: j.user.role,
          credits: Number(j.user.credits ?? 0),
        });

        setView("main");
      } finally {
        if (alive) setBootingSession(false);
      }
    }

    boot();
    return () => {
      alive = false;
    };
  }, []);

  // ✅ guard: si no es admin, jamás puede estar en view admin
  useEffect(() => {
    if (view === "admin" && sessionUser?.role !== "admin") setView("main");
  }, [view, sessionUser]);

  // License Handlers
  const handleUnlock = (key: string) => {
    localStorage.setItem(LICENSE_STORAGE_KEY, key);
    setIsLicensed(true);
  };

  const handleDeactivate = () => {
    if (
      confirm(
        "Are you sure you want to deactivate this terminal? You will need your license key to enter again."
      )
    ) {
      localStorage.removeItem(LICENSE_STORAGE_KEY);
      setIsLicensed(false);
    }
  };

  // ✅ Logout real (token por pestaña)
  const handleLogoutSession = async () => {
    const tk = getToken();
    try {
      if (tk) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${tk}` },
        });
      }
    } catch {
      // ignore
    } finally {
      clearTokenStorage();
      setToken("");
      setSessionUser(null);
      setAuthView("login");
      setView("main");
      lastChargedFilenameRef.current = "";
    }
  };

  // Update Filename
  const generateFilename = useCallback(() => {
    const parts = order.map((key) => {
      if (key === "sound") {
        return soundSelection.length > 0 ? soundSelection.join("-") : "";
      }

      if (key === "subtitles") {
        const subType = values.subtitles;
        const subL = subtitleLang;

        if (subType === "NONE") return "";
        if (subL !== "NONE") return `${subType}-${subL}`;
        return subType;
      }

      const val = values[key];
      return val && val !== "NONE" ? val : "";
    });

    const name = parts.filter((p) => p !== "").join("_");
    setFilename(name);
  }, [values, order, soundSelection, subtitleLang]);

  useEffect(() => {
    generateFilename();
  }, [generateFilename]);

  // Handlers
  const handleValueChange = (key: TokenKey, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  const handlePresetChange = (newPreset: string) => {
    setPreset(newPreset);
    if (PRESETS[newPreset]) setOrder(PRESETS[newPreset]);
  };

  const handleSave = () => {
    const dataToSave = { values, order, soundSelection, preset, subtitleLang };
    localStorage.setItem("mediaProNamerData", JSON.stringify(dataToSave));
    alert("SETTINGS SAVED TO CORE MEMORY.");
  };

  const noCredits =
    sessionUser?.role === "user" && Number(sessionUser?.credits ?? 0) <= 0;

  // ✅ Cobra 1 crédito SOLO si el filename cambió desde el último cobro.
  // Se usa tanto para COPY como para KEY.
  const ensureChargedForFilename = async (): Promise<
    { ok: true } | { ok: false; message: string }
  > => {
    setCreditError("");

    if (!sessionUser) return { ok: false, message: "NO SESSION." };
    if (!filename) return { ok: false, message: "EMPTY NAME." };

    // admin nunca cobra
    if (sessionUser.role === "admin") return { ok: true };

    // user: sin créditos
    if (noCredits) return { ok: false, message: "NO CREDITS. CONTACT ADMIN." };

    // user: si es el mismo filename que ya cobraste, NO cobrar
    if (lastChargedFilenameRef.current === filename) return { ok: true };

    const tk = getToken();
    if (!tk) return { ok: false, message: "SESSION EXPIRED. PLEASE LOGIN AGAIN." };

    if (charging) return { ok: false, message: "CHARGING..." };

    try {
      setCharging(true);

      const result = await chargeAndConfirm(filename, tk);

      // marca el filename como cobrado (para no cobrar repetido)
      lastChargedFilenameRef.current = filename;

      // actualiza créditos UI
      if (typeof result.credits === "number") {
        setSessionUser((prev) =>
          prev ? { ...prev, credits: Number(result.credits) } : prev
        );
      }

      return { ok: true };
    } catch (e: any) {
      const msg = String(e?.message || "CANNOT GENERATE.");
      setCreditError(msg);
      return { ok: false, message: msg };
    } finally {
      setCharging(false);
    }
  };

  // ✅ COPY cobra (si aplica) y copia
  const handleCopy = async () => {
    if (!filename) return;

    const charged = await ensureChargedForFilename();
    if (!charged.ok) return;

    await navigator.clipboard.writeText(filename);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  // ✅ KEY cobra (si aplica) y copia KEY
  const handleExportKey = async () => {
    const getKeyLabel = (key: TokenKey) => {
      switch (key) {
        case "episode-reel":
          return "EP/REEL";
        case "color-space":
          return "COLOR";
        case "aspect-ratio":
          return "ASPECT";
        case "language":
          return "AUDIO";
        case "subtitles":
          return "SUBS";
        case "luminance":
          return "NITS";
        case "compresor":
          return "CODEC";
        case "container":
          return "EXT";
        default:
          return key.toUpperCase();
      }
    };

    const parts = order.map((key) => {
      let isActive = false;

      if (key === "sound") {
        isActive = soundSelection.length > 0;
      } else if (key === "subtitles") {
        isActive = values.subtitles !== "NONE";
      } else {
        isActive = !!values[key] && values[key] !== "NONE";
      }

      return isActive ? `[${getKeyLabel(key)}]` : null;
    });

    const keyString = parts.filter(Boolean).join("_");
    if (!keyString) return;

    const charged = await ensureChargedForFilename();
    if (!charged.ok) return;

    await navigator.clipboard.writeText(keyString);
    setExportKeyFeedback(true);
    setTimeout(() => setExportKeyFeedback(false), 2000);
  };

  // ✅ Anti-trampa: preview para user hasta que pague ese filename
  const isUser = sessionUser?.role === "user";
  const isUnlockedForThisName =
    !isUser || lastChargedFilenameRef.current === filename;

  const previewName = useMemo(() => {
    if (!filename) return "";
    if (isUnlockedForThisName) return filename;

    // preview truncado (sin revelar todo)
    const max = 26;
    if (filename.length <= max) return `${filename.slice(0, Math.min(12, filename.length))}...`;
    return `${filename.slice(0, max)}...`;
  }, [filename, isUnlockedForThisName]);

  // ✅ Loading general
  if (loadingLicense || bootingSession) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          color: "white",
          background: "black",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
        }}
      >
        Loading...
      </div>
    );
  }

  // ✅ Gate: si NO hay sesión → Login/Register
  if (!sessionUser) {
    return authView === "login" ? (
      <AuthLogin
        onLoginSuccess={(u: any, tk: string) => {
          setTokenStorage(tk);
          setToken(tk);
          setSessionUser(u);
          setView("main");
          lastChargedFilenameRef.current = "";
        }}
        onGoRegister={() => setAuthView("register")}
      />
    ) : (
      <AuthRegister
        onRegisterSuccess={(u: any, tk: string) => {
          setTokenStorage(tk);
          setToken(tk);
          setSessionUser(u);
          setView("main");
          lastChargedFilenameRef.current = "";
        }}
        onGoLogin={() => setAuthView("login")}
      />
    );
  }

  // ✅ LicenseGate opcional
  // if (!isLicensed) return <LicenseGate onUnlock={handleUnlock} />;

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto font-sans text-gray-200">
      {/* Header */}
      <header className="mb-8 border-b-2 border-neon-pink pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-retro text-neon-pink drop-shadow-[0_0_8px_rgba(255,106,193,0.8)] mb-2 leading-none">
              MEDIA PRO NAMER{" "}
              <span className="text-neon-cyan text-lg md:text-2xl animate-pulse">
                NEON
              </span>
            </h1>

            <p className="font-code text-neon-cyan tracking-[0.2em] text-xs md:text-sm opacity-80">
              ADVANCED_FILE_NAMING_SYSTEM_V3.0
            </p>

            <div className="mt-2 font-tech text-xs text-neon-pink/60">
              USER: {sessionUser.email} // ROLE:{" "}
              {sessionUser.role.toUpperCase()} // CREDITS: {sessionUser.credits}
            </div>
          </div>
        </div>

        <div className="flex items-end gap-4">
          <div className="hidden md:block text-right font-tech text-xs text-neon-pink/50">
            SYS.STATUS: ONLINE
            <br />
            SESSION: ACTIVE
          </div>

          {sessionUser.role === "admin" && (
            <button
              onClick={() => setView(view === "admin" ? "main" : "admin")}
              className="flex items-center gap-1 text-xs opacity-70 hover:opacity-100 hover:text-neon-cyan transition-all"
              title="Admin"
            >
              <Shield size={12} />
              {view === "admin" ? "BACK // MAIN" : "ADMIN // USERS"}
            </button>
          )}

          <button
            onClick={handleLogoutSession}
            className="flex items-center gap-1 text-xs opacity-70 hover:opacity-100 hover:text-red-400 transition-all"
            title="Logout"
          >
            <LogOut size={12} /> LOGOUT
          </button>
        </div>
      </header>

      {/* Admin view */}
      {view === "admin" && sessionUser.role === "admin" ? (
        <AdminPanel />
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-neon-panel/40 border border-neon-pink/20 p-4 rounded-lg backdrop-blur-sm">
                <h2 className="font-retro text-neon-pink text-xs mb-4 border-b border-neon-pink/30 pb-2">
                  CORE METADATA
                </h2>

                <NeonInput
                  id="id"
                  label="ID"
                  value={values.id}
                  onChange={(v) => handleValueChange("id", v)}
                  tooltip="Identificador único del proyecto o activo."
                />

                <NeonInput
                  id="episode"
                  label="EPISODE / REEL"
                  value={values["episode-reel"]}
                  onChange={(v) => handleValueChange("episode-reel", v)}
                  tooltip="Número de Episodio o Rollo (Reel)."
                />

                <NeonSelect
                  id="type"
                  label="TYPE"
                  value={values.type}
                  options={TYPE_OPTIONS}
                  onChange={(v) => handleValueChange("type", v)}
                  tooltip="Tipo de contenido (Master, Review, etc)."
                />

                <div className="grid grid-cols-2 gap-4">
                  <NeonInput
                    id="date"
                    label="DATE"
                    type="date"
                    value={values.date}
                    onChange={(v) => handleValueChange("date", v)}
                    tooltip="Fecha de creación."
                  />
                  <NeonInput
                    id="version"
                    label="VERSION"
                    value={values.version}
                    onChange={(v) => handleValueChange("version", v)}
                    tooltip="Número de versión (v01, v02...)."
                  />
                </div>
              </div>

              <div className="bg-neon-panel/40 border border-neon-pink/20 p-4 rounded-lg backdrop-blur-sm">
                <h2 className="font-retro text-neon-pink text-xs mb-4 border-b border-neon-pink/30 pb-2">
                  LOCALIZATION
                </h2>

                <NeonSelect
                  id="lang"
                  label="AUDIO LANGUAGE"
                  value={values.language}
                  options={LANGUAGE_OPTIONS}
                  onChange={(v) => handleValueChange("language", v)}
                  tooltip="Idioma principal del audio."
                />

                <div className="grid grid-cols-2 gap-4">
                  <NeonSelect
                    id="subs_type"
                    label="SUB TITLE TYPE"
                    value={values.subtitles}
                    options={SUBTITLE_TYPE_OPTIONS}
                    onChange={(v) => handleValueChange("subtitles", v)}
                    tooltip="Tipo de subtítulos."
                  />
                  <NeonSelect
                    id="subs_lang"
                    label="SUB LANGUAGE"
                    value={subtitleLang}
                    options={LANGUAGE_OPTIONS}
                    onChange={(v) => setSubtitleLang(v)}
                    tooltip="Idioma de los subtítulos."
                  />
                </div>
              </div>
            </div>

            {/* Middle Column */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-neon-panel/40 border border-neon-pink/20 p-4 rounded-lg backdrop-blur-sm">
                <h2 className="font-retro text-neon-pink text-xs mb-4 border-b border-neon-pink/30 pb-2">
                  TECHNICAL SPECS
                </h2>

                <NeonSelect
                  id="res"
                  label="RESOLUTION"
                  value={values.resolution}
                  options={RESOLUTION_OPTIONS}
                  onChange={(v) => handleValueChange("resolution", v)}
                  tooltip="Resolución de imagen."
                />

                <div className="grid grid-cols-2 gap-4">
                  <NeonSelect
                    id="cs"
                    label="COLOR SPACE"
                    value={values["color-space"]}
                    options={COLOR_SPACE_OPTIONS}
                    onChange={(v) => handleValueChange("color-space", v)}
                    tooltip="Espacio de color."
                  />

                  <NeonSelect
                    id="nits"
                    label="LUMINANCE"
                    value={values.luminance}
                    options={LUMINANCE_OPTIONS}
                    onChange={(v) => handleValueChange("luminance", v)}
                    tooltip="Brillo máximo."
                  />
                </div>

                <NeonSelect
                  id="ar"
                  label="ASPECT RATIO"
                  value={values["aspect-ratio"]}
                  options={ASPECT_RATIO_OPTIONS}
                  onChange={(v) => handleValueChange("aspect-ratio", v)}
                  tooltip="Relación de aspecto."
                />

                <NeonSelect
                  id="fps"
                  label="FRAMERATE"
                  value={values.framerate}
                  options={FRAMERATE_OPTIONS}
                  onChange={(v) => handleValueChange("framerate", v)}
                  tooltip="FPS."
                />
              </div>

              <div className="bg-neon-panel/40 border border-neon-pink/20 p-4 rounded-lg backdrop-blur-sm">
                <h2 className="font-retro text-neon-pink text-xs mb-4 border-b border-neon-pink/30 pb-2">
                  FORMAT & AUDIO
                </h2>

                <NeonSelect
                  id="container"
                  label="CONTAINER"
                  value={values.container}
                  options={CONTAINER_OPTIONS}
                  onChange={(v) => handleValueChange("container", v)}
                  tooltip="Formato contenedor."
                />

                <NeonSelect
                  id="codec"
                  label="COMPRESSOR"
                  value={values.compresor}
                  options={COMPRESOR_OPTIONS}
                  onChange={(v) => handleValueChange("compresor", v)}
                  tooltip="Códec."
                />

                <div className="mt-6 border-t border-neon-pink/20 pt-4">
                  <SoundSelector
                    selectedSounds={soundSelection}
                    onChange={setSoundSelection}
                  />
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              <div className="bg-neon-panel/40 border border-neon-cyan/20 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <NeonTooltip
                    content="Selecciona una configuración predefinida."
                    align="left"
                  >
                    <label className="block text-neon-cyan font-code tracking-wider text-sm cursor-help">
                      PRESET CONFIG:
                    </label>
                  </NeonTooltip>
                </div>

                <div className="relative">
                  <select
                    value={preset}
                    onChange={(e) => handlePresetChange(e.target.value)}
                    className="w-full bg-black border border-neon-cyan text-neon-cyan font-code p-2 rounded focus:shadow-neon-cyan focus:outline-none appearance-none cursor-pointer"
                  >
                    {Object.keys(PRESETS).map((k) => (
                      <option key={k} value={k}>
                        {k.toUpperCase()}
                      </option>
                    ))}
                  </select>

                  <Zap
                    className="absolute right-2 top-2.5 text-neon-cyan pointer-events-none"
                    size={16}
                  />
                </div>
              </div>

              <div className="bg-neon-panel/40 border border-neon-pink/20 p-4 rounded-lg flex-grow">
                <OrderController order={order} onOrderChange={setOrder} />
              </div>

              <div className="bg-neon-panel p-4 rounded-lg border-2 border-neon-pink shadow-neon-pink sticky bottom-4 z-40">
                <label className="block mb-1 text-neon-pink font-retro text-xs">
                  GENERATED FILENAME:
                </label>

                {/* ✅ BLOQUE ANTI-TRAMPA */}
                <div
                  tabIndex={0}
                  onContextMenu={(e) => {
                    // bloquear click derecho solo si user y NO unlocked
                    if (sessionUser.role === "user" && !isUnlockedForThisName) {
                      e.preventDefault();
                      setCreditError("USE COPY/KEY TO UNLOCK.");
                    }
                  }}
                  onCopy={(e) => {
                    // bloquear copy dentro del panel si NO unlocked
                    if (sessionUser.role === "user" && !isUnlockedForThisName) {
                      e.preventDefault();
                      setCreditError("USE COPY/KEY TO UNLOCK.");
                    }
                  }}
                  onKeyDown={(e) => {
                    const isCopy =
                      (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c";
                    if (isCopy && sessionUser.role === "user" && !isUnlockedForThisName) {
                      e.preventDefault();
                      setCreditError("USE COPY/KEY TO UNLOCK.");
                    }
                  }}
                  className={`bg-neon-cyan text-black font-code text-lg p-3 break-all mb-3 min-h-[3.5rem] flex items-center border-2 border-black shadow-inner ${
                    sessionUser.role === "user" && !isUnlockedForThisName
                      ? "select-none"
                      : ""
                  }`}
                  title={
                    sessionUser.role === "user" && !isUnlockedForThisName
                      ? "LOCKED PREVIEW. USE COPY/KEY."
                      : "READY"
                  }
                >
                  {(isUser ? previewName : filename) || (
                    <span className="opacity-30">WAITING_FOR_INPUT...</span>
                  )}
                </div>

                {/* ✅ mensaje de créditos */}
                {sessionUser.role === "user" && (
                  <div className="mb-3 font-tech text-xs">
                    {noCredits ? (
                      <div className="text-neon-pink/90">
                        &gt; NO CREDITS. CONTACT ADMIN.
                      </div>
                    ) : (
                      <div className="text-neon-cyan/80">
                        &gt; 1 CREDIT PER UNIQUE NAME. REMAINING:{" "}
                        <span className="text-neon-pink">
                          {sessionUser.credits}
                        </span>
                        {!isUnlockedForThisName && (
                          <span className="ml-2 text-neon-pink/70">
                            // LOCKED PREVIEW
                          </span>
                        )}
                      </div>
                    )}
                    {creditError && (
                      <div className="mt-2 text-neon-pink/90 animate-pulse">
                        &gt; {creditError}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <NeonTooltip content="Copiar nombre." className="flex-1" align="left">
                    <button
                      onClick={handleCopy}
                      disabled={charging || (sessionUser.role === "user" && noCredits)}
                      className={`w-full flex items-center justify-center gap-2 font-retro text-xs py-3 px-2 transition-all border-2 ${
                        charging || (sessionUser.role === "user" && noCredits)
                          ? "opacity-60 cursor-not-allowed border-neon-pink/40 text-neon-pink/50"
                          : copyFeedback
                          ? "bg-white text-neon-pink border-white"
                          : "bg-neon-pink text-black border-neon-pink hover:bg-pink-400 hover:shadow-[0_0_15px_#ff6ac1]"
                      }`}
                    >
                      {charging ? "CHARGING..." : copyFeedback ? (
                        "COPIED!"
                      ) : (
                        <>
                          COPY <Copy size={14} />
                        </>
                      )}
                    </button>
                  </NeonTooltip>

                  <NeonTooltip content="Copiar estructura de tokens." className="flex-1" align="center">
                    <button
                      onClick={handleExportKey}
                      disabled={charging || (sessionUser.role === "user" && noCredits)}
                      className={`w-full flex items-center justify-center gap-2 font-retro text-xs py-3 px-2 transition-all border-2 ${
                        charging || (sessionUser.role === "user" && noCredits)
                          ? "opacity-60 cursor-not-allowed border-neon-cyan/40 text-neon-cyan/50"
                          : exportKeyFeedback
                          ? "bg-white text-neon-cyan border-white"
                          : "bg-neon-cyan/10 text-neon-cyan border-neon-cyan hover:bg-neon-cyan/20 hover:shadow-[0_0_10px_#00FFFF]"
                      }`}
                    >
                      {exportKeyFeedback ? (
                        "KEY COPIED!"
                      ) : (
                        <>
                          KEY <Key size={14} />
                        </>
                      )}
                    </button>
                  </NeonTooltip>

                  <NeonTooltip content="Guardar configuración (NO cobra)." align="right">
                    <button
                      onClick={handleSave}
                      className="w-12 flex items-center justify-center bg-transparent text-neon-pink font-retro text-xs py-3 border-2 border-neon-pink hover:bg-neon-pink/20 hover:shadow-[0_0_10px_#ff6ac1] transition-all"
                    >
                      <Save size={16} />
                    </button>
                  </NeonTooltip>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <footer className="mt-12 flex flex-col items-center justify-center gap-2 font-code text-neon-pink/40 text-sm pb-8">
        <div>&copy; MEDIA PRO NAMER BY NICO</div>

        <button
          onClick={handleDeactivate}
          className="flex items-center gap-1 text-xs opacity-50 hover:opacity-100 hover:text-red-400 transition-all"
        >
          <LogOut size={12} /> DEACTIVATE TERMINAL
        </button>
      </footer>
    </div>
  );
};

export default App;


// import React, { useState, useEffect, useCallback } from "react";
// import { Copy, Save, Zap, Key, LogOut } from "lucide-react";
// import { NeonInput } from "./components/NeonInput";
// import { NeonSelect } from "./components/NeonSelect";
// import { SoundSelector } from "./components/SoundSelector";
// import { OrderController } from "./components/OrderController";
// import { NeonTooltip } from "./components/NeonTooltip";
// import { LicenseGate } from "./components/LicenseGate";

// // ✅ Auth screens
// import { AuthLogin } from "./components/AuthLogin";
// import { AuthRegister } from "./components/AuthRegister";

// import {
//   TYPE_OPTIONS,
//   RESOLUTION_OPTIONS,
//   COLOR_SPACE_OPTIONS,
//   CONTAINER_OPTIONS,
//   COMPRESOR_OPTIONS,
//   FRAMERATE_OPTIONS,
//   ASPECT_RATIO_OPTIONS,
//   LANGUAGE_OPTIONS,
//   SUBTITLE_TYPE_OPTIONS,
//   LUMINANCE_OPTIONS,
// } from "./constants";
// import { PRESETS, TokenKey } from "./types";

// const DEFAULT_PRESET = "Archival";
// const DEFAULT_ORDER: TokenKey[] = PRESETS[DEFAULT_PRESET];
// const LICENSE_STORAGE_KEY = "mediaProNamerLicense";

// // ✅ Auth storage keys
// const USERS_KEY = "mpn_users_v1";
// const SESSION_KEY = "mpn_session_v1";

// type SessionUser = { email: string; role: "admin" | "user"; credits: number };

// type StoredUser = {
//   email: string;
//   password: string;
//   role: "admin" | "user";
//   credits: number;
//   createdAt: string;
// };

// function safeJsonParse<T>(raw: string | null): T | null {
//   if (!raw) return null;
//   try {
//     return JSON.parse(raw) as T;
//   } catch {
//     return null;
//   }
// }

// function loadUsersFromStorage(): StoredUser[] {
//   const parsed = safeJsonParse<unknown>(localStorage.getItem(USERS_KEY));
//   return Array.isArray(parsed) ? (parsed as StoredUser[]) : [];
// }

// function loadSessionEmail(): string | null {
//   const s = safeJsonParse<{ email?: string }>(localStorage.getItem(SESSION_KEY));
//   const email = s?.email;
//   return email && typeof email === "string" ? email : null;
// }

// const App: React.FC = () => {
//   // --- LICENSE STATE (se mantiene, NO lo borramos) ---
//   const [isLicensed, setIsLicensed] = useState<boolean>(false);
//   const [loadingLicense, setLoadingLicense] = useState(true);

//   // ✅ AUTH STATE
//   const [authView, setAuthView] = useState<"login" | "register">("login");
//   const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
//   const [bootingSession, setBootingSession] = useState(true);

//   // --- APP STATE ---
//   const [values, setValues] = useState<Record<TokenKey, string>>({
//     id: "",
//     "episode-reel": "",
//     type: "NONE",
//     language: "NONE",
//     subtitles: "NONE",
//     resolution: "NONE",
//     "color-space": "NONE",
//     luminance: "NONE",
//     container: "NONE",
//     compresor: "NONE",
//     framerate: "NONE",
//     "aspect-ratio": "NONE",
//     sound: "NONE",
//     date: "",
//     version: "",
//   });

//   const [subtitleLang, setSubtitleLang] = useState<string>("NONE");
//   const [soundSelection, setSoundSelection] = useState<string[]>([]);
//   const [order, setOrder] = useState<TokenKey[]>(DEFAULT_ORDER);
//   const [filename, setFilename] = useState("");
//   const [preset, setPreset] = useState(DEFAULT_PRESET);
//   const [copyFeedback, setCopyFeedback] = useState(false);
//   const [exportKeyFeedback, setExportKeyFeedback] = useState(false);

//   // ✅ 1) Load License + Settings
//   useEffect(() => {
//     // License
//     const savedLicense = localStorage.getItem(LICENSE_STORAGE_KEY);
//     if (savedLicense) setIsLicensed(true);
//     setLoadingLicense(false);

//     // Settings
//     const storedData = localStorage.getItem("mediaProNamerData");
//     if (storedData) {
//       try {
//         const parsed = JSON.parse(storedData);
//         if (parsed.values) setValues((prev) => ({ ...prev, ...parsed.values }));
//         if (parsed.order) setOrder(parsed.order);
//         if (parsed.soundSelection) setSoundSelection(parsed.soundSelection);
//         if (parsed.preset) setPreset(parsed.preset);
//         if (parsed.subtitleLang) setSubtitleLang(parsed.subtitleLang);
//       } catch (e) {
//         console.error("Failed to load settings", e);
//       }
//     }
//   }, []);

//   // ✅ 2) Session gate (SI NO hay session válida => Login/Register)
//   useEffect(() => {
//     try {
//       const email = loadSessionEmail();
//       if (!email) {
//         setBootingSession(false);
//         return;
//       }

//       const users = loadUsersFromStorage();
//       const u = users.find(
//         (x) => String(x.email).toLowerCase() === String(email).toLowerCase()
//       );

//       if (u) {
//         setSessionUser({
//           email: u.email,
//           role: u.role,
//           credits: Number(u.credits ?? 0),
//         });
//       } else {
//         // sesión colgada => limpiamos
//         localStorage.removeItem(SESSION_KEY);
//       }
//     } finally {
//       setBootingSession(false);
//     }
//   }, []);

//   // License Handlers (se mantienen)
//   const handleUnlock = (key: string) => {
//     localStorage.setItem(LICENSE_STORAGE_KEY, key);
//     setIsLicensed(true);
//   };

//   const handleDeactivate = () => {
//     if (
//       confirm(
//         "Are you sure you want to deactivate this terminal? You will need your license key to enter again."
//       )
//     ) {
//       localStorage.removeItem(LICENSE_STORAGE_KEY);
//       setIsLicensed(false);
//     }
//   };

//   // ✅ Logout de sesión (para que al refrescar vuelva a login)
//   const handleLogoutSession = () => {
//     localStorage.removeItem(SESSION_KEY);
//     setSessionUser(null);
//     setAuthView("login");
//   };

//   // Update Filename
//   const generateFilename = useCallback(() => {
//     const parts = order.map((key) => {
//       if (key === "sound") {
//         return soundSelection.length > 0 ? soundSelection.join("-") : "";
//       }

//       if (key === "subtitles") {
//         const subType = values.subtitles;
//         const subL = subtitleLang;

//         if (subType === "NONE") return "";
//         if (subL !== "NONE") return `${subType}-${subL}`;
//         return subType;
//       }

//       const val = values[key];
//       return val && val !== "NONE" ? val : "";
//     });

//     const name = parts.filter((p) => p !== "").join("_");
//     setFilename(name);
//   }, [values, order, soundSelection, subtitleLang]);

//   useEffect(() => {
//     generateFilename();
//   }, [generateFilename]);

//   // Handlers
//   const handleValueChange = (key: TokenKey, val: string) => {
//     setValues((prev) => ({ ...prev, [key]: val }));
//   };

//   const handlePresetChange = (newPreset: string) => {
//     setPreset(newPreset);
//     if (PRESETS[newPreset]) setOrder(PRESETS[newPreset]);
//   };

//   const handleSave = () => {
//     const dataToSave = { values, order, soundSelection, preset, subtitleLang };
//     localStorage.setItem("mediaProNamerData", JSON.stringify(dataToSave));
//     alert("SETTINGS SAVED TO CORE MEMORY.");
//   };

//   const handleCopy = () => {
//     if (!filename) return;
//     navigator.clipboard.writeText(filename).then(() => {
//       setCopyFeedback(true);
//       setTimeout(() => setCopyFeedback(false), 2000);
//     });
//   };

//   const handleExportKey = () => {
//     const getKeyLabel = (key: TokenKey) => {
//       switch (key) {
//         case "episode-reel":
//           return "EP/REEL";
//         case "color-space":
//           return "COLOR";
//         case "aspect-ratio":
//           return "ASPECT";
//         case "language":
//           return "AUDIO";
//         case "subtitles":
//           return "SUBS";
//         case "luminance":
//           return "NITS";
//         case "compresor":
//           return "CODEC";
//         case "container":
//           return "EXT";
//         default:
//           return key.toUpperCase();
//       }
//     };

//     const parts = order.map((key) => {
//       let isActive = false;

//       if (key === "sound") {
//         isActive = soundSelection.length > 0;
//       } else if (key === "subtitles") {
//         isActive = values.subtitles !== "NONE";
//       } else {
//         isActive = !!values[key] && values[key] !== "NONE";
//       }

//       return isActive ? `[${getKeyLabel(key)}]` : null;
//     });

//     const keyString = parts.filter(Boolean).join("_");
//     if (!keyString) return;

//     navigator.clipboard.writeText(keyString).then(() => {
//       setExportKeyFeedback(true);
//       setTimeout(() => setExportKeyFeedback(false), 2000);
//     });
//   };

//   // ✅ Loading general
//   if (loadingLicense || bootingSession) {
//     return (
//       <div
//         style={{
//           minHeight: "100vh",
//           display: "grid",
//           placeItems: "center",
//           color: "white",
//           background: "black",
//           fontFamily:
//             "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
//         }}
//       >
//         Loading...
//       </div>
//     );
//   }

//   // ✅ Gate: si NO hay sesión → Login/Register (esto arregla tu problema al refrescar)
//   if (!sessionUser) {
//     return authView === "login" ? (
//       <AuthLogin
//         onLoginSuccess={(u) => setSessionUser(u)}
//         onGoRegister={() => setAuthView("register")}
//       />
//     ) : (
//       <AuthRegister
//         onRegisterSuccess={(u) => setSessionUser(u)}
//         onGoLogin={() => setAuthView("login")}
//       />
//     );
//   }

//   // ✅ LicenseGate queda opcional (no lo borramos)
//   // Si quieres forzarlo además del login, descomenta:
//   // if (!isLicensed) return <LicenseGate onUnlock={handleUnlock} />;

//   return (
//     <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto font-sans text-gray-200">
//       {/* Header */}
//       <header className="mb-8 border-b-2 border-neon-pink pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
//         <div className="flex items-center gap-4">
//           <div>
//             <h1 className="text-2xl md:text-4xl font-retro text-neon-pink drop-shadow-[0_0_8px_rgba(255,106,193,0.8)] mb-2 leading-none">
//               MEDIA PRO NAMER{" "}
//               <span className="text-neon-cyan text-lg md:text-2xl animate-pulse">
//                 NEON
//               </span>
//             </h1>
//             <p className="font-code text-neon-cyan tracking-[0.2em] text-xs md:text-sm opacity-80">
//               ADVANCED_FILE_NAMING_SYSTEM_V3.0
//             </p>

//             {/* Mini info sesión */}
//             <div className="mt-2 font-tech text-xs text-neon-pink/60">
//               USER: {sessionUser.email} // ROLE:{" "}
//               {sessionUser.role.toUpperCase()} // CREDITS: {sessionUser.credits}
//             </div>
//           </div>
//         </div>

//         <div className="flex items-end gap-4">
//           <div className="hidden md:block text-right font-tech text-xs text-neon-pink/50">
//             SYS.STATUS: ONLINE
//             <br />
//             SESSION: ACTIVE
//           </div>

//           <button
//             onClick={handleLogoutSession}
//             className="flex items-center gap-1 text-xs opacity-70 hover:opacity-100 hover:text-red-400 transition-all"
//             title="Logout"
//           >
//             <LogOut size={12} /> LOGOUT
//           </button>
//         </div>
//       </header>

//       <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
//         {/* Left Column */}
//         <div className="lg:col-span-4 space-y-4">
//           <div className="bg-neon-panel/40 border border-neon-pink/20 p-4 rounded-lg backdrop-blur-sm">
//             <h2 className="font-retro text-neon-pink text-xs mb-4 border-b border-neon-pink/30 pb-2">
//               CORE METADATA
//             </h2>

//             <NeonInput
//               id="id"
//               label="ID"
//               value={values.id}
//               onChange={(v) => handleValueChange("id", v)}
//               tooltip="Identificador único del proyecto o activo."
//             />
//             <NeonInput
//               id="episode"
//               label="EPISODE / REEL"
//               value={values["episode-reel"]}
//               onChange={(v) => handleValueChange("episode-reel", v)}
//               tooltip="Número de Episodio o Rollo (Reel)."
//             />
//             <NeonSelect
//               id="type"
//               label="TYPE"
//               value={values.type}
//               options={TYPE_OPTIONS}
//               onChange={(v) => handleValueChange("type", v)}
//               tooltip="Tipo de contenido (Master, Review, etc)."
//             />

//             <div className="grid grid-cols-2 gap-4">
//               <NeonInput
//                 id="date"
//                 label="DATE"
//                 type="date"
//                 value={values.date}
//                 onChange={(v) => handleValueChange("date", v)}
//                 tooltip="Fecha de creación (YYYYMMDD)."
//               />
//               <NeonInput
//                 id="version"
//                 label="VERSION"
//                 value={values.version}
//                 onChange={(v) => handleValueChange("version", v)}
//                 tooltip="Número de versión (v01, v02...)."
//               />
//             </div>
//           </div>

//           <div className="bg-neon-panel/40 border border-neon-pink/20 p-4 rounded-lg backdrop-blur-sm">
//             <h2 className="font-retro text-neon-pink text-xs mb-4 border-b border-neon-pink/30 pb-2">
//               LOCALIZATION
//             </h2>

//             <NeonSelect
//               id="lang"
//               label="AUDIO LANGUAGE"
//               value={values.language}
//               options={LANGUAGE_OPTIONS}
//               onChange={(v) => handleValueChange("language", v)}
//               tooltip="Idioma principal del audio."
//             />

//             <div className="grid grid-cols-2 gap-4">
//               <NeonSelect
//                 id="subs_type"
//                 label="SUB TITLE TYPE"
//                 value={values.subtitles}
//                 options={SUBTITLE_TYPE_OPTIONS}
//                 onChange={(v) => handleValueChange("subtitles", v)}
//                 tooltip="Tipo de subtítulos (Quemados, Textless)."
//               />
//               <NeonSelect
//                 id="subs_lang"
//                 label="SUB LANGUAGE"
//                 value={subtitleLang}
//                 options={LANGUAGE_OPTIONS}
//                 onChange={(v) => setSubtitleLang(v)}
//                 tooltip="Idioma de los subtítulos."
//               />
//             </div>
//           </div>
//         </div>

//         {/* Middle Column */}
//         <div className="lg:col-span-4 space-y-4">
//           <div className="bg-neon-panel/40 border border-neon-pink/20 p-4 rounded-lg backdrop-blur-sm">
//             <h2 className="font-retro text-neon-pink text-xs mb-4 border-b border-neon-pink/30 pb-2">
//               TECHNICAL SPECS
//             </h2>

//             <NeonSelect
//               id="res"
//               label="RESOLUTION"
//               value={values.resolution}
//               options={RESOLUTION_OPTIONS}
//               onChange={(v) => handleValueChange("resolution", v)}
//               tooltip="Resolución de imagen (1920x1080, 4K...)."
//             />

//             <div className="grid grid-cols-2 gap-4">
//               <NeonSelect
//                 id="cs"
//                 label="COLOR SPACE"
//                 value={values["color-space"]}
//                 options={COLOR_SPACE_OPTIONS}
//                 onChange={(v) => handleValueChange("color-space", v)}
//                 tooltip="Espacio de color y curva gamma."
//               />
//               <NeonSelect
//                 id="nits"
//                 label="LUMINANCE"
//                 value={values.luminance}
//                 options={LUMINANCE_OPTIONS}
//                 onChange={(v) => handleValueChange("luminance", v)}
//                 tooltip="Brillo máximo en Nits (HDR)."
//               />
//             </div>

//             <NeonSelect
//               id="ar"
//               label="ASPECT RATIO"
//               value={values["aspect-ratio"]}
//               options={ASPECT_RATIO_OPTIONS}
//               onChange={(v) => handleValueChange("aspect-ratio", v)}
//               tooltip="Relación de aspecto de la imagen."
//             />
//             <NeonSelect
//               id="fps"
//               label="FRAMERATE"
//               value={values.framerate}
//               options={FRAMERATE_OPTIONS}
//               onChange={(v) => handleValueChange("framerate", v)}
//               tooltip="Velocidad de cuadros por segundo (FPS)."
//             />
//           </div>

//           <div className="bg-neon-panel/40 border border-neon-pink/20 p-4 rounded-lg backdrop-blur-sm">
//             <h2 className="font-retro text-neon-pink text-xs mb-4 border-b border-neon-pink/30 pb-2">
//               FORMAT & AUDIO
//             </h2>

//             <NeonSelect
//               id="container"
//               label="CONTAINER"
//               value={values.container}
//               options={CONTAINER_OPTIONS}
//               onChange={(v) => handleValueChange("container", v)}
//               tooltip="Formato contenedor del archivo (.mov, .mxf)."
//             />
//             <NeonSelect
//               id="codec"
//               label="COMPRESSOR"
//               value={values.compresor}
//               options={COMPRESOR_OPTIONS}
//               onChange={(v) => handleValueChange("compresor", v)}
//               tooltip="Códec de compresión de video."
//             />

//             <div className="mt-6 border-t border-neon-pink/20 pt-4">
//               <SoundSelector
//                 selectedSounds={soundSelection}
//                 onChange={setSoundSelection}
//               />
//             </div>
//           </div>
//         </div>

//         {/* Right Column */}
//         <div className="lg:col-span-4 flex flex-col gap-4">
//           <div className="bg-neon-panel/40 border border-neon-cyan/20 p-4 rounded-lg">
//             <div className="flex items-center mb-2">
//               <NeonTooltip
//                 content="Selecciona una configuración predefinida para ordenar los tokens."
//                 align="left"
//               >
//                 <label className="block text-neon-cyan font-code tracking-wider text-sm cursor-help">
//                   PRESET CONFIG:
//                 </label>
//               </NeonTooltip>
//             </div>

//             <div className="relative">
//               <select
//                 value={preset}
//                 onChange={(e) => handlePresetChange(e.target.value)}
//                 className="w-full bg-black border border-neon-cyan text-neon-cyan font-code p-2 rounded focus:shadow-neon-cyan focus:outline-none appearance-none cursor-pointer"
//               >
//                 {Object.keys(PRESETS).map((k) => (
//                   <option key={k} value={k}>
//                     {k.toUpperCase()}
//                   </option>
//                 ))}
//               </select>
//               <Zap
//                 className="absolute right-2 top-2.5 text-neon-cyan pointer-events-none"
//                 size={16}
//               />
//             </div>
//           </div>

//           <div className="bg-neon-panel/40 border border-neon-pink/20 p-4 rounded-lg flex-grow">
//             <OrderController order={order} onOrderChange={setOrder} />
//           </div>

//           <div className="bg-neon-panel p-4 rounded-lg border-2 border-neon-pink shadow-neon-pink sticky bottom-4 z-40">
//             <label className="block mb-1 text-neon-pink font-retro text-xs">
//               GENERATED FILENAME:
//             </label>

//             <div className="bg-neon-cyan text-black font-code text-lg p-3 break-all mb-4 min-h-[3.5rem] flex items-center border-2 border-black shadow-inner">
//               {filename || (
//                 <span className="opacity-30">WAITING_FOR_INPUT...</span>
//               )}
//             </div>

//             <div className="flex gap-2">
//               <NeonTooltip
//                 content="Copiar el nombre generado al portapapeles."
//                 className="flex-1"
//                 align="left"
//               >
//                 <button
//                   onClick={handleCopy}
//                   className={`w-full flex items-center justify-center gap-2 font-retro text-xs py-3 px-2 transition-all border-2 ${
//                     copyFeedback
//                       ? "bg-white text-neon-pink border-white"
//                       : "bg-neon-pink text-black border-neon-pink hover:bg-pink-400 hover:shadow-[0_0_15px_#ff6ac1]"
//                   }`}
//                 >
//                   {copyFeedback ? (
//                     "COPIED!"
//                   ) : (
//                     <>
//                       COPY <Copy size={14} />
//                     </>
//                   )}
//                 </button>
//               </NeonTooltip>

//               <NeonTooltip
//                 content="Copiar la estructura/guía de los tokens utilizados."
//                 className="flex-1"
//                 align="center"
//               >
//                 <button
//                   onClick={handleExportKey}
//                   className={`w-full flex items-center justify-center gap-2 font-retro text-xs py-3 px-2 transition-all border-2 ${
//                     exportKeyFeedback
//                       ? "bg-white text-neon-cyan border-white"
//                       : "bg-neon-cyan/10 text-neon-cyan border-neon-cyan hover:bg-neon-cyan/20 hover:shadow-[0_0_10px_#00FFFF]"
//                   }`}
//                 >
//                   {exportKeyFeedback ? (
//                     "KEY COPIED!"
//                   ) : (
//                     <>
//                       KEY <Key size={14} />
//                     </>
//                   )}
//                 </button>
//               </NeonTooltip>

//               <NeonTooltip content="Guardar configuración actual." align="right">
//                 <button
//                   onClick={handleSave}
//                   className="w-12 flex items-center justify-center bg-transparent text-neon-pink font-retro text-xs py-3 border-2 border-neon-pink hover:bg-neon-pink/20 hover:shadow-[0_0_10px_#ff6ac1] transition-all"
//                 >
//                   <Save size={16} />
//                 </button>
//               </NeonTooltip>
//             </div>
//           </div>
//         </div>
//       </div>

//       <footer className="mt-12 flex flex-col items-center justify-center gap-2 font-code text-neon-pink/40 text-sm pb-8">
//         <div>&copy; MEDIA PRO NAMER BY NICO</div>

//         <button
//           onClick={handleDeactivate}
//           className="flex items-center gap-1 text-xs opacity-50 hover:opacity-100 hover:text-red-400 transition-all"
//         >
//           <LogOut size={12} /> DEACTIVATE TERMINAL
//         </button>
//       </footer>
//     </div>
//   );
// };

// export default App;

