import React, { useState, useEffect } from "react";
import {
  Download,
  Instagram,
  History,
  Settings,
  Home,
  Loader2,
  Search,
  Image,
  Video,
  User,
  AlertCircle,
  X,
  ExternalLink,
  Trash2,
  Moon,
  Sun,
  CheckCircle,
} from "lucide-react";

/* -------------------------------------------------------
    STORAGE HOOK — DOWNLOAD HISTORY (localStorage)
------------------------------------------------------- */
const useDownloadHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("download_history");
      if (saved) setHistory(JSON.parse(saved));
    } catch {}
    setLoading(false);
  }, []);

  const addToHistory = (item) => {
    const entry = { ...item, id: Date.now(), timestamp: Date.now() };
    const updated = [entry, ...history];

    setHistory(updated);
    localStorage.setItem("download_history", JSON.stringify(updated));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("download_history");
  };

  const removeItem = (id) => {
    const updated = history.filter((i) => i.id !== id);
    setHistory(updated);
    localStorage.setItem("download_history", JSON.stringify(updated));
  };

  return { history, loading, addToHistory, clearHistory, removeItem };
};

/* -------------------------------------------------------
    SETTINGS HOOK — THEME + QUALITY + AUTODOWNLOAD
------------------------------------------------------- */
const useSettings = () => {
  const [settings, setSettings] = useState({
    theme: "light",
    autoDownload: false,
    quality: "hd",
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem("app_settings");
      if (saved) setSettings(JSON.parse(saved));
    } catch {}
  }, []);

  const updateSettings = (obj) => {
    const updated = { ...settings, ...obj };
    setSettings(updated);
    localStorage.setItem("app_settings", JSON.stringify(updated));
  };

  return { settings, updateSettings };
};

/* -------------------------------------------------------
    MAIN APP — InstaGrab Pro
------------------------------------------------------- */
export default function InstagramDownloaderApp() {
  const [currentPage, setCurrentPage] = useState("home");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const { history, addToHistory, clearHistory, removeItem } =
    useDownloadHistory();
  const { settings, updateSettings } = useSettings();

  /* -------------------------------------------------------
        FETCH CONTENT FROM YOUR BACKEND API
  ------------------------------------------------------- */
  const fetchContent = async () => {
    setError("");
    setResult(null);

    if (!url.trim()) {
      setError("Please paste Instagram URL");
      return;
    }

    if (!url.includes("instagram.com")) {
      setError("Invalid Instagram URL");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/video?postUrl=${encodeURIComponent(url)}`
      );

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Failed to fetch content");

      setResult({
        filename: data.data.filename,
        videoUrl: data.data.videoUrl,
        thumbnail: data.data.thumbnail,
        size: data.data.size,
        type: data.data.type,
        url: url,
      });

      if (settings.autoDownload) handleDownload();

      setCurrentPage("download");
    } catch (err) {
      setError(err.message || "Failed to fetch content.");
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------------------------------------
       DOWNLOAD USING PROXY (for CORS Fix)
  ------------------------------------------------------- */
  const handleDownload = () => {
    if (!result) return;

    addToHistory({
      type: result.type || "video",
      url: result.url,
      thumbnail: result.thumbnail,
      filename: result.filename,
      size: result.size,
    });

    const proxyUrl = `/api/proxy?url=${encodeURIComponent(
      result.videoUrl
    )}&filename=${encodeURIComponent(result.filename)}`;

    window.location.href = proxyUrl;
  };

  /* -------------------------------------------------------
       PAGE SWITCHING
  ------------------------------------------------------- */
  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return <HomePage onNavigate={setCurrentPage} settings={settings} />;
      case "download":
        return (
          <DownloadPage
            url={url}
            setUrl={setUrl}
            loading={loading}
            result={result}
            error={error}
            onFetch={fetchContent}
            onDownload={handleDownload}
          />
        );
      case "history":
        return (
          <HistoryPage
            history={history}
            onClear={clearHistory}
            onRemove={removeItem}
          />
        );
      case "settings":
        return <SettingsPage settings={settings} onUpdate={updateSettings} />;
      default:
        return <HomePage onNavigate={setCurrentPage} settings={settings} />;
    }
  };

  /* -------------------------------------------------------
       MAIN LAYOUT + NAVIGATION
  ------------------------------------------------------- */
  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        settings.theme === "dark"
          ? "bg-gray-900"
          : "bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50"
      }`}
    >
      {/* HEADER */}
      <header
        className={`sticky top-0 z-50 backdrop-blur-lg border-b ${
          settings.theme === "dark"
            ? "bg-gray-800/80 border-gray-700"
            : "bg-white/80 border-gray-200"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-2 rounded-xl">
            <Instagram className="w-6 h-6 text-white" />
          </div>
          <h1
            className={`text-xl font-bold ${
              settings.theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            InstaGrab Pro
          </h1>
        </div>
      </header>

      {/* CONTENT */}
      <main className="max-w-7xl mx-auto px-4 py-6">{renderPage()}</main>

      {/* BOTTOM NAVIGATION */}
      <nav
        className={`fixed bottom-0 left-0 right-0 backdrop-blur-lg border-t px-4 py-3 ${
          settings.theme === "dark"
            ? "bg-gray-800/95 border-gray-700"
            : "bg-white/95 border-gray-200"
        }`}
      >
        <div className="max-w-7xl mx-auto flex justify-around items-center">
          <NavButton
            icon={Home}
            label="Home"
            active={currentPage === "home"}
            onClick={() => setCurrentPage("home")}
            theme={settings.theme}
          />
          <NavButton
            icon={Download}
            label="Download"
            active={currentPage === "download"}
            onClick={() => setCurrentPage("download")}
            theme={settings.theme}
          />
          <NavButton
            icon={History}
            label="History"
            active={currentPage === "history"}
            onClick={() => setCurrentPage("history")}
            theme={settings.theme}
          />
          <NavButton
            icon={Settings}
            label="Settings"
            active={currentPage === "settings"}
            onClick={() => setCurrentPage("settings")}
            theme={settings.theme}
          />
        </div>
      </nav>
    </div>
  );
}

/* -------------------------------------------------------
    NAV BUTTON COMPONENT
------------------------------------------------------- */
function NavButton({ icon: Icon, label, active, onClick, theme }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
        active
          ? theme === "dark"
            ? "bg-purple-600 text-white"
            : "bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-lg"
          : theme === "dark"
          ? "text-gray-400 hover:text-white"
          : "text-gray-500 hover:text-gray-900"
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

/* -------------------------------------------------------
    HOME PAGE
------------------------------------------------------- */
function HomePage({ onNavigate, settings }) {
  const features = [
    {
      icon: Video,
      title: "Reels & Videos",
      desc: "Download HD reels & videos instantly",
      action: "download",
    },
    {
      icon: Image,
      title: "Posts & Photos",
      desc: "Save images & carousel posts",
      action: "download",
    },
    {
      icon: User,
      title: "Stories & IGTV",
      desc: "Get stories & IGTV videos",
      action: "download",
    },
  ];

  return (
    <div className="space-y-8 pb-24">
      {/* HERO */}
      <div
        className={`rounded-3xl p-8 border text-center ${
          settings.theme === "dark"
            ? "bg-gradient-to-br from-purple-900/50 to-pink-900/50 border-purple-700"
            : "bg-gradient-to-br from-purple-100 to-pink-100 border-purple-200"
        }`}
      >
        <div className="inline-block bg-gradient-to-br from-purple-600 to-pink-600 p-4 rounded-2xl mb-4">
          <Instagram className="w-12 h-12 text-white" />
        </div>
        <h2
          className={`text-3xl font-bold mb-2 ${
            settings.theme === "dark" ? "text-white" : "text-gray-900"
          }`}
        >
          Download Instagram Content
        </h2>
        <p
          className={`mb-6 ${
            settings.theme === "dark" ? "text-gray-300" : "text-gray-600"
          }`}
        >
          Fast, secure & completely free. No watermark!
        </p>

        <button
          onClick={() => onNavigate("download")}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-xl font-semibold hover:opacity-90 transition shadow-lg"
        >
          Start Downloading
        </button>
      </div>

      {/* FEATURES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {features.map((f, i) => (
          <button
            key={i}
            onClick={() => onNavigate(f.action)}
            className={`backdrop-blur-lg p-6 rounded-2xl border hover:shadow-xl transition text-left w-full hover:scale-105 ${
              settings.theme === "dark"
                ? "bg-gray-800/50 border-gray-700"
                : "bg-white/70 border-gray-200"
            }`}
          >
            <div className="bg-gradient-to-br from-purple-600 to-pink-600 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
              <f.icon className="w-6 h-6 text-white" />
            </div>
            <h3
              className={`font-bold text-lg mb-2 ${
                settings.theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              {f.title}
            </h3>
            <p
              className={`text-sm ${
                settings.theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {f.desc}
            </p>
          </button>
        ))}
      </div>

      {/* HOW IT WORKS */}
      <div
        className={`backdrop-blur-lg rounded-2xl p-6 border ${
          settings.theme === "dark"
            ? "bg-gray-800/50 border-gray-700"
            : "bg-white/70 border-gray-200"
        }`}
      >
        <h3
          className={`font-bold text-xl mb-4 ${
            settings.theme === "dark" ? "text-white" : "text-gray-900"
          }`}
        >
          How It Works
        </h3>

        <div className="space-y-3">
          <Step number="1" text="Copy Instagram post or reel URL from the app" theme={settings.theme} />
          <Step number="2" text="Paste URL here & click Fetch Content" theme={settings.theme} />
          <Step number="3" text="Preview & download in HD" theme={settings.theme} />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------
    STEP ROW
------------------------------------------------------- */
function Step({ number, text, theme }) {
  return (
    <div className="flex items-center gap-3">
      <div className="bg-gradient-to-br from-purple-600 to-pink-600 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
        {number}
      </div>
      <p className={`${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
        {text}
      </p>
    </div>
  );
}

/* -------------------------------------------------------
    DOWNLOAD PAGE
------------------------------------------------------- */
function DownloadPage({
  url,
  setUrl,
  loading,
  result,
  error,
  onFetch,
  onDownload,
}) {
  return (
    <div className="space-y-6 pb-24">
      {/* INPUT CARD */}
      <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 border border-gray-200 shadow-lg">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Download Content
        </h2>

        <div className="space-y-4">
          {/* URL Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Instagram URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.instagram.com/reel/xxxx/"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
            />
            <p className="text-xs text-gray-500 mt-1">
              Paste any Instagram reel, post or video URL.
            </p>
          </div>

          {/* Fetch Button */}
          <button
            onClick={onFetch}
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl shadow-lg hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Fetching Content...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Fetch Content
              </>
            )}
          </button>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-900">Error</h4>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* LOADING SKELETON */}
      {loading && (
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 border border-gray-200">
          <div className="space-y-4">
            <div className="h-64 bg-gray-200 rounded-xl animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
          </div>
        </div>
      )}

      {/* RESULT PREVIEW */}
      {result && !loading && (
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 border border-gray-200 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">Content Ready!</h3>

            <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
              <CheckCircle className="w-4 h-4" />
              READY
            </div>
          </div>

          {/* Video Preview - Reels 9:16 */}
          <div className="flex justify-center">
            <div className="rounded-xl overflow-hidden bg-black shadow-lg w-full max-w-[360px]">
              <video
                controls
                className="w-full aspect-[9/16] object-cover"
                poster={result.thumbnail}
                src={result.videoUrl}
              />
            </div>
          </div>

          {/* Meta */}
          <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-2">
              <Video className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {result.filename}
                </p>
                <p className="text-xs text-gray-500">
                  {result.size ? `Size: ${result.size}` : "HD Video"}
                </p>
              </div>
            </div>
          </div>

          {/* DOWNLOAD BTN */}
          <button
            onClick={onDownload}
            className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl shadow-lg hover:opacity-90 transition flex items-center justify-center gap-2 text-lg"
          >
            <Download className="w-6 h-6" />
            Download Now
          </button>

          <p className="text-xs text-center text-gray-500">
            No watermark • Original quality • Free forever
          </p>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------
    HISTORY PAGE
------------------------------------------------------- */
function HistoryPage({ history, onClear, onRemove }) {
  if (history.length === 0) {
    return (
      <div className="pb-24">
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-12 border border-gray-200 text-center">
          <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            No History Yet
          </h3>
          <p className="text-gray-600">Your downloaded content will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Download History</h2>

        <button
          onClick={onClear}
          className="px-4 py-2 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Clear All
        </button>
      </div>

      {/* History Items */}
      <div className="space-y-3">
        {history.map((item) => (
          <div
            key={item.id}
            className="bg-white/70 backdrop-blur-lg rounded-xl p-4 border border-gray-200 flex items-center gap-4 hover:shadow-lg transition"
          >
            <img
              src={item.thumbnail || "https://via.placeholder.com/80"}
              alt="thumbnail"
              className="w-16 h-16 rounded-lg object-cover bg-gray-200"
            />

            <div className="flex-1">
              <p className="font-semibold text-gray-900">
                {item.filename || "Instagram Media"}
              </p>

              <p className="text-xs text-gray-500">
                {new Date(item.timestamp).toLocaleString()}
              </p>

              <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-semibold">
                {item.type || "video"}
              </span>
            </div>

            <button
              onClick={() => onRemove(item.id)}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------
    SETTINGS PAGE
------------------------------------------------------- */
function SettingsPage({ settings, onUpdate }) {
  return (
    <div className="space-y-6 pb-24">
      <h2 className="text-2xl font-bold text-gray-900">Settings</h2>

      <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 border border-gray-200 space-y-8">
        
        {/* THEME */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Dark Mode</h3>
            <p className="text-sm text-gray-600">Switch between themes</p>
          </div>

          <button
            onClick={() =>
              onUpdate({ theme: settings.theme === "light" ? "dark" : "light" })
            }
            className={`w-14 h-8 rounded-full transition ${
              settings.theme === "dark" ? "bg-purple-600" : "bg-gray-300"
            } relative`}
          >
            <div
              className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all flex items-center justify-center ${
                settings.theme === "dark" ? "left-7" : "left-1"
              }`}
            >
              {settings.theme === "dark" ? (
                <Moon className="w-3 h-3 text-purple-600" />
              ) : (
                <Sun className="w-3 h-3 text-gray-600" />
              )}
            </div>
          </button>
        </div>

        {/* AUTO DOWNLOAD */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div>
            <h3 className="font-semibold text-gray-900">Auto Download</h3>
            <p className="text-sm text-gray-600">Start download automatically</p>
          </div>

          <button
            onClick={() =>
              onUpdate({ autoDownload: !settings.autoDownload })
            }
            className={`w-14 h-8 rounded-full transition ${
              settings.autoDownload ? "bg-purple-600" : "bg-gray-300"
            } relative`}
          >
            <div
              className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${
                settings.autoDownload ? "left-7" : "left-1"
              }`}
            />
          </button>
        </div>

        {/* QUALITY SELECTOR */}
        <div className="pt-4 border-t border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">
            Download Quality
          </h3>

          <div className="grid grid-cols-3 gap-2">
            {["sd", "hd", "fhd"].map((q) => (
              <button
                key={q}
                onClick={() => onUpdate({ quality: q })}
                className={`py-2 rounded-xl font-semibold transition ${
                  settings.quality === q
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {q.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ABOUT */}
      <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 border border-gray-200">
        <h3 className="font-bold text-gray-900 mb-2">About</h3>

        <p className="text-sm text-gray-600 mb-3">
          InstaGrab Pro — Download Instagram reels, posts & videos in HD.
        </p>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span>100% Free • HD Quality • No Watermark</span>
        </div>
      </div>
    </div>
  );
}