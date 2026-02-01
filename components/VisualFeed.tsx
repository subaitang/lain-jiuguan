import {
  Activity,
  Radio,
  RefreshCw,
  Shield,
  Sliders,
  Upload,
  Wifi,
  X,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { audio } from "../services/audioEngine";
import { generateImage } from "../services/geminiService";
import { AppSettings, Message, PersonaSettings, VisualAsset } from "../types";
import { t } from "../utils/translations";

interface VisualFeedProps {
  activePersona: PersonaSettings;
  messages: Message[];
  apiKey?: string;
  onUpdatePersona: (id: string, updates: Partial<PersonaSettings>) => void;
  opacity: number;
  setOpacity: (val: number) => void;
  settings: AppSettings;
  onUpdateSettings?: (s: AppSettings) => void;
}

const isVideoUrl = (url: string) => {
  if (!url) return false;
  if (url.startsWith("data:image/")) return false;
  return (
    url.includes(".mp4") ||
    url.includes(".webm") ||
    url.startsWith("data:video") ||
    url.startsWith("blob:")
  );
};

/**
 * 客户端图片压缩与调整尺寸，防止 LocalStorage 容量超限导致崩溃
 */
const compressAndResizeImage = (
  file: File,
  maxWidth = 1024,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject("Canvas Context Error");
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = () => reject("Image Load Error");
    };
    reader.onerror = () => reject("File Read Error");
  });
};

const VideoLinkHUD: React.FC<{
  name: string;
  ip?: string;
  isLoading: boolean;
}> = ({ name, ip, isLoading }) => {
  const [bitrate, setBitrate] = useState(2400);
  const [fps, setFps] = useState(30);

  useEffect(() => {
    const interval = setInterval(() => {
      setBitrate(2400 + Math.floor(Math.random() * 800 - 400));
      setFps(30 + (Math.random() > 0.9 ? -1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none z-10 font-mono flex flex-col justify-between p-3 select-none">
      {/* Top HUD */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2 bg-black/40 px-2 py-0.5 border border-[color:var(--lain-cyan)]/30 backdrop-blur-sm">
            <Radio size={10} className="text-red-500 animate-pulse" />
            <span className="text-[10px] font-bold tracking-[0.2em] text-[color:var(--lain-cyan)] text-glow">
              V-LINK ESTABLISHED // {name.toUpperCase()}
            </span>
          </div>
          <div className="text-[8px] opacity-60 pl-2">
            PROTOCOL: WIRED_TCP_v6 // {ip || "192.168.x.x"}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2 bg-black/40 px-2 py-0.5 border border-[color:var(--lain-cyan)]/30 backdrop-blur-sm">
            <Shield size={10} className="text-green-400" />
            <span className="text-[8px] font-bold">SECURE_ENC: AES-2048</span>
          </div>
          <div className="text-[8px] opacity-60 pr-2">
            RES: 1280x720 (NEURAL_SCALED)
          </div>
        </div>
      </div>

      {/* Middle Indicator (Only when syncing/loading) */}
      {isLoading && (
        <div className="self-center flex flex-col items-center gap-2">
          <div className="px-4 py-1 border border-white/50 bg-black/80 animate-pulse">
            <span className="text-xs font-bold tracking-[0.5em] text-white">
              RE-BUFFERING DATA...
            </span>
          </div>
          <div className="flex gap-1">
            <div className="w-1 h-1 bg-[color:var(--lain-cyan)] animate-bounce" />
            <div className="w-1 h-1 bg-[color:var(--lain-cyan)] animate-bounce delay-75" />
            <div className="w-1 h-1 bg-[color:var(--lain-cyan)] animate-bounce delay-150" />
          </div>
        </div>
      )}

      {/* Bottom HUD */}
      <div className="flex justify-between items-end">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3 text-[9px] opacity-80 bg-black/40 p-1 border-l border-[color:var(--lain-cyan)]">
            <div className="flex items-center gap-1">
              <Activity size={10} />
              <span>{bitrate} kbps</span>
            </div>
            <div className="flex items-center gap-1">
              <Wifi size={10} />
              <span>LAT: {Math.floor(Math.random() * 10 + 15)}ms</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex gap-0.5 items-end h-3">
              <div className="w-1 h-1 bg-[color:var(--lain-cyan)]"></div>
              <div className="w-1 h-1.5 bg-[color:var(--lain-cyan)]"></div>
              <div className="w-1 h-2 bg-[color:var(--lain-cyan)]"></div>
              <div className="w-1 h-3 bg-[color:var(--lain-cyan)]"></div>
            </div>
            <span className="text-[9px] font-bold">SIG_STR: MAX</span>
          </div>
          <div className="text-[10px] font-bold px-2 py-0.5 bg-red-600 text-white animate-pulse">
            LIVE
          </div>
        </div>
      </div>

      {/* Camera Corner Brackets */}
      <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-white/30"></div>
      <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-white/30"></div>
      <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-white/30"></div>
      <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-white/30"></div>
    </div>
  );
};

const PositionGrid = ({
  currentPos,
  onChange,
}: {
  currentPos: string;
  onChange: (p: string) => void;
}) => {
  const positions = [
    "top left",
    "top",
    "top right",
    "left",
    "center",
    "right",
    "bottom left",
    "bottom",
    "bottom right",
  ];
  return (
    <div className="grid grid-cols-3 gap-0.5 w-24 h-24 bg-black/50 border border-[color:var(--lain-cyan)]/20 p-0.5 pointer-events-auto">
      {positions.map((pos) => (
        <button
          key={pos}
          onClick={() => onChange(pos)}
          className={`w-full h-full hover:bg-[color:var(--lain-cyan)]/50 transition-colors ${currentPos === pos ? "bg-[color:var(--lain-cyan)]" : "bg-[color:var(--lain-cyan)]/10"}`}
          title={pos}
        />
      ))}
    </div>
  );
};

export const VisualFeed: React.FC<VisualFeedProps> = ({
  activePersona,
  messages,
  apiKey,
  onUpdatePersona,
  opacity,
  setOpacity,
  settings,
  onUpdateSettings,
}) => {
  const [visibleSrc, setVisibleSrc] = useState<string>(
    activePersona.visualImage || "https://picsum.photos/seed/lain/800/800",
  );
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("PROCESSING...");
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [genMode, setGenMode] = useState<"nano" | "pro" | "veo">("nano");
  const [showPosGrid, setShowPosGrid] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const lang = settings.user.language;

  useEffect(() => {
    if (activePersona.visualImage) {
      setVisibleSrc(activePersona.visualImage);
    } else if (!activePersona.visualImage && visibleSrc.startsWith("data:")) {
      setVisibleSrc("https://picsum.photos/seed/lain/800/800");
    }
  }, [activePersona.visualImage, activePersona.id]);

  const handleGenRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    setLoadingMsg(t("vf_gen_img", lang));
    try {
      const url = await generateImage(
        searchQuery,
        apiKey,
        genMode === "pro" ? "pro" : "nano",
      );
      if (url) {
        setVisibleSrc(url);
        onUpdatePersona(activePersona.id, { visualImage: url });
      }
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
    setIsSearching(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsLoading(true);
      setLoadingMsg("OPTIMIZING IMAGE...");
      try {
        let finalResult: string;
        if (file.type.startsWith("video/") || file.type === "image/gif") {
          const reader = new FileReader();
          finalResult = await new Promise((res) => {
            reader.onloadend = () => res(reader.result as string);
            reader.readAsDataURL(file);
          });
        } else {
          finalResult = await compressAndResizeImage(file);
        }

        setVisibleSrc(finalResult);
        onUpdatePersona(activePersona.id, { visualImage: finalResult });

        if (onUpdateSettings) {
          const currentUI = settings.ui || ({} as any);
          const currentAssets = currentUI.visualAssets || [];
          const newAsset: VisualAsset = {
            id: `upload-${Date.now()}`,
            url: finalResult,
            type: file.type.startsWith("video/") ? "video" : "image",
            keywords: "uploaded",
            active: true,
            name: file.name,
          };
          onUpdateSettings({
            ...settings,
            ui: {
              ...currentUI,
              visualAssets: [...currentAssets, newAsset],
            },
          });
        }
        audio.playBootSound();
      } catch (err) {
        console.error("Image processing failed:", err);
      } finally {
        setIsLoading(false);
      }
    }
    e.target.value = "";
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden group">
      {isSearching ? (
        <div className="w-full h-full bg-black/90 p-4 flex flex-col z-30 animate-in fade-in">
          <div className="flex justify-between items-center mb-4 border-b border-[color:var(--lain-cyan)]/30 pb-2">
            <h3 className="text-xs font-bold tracking-widest text-[color:var(--lain-cyan)]">
              {t("vf_title", lang)}
            </h3>
            <button
              onClick={() => setIsSearching(false)}
              className="text-red-500"
            >
              <X size={14} />
            </button>
          </div>
          <form onSubmit={handleGenRequest} className="space-y-4">
            <div className="flex gap-2">
              {["nano", "pro", "veo"].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setGenMode(m as any)}
                  className={`flex-1 py-1 text-[10px] border ${genMode === m ? "bg-[color:var(--lain-cyan)] text-black" : "border-[color:var(--lain-cyan)]/30"}`}
                >
                  {m.toUpperCase()}
                </button>
              ))}
            </div>
            <textarea
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-24 bg-black border border-[color:var(--lain-cyan)]/30 p-2 text-xs outline-none focus:border-[color:var(--lain-cyan)] resize-none"
              placeholder={t("vf_prompt_gen", lang)}
            />
            <button
              type="submit"
              className="w-full py-2 bg-[color:var(--lain-cyan)] text-black font-bold text-xs hover:bg-white transition-colors"
            >
              GENERATE
            </button>
          </form>
        </div>
      ) : (
        <div className="w-full h-full relative">
          <VideoLinkHUD
            name={activePersona.name}
            ip={activePersona.ipAddress}
            isLoading={isLoading}
          />

          {isVideoUrl(visibleSrc) ? (
            <video
              src={visibleSrc}
              className="w-full h-full object-cover"
              style={{
                opacity,
                objectPosition: activePersona.visualPosition || "center",
              }}
              autoPlay
              loop
              muted
              playsInline
              key={visibleSrc}
            />
          ) : (
            <img
              src={visibleSrc}
              className="w-full h-full object-cover"
              style={{
                opacity,
                objectPosition: activePersona.visualPosition || "center",
              }}
              alt="visual"
              key={visibleSrc}
            />
          )}

          {/* Visual Overlay Interferences */}
          <div className="absolute inset-0 pointer-events-none bg-[url('https://upload.wikimedia.org/wikipedia/commons/b/bc/Static_tv_noise_clip.gif')] opacity-[0.03] mix-blend-overlay"></div>

          {showPosGrid && (
            <div className="absolute top-12 right-12 z-30 animate-in fade-in zoom-in origin-top-right">
              <PositionGrid
                currentPos={activePersona.visualPosition || "center"}
                onChange={(pos) =>
                  onUpdatePersona(activePersona.id, { visualPosition: pos })
                }
              />
            </div>
          )}

          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2 z-20 pointer-events-auto">
            <button
              onClick={() => setShowPosGrid(!showPosGrid)}
              className={`p-2 border border-[color:var(--lain-cyan)]/50 hover:bg-[color:var(--lain-cyan)] hover:text-black transition-colors ${
                showPosGrid
                  ? "bg-[color:var(--lain-cyan)] text-black"
                  : "bg-black/80"
              }`}
              title="Adjust Position"
            >
              <Sliders size={14} />
            </button>
            <button
              onClick={() => setIsSearching(true)}
              className="p-2 bg-black/80 border border-[color:var(--lain-cyan)]/50 hover:bg-[color:var(--lain-cyan)] hover:text-black transition-colors"
              title="New Generation"
            >
              <RefreshCw size={14} />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 bg-black/80 border border-[color:var(--lain-cyan)]/50 hover:bg-[color:var(--lain-cyan)] hover:text-black transition-colors"
              title="Upload Local"
            >
              <Upload size={14} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,video/*"
            />
          </div>
        </div>
      )}
    </div>
  );
};
