'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from './Input';
import { Button } from './Button';
import { MapPin, Navigation, Loader2 } from 'lucide-react';

interface AddressAutocompleteProps {
  onLocationSelect: (address: string, lat: number, lon: number) => void;
  defaultValue?: string;
}

export function AddressAutocomplete({ onLocationSelect, defaultValue = '' }: AddressAutocompleteProps) {
  const [query, setQuery] = useState(defaultValue);
  const [debouncedQuery, setDebouncedQuery] = useState(defaultValue);
  const [results, setResults] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    async function fetchAddresses() {
      if (debouncedQuery.length < 3) {
        setResults([]);
        setIsOpen(false);
        return;
      }
      setIsLoading(true);
      try {
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(debouncedQuery)}&limit=5`);
        const data = await res.json();
        const formattedResults = (data.features || []).map((f: any) => {
          const props = f.properties;
          const addressParts = [props.name, props.street, props.city, props.state].filter(Boolean);
          const uniqueParts = Array.from(new Set(addressParts));
          return {
            place_id: props.osm_id || Math.random().toString(),
            display_name: uniqueParts.join(', '),
            lat: f.geometry.coordinates[1],
            lon: f.geometry.coordinates[0]
          };
        });
        setResults(formattedResults);
        setIsOpen(true);
      } catch (e) {
        console.error(e);
      }
      setIsLoading(false);
    }
    
    // Only search if user typed something new and didn't just select an item
    if (isOpen || document.activeElement?.tagName === 'INPUT') {
      fetchAddresses();
    }
  }, [debouncedQuery]);

  const handleSelect = (item: any) => {
    setQuery(item.display_name);
    setIsOpen(false);
    onLocationSelect(item.display_name, Number(item.lat), Number(item.lon));
  };

  const getCurrentLocation = () => {
    if ('geolocation' in navigator) {
      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const res = await fetch(`https://photon.komoot.io/reverse?lon=${longitude}&lat=${latitude}`);
            const data = await res.json();
            if (data.features && data.features.length > 0) {
              const props = data.features[0].properties;
              const addressParts = [props.name, props.street, props.city, props.state].filter(Boolean);
              const address = Array.from(new Set(addressParts)).join(', ');
              
              setQuery(address);
              onLocationSelect(address, latitude, longitude);
            } else {
              alert('Gagal menemukan alamat untuk koordinat Anda.');
            }
          } catch (e) {
            alert('Gagal mengambil nama lokasi dari koordinat Anda.');
          }
          setIsLoading(false);
        },
        () => {
          alert('Akses lokasi ditolak atau gagal. Mohon izinkan akses lokasi.');
          setIsLoading(false);
        }
      );
    } else {
      alert('Geolocation tidak didukung di browser ini.');
    }
  };

  return (
    <div className="relative flex flex-col gap-3" ref={wrapperRef}>
      <Button 
        type="button" 
        variant="secondary" 
        onClick={getCurrentLocation}
        disabled={isLoading}
        className="flex w-full items-center justify-center gap-2 border-primary-400 bg-primary-50 py-3 text-primary-950 hover:bg-primary-100"
      >
        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Navigation className="h-5 w-5" />}
        Gunakan Lokasi Saat Ini
      </Button>

      <div className="flex items-center gap-2">
        <div className="h-[1px] flex-1 bg-border" />
        <span className="text-[12px] font-semibold text-text-desc">ATAU CARI MANUAL</span>
        <div className="h-[1px] flex-1 bg-border" />
      </div>

      <div className="relative">
        <MapPin className="absolute left-3 top-3 h-5 w-5 text-text-desc" />
        <Input 
          type="text"
          placeholder="Ketik nama jalan atau daerah..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          className="w-full pl-10"
        />
        
        {isOpen && results.length > 0 && (
          <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-white shadow-none">
            {results.map((item) => (
              <div 
                key={item.place_id} 
                className="cursor-pointer border-b border-border p-3 text-[14px] text-text-main last:border-0 hover:bg-primary-50"
                onClick={() => handleSelect(item)}
              >
                {item.display_name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
