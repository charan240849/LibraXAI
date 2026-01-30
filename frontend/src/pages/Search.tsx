import { useState } from 'react';
import { searchApi } from '../api';
import { SearchResult } from '../types';
import { BookCard } from '../components/BookCard';
import './Search.css';

export function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    setSuggestions([]);
    
    try {
      const data = await searchApi.semantic(query, 10);
      setResults(data.results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = async (value: string) => {
    setQuery(value);
    
    if (value.length >= 2) {
      try {
        const data = await searchApi.suggest(value);
        setSuggestions(data.suggestions);
      } catch (error) {
        console.error('Suggest error:', error);
      }
    } else {
      setSuggestions([]);
    }
  };

  const selectSuggestion = (suggestion: string) => {
    setQuery(suggestion);
    setSuggestions([]);
  };

  return (
    <div className="search-page">
      <header className="page-header">
        <h1>🔍 Search Books</h1>
        <p>Find books by title, author, or keywords</p>
      </header>

      <form onSubmit={handleSearch} className="search-form-large">
        <div className="search-input-container">
          <input
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Search for books..."
            className="search-input-large"
          />
          {suggestions.length > 0 && (
            <ul className="suggestions-list">
              {suggestions.map((suggestion, i) => (
                <li key={i} onClick={() => selectSuggestion(suggestion)}>
                  {suggestion}
                </li>
              ))}
            </ul>
          )}
        </div>
        <button type="submit" className="btn btn-primary btn-large" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {loading && (
        <div className="loading">Searching...</div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="empty-state">
          <p>No books found matching "{query}"</p>
          <small>Try different keywords or check spelling</small>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="search-results">
          <h2>{results.length} result{results.length !== 1 ? 's' : ''} found</h2>
          <div className="results-grid">
            {results.map(book => (
              <div key={book.id} className="result-item">
                <BookCard book={book} showActions={false} />
                <div className="relevance-score">
                  Relevance: {Math.round(book.score * 10)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
