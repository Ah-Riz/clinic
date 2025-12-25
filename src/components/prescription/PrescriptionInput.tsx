/**
 * Advanced Prescription Input Component
 * Senior Developer Implementation - Best Practices
 * Supports both Non-Racik (Regular) and Racik (Compounded) prescriptions
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';

export type PrescriptionType = 'non_racik' | 'racik';

interface Medicine {
  id: string;
  name: string;
  unit: string | null;
  price: number | null;
}

interface RacikIngredient {
  medicine_id: string;
  medicine_name: string;
  dosage: string;
  unit: string | null;
}

interface NonRacikPrescription {
  type: 'non_racik';
  medicine_id: string;
  medicine_name: string;
  quantity: number;
  directions: string;
  additional_info: string;
}

interface RacikPrescription {
  type: 'racik';
  sediaan: string;
  quantity: number;
  ingredients: RacikIngredient[];
  directions: string;
  additional_info: string;
}

export type PrescriptionData = NonRacikPrescription | RacikPrescription;

interface PrescriptionInputProps {
  value: PrescriptionData;
  onChange: (prescription: PrescriptionData) => void;
  onRemove?: () => void;
  showRemove?: boolean;
  index: number;
}

/**
 * Advanced prescription input supporting Indonesian pharmacy practices
 * Non-Racik: Regular medicines with simple dosing
 * Racik: Custom compounded medicines with multiple ingredients
 */
export default function PrescriptionInput({
  value,
  onChange,
  onRemove,
  showRemove = false,
  index
}: PrescriptionInputProps) {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [showMedicineDropdown, setShowMedicineDropdown] = useState<number | null>(null);
  const [sediaanRecommendations, setSediaanRecommendations] = useState<string[]>([]);
  const [showSediaanDropdown, setShowSediaanDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  const supabase = createSupabaseBrowserClient();
  const sediaanInputRef = useRef<HTMLInputElement>(null);
  const medicineInputRefs = useRef<{ [key: number]: HTMLInputElement }>({});

  // Common sediaan types in Indonesian pharmacy
  const commonSediaan = [
    'Kapsul',
    'Tablet',
    'Sirup',
    'Salep',
    'Krim',
    'Drops',
    'Injeksi',
    'Suppositoria',
    'Suspensi',
    'Emulsi',
    'Larutan',
    'Serbuk'
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sediaanInputRef.current && !sediaanInputRef.current.contains(event.target as Node)) {
        setShowSediaanDropdown(false);
      }
      
      Object.values(medicineInputRefs.current).forEach(ref => {
        if (ref && !ref.contains(event.target as Node)) {
          setShowMedicineDropdown(null);
        }
      });
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchMedicines = async (query: string, ingredientIndex?: number) => {
    if (query.length < 2) {
      setMedicines([]);
      setShowMedicineDropdown(null);
      return;
    }

    setShowMedicineDropdown(ingredientIndex ?? -1);
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('medicines')
        .select('id, name, unit, price')
        .ilike('name', `%${query}%`)
        .eq('active', true)
        .order('name')
        .limit(10);

      if (error) {
        console.error('Error fetching medicines:', error);
        setMedicines([]);
      } else {
        setMedicines(data || []);
      }
    } catch (err) {
      console.error('Error:', err);
      setMedicines([]);
    } finally {
      setLoading(false);
    }
  };

  const searchSediaan = async (query: string) => {
    if (query.length < 1) {
      setSediaanRecommendations([]);
      setShowSediaanDropdown(false);
      return;
    }

    setShowSediaanDropdown(true);
    
    // Filter common sediaan based on input
    const filtered = commonSediaan.filter(sediaan => 
      sediaan.toLowerCase().includes(query.toLowerCase())
    );
    
    setSediaanRecommendations(filtered);
  };

  const handleTypeChange = (newType: PrescriptionType) => {
    if (newType === 'non_racik') {
      onChange({
        type: 'non_racik',
        medicine_id: '',
        medicine_name: '',
        quantity: 1,
        directions: '',
        additional_info: ''
      });
    } else {
      onChange({
        type: 'racik',
        sediaan: '',
        quantity: 1,
        ingredients: [{
          medicine_id: '',
          medicine_name: '',
          dosage: '',
          unit: null
        }],
        directions: '',
        additional_info: ''
      });
    }
  };

  const updateNonRacik = (field: keyof NonRacikPrescription, newValue: any) => {
    if (value.type === 'non_racik') {
      onChange({
        ...value,
        [field]: newValue
      });
    }
  };

  const updateRacik = (field: keyof RacikPrescription, newValue: any) => {
    if (value.type === 'racik') {
      onChange({
        ...value,
        [field]: newValue
      });
    }
  };

  const updateRacikIngredient = (ingredientIndex: number, field: keyof RacikIngredient, newValue: any) => {
    if (value.type === 'racik') {
      const newIngredients = [...value.ingredients];
      newIngredients[ingredientIndex] = {
        ...newIngredients[ingredientIndex],
        [field]: newValue
      };
      onChange({
        ...value,
        ingredients: newIngredients
      });
    }
  };

  const addRacikIngredient = () => {
    if (value.type === 'racik') {
      onChange({
        ...value,
        ingredients: [
          ...value.ingredients,
          {
            medicine_id: '',
            medicine_name: '',
            dosage: '',
            unit: null
          }
        ]
      });
    }
  };

  const removeRacikIngredient = (ingredientIndex: number) => {
    if (value.type === 'racik' && value.ingredients.length > 1) {
      onChange({
        ...value,
        ingredients: value.ingredients.filter((_, idx) => idx !== ingredientIndex)
      });
    }
  };

  const selectMedicine = (medicine: Medicine, ingredientIndex?: number) => {
    if (value.type === 'non_racik' && ingredientIndex === undefined) {
      updateNonRacik('medicine_id', medicine.id);
      updateNonRacik('medicine_name', medicine.name);
    } else if (value.type === 'racik' && ingredientIndex !== undefined) {
      updateRacikIngredient(ingredientIndex, 'medicine_id', medicine.id);
      updateRacikIngredient(ingredientIndex, 'medicine_name', medicine.name);
      updateRacikIngredient(ingredientIndex, 'unit', medicine.unit);
    }
    
    setMedicines([]);
    setShowMedicineDropdown(null);
  };

  const selectSediaan = (sediaan: string) => {
    if (value.type === 'racik') {
      updateRacik('sediaan', sediaan);
    }
    setShowSediaanDropdown(false);
    setSediaanRecommendations([]);
  };

  const calculateTotalMedicine = (): string => {
    if (value.type === 'racik') {
      const total = value.ingredients.reduce((sum, ingredient) => {
        const dosage = parseFloat(ingredient.dosage) || 0;
        return sum + (dosage * value.quantity);
      }, 0);
      return total.toString();
    }
    return '';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Resep #{index + 1}
        </h3>
        {showRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-sm text-red-600 hover:text-red-800 font-medium"
          >
            Hapus Resep
          </button>
        )}
      </div>

      {/* Type Selection */}
      <div className="flex gap-4 p-3 bg-gray-50 rounded-lg">
        <label className="flex items-center">
          <input
            type="radio"
            name={`prescription-type-${index}`}
            checked={value.type === 'non_racik'}
            onChange={() => handleTypeChange('non_racik')}
            className="mr-2 text-blue-600"
          />
          <div>
            <span className="text-sm font-medium text-gray-900">Non-Racik</span>
            <p className="text-xs text-gray-600">Obat jadi/regular</p>
          </div>
        </label>
        <label className="flex items-center">
          <input
            type="radio"
            name={`prescription-type-${index}`}
            checked={value.type === 'racik'}
            onChange={() => handleTypeChange('racik')}
            className="mr-2 text-blue-600"
          />
          <div>
            <span className="text-sm font-medium text-gray-900">Racik</span>
            <p className="text-xs text-gray-600">Obat racikan/compound</p>
          </div>
        </label>
      </div>

      {/* Non-Racik Form */}
      {value.type === 'non_racik' && (
        <div className="space-y-4">
          {/* Medicine Search */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama Obat
            </label>
            <input
              type="text"
              value={value.medicine_name}
              onChange={(e) => {
                updateNonRacik('medicine_name', e.target.value);
                searchMedicines(e.target.value);
              }}
              onFocus={() => value.medicine_name.length >= 2 && searchMedicines(value.medicine_name)}
              placeholder="Cari nama obat..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoComplete="off"
            />
            
            {/* Medicine Dropdown */}
            {showMedicineDropdown === -1 && medicines.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {medicines.map((medicine) => (
                  <button
                    key={medicine.id}
                    type="button"
                    onClick={() => selectMedicine(medicine)}
                    className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900">{medicine.name}</span>
                      {medicine.unit && (
                        <span className="text-sm text-gray-500">{medicine.unit}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jumlah (pcs)
            </label>
            <input
              type="number"
              min="1"
              value={value.quantity}
              onChange={(e) => updateNonRacik('quantity', parseInt(e.target.value) || 1)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Racik Form */}
      {value.type === 'racik' && (
        <div className="space-y-4">
          {/* Sediaan Type */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jenis Sediaan
            </label>
            <input
              ref={sediaanInputRef}
              type="text"
              value={value.sediaan}
              onChange={(e) => {
                updateRacik('sediaan', e.target.value);
                searchSediaan(e.target.value);
              }}
              onFocus={() => searchSediaan(value.sediaan)}
              placeholder="Contoh: Kapsul, Tablet, Sirup..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoComplete="off"
            />
            
            {/* Sediaan Dropdown */}
            {showSediaanDropdown && sediaanRecommendations.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {sediaanRecommendations.map((sediaan) => (
                  <button
                    key={sediaan}
                    type="button"
                    onClick={() => selectSediaan(sediaan)}
                    className="w-full px-4 py-2 text-left hover:bg-blue-50 border-b border-gray-100 last:border-0"
                  >
                    <span className="text-gray-900">{sediaan}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quantity of Sediaan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jumlah Sediaan (pcs)
            </label>
            <input
              type="number"
              min="1"
              value={value.quantity}
              onChange={(e) => updateRacik('quantity', parseInt(e.target.value) || 1)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Ingredients */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">
                Komposisi Obat
              </label>
              <button
                type="button"
                onClick={addRacikIngredient}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                + Tambah Bahan
              </button>
            </div>
            
            <div className="space-y-3">
              {value.ingredients.map((ingredient, ingredientIndex) => (
                <div key={ingredientIndex} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">
                      Bahan #{ingredientIndex + 1}
                    </span>
                    {value.ingredients.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRacikIngredient(ingredientIndex)}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {/* Medicine Search for Ingredient */}
                    <div className="relative">
                      <label className="block text-xs text-gray-600 mb-1">Nama Obat</label>
                      <input
                        ref={el => {
                          if (el) medicineInputRefs.current[ingredientIndex] = el;
                        }}
                        type="text"
                        value={ingredient.medicine_name}
                        onChange={(e) => {
                          updateRacikIngredient(ingredientIndex, 'medicine_name', e.target.value);
                          searchMedicines(e.target.value, ingredientIndex);
                        }}
                        onFocus={() => ingredient.medicine_name.length >= 2 && searchMedicines(ingredient.medicine_name, ingredientIndex)}
                        placeholder="Cari obat..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        autoComplete="off"
                      />
                      
                      {/* Medicine Dropdown for Ingredient */}
                      {showMedicineDropdown === ingredientIndex && medicines.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {medicines.map((medicine) => (
                            <button
                              key={medicine.id}
                              type="button"
                              onClick={() => selectMedicine(medicine, ingredientIndex)}
                              className="w-full px-3 py-2 text-left hover:bg-blue-50 border-b border-gray-100 last:border-0 text-sm"
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-medium text-gray-900">{medicine.name}</span>
                                {medicine.unit && (
                                  <span className="text-xs text-gray-500">{medicine.unit}</span>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Dosage */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Dosis per sediaan {ingredient.unit ? `(${ingredient.unit})` : ''}
                      </label>
                      <input
                        type="text"
                        value={ingredient.dosage}
                        onChange={(e) => updateRacikIngredient(ingredientIndex, 'dosage', e.target.value)}
                        placeholder="Contoh: 250 mg"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total Calculation Display */}
          {calculateTotalMedicine() && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Perhitungan Total Bahan:</strong>
              </p>
              {value.ingredients.map((ingredient, idx) => {
                const dosage = parseFloat(ingredient.dosage) || 0;
                const total = dosage * value.quantity;
                return ingredient.medicine_name && dosage > 0 ? (
                  <p key={idx} className="text-sm text-blue-700">
                    • {ingredient.medicine_name}: {dosage} × {value.quantity} = {total} {ingredient.unit || 'unit'}
                  </p>
                ) : null;
              })}
            </div>
          )}
        </div>
      )}

      {/* Common Fields for Both Types */}
      <div className="space-y-4 pt-4 border-t border-gray-200">
        {/* Directions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Aturan Pakai
          </label>
          <input
            type="text"
            value={value.directions}
            onChange={(e) => {
              if (value.type === 'non_racik') {
                updateNonRacik('directions', e.target.value);
              } else {
                updateRacik('directions', e.target.value);
              }
            }}
            placeholder="Contoh: 3x sehari 1 tablet sesudah makan"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Additional Information */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Informasi Tambahan (Opsional)
          </label>
          <textarea
            rows={2}
            value={value.additional_info}
            onChange={(e) => {
              if (value.type === 'non_racik') {
                updateNonRacik('additional_info', e.target.value);
              } else {
                updateRacik('additional_info', e.target.value);
              }
            }}
            placeholder="Catatan khusus untuk apoteker atau pasien..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
}
