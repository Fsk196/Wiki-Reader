// Add this component to your project:
// filepath: c:\React\project\src\components\MobileTableOfContents.tsx

import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

interface MobileTableOfContentsProps {
  tableOfContents: {
    id: string;
    title: string;
    level: number;
  }[];
  currentSection?: string;
  onSelectSection: (id: string) => void;
}

const MobileTableOfContents: React.FC<MobileTableOfContentsProps> = ({ 
  tableOfContents, 
  currentSection,
  onSelectSection
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [hideTimeout, setHideTimeout] = useState<NodeJS.Timeout | null>(null);

  // Handle scroll events
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let scrollingTimer: NodeJS.Timeout | null = null;
    
    const handleScroll = () => {
      setIsVisible(true);
      
      // Clear existing hide timeout
      if (hideTimeout) {
        clearTimeout(hideTimeout);
      }
      
      // Clear existing scroll timeout
      if (scrollingTimer) {
        clearTimeout(scrollingTimer);
      }
      
      // Set new timeout to hide the button after 4 seconds of no scrolling
      const newTimeout = setTimeout(() => {
        if (!isOpen) {
          setIsVisible(false);
        }
      }, 4000);
      
      setHideTimeout(newTimeout);
      lastScrollY = window.scrollY;
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (hideTimeout) {
        clearTimeout(hideTimeout);
      }
      if (scrollingTimer) {
        clearTimeout(scrollingTimer);
      }
    };
  }, [hideTimeout, isOpen]);

  // Handle clicking outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (isOpen && !target.closest('.mobile-toc')) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close ToC when a section is selected
  const handleSectionClick = (id: string) => {
    onSelectSection(id);
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-40 p-3 bg-white dark:bg-gray-800 shadow-lg rounded-full transition-all duration-300 transform ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
        aria-label="Show table of contents"
      >
        <Menu size={24} className="text-gray-700 dark:text-gray-200" />
      </button>

      {isOpen && (
        <div className="mobile-toc fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-t-xl sm:rounded-xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Table of Contents
              </h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X size={20} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            
            <div className="overflow-y-auto p-4 flex-1">
              <ul className="space-y-2">
                {tableOfContents.map((section) => (
                  <li key={section.id}>
                    <button
                      onClick={() => handleSectionClick(section.id)}
                      className={`text-left w-full px-3 py-2 rounded-md transition-colors ${
                        currentSection === section.id
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                      }`}
                      style={{ paddingLeft: `${section.level * 0.75}rem` }}
                    >
                      {section.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileTableOfContents;