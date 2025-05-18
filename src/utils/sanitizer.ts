/**
 * Sanitizes HTML content from Wikipedia to:
 * 1. Remove unnecessary elements
 * 2. Fix relative URLs for images and links
 * 3. Improve formatting for our custom UI
 */
export function sanitizeHtml(
  html: string,
  openTables?: Set<string>, // This now tracks tables that should be open
  toggleTable?: (id: string) => void,
  onRefreshImage?: (imageId: string) => void
): string {
  console.log("sanitizeHtml called with:", {
    htmlLength: html?.length,
    openTables: openTables ? `Set(${openTables.size})` : "undefined",
    hasToggleTable: typeof toggleTable === "function",
  });

  // Create a new DOM parser to safely parse the HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // Ensure openTables is defined
  const safeOpenTables = openTables || new Set<string>();

  // Use a safe version of toggleTable
  const safeToggleTable = toggleTable || ((id: string) => {});

  // Process the document

  // 1. Remove edit links, citation needed markers, etc.
  const editElements = doc.querySelectorAll(".mw-editsection, .noprint");
  editElements.forEach((el) => el.remove());

  // Update the image handling section

  // 2. Fix image URLs and add click handlers for image modal
  const images = doc.querySelectorAll("img");
  images.forEach((img, index) => {
    // Generate a unique ID for tracking image state
    const imageId = `img-${index}-${Date.now().toString(36).slice(-6)}`;
    img.setAttribute("data-image-id", imageId);

    // Some Wikipedia images are broken or have strange src attributes
    const originalSrc = img.getAttribute("src") || "";
    img.setAttribute("data-original-src", originalSrc);

    // Fix Wikipedia image URLs
    let fixedSrc = originalSrc;
    if (originalSrc.startsWith("/")) {
      fixedSrc = `https://en.wikipedia.org${originalSrc}`;
    } else if (originalSrc.startsWith("./")) {
      fixedSrc = `https://en.wikipedia.org/wiki/${originalSrc.substring(2)}`;
    } else if (!originalSrc.startsWith("http")) {
      fixedSrc = `https://en.wikipedia.org${
        originalSrc.startsWith("/") ? "" : "/"
      }${originalSrc}`;
    }

    img.setAttribute("src", fixedSrc);

    // Handle parent anchor tags
    const parentAnchor = img.closest("a");
    if (parentAnchor) {
      parentAnchor.setAttribute("data-image-link", "true");
      parentAnchor.setAttribute(
        "data-original-href",
        parentAnchor.getAttribute("href") || ""
      );
      parentAnchor.setAttribute("href", "javascript:void(0)");
      parentAnchor.removeAttribute("data-wiki-link");
    }

    // Create wrapper structure - IMPORTANT: Use flex container to position button to the side
    const imageWrapper = doc.createElement("div");
    imageWrapper.className = "image-wrapper"; // This will be styled as flex container

    // Create inner container for image
    const imageContainer = doc.createElement("div");
    imageContainer.className = "image-container";

    // Create refresh button
    const refreshButton = doc.createElement("button");
    refreshButton.className = "opacity-0";
    refreshButton.setAttribute("data-refresh-image", "true");
    refreshButton.setAttribute("data-target-id", imageId);
    refreshButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 2v6h-6"></path>
        <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
        <path d="M3 22v-6h6"></path>
        <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
      </svg>
    `;

    // Replace the image with our new structure
    const parent = img.parentNode;
    if (parent) {
      parent.replaceChild(imageWrapper, img);
      imageContainer.appendChild(img);
      imageWrapper.appendChild(imageContainer);
      imageWrapper.appendChild(refreshButton);

      // Set initial state
      img.setAttribute("data-can-modal", "false");
    }
  });

  // Replace the image styles with this updated version:
  const imageStyles = doc.createElement("style");
  imageStyles.textContent = `
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
    
    .image-container img {
      max-width: 100%;
      height: auto;
      display: block;
      border-radius: 0.375rem;
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
    
    /* Ensure modal cursor only appears on images that can be expanded */
    [data-image-modal="true"] img {
      cursor: zoom-in;
    }
  `;
  doc.head.appendChild(imageStyles);

  // 3. Fix anchor links
  const links = doc.querySelectorAll("a");
  links.forEach((link) => {
    const href = link.getAttribute("href");
    if (href) {
      // Handle specific link types with colons that should still be internal
      if (href.includes(":")) {
        const colonIndex = href.indexOf(":");
        const prefix = href.substring(0, colonIndex).toLowerCase();

        // Check if it's one of these special types to be treated as external
        const externalPrefixes = [
          "file",
          "category",
          "image",
          "special",
          "help",
          "template",
          "wikipedia",
        ];

        if (externalPrefixes.includes(prefix)) {
          // It's a special link type - make it external
          link.setAttribute("href", `https://en.wikipedia.org/wiki/${href}`);
          link.setAttribute("target", "_blank");
          link.setAttribute("rel", "noopener noreferrer");
          return; // Skip the rest of processing for this link
        }
      }

      // First, store the original href for debugging and reference
      link.setAttribute("data-original-href", href);

      if (href.startsWith("#")) {
        // Internal section link - keep as is
      } else if (href.startsWith("/wiki/")) {
        // Direct Wikipedia article link (most common case)
        const articleTitle = href.substring(6); // Remove /wiki/
        link.setAttribute("data-wiki-link", "true");
        link.setAttribute("data-article-title", articleTitle);
        link.setAttribute("href", `/wiki/${articleTitle}`);
        link.removeAttribute("target"); // Allow internal navigation

        // Add a visual indicator that this is a wiki link
        link.classList.add("wiki-internal-link");
      } else if (href.startsWith("./")) {
        // Relative wiki path
        const articleTitle = href.substring(2); // Remove ./
        link.setAttribute("data-wiki-link", "true");
        link.setAttribute("data-article-title", articleTitle);
        link.setAttribute("href", `/wiki/${articleTitle}`);
        link.removeAttribute("target");
        link.classList.add("wiki-internal-link");
      } else if (href.startsWith("/")) {
        // Other Wikipedia internal paths
        if (href.includes(":")) {
          // Special pages, files, categories, etc.
          link.setAttribute("href", `https://en.wikipedia.org${href}`);
          link.setAttribute("target", "_blank");
          link.setAttribute("rel", "noopener noreferrer");
        } else {
          // Assume it's a wiki article path
          const articleTitle = href.substring(1); // Remove leading /
          link.setAttribute("data-wiki-link", "true");
          link.setAttribute("data-article-title", articleTitle);
          link.setAttribute("href", `/wiki/${articleTitle}`);
          link.removeAttribute("target");
          link.classList.add("wiki-internal-link");
        }
      } else if (!href.startsWith("http")) {
        // Non-absolute links that don't start with / are typically wiki links too
        if (href.includes(":")) {
          // Special page links - make them external
          link.setAttribute("href", `https://en.wikipedia.org/wiki/${href}`);
          link.setAttribute("target", "_blank");
          link.setAttribute("rel", "noopener noreferrer");
        } else {
          // Likely an article link
          link.setAttribute("data-wiki-link", "true");
          link.setAttribute("data-article-title", href);
          link.setAttribute("href", `/wiki/${href}`);
          link.removeAttribute("target");
          link.classList.add("wiki-internal-link");
        }
      } else {
        // External links - open in new tab
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener noreferrer");
      }
    }
  });

  // Add custom styling for wiki links
  const linkStyles = doc.createElement("style");
  linkStyles.textContent = `
    .wiki-internal-link {
      color: #0366d6;
      position: relative;
    }
    
    .wiki-internal-link:after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      width: 100%;
      height: 1px;
      background-color: currentColor;
      transform: scaleX(0);
      transition: transform 0.2s;
      transform-origin: right;
    }
    
    .wiki-internal-link:hover:after {
      transform: scaleX(1);
      transform-origin: left;
    }
    
    .dark .wiki-internal-link {
      color: #58a6ff;
    }
  `;
  doc.head.appendChild(linkStyles);

  // 4. Ensure heading IDs are preserved for navigation
  const headings = doc.querySelectorAll("h1, h2, h3, h4, h5, h6");
  headings.forEach((heading) => {
    if (!heading.id) {
      const headingText = heading.textContent || "";
      heading.id = headingText
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }
  });

  // 5. Process tables to make them collapsible
  const tables = doc.querySelectorAll("table");

  // Create a set to track table IDs that should be displayed
  const safeCollapsedTables = openTables || new Set();

  // Add styles for tables with transitions
  const tableStyles = doc.createElement("style");
  tableStyles.textContent = `
  .collapsible-table-wrapper {
    margin: 1.5rem 0;
    border-radius: 0.75rem;
    overflow: hidden;
    background-color: white;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    transition: all 0.2s ease;
    border: 1px solid #e2e8f0;
  }
  
  .dark .collapsible-table-wrapper {
    background-color: #1e293b;
    border-color: #334155;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }
  
  .collapsible-table-wrapper:hover {
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
  }
  
  .dark .collapsible-table-wrapper:hover {
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
  }
  
  /* Tab-style header */
  .collapsible-table-header {
    position: relative;
    padding: 0.75rem 1.25rem;
    background-color: #f8fafc;
    border-bottom: 1px solid #000000;
    cursor: pointer;
    user-select: none;
    transition: background-color 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  .collapsible-table-header:hover {
    background-color: #f1f5f9;
  }
  
  .dark .collapsible-table-header {
    background-color: #1e293b;
    border-color: #334155;
  }
  
  .dark .collapsible-table-header:hover {
    background-color: #263449;
  }
  
  /* Tab label styling */
  .collapsible-table-tab {
    display: flex;
    align-items: center;
    font-weight: 600;
    color: #111827;
    font-size: 0.95rem;
  }
  
  .dark .collapsible-table-tab {
    color: #f3f4f6;
  }
  
  /* Toggle icon button */
  .collapsible-table-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background-color: #e2e8f0;
    transition: all 0.15s ease;
    color: #475569;
    margin-left: 12px;
    flex-shrink: 0;
  }
  
  .collapsible-table-header:hover .collapsible-table-toggle {
    background-color: #cbd5e1;
  }
  
  .dark .collapsible-table-toggle {
    background-color: #334155;
    color: #cbd5e1;
  }
  
  .dark .collapsible-table-header:hover .collapsible-table-toggle {
    background-color: #475569;
  }
  

  .collapse-table-svg {
    width: 16px !important;
    height: 16px !important;
    min-width: 16px;
    min-height: 16px;
    display: block;
    transition: transform 0.2s ease;
    }
  
  .collapsible-table-toggle.closed .collapse-table-svg {
    transform: rotate(180deg);
  }
  
  /* Table content container */
  .collapsible-table-content {
    max-height: 2000px;
    transition: max-height 0.3s ease-out, opacity 0.3s ease;
    overflow: hidden;
    opacity: 1;
    
  }
  
  .collapsible-table-content.hidden {
    max-height: 0;
    opacity: 0;
    transition: max-height 0.2s ease-in, opacity 0.2s ease;
  }
  
  /* Table styling */
  .collapsible-table-content table {
    width: 100%;
    margin: 0 !important;
    border-collapse: collapse;
    
  }
  
  .collapsible-table-content table th {
    background-color: #f8fafc;
    font-weight: 600;
    text-align: left;
    padding: 0.75rem 1rem;
    border: 1px solid #e2e8f0;
  }
  
  .dark .collapsible-table-content table th {
    background-color: #1e293b;
    border-color: #334155;
    color: #f3f4f6;
  }
  
  .collapsible-table-content table td {
    padding: 0.75rem 1rem;
    border: 1px solid #e2e8f0;
    vertical-align: top;
  }
  
  .collapsible-table-content table tr:nth-child(even) td {
    background-color: #f9fafb;
  }
  
  .dark .collapsible-table-content table tr:nth-child(even) td {
    background-color: #1f2937;
  }
  
  .dark .collapsible-table-content table td {
    border-color: #334155;
    color: #f3f4f6;
  }
`;
  doc.head.appendChild(tableStyles);

  for (let i = 0; i < tables.length; i++) {
    const table = tables[i];

    // Skip tables that shouldn't be collapsed (like navigation tables)
    if (
      table.classList.contains("infobox") ||
      table.classList.contains("vertical-navbox") ||
      table.classList.contains("navbox") ||
      table.classList.contains("sidebar") ||
      table.classList.contains("metadata")
    ) {
      continue;
    }

    // Generate a unique ID for the table if it doesn't have one
    const tableId =
      table.id || `table-${i}-${Date.now().toString(36).slice(-4)}`;
    table.id = tableId;

    // Check if table should be initially open based on openTables
    const isOpen = safeCollapsedTables.has(tableId) || false;

    // Create a new wrapper for the table
    const wrapper = doc.createElement("div");
    wrapper.className = "collapsible-table-wrapper";
    wrapper.id = `wrapper-${tableId}`;

    // Create tab-style header
    const header = doc.createElement("div");
    header.className = "collapsible-table-header";
    header.setAttribute("data-table-id", tableId);

    // Check if table has a caption to use as title
    const caption = table.querySelector("caption");
    let titleText = "Table";

    if (caption) {
      titleText = caption.textContent || "Table";
      // Remove the caption from the table since we're adding it to the header
      if (caption.parentNode) {
        caption.parentNode.removeChild(caption);
      }
    }

    // Create the tab label
    const tabLabel = doc.createElement("div");
    tabLabel.className = "collapsible-table-tab";

    // Create toggle button with improved styling
    const toggleBtn = doc.createElement("div");
    toggleBtn.className = `collapsible-table-toggle ${isOpen ? "" : "closed"}`;
    toggleBtn.setAttribute("aria-label", "Toggle table");
    toggleBtn.innerHTML = `<div style="display: flex; align-items: center; justify-content: space-between; background-color: #f5f5f5; width: 100%; height: 60px; border-radius: 5px; padding: 10px; border: 1px solid #e5e7eb;">
    <h2 style="
    color: #303030; margin: 0px; font-size: 18px; font-weight: 400;
    ">${titleText}</h2>
    
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 20 20" fill="currentColor" class="collapse-table-svg">
    <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
    </svg>
    </div>
`;
    header.appendChild(toggleBtn);

    // Add the header to the wrapper
    wrapper.appendChild(header);

    // Create content container
    const content = doc.createElement("div");
    content.className = `collapsible-table-content ${isOpen ? "" : "hidden"}`;

    // Copy the table into the content container
    content.appendChild(table.cloneNode(true));

    // Add the content to the wrapper
    wrapper.appendChild(content);

    // Replace the original table with our new wrapper
    if (table.parentNode) {
      table.parentNode.replaceChild(wrapper, table);
    }

    // Add click event handler to toggle visibility
    header.setAttribute(
      "onClick",
      `
    (function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      const tableId = this.getAttribute('data-table-id');
      const wrapper = document.getElementById('wrapper-' + tableId);
      const content = wrapper.querySelector('.collapsible-table-content');
      const toggle = wrapper.querySelector('.collapsible-table-toggle');
      const tabLabel = wrapper.querySelector('.collapsible-table-tab');
      
      // Toggle visibility
      const isCurrentlyOpen = !content.classList.contains('hidden');
      content.classList.toggle('hidden');
      toggle.classList.toggle('closed');
      
      // Update tab label text
      const titleText = tabLabel.textContent.split(' (click')[0];
      tabLabel.textContent = titleText + ' (click to ' + (isCurrentlyOpen ? 'expand' : 'collapse') + ')';
      
      // Dispatch event to React
      const event = new CustomEvent('toggleTable', {
        bubbles: true,
        detail: { tableId }
      });
      document.dispatchEvent(event);
    }).call(this, event);
    `
    );
  }

  // Return the sanitized and processed HTML
  return doc.body.innerHTML;
}
