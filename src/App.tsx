import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { SettingsProvider } from './context/SettingsContext';
import Layout from './components/Layout';
import WikiViewer from './components/WikiViewer';

function App() {
  const handleSearch = async (url: string) => {
    if (window.wikiViewerRef?.handleSearch) {
      window.wikiViewerRef.handleSearch(url);
    }
  };

  return (
    <ThemeProvider>
      <SettingsProvider>
        <Layout onSearch={handleSearch}>
          <WikiViewer />
        </Layout>
      </SettingsProvider>
    </ThemeProvider>
  );
}

export default App;