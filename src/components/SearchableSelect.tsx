import React from 'react';
import AsyncSelect from 'react-select/async';
import { metadataService } from '../services/api';
import { MetadataTypes } from '../constants';

interface SearchableSelectProps {
  type: MetadataTypes;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  staticOptions?: { value: string; label: string }[];
  className?: string;
}

export default function SearchableSelect({ type, value, onChange, placeholder, error, staticOptions = [], className }: SearchableSelectProps) {
  const loadOptions = async (inputValue: string) => {
    try {
      const response = await metadataService.getAll({
        type,
        search: inputValue,
        limit: 20
      });
      const dynamicOptions = response.data.map(item => ({
        value: item.name,
        label: item.name
      }));

      // Filter static options based on input
      const filteredStatic = staticOptions.filter(opt => 
        opt.label.toLowerCase().includes(inputValue.toLowerCase())
      );

      return [...filteredStatic, ...dynamicOptions];
    } catch (error) {
      console.error('Error loading options:', error);
      return staticOptions;
    }
  };

  const customStyles = {
    control: (base: any, state: any) => ({
      ...base,
      backgroundColor: '#1e293b', // slate-800
      borderColor: state.isFocused ? '#6366f1' : '#334155', // indigo-500 : slate-700
      borderRadius: '0.5rem',
      padding: '2px',
      boxShadow: 'none',
      '&:hover': {
        borderColor: state.isFocused ? '#6366f1' : '#475569', // indigo-500 : slate-600
      }
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: '#0f172a', // slate-900
      border: '1px solid #1e293b', // slate-800
      borderRadius: '0.5rem',
      zIndex: 100
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isFocused ? '#1e293b' : 'transparent',
      color: state.isFocused ? '#f8fafc' : '#94a3b8',
      '&:active': {
        backgroundColor: '#334155',
      }
    }),
    singleValue: (base: any) => ({
      ...base,
      color: '#f8fafc', // slate-50
    }),
    input: (base: any) => ({
      ...base,
      color: '#f8fafc',
    }),
    placeholder: (base: any) => ({
      ...base,
      color: '#64748b', // slate-500
    })
  };

  return (
    <div className={`space-y-1 ${className || ''}`}>
      <AsyncSelect
        cacheOptions
        defaultOptions
        loadOptions={loadOptions}
        value={value ? { value, label: value } : null}
        onChange={(option: any) => onChange(option ? option.value : '')}
        placeholder={placeholder}
        styles={customStyles}
        classNamePrefix="react-select"
        isClearable
      />
      {error && <p className="text-xs text-rose-500">{error}</p>}
    </div>
  );
}
