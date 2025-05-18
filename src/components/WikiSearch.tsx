import React, { useState } from 'react';
import { Search } from 'lucide-react';

interface WikiSearchProps {
  onSearch: (url: string) => void;
}

const WikiSearch: React.FC<WikiSearchProps> = ({ onSearch }) => {
  const [searchValue, setSearchValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (searchValue.trim()) {
      // If it's a URL, use it directly
      let url = searchValue.trim();
      
      if (!url.startsWith('http')) {
        // Otherwise, treat it as an article name
        url = `https://en.wikipedia.org/wiki/${encodeURIComponent(url)}`;
      }
      
      onSearch(url);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full">
      <div className="relative flex-1">
        <input
          type="text"
          className="w-full py-2 px-4 pr-10 rounded-l-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter Wikipedia URL or article name"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
      </div>
      <button
        type="submit"
        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-r-md flex items-center justify-center transition-colors"
        aria-label="Search Wikipedia"
      >
        <Search size={20} />
      </button>
    </form>
  );
};

export default WikiSearch;