import React, { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { Moon, Sun, Settings, Search, Menu, X } from "lucide-react";
import WikiSearch from "./WikiSearch";
// import { useNavigate } from 'react-router-dom';
import SettingsPanel from "./SettingsPanel";

interface LayoutProps {
  children: React.ReactNode;
  onSearch: (url: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, onSearch }) => {
  const { theme, toggleTheme } = useTheme();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // const navigate = useNavigate()

  // Handle form submission
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (searchValue.trim()) {
      let url = searchValue;
      if (!url.startsWith("http")) {
        url = `https://en.wikipedia.org/wiki/${encodeURIComponent(
          searchValue.trim()
        )}`;
      }
      onSearch(url);
      setSearchValue("");
      setMobileMenuOpen(false);
    }
  };

  const handleHome= () => {
    // navigate
  }

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  // Add a global event handler for image refresh buttons
  useEffect(() => {
    const handleImageRefresh = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const refreshButton = target.closest(".refresh-image-btn");

      if (refreshButton) {
        e.preventDefault();
        e.stopPropagation();

        const imgWrapper = refreshButton.closest(".image-wrapper");
        if (imgWrapper) {
          const img = imgWrapper.querySelector("img");
          if (img) {
            refreshButton.innerHTML = `
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin">
                <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="16"></circle>
              </svg>
            `;

            const originalSrc =
              img.getAttribute("data-original-src") ||
              img.getAttribute("src") ||
              "";
            const cleanSrc = originalSrc.split("?")[0];

            const newImg = new Image();

            const cacheBuster = "?t=" + new Date().getTime();
            const fullUrl = cleanSrc + cacheBuster;

            newImg.onload = function () {
              img.setAttribute("src", fullUrl);
              img.classList.remove("img-error");
              refreshButton.classList.add("hidden");
            };

            newImg.onerror = function () {
              try {
                const proxyUrl = `https://images1-focus-opensocial.googleusercontent.com/gadgets/proxy?container=focus&refresh=2592000&url=${encodeURIComponent(
                  cleanSrc
                )}`;
                img.setAttribute("src", proxyUrl);

                img.onload = function () {
                  img.classList.remove("img-error");
                  refreshButton.classList.add("hidden");
                };

                img.onerror = function () {
                  refreshButton.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  `;
                  refreshButton.classList.add("text-red-500");
                };
              } catch (err) {
                console.error("Failed to load image:", err);
                refreshButton.innerHTML = `
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                `;
                refreshButton.classList.add("text-red-500");
              }
            };

            newImg.src = fullUrl;
          }
        }
      }
    };

    document.addEventListener("click", handleImageRefresh);

    return () => {
      document.removeEventListener("click", handleImageRefresh);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <header className="sticky top-0 z-30 backdrop-blur-md bg-white/90 dark:bg-gray-900/90 border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">
        <div className="container mx-auto px-4 py-3 md:py-4">
          {/* Mobile header layout */}
          <div className="flex items-center justify-between md:hidden">
            <a href="/" className="text-lg font-semibold text-gray-900 dark:text-white">
              Wiki<span className="text-blue-600 dark:text-blue-400">Reader</span>
            </a>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
              >
                {theme === "light" ? (
                  <Moon size={18} className="text-gray-700" />
                ) : (
                  <Sun size={18} className="text-gray-300" />
                )}
              </button>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {mobileMenuOpen ? (
                  <X size={18} className="text-gray-700 dark:text-gray-300" />
                ) : (
                  <Menu size={18} className="text-gray-700 dark:text-gray-300" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile search and menu (collapsible) */}
          <div className={`mt-3 md:hidden ${mobileMenuOpen ? "block" : "hidden"}`}>
            <form onSubmit={handleSubmit} className="flex items-center mb-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search Wikipedia"
                  className="w-full py-2 px-3 rounded-l-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none text-sm"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
              </div>
              <button
                type="submit"
                className="py-2 px-3 border border-l-0 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none rounded-r-md flex items-center justify-center"
                aria-label="Search Wikipedia"
              >
                <Search size={18} />
              </button>
            </form>

            <div className="flex items-center justify-end">
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center gap-2 py-2 px-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
              >
                <Settings size={16} />
                <span>Settings</span>
              </button>
            </div>
          </div>

          {/* Desktop header layout */}
          <div className="hidden md:flex items-center justify-between gap-4">
            <a href="/" className="text-xl font-semibold text-gray-900 dark:text-white shrink-0">
              Wiki<span className="text-blue-600 dark:text-blue-400">Reader</span>
            </a>

            <div className="flex-1 max-w-3xl mx-auto">
              <form onSubmit={handleSubmit} className="flex items-center">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Enter Wikipedia URL or article name"
                    className="w-full py-2 px-4 rounded-l-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                </div>
                <button
                  type="submit"
                  className="py-2 px-3 border border-l-0 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none rounded-r-md flex items-center justify-center"
                  aria-label="Search Wikipedia"
                >
                  <Search size={20} />
                </button>
              </form>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                aria-label="Open settings"
              >
                <Settings size={20} className="text-gray-700 dark:text-gray-300" />
              </button>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
              >
                {theme === "light" ? (
                  <Moon size={20} className="text-gray-700" />
                ) : (
                  <Sun size={20} className="text-gray-300" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 md:py-6 pb-16 md:pb-24">{children}</main>

      <footer className="py-4 md:py-6 border-t border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 text-center text-xs md:text-sm text-gray-600 dark:text-gray-400">
          <p>
            © {new Date().getFullYear()} WikiReader - A better way to read
            Wikipedia
          </p>
        </div>
      </footer>

      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default Layout;
