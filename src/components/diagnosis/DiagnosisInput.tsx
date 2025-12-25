/**
 * Diagnosis Input Component with Database Recommendations
 * Senior Developer Implementation - Best Practices
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';

interface DiagnosisInputProps {
  value: string;
  onChange: (value: string) => void;
  isPrimary: boolean;
  onPrimaryChange: (isPrimary: boolean) => void;
  placeholder?: string;
  label?: string;
  onRemove?: () => void;
  showRemove?: boolean;
}

interface DiagnosisHistory {
  id: string;
  diagnosis_text: string;
  frequency: number;
  last_used: string;
  is_primary: boolean;
}

/**
 * Diagnosis input component with intelligent recommendations
 * Features:
 * - Case-insensitive search
 * - Frequency-based sorting
 * - Recent usage prioritization
 * - Primary/Secondary diagnosis selection
 */
export default function DiagnosisInput({
  value,
  onChange,
  isPrimary,
  onPrimaryChange,
  placeholder = "Ketik diagnosis...",
  label = "Diagnosis",
  onRemove,
  showRemove = false
}: DiagnosisInputProps) {
  const [recommendations, setRecommendations] = useState<DiagnosisHistory[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchDiagnoses = async (query: string) => {
    if (query.length < 2) {
      setRecommendations([]);
      setShowDropdown(false);
      return;
    }

    setLoading(true);
    setShowDropdown(true);

    try {
      // Create a view or function to get diagnosis history with frequency
      // For now, we'll simulate this with a simple query
      // In production, you would create a materialized view or stored function
      const { data, error } = await supabase
        .from('diagnosis_history')
        .select('*')
        .ilike('diagnosis_text', `%${query}%`)
        .order('frequency', { ascending: false })
        .order('last_used', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching diagnosis recommendations:', error);
        setRecommendations([]);
      } else {
        setRecommendations(data || []);
      }
    } catch (err) {
      console.error('Error:', err);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    searchDiagnoses(newValue);
  };

  const selectRecommendation = (diagnosis: DiagnosisHistory) => {
    onChange(diagnosis.diagnosis_text);
    setShowDropdown(false);
    setRecommendations([]);
    
    // Optionally set primary based on history
    if (diagnosis.is_primary && !isPrimary) {
      onPrimaryChange(true);
    }
  };

  const handleFocus = () => {
    if (value.length >= 2) {
      searchDiagnoses(value);
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        {showRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-sm text-red-600 hover:text-red-800 font-medium"
          >
            Hapus
          </button>
        )}
      </div>
      
      <div className="space-y-3">
        {/* Diagnosis Text Input */}
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleInputChange}
            onFocus={handleFocus}
            placeholder={placeholder}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            autoComplete="off"
          />
          
          {/* Loading indicator */}
          {loading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* Recommendations dropdown */}
          {showDropdown && recommendations.length > 0 && (
            <div
              ref={dropdownRef}
              className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto"
            >
              {recommendations.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectRecommendation(item)}
                  className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-0 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {item.diagnosis_text}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-500">
                          Digunakan {item.frequency}x
                        </span>
                        <span className="text-xs text-gray-500">
                          Terakhir: {new Intl.DateTimeFormat('id-ID', {
                            dateStyle: 'short'
                          }).format(new Date(item.last_used))}
                        </span>
                        {item.is_primary && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                            Primer
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Empty state */}
          {showDropdown && !loading && recommendations.length === 0 && value.length >= 2 && (
            <div
              ref={dropdownRef}
              className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4"
            >
              <p className="text-sm text-gray-500 text-center">
                Tidak ada riwayat diagnosis ditemukan.
                <br />
                <span className="text-xs">Diagnosis baru akan disimpan untuk rekomendasi di masa depan.</span>
              </p>
            </div>
          )}
        </div>

        {/* Primary/Secondary Selection */}
        <div className="flex items-center gap-4">
          <label className="text-sm text-gray-600">Jenis Diagnosis:</label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name={`diagnosis-type-${Math.random()}`}
                checked={isPrimary}
                onChange={() => onPrimaryChange(true)}
                className="mr-2 text-blue-600"
              />
              <span className="text-sm text-gray-700">Diagnosis Utama</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name={`diagnosis-type-${Math.random()}`}
                checked={!isPrimary}
                onChange={() => onPrimaryChange(false)}
                className="mr-2 text-blue-600"
              />
              <span className="text-sm text-gray-700">Diagnosis Pendukung</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
