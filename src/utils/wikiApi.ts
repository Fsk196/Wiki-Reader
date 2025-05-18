import { parseWikiUrl, extractPageTitle } from './urlUtils';

// Type definitions
interface WikiPageData {
  title: string;
  extract: string;
  content: string;
  sections: Array<{
    id: string;
    title: string;
    level: number;
  }>;
  url: string;
}

/**
 * Fetches Wikipedia content based on a Wikipedia URL
 */
export const fetchWikiContent = async (url: string): Promise<WikiPageData> => {
  try {
    // Extract page title and validate URL
    const pageTitle = extractPageTitle(url);
    
    if (!pageTitle) {
      throw new Error('Invalid Wikipedia URL. Please enter a valid Wikipedia article URL.');
    }

    // Use Wikipedia's API to fetch the content
    const apiUrl = `https://en.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(pageTitle)}`;
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch article: ${response.statusText}`);
    }

    // Get the HTML content
    const htmlContent = await response.text();
    
    // Also fetch the summary for the extract
    const summaryResponse = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`
    );
    
    if (!summaryResponse.ok) {
      throw new Error(`Failed to fetch article summary: ${summaryResponse.statusText}`);
    }
    
    const summaryData = await summaryResponse.json();
    
    // Parse the HTML to extract sections for the table of contents
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    
    // Extract headings for table of contents
    const headings = Array.from(doc.querySelectorAll('h2, h3, h4, h5, h6'));
    const sections = headings.map(heading => {
      // Ensure each heading has an ID for linking
      const id = heading.id || `section-${Math.random().toString(36).substr(2, 9)}`;
      if (!heading.id) heading.id = id;
      
      // Determine heading level (h2 = 1, h3 = 2, etc.)
      const level = parseInt(heading.tagName.charAt(1), 10) - 1;
      
      return {
        id,
        title: heading.textContent || '',
        level
      };
    });

    // Prepare final data object
    const wikiData: WikiPageData = {
      title: summaryData.title || pageTitle,
      extract: summaryData.extract || '',
      content: htmlContent,
      sections,
      url: url
    };

    return wikiData;
  } catch (error) {
    console.error('Error fetching Wikipedia content:', error);
    throw error;
  }
};