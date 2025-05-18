import React from 'react';
import { X } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings } = useSettings();

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <div 
        className={`absolute right-0 top-0 bottom-0 w-full sm:w-96 bg-white dark:bg-gray-800 shadow-xl p-6 transform transition-transform ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Close settings"
          >
            <X size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Font Size
            </label>
            <select
              value={settings.fontSize}
              onChange={(e) => updateSettings({ fontSize: e.target.value as any })}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 
                       text-gray-900 dark:text-gray-100 px-3 py-2"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Font Family
            </label>
            <select
              value={settings.fontFamily}
              onChange={(e) => updateSettings({ fontFamily: e.target.value as any })}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 
                       text-gray-900 dark:text-gray-100 px-3 py-2"
            >
              <option value="inter">Inter</option>
              <option value="georgia">Georgia</option>
              <option value="system">System Font</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Line Height
            </label>
            <select
              value={settings.lineHeight}
              onChange={(e) => updateSettings({ lineHeight: e.target.value as any })}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 
                       text-gray-900 dark:text-gray-100 px-3 py-2"
            >
              <option value="normal">Normal</option>
              <option value="relaxed">Relaxed</option>
              <option value="loose">Loose</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel