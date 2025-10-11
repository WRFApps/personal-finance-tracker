
import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AppContext } from '../App.tsx';
import Modal from './ui/Modal.tsx';
import Button from './ui/Button.tsx';
import { SearchResults, SearchResultItem } from '../types.ts';

const GlobalSearchModal: React.FC = () => {
  const context = useContext(AppContext);

  if (!context) return null;
  const { isSearchModalOpen, closeSearchModal, searchResults, searchQuery } = context;

  const hasResults = Object.keys(searchResults).some(key => searchResults[key] && searchResults[key].length > 0);

  const highlightMatch = (text: string, query: string) => {
    if (!query || !text) return text;
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const startIndex = lowerText.indexOf(lowerQuery);
    if (startIndex === -1) return text;
    const endIndex = startIndex + query.length;
    return (
      <>
        {text.substring(0, startIndex)}
        <span className="bg-yellow-200 dark:bg-yellow-600 font-semibold">
          {text.substring(startIndex, endIndex)}
        </span>
        {text.substring(endIndex)}
      </>
    );
  };


  return (
    <Modal
      isOpen={isSearchModalOpen}
      onClose={closeSearchModal}
      title={`Search Results for "${searchQuery}"`}
      size="xl" 
      footer={<Button onClick={closeSearchModal} variant="light">Close</Button>}
    >
      <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-6">
        {!hasResults && (
          <div className="text-center py-10">
            <i className="fas fa-search-minus text-4xl text-gray-400 dark:text-gray-500 mb-3"></i>
            <p className="text-lg text-gray-700 dark:text-gray-300">No results found.</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Try a different search term.</p>
          </div>
        )}

        {/* FIX: Changed from Object.entries to Object.keys to fix typing issues with 'items'. */}
        {Object.keys(searchResults).map((category) => {
          const items = searchResults[category];
          if (!items || items.length === 0) return null;
          return (
            <div key={category}>
              <h3 className="text-xl font-semibold text-primary dark:text-primary-light mb-3 pb-1 border-b border-gray-200 dark:border-gray-700">
                {category} ({items.length})
              </h3>
              <ul className="space-y-2">
                {items.map((item: SearchResultItem) => (
                  <li key={`${item.type}-${item.id}`} className="hover:bg-gray-100 dark:hover:bg-gray-700/50 p-3 rounded-md transition-colors duration-150">
                    <Link to={item.path} onClick={closeSearchModal} className="block group">
                      <div className="flex items-center">
                        {item.icon && <i className={`fas ${item.icon} mr-3 text-gray-500 dark:text-gray-400 group-hover:text-primary dark:group-hover:text-primary-light w-5 text-center`}></i>}
                        <div className="flex-grow">
                            <p className="text-md font-medium text-gray-800 dark:text-gray-100 group-hover:text-primary dark:group-hover:text-primary-light">
                                {highlightMatch(item.name, searchQuery)}
                            </p>
                            {item.description && <p className="text-xs text-gray-500 dark:text-gray-400">{highlightMatch(item.description, searchQuery)}</p>}
                        </div>
                        <i className="fas fa-chevron-right text-gray-400 dark:text-gray-500 ml-2 group-hover:text-primary dark:group-hover:text-primary-light"></i>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </Modal>
  );
};

export default GlobalSearchModal;