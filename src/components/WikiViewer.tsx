import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import ArticleView from './ArticleView';
import { fetchWikiContent } from '../utils/wikiApi';

declare global {
  interface Window {
    wikiViewerRef: {
      handleSearch: (url: string) => Promise<void>;
    };
  }
}

const WikiViewer: React.FC = () => {
  const [wikiData, setWikiData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; articleTitle?: string } | null>(null);

  const handleSearch = async (url: string) => {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchWikiContent(url);
      setWikiData(data);
    } catch (err) {
      let articleTitle = '';
      try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');
        articleTitle = pathParts[pathParts.length - 1];
      } catch (e) {
        // URL parsing failed, that's okay
      }

      setError({
        message: err instanceof Error ? err.message : 'Failed to fetch Wikipedia content',
        articleTitle,
      });
      setWikiData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateToArticle = async (articleTitle: string) => {
    try {
      setLoading(true);
      setError(null);

      const formattedTitle = articleTitle.replace(/_/g, ' ');
      const wikiUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(articleTitle)}`;

      const data = await fetchWikiContent(wikiUrl);
      setWikiData(data);

      window.history.pushState(
        { articleTitle: formattedTitle },
        formattedTitle,
        `/wiki/${encodeURIComponent(articleTitle)}`
      );
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : `Failed to load article: ${articleTitle}`,
        articleTitle: articleTitle,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.wikiViewerRef = {
      handleSearch,
    };
    return () => {
      delete window.wikiViewerRef;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw size={24} className="animate-spin text-blue-600 dark:text-blue-400" />
      </div>
    );
  }

  if (error) {
    // Check history length to determine if back button should be shown
    let showBackButton = false;
    try {
      const history = JSON.parse(sessionStorage.getItem('articleHistory') || '[]');
      showBackButton = history.length > 1; // Only show back button if history has more than 1 item
      
      // Log history for debugging but don't show in UI
      console.log("Navigation history:", {
        historyLength: history.length,
        history: history
      });
    } catch (e) {
      console.error('Error parsing article history:', e);
    }
    
    return (
      <div className="max-w-2xl mx-auto p-6 my-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <h3 className="text-lg font-medium text-red-800 dark:text-red-400 mb-2">
          Error Loading Article
        </h3>
        <p className="text-red-700 dark:text-red-400 mb-4">{error.message}</p>
        <div className="flex flex-wrap gap-3 mt-4">
          {/* Only show back button if history length > 1 */}
          {showBackButton && (
            <button
              onClick={() => {
                try {
                  const history = JSON.parse(sessionStorage.getItem('articleHistory') || '[]');
                  if (history.length > 1) {
                    const previousArticle = history[history.length - 2];
                    const newHistory = history.slice(0, -1);
                    sessionStorage.setItem('articleHistory', JSON.stringify(newHistory));
                    handleNavigateToArticle(previousArticle);
                  }
                } catch (e) {
                  console.error('Error parsing article history:', e);
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 flex items-center gap-2"
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
              Back to Previous Article
            </button>
          )}

          {error.articleTitle && (
            <a
              href={`https://en.wikipedia.org/wiki/${encodeURIComponent(error.articleTitle)}`}
              target="_blank"
              rel="noreferrer noopener"
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 flex items-center gap-2"
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
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              View on Wikipedia
            </a>
          )}

          <button
            onClick={() => {
              setError(null);
              setWikiData(null);
            }}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 flex items-center gap-2"
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
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  if (!wikiData) {
    return (
      <div className="max-w-full sm:max-w-2xl mx-auto p-4 sm:p-6 my-4 sm:my-8 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          Welcome to WikiReader
        </h2>
        <p className="text-gray-700 dark:text-gray-300 mb-4 text-sm sm:text-base">
          Enter a Wikipedia URL or article name above to transform it into a clean, modern reading experience.
        </p>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p className="mb-2">Example articles to try:</p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-5 list-disc">
            <li>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigateToArticle('React_(software)');
                }}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                React (software)
              </a>
            </li>
            <li>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigateToArticle('Artificial_intelligence');
                }}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Artificial Intelligence
              </a>
            </li>
            <li>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigateToArticle('Web_development');
                }}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Web Development
              </a>
            </li>
            <li>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigateToArticle('History_of_computing');
                }}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                History of Computing
              </a>
            </li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div>
      {wikiData && <ArticleView article={wikiData} onNavigate={handleNavigateToArticle} />}
    </div>
  );
};

export default WikiViewer;