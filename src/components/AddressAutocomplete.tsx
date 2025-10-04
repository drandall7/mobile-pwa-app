'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

interface AddressSuggestion {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (address: string, placeId: string, coordinates?: { lat: number; lng: number }) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Enter your address',
  disabled = false,
  className = ''
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [error, setError] = useState<string>('');
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Google Places API
  useEffect(() => {
    const initGooglePlaces = async () => {
      try {
        const loader = new Loader({
          apiKey: process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY!,
          version: 'weekly',
          libraries: ['places']
        });

        await loader.load();
        
        // Initialize services
        autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
        
        // Create a dummy div for PlacesService (required by Google)
        const dummyDiv = document.createElement('div');
        placesServiceRef.current = new google.maps.places.PlacesService(dummyDiv);
        
        setError('');
      } catch (err) {
        console.error('Failed to load Google Places API:', err);
        setError('Address autocomplete is temporarily unavailable');
      }
    };

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
    
    if (apiKey && apiKey !== 'your_google_places_api_key_here') {
      initGooglePlaces();
    } else {
      setError('Address autocomplete will be available after API key setup');
    }
  }, []);

  // Debounced search function
  const searchAddresses = useCallback(async (input: string) => {
    if (!input.trim() || !autocompleteServiceRef.current) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    // Don't search if API key is not configured
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
    if (!apiKey || apiKey === 'your_google_places_api_key_here') {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const request = {
        input: input.trim(),
        types: ['address'],
        componentRestrictions: { country: 'us' }, // Restrict to US for now
      };

      autocompleteServiceRef.current.getPlacePredictions(request, (predictions, status) => {
        setIsLoading(false);
        
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSuggestions(predictions);
          setIsOpen(true);
          setSelectedIndex(-1);
        } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          setSuggestions([]);
          setIsOpen(false);
        } else {
          console.error('Places API error:', status);
          setError('Failed to load address suggestions');
          setSuggestions([]);
          setIsOpen(false);
        }
      });
    } catch (err) {
      console.error('Address search error:', err);
      setIsLoading(false);
      setError('Failed to search addresses');
      setSuggestions([]);
      setIsOpen(false);
    }
  }, []);

  // Handle input change with debouncing
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new timeout for debounced search
    debounceTimeoutRef.current = setTimeout(() => {
      searchAddresses(newValue);
    }, 400); // 400ms debounce
  }, [onChange, searchAddresses]);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback(async (suggestion: AddressSuggestion) => {
    const address = suggestion.description;
    onChange(address);
    setIsOpen(false);
    setSuggestions([]);
    setSelectedIndex(-1);

    // Get place details for coordinates
    if (placesServiceRef.current) {
      const request = {
        placeId: suggestion.place_id,
        fields: ['geometry']
      };

      placesServiceRef.current.getDetails(request, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
          const coordinates = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          };
          onSelect(address, suggestion.place_id, coordinates);
        } else {
          onSelect(address, suggestion.place_id);
        }
      });
    } else {
      onSelect(address, suggestion.place_id);
    }
  }, [onChange, onSelect]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  }, [isOpen, suggestions, selectedIndex, handleSuggestionSelect]);

  // Handle input focus
  const handleFocus = useCallback(() => {
    if (suggestions.length > 0) {
      setIsOpen(true);
    }
  }, [suggestions.length]);

  // Handle input blur with delay
  const handleBlur = useCallback(() => {
    setTimeout(() => {
      setIsOpen(false);
      setSelectedIndex(-1);
    }, 200); // Small delay to allow clicks on suggestions
  }, []);

  // Handle suggestion click
  const handleSuggestionClick = useCallback((suggestion: AddressSuggestion) => {
    handleSuggestionSelect(suggestion);
  }, [handleSuggestionSelect]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Check if API key is configured
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
  const isApiConfigured = apiKey && apiKey !== 'your_google_places_api_key_here';
  
  const inputPlaceholder = isApiConfigured ? placeholder : 'Address autocomplete coming soon...';

  return (
    <div className="relative">
      {/* Input Field */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={inputPlaceholder}
        disabled={disabled || !isApiConfigured}
        className={`w-full h-12 px-4 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 ${!isApiConfigured ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      />

      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="w-5 h-5 border-2 border-gray-400 border-t-orange-500 rounded-full animate-spin"></div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-red-400 text-sm mt-2">{error}</p>
      )}

      {/* Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.place_id}
              onClick={() => handleSuggestionClick(suggestion)}
              className={`px-4 py-3 cursor-pointer transition-colors duration-150 ${
                index === selectedIndex
                  ? 'bg-orange-500/20 text-orange-300'
                  : 'text-white hover:bg-gray-600'
              }`}
            >
              <div className="font-medium text-sm">
                {suggestion.structured_formatting.main_text}
              </div>
              <div className="text-gray-400 text-xs mt-1">
                {suggestion.structured_formatting.secondary_text}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results Message */}
      {isOpen && suggestions.length === 0 && value.trim() && !isLoading && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg z-50">
          <div className="px-4 py-3 text-gray-400 text-sm">
            No addresses found. Try a different search term.
          </div>
        </div>
      )}
    </div>
  );
}
