import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";

interface AddressSuggestion {
  address: string;
  lat: number;
  lng: number;
}

interface AddressInputProps {
  onSelect: (address: AddressSuggestion) => void;
  defaultValue?: string;
  className?: string;
}

export default function AddressInput({ onSelect, defaultValue = '', className = '' }: AddressInputProps) {
  const [input, setInput] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (input.length < 3) {
        setSuggestions([]);
        return;
      }
      setLoading(true);
      try {
        const response = await fetch(`/api/address/search?q=${encodeURIComponent(input)}`);
        const data = await response.json();
        setSuggestions(data);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [input]);

  const handleClickOutside = () => {
    setTimeout(() => setShowSuggestions(false), 200);
  };

  return (
    <div className="relative">
      <Input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onFocus={() => setShowSuggestions(true)}
        onBlur={handleClickOutside}
        className={`bg-white/5 border-0 focus-visible:ring-1 focus-visible:ring-[#95ff00]/50 focus-visible:ring-offset-0 ${className}`}
        placeholder="Start typing an address..."
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 w-full z-50 mt-1">
          <div className="bg-black/95 backdrop-blur-lg border border-white/10 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                onClick={() => {
                  onSelect(suggestion);
                  setInput(suggestion.address);
                  setShowSuggestions(false);
                }}
                className="px-3 py-2 text-white hover:bg-white/5 cursor-pointer truncate transition-colors"
              >
                {suggestion.address}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {loading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin h-4 w-4 border-2 border-[#95ff00] border-t-transparent rounded-full" />
        </div>
      )}
    </div>
  );
}