import React from 'react';
import { List } from 'lucide-react';

interface Section {
  id: string;
  title: string;
  level: number;
}

interface TableOfContentsProps {
  sections: Section[];
  activeSection: string;
}

const TableOfContents: React.FC<TableOfContentsProps> = ({ sections, activeSection }) => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="text-sm">
      <div className="mb-4 flex items-center gap-2 text-gray-900 dark:text-white font-medium">
        <List size={16} />
        <span>Table of Contents</span>
      </div>
      <nav>
        <ul className="space-y-1">
          {sections.map((section) => {
            // Calculate indentation based on heading level
            const indentClass = `pl-${(section.level - 1) * 4}`;
            
            return (
              <li key={section.id} className={indentClass}>
                <a
                  href={`#${section.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection(section.id);
                  }}
                  className={`block py-1 transition-colors duration-200 hover:text-blue-600 dark:hover:text-blue-400 
                    ${
                      activeSection === section.id
                        ? 'text-blue-600 dark:text-blue-400 font-medium'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                >
                  {section.title}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

export default TableOfContents;