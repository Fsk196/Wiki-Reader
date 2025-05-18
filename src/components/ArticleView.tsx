import React, { useState, useEffect, useRef } from "react";
import TableOfContents from "./TableOfContents";
import ReadingProgress from "./ReadingProgress";
import { sanitizeHtml } from "../utils/sanitizer";
import { useSettings } from "../context/SettingsContext";
import { ChevronDown, ChevronUp } from "lucide-react";
import ImageViewer from "./ImageViewer";
import MobileTableOfContents from "./MobileTableOfContents";

interface ArticleViewProps {
  article: {
    title: string;
    extract: string;
    content: string;
    sections: Array<{
      id: string;
      title: string;
      level: number;
    }>;
    url: string;
  };
  onNavigate?: (articleTitle: string) => void; // Add this prop
}

const ArticleView: React.FC<ArticleViewProps> = ({ article, onNavigate }) => {
  const [activeSection, setActiveSection] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);
  const { settings } = useSettings();
  const [canGoBack, setCanGoBack] = useState(false);
  const [articleHistory, setArticleHistory] = useState<string[]>([]);

  // Initialize all tables as initially shown (we'll reverse this logic)
  const [openTables, setOpenTables] = useState<Set<string>>(new Set());

  const [imageModal, setImageModal] = useState({
    isOpen: false,
    src: "",
    alt: "",
  });

  // Add a state to track refresh attempts
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Track headings in the document
  const [tableOfContents, setTableOfContents] = useState<
    Array<{ id: string; title: string; level: number }>
  >([]);
  const [currentSection, setCurrentSection] = useState<string>("");

  const toggleTable = (tableId: string) => {
    setOpenTables((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(tableId)) {
        newSet.delete(tableId);
      } else {
        newSet.add(tableId);
      }
      return newSet;
    });
  };

  const handleImageRefresh = (imageId: string) => {
    if (contentRef.current) {
      const img = contentRef.current.querySelector(
        `img[data-image-id="${imageId}"]`
      );
      if (img) {
        // Add cache-busting parameter
        const src = img.getAttribute("src") || "";
        const timestampParam = `cache=${Date.now()}`;
        const newSrc = src.includes("?")
          ? `${src}&${timestampParam}`
          : `${src}?${timestampParam}`;

        // Update the image source
        img.setAttribute("src", newSrc);

        // Force a re-render by updating the refresh counter
        setRefreshCounter((prev) => prev + 1);
      }
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-100px 0px -80% 0px",
        threshold: 0,
      }
    );

    if (contentRef.current) {
      const headings =
        contentRef.current.querySelectorAll("h2, h3, h4, h5, h6");
      headings.forEach((heading) => {
        if (heading.id) {
          observer.observe(heading);
        }
      });
    }

    return () => observer.disconnect();
  }, [article]);

  useEffect(() => {
    const handleImageRefreshClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const refreshButton = target.closest('[data-refresh-image="true"]');

      if (refreshButton) {
        e.preventDefault();
        e.stopPropagation();

        const imageId = refreshButton.getAttribute("data-target-id");
        if (imageId) {
          handleImageRefresh(imageId);
        }

        // This is handled by the script we injected in sanitizeHtml
        // but we need to prevent the modal from opening
        console.log("Refresh button clicked");
      }
    };

    document.addEventListener("click", handleImageRefreshClick);

    return () => {
      document.removeEventListener("click", handleImageRefreshClick);
    };
  }, []);

  useEffect(() => {
    // Handle image clicks for modal
    const handleImageClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Don't open modal if refresh button was clicked
      if (target.closest('[data-refresh-image="true"]')) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      // Handle linked images specially
      const imageLink = target.closest('[data-image-link="true"]');
      if (imageLink) {
        e.preventDefault();
        e.stopPropagation();

        // Find the image inside the link
        const img = imageLink.querySelector("img");

        // Only open modal if the image loaded successfully
        if (img && img.getAttribute("data-can-modal") === "true") {
          setImageModal({
            isOpen: true,
            src: img.getAttribute("src") || "",
            alt: img.getAttribute("alt") || "Image",
          });
        }
        return;
      }

      // Check if we clicked on an image wrapper that can show modal
      const imageWrapper = target.closest('[data-image-modal="true"]');
      if (imageWrapper) {
        const img = imageWrapper.querySelector("img");

        if (img && img.getAttribute("data-can-modal") === "true") {
          e.preventDefault();
          setImageModal({
            isOpen: true,
            src: img.getAttribute("src") || "",
            alt: img.getAttribute("alt") || "Image",
          });
        }
      }
    };

    document.addEventListener("click", handleImageClick);

    return () => {
      document.removeEventListener("click", handleImageClick);
    };
  }, []);

  useEffect(() => {
    // Handle internal Wikipedia links
    const handleWikiLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('[data-wiki-link="true"]');

      if (link instanceof HTMLAnchorElement) {
        e.preventDefault();
        e.stopPropagation();

        // Get the article title
        const articleTitle = link.getAttribute("data-article-title");

        if (articleTitle) {
          console.log("Navigating to article:", articleTitle); // Add debug logging
          navigateToArticle(articleTitle);
        } else {
          console.warn("No article title found for link:", link); // Debug missing titles
        }
      }
    };

    document.addEventListener("click", handleWikiLinkClick);

    return () => {
      document.removeEventListener("click", handleWikiLinkClick);
    };
  }, []);

  useEffect(() => {
    // When an article loads, check if we need to update our history
    const storedHistory = sessionStorage.getItem("articleHistory");
    if (storedHistory) {
      try {
        const history = JSON.parse(storedHistory);

        if (Array.isArray(history)) {
          // If history is empty or corrupt, start fresh
          if (history.length === 0) {
            const newHistory = [article.title];
            sessionStorage.setItem(
              "articleHistory",
              JSON.stringify(newHistory)
            );
            setArticleHistory(newHistory);
            setCanGoBack(false);
            return;
          }

          // Check if this is a new navigation or returning to an existing article
          if (history[history.length - 1] !== article.title) {
            // It's a new article - add it to history
            const newHistory = [...history, article.title];
            sessionStorage.setItem(
              "articleHistory",
              JSON.stringify(newHistory)
            );
            setArticleHistory(newHistory);

            // We can go back if we have more than one item
            setCanGoBack(true);
          } else {
            // Same article as before - don't change history, just update state
            setArticleHistory(history);

            // Only enable back if we have somewhere to go back to
            setCanGoBack(history.length > 1);
          }

          console.log("Navigation history:", {
            canGoBack: history.length > 1,
            historyLength: history.length,
            currentArticle: article.title,
            history: history,
          });
        }
      } catch (e) {
        console.error("Error parsing article history:", e);
        resetHistory();
      }
    } else {
      resetHistory();
    }

    // Helper function to reset history when needed
    function resetHistory() {
      const initialHistory = [article.title];
      sessionStorage.setItem("articleHistory", JSON.stringify(initialHistory));
      setArticleHistory(initialHistory);
      setCanGoBack(false);

      console.log("Reset navigation history:", {
        canGoBack: false,
        historyLength: 1,
        currentArticle: article.title,
        history: initialHistory,
      });
    }
  }, [article.title]);

  // Add this useEffect to handle table toggle events
  useEffect(() => {
    const handleTableToggle = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.tableId) {
        toggleTable(customEvent.detail.tableId);
      }
    };

    document.addEventListener(
      "toggleTable",
      handleTableToggle as EventListener
    );

    return () => {
      document.removeEventListener(
        "toggleTable",
        handleTableToggle as EventListener
      );
    };
  }, []);

  const closeImageModal = () => {
    setImageModal({ isOpen: false, src: "", alt: "" });
    document.body.style.overflow = "";
  };

  const navigateToArticle = (articleTitle: string) => {
    if (onNavigate) {
      // Only update history if we're navigating to a new article
      if (article.title !== articleTitle) {
        setArticleHistory((prev) => {
          // Make sure we don't duplicate the current article
          const currentArticleIndex = prev.indexOf(articleTitle);

          let newHistory;
          if (currentArticleIndex >= 0) {
            // If we're navigating to an article that's already in history,
            // remove everything after it to create a new branch
            newHistory = prev.slice(0, currentArticleIndex + 1);
          } else {
            // Add the new article to history
            newHistory = [...prev, articleTitle];
          }

          sessionStorage.setItem("articleHistory", JSON.stringify(newHistory));
          return newHistory;
        });

        // Navigate to the new article
        onNavigate(articleTitle);
      }
    }
  };

  const handleGoBack = () => {
    if (articleHistory.length > 1) {
      // Need at least 2 items to go back
      const newHistory = [...articleHistory];
      newHistory.pop(); // Remove current article
      const previousArticle = newHistory[newHistory.length - 1]; // Get the previous article

      // Save the updated history
      sessionStorage.setItem("articleHistory", JSON.stringify(newHistory));
      setArticleHistory(newHistory);

      // Can only go back if we have more than one item in history after going back
      setCanGoBack(newHistory.length > 1);

      // Navigate to the previous article
      if (previousArticle && onNavigate) {
        onNavigate(previousArticle);
      }
    }
  };

  // Extract headings for table of contents
  useEffect(() => {
    if (contentRef.current) {
      // Wait a bit for content to be fully rendered
      setTimeout(() => {
        const headings = contentRef.current?.querySelectorAll(
          "h1, h2, h3, h4, h5, h6"
        );
        const toc = Array.from(headings || []).map((heading) => ({
          id: heading.id,
          title: heading.textContent || "",
          level: parseInt(heading.tagName.substring(1)) - 1,
        }));

        setTableOfContents(toc);
      }, 300);
    }
  }, [article]);

  // Track current section on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current && tableOfContents.length > 0) {
        // Get all headings
        const headingElements = Array.from(
          contentRef.current.querySelectorAll("h1, h2, h3, h4, h5, h6")
        );

        // Find the one closest to the top of the viewport
        let current = "";
        for (const heading of headingElements) {
          const rect = heading.getBoundingClientRect();
          if (rect.top <= 100) {
            current = heading.id;
          } else {
            break;
          }
        }

        if (current) {
          setCurrentSection(current);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Call once to set initial state

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [tableOfContents]);

  // Scroll to section when selected from TOC
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Apply reading settings
  const fontSizeClass = {
    small: "prose-sm",
    medium: "prose-base",
    large: "prose-lg",
  }[settings.fontSize];

  const fontFamilyClass = {
    inter: "font-sans",
    georgia: "font-serif",
    system: "font-system",
  }[settings.fontFamily];

  const lineHeightClass = {
    normal: "leading-normal",
    relaxed: "leading-relaxed",
    loose: "leading-loose",
  }[settings.lineHeight];

  // Add these styles to make the refresh button more visible
  const additionalStyles = document.createElement("style");
  additionalStyles.textContent = `
    .image-wrapper {
      position: relative;
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 8px;
      max-width: 100%;
      margin: 1rem 0;
    }
    
    .image-container {
      position: relative;
      flex: 1;
      max-width: 100%;
    }
    
    .image-wrapper img[data-can-modal="false"] {
      min-height: 100px;
      background-color: #f3f4f6;
      border: 1px dashed #d1d5db;
    }
    
    [data-refresh-image] {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      flex-shrink: 0;
      background-color: #f3f4f6;
      border: 1px solid #e2e8f0;
      color: #4b5563;
      border-radius: 4px;
      cursor: pointer;
      z-index: 10;
      transition: all 0.2s ease;
    }
    
    .dark [data-refresh-image] {
      background-color: #374151;
      border-color: #4b5563;
      color: #e5e7eb;
    }
    
    [data-refresh-image]:hover {
      background-color: #e5e7eb;
    }
    
    .dark [data-refresh-image]:hover {
      background-color: #4b5563;
    }
    
    [data-refresh-image].opacity-0 {
      display: none;
    }
    
    [data-refresh-image].opacity-100 {
      display: flex;
    }
    
    /* Make sure the image container takes the full available width */
    .image-container img {
      max-width: 100%;
      height: auto;
      display: block;
    }
    
    /* Ensure modal cursor only appears on images that can be expanded */
    [data-image-modal="true"] img {
      cursor: zoom-in;
    }
  `;
  document.head.appendChild(additionalStyles);

  return (
    <>
      <div className="relative max-w-7xl mx-auto">
        <ReadingProgress />

        <div className="lg:flex">
          <aside className="lg:w-64 lg:shrink-0 pr-8 hidden lg:block sticky top-24 self-start">
            <TableOfContents
              sections={article.sections}
              activeSection={activeSection}
            />
          </aside>

          <article
            className={`lg:flex-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 border border-gray-200 dark:border-gray-700 ${fontFamilyClass}`}
          >
            {/* Position back button in the main content area */}
            {canGoBack && articleHistory.length > 1 && (
              <button
                onClick={handleGoBack}
                className="mb-6 inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                aria-label="Back to previous article"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
                Back to previous article
              </button>
            )}

            <header className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {article.title}
              </h1>
              <div className="text-gray-700 dark:text-gray-300 italic">
                {article.extract}
              </div>
            </header>

            <div
              ref={contentRef}
              className={`prose ${fontSizeClass} dark:prose-invert max-w-none ${lineHeightClass}
            prose-headings:scroll-mt-24
            prose-a:text-blue-600 dark:prose-a:text-blue-400
            prose-img:rounded-lg prose-img:mx-auto
            prose-hr:my-8
            prose-p:text-gray-800 dark:prose-p:text-gray-200
            prose-headings:text-gray-900 dark:prose-headings:text-white`}
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(
                  article.content,
                  openTables,
                  toggleTable,
                  handleImageRefresh
                ),
              }}
            />

            <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
              <p>
                This content is an enhanced version of the original article on
                Wikipedia.
              </p>
              <p className="mt-2">
                <a
                  href={article.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View original article
                </a>
              </p>
            </div>
          </article>
        </div>
      </div>

      {/* Add Mobile TOC - only visible on small screens */}
      <div className="sm:hidden">
        <MobileTableOfContents
          tableOfContents={tableOfContents}
          currentSection={currentSection}
          onSelectSection={scrollToSection}
        />
      </div>

      <ImageViewer
        src={imageModal.src}
        alt={imageModal.alt}
        isOpen={imageModal.isOpen}
        onClose={closeImageModal}
      />
    </>
  );
};

export default ArticleView;
