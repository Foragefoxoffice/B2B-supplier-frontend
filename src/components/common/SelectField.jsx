import React from 'react';

const SelectField = React.forwardRef(({ 
  label, 
  className = '', 
  labelClassName = '',
  wrapperClassName = '',
  error,
  children,
  icon: Icon,
  ...props 
}, ref) => {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${wrapperClassName}`}>
      {label && (
        <label className={`text-sm font-medium text-slate-700 ${labelClassName}`}>
          {label}
        </label>
      )}
      <div className="relative w-full">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <select
          ref={ref}
          className={`w-full ${Icon ? 'pl-9' : 'pl-3'} pr-8 py-2 text-[13px] border ${error ? 'border-red-500' : 'border-slate-200'} rounded-lg appearance-none bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500 transition-colors ${className}`}
          {...props}
        >
          {children}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
});

SelectField.displayName = 'SelectField';

export default SelectField;
