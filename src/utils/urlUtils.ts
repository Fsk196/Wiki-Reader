/**
 * Extracts the page title from a Wikipedia URL
 */
export const extractPageTitle = (url: string): string | null => {
  try {
    // Validate that this is a Wikipedia URL
    if (!isWikipediaUrl(url)) {
      return null;
    }
    
    // Parse the URL
    const parsedUrl = new URL(url);
    
    // Extract the page title from the pathname
    const pathParts = parsedUrl.pathname.split('/');
    
    // Wikipedia URLs typically have the format /wiki/Page_Title
    // or /w/index.php?title=Page_Title
    if (pathParts[1] === 'wiki' && pathParts.length > 2) {
      return decodeURIComponent(pathParts[2]);
    } else if (parsedUrl.pathname.includes('/w/index.php')) {
      return parsedUrl.searchParams.get('title');
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing Wikipedia URL:', error);
    return null;
  }
};

/**
 * Checks if a URL is a valid Wikipedia URL
 */
export const isWikipediaUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname.endsWith('wikipedia.org') && 
           (parsedUrl.pathname.startsWith('/wiki/') || 
            parsedUrl.pathname.includes('/w/index.php'));
  } catch (error) {
    return false;
  }
};

/**
 * Parses a Wikipedia URL to extract language, title, and other components
 */
export const parseWikiUrl = (url: string) => {
  try {
    const parsedUrl = new URL(url);
    
    // Extract language code from hostname (e.g., en.wikipedia.org -> en)
    const hostnameParts = parsedUrl.hostname.split('.');
    const langCode = hostnameParts[0] !== 'www' ? hostnameParts[0] : 'en';
    
    // Extract page title
    const title = extractPageTitle(url);
    
    return {
      langCode,
      title,
      isValid: !!title,
      originalUrl: url
    };
  } catch (error) {
    return {
      langCode: null,
      title: null,
      isValid: false,
      originalUrl: url
    };
  }
};