import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const SelectField = React.forwardRef(({
  label,
  className = '',
  labelClassName = '',
  wrapperClassName = '',
  error,
  children,
  icon: Icon,
  value,
  onChange,
  disabled,
  ...props
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const internalSelectRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options = React.Children.toArray(children)
    .filter(child => child.type === 'option')
    .map(child => {
      // Native select behavior: if value is not provided, it defaults to the text content
      const value = child.props.value !== undefined ? child.props.value : child.props.children;
      return {
        value: value,
        label: child.props.children,
        disabled: child.props.disabled
      };
    });

  // Combine forwarded ref and internal ref
  const setRefs = React.useCallback(
    (node) => {
      internalSelectRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    },
    [ref]
  );

  // Read value from props or fallback
  const [internalValue, setInternalValue] = useState(value !== undefined ? value : (options.length > 0 ? options[0].value : ''));

  // Sync internal value with controlled value
  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  // Sync internal value with native select value (useful for react-hook-form reset)
  useEffect(() => {
    if (internalSelectRef.current) {
      const nativeValue = internalSelectRef.current.value;
      if (nativeValue !== internalValue) {
        setInternalValue(nativeValue);
      }
    }
  });

  const currentOption = options.find(opt => String(opt.value) === String(internalValue)) || options.find(opt => opt.value === '') || options[0];

  const handleSelect = (option) => {
    if (option.disabled) return;

    setInternalValue(option.value);
    setIsOpen(false);

    // Trigger the native change event
    if (internalSelectRef.current) {
      const select = internalSelectRef.current;
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLSelectElement.prototype,
        'value'
      ).set;
      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(select, option.value);
      }

      const event = new Event('change', { bubbles: true });
      select.dispatchEvent(event);
    }
  };

  return (
    <div className={`flex flex-col gap-1.5 w-full ${wrapperClassName}`} ref={containerRef}>
      {label && (
        <label className={`text-sm font-medium text-slate-700 ${labelClassName}`}>
          {label}
        </label>
      )}

      <div className="relative w-full">
        {/* Hidden native select for form libraries (like React Hook Form) */}
        <select
          ref={setRefs}
          value={internalValue}
          onChange={(e) => {
            setInternalValue(e.target.value);
            if (onChange) onChange(e);
          }}
          disabled={disabled}
          className="absolute opacity-0 pointer-events-none w-0 h-0 -z-10"
          tabIndex={-1}
          {...props}
        >
          {children}
        </select>

        {/* Custom trigger */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between text-left ${Icon ? 'pl-9' : 'pl-3'} pr-3 py-2 text-[13px] border ${error ? 'border-red-500' : (isOpen ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200')} rounded-lg bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500 transition-all hover:border-slate-300 ${className} ${disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
        >
          {Icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Icon className="w-4 h-4" />
            </div>
          )}

          <span className={`truncate ${!currentOption?.value && currentOption?.label?.includes('Select') ? 'text-slate-400' : 'text-slate-700'}`}>
            {currentOption ? currentOption.label : 'Select...'}
          </span>

          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="text-slate-400 ml-2 shrink-0"
          >
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </button>

        {/* Custom Dropdown */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -5, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -5, scale: 0.98 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute z-50 w-full mt-1.5 bg-white border border-slate-100 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] overflow-hidden"
            >
              <div className="max-h-60 overflow-y-auto py-1.5 custom-scrollbar">
                {options.map((option, idx) => {
                  const isSelected = String(option.value) === String(internalValue);
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(idx * 0.02, 0.2) }}
                    >
                      <button
                        type="button"
                        onClick={() => handleSelect(option)}
                        disabled={option.disabled}
                        className={`w-full text-left px-3 py-2 text-[13px] transition-colors flex items-center justify-between ${isSelected
                            ? 'bg-blue-50/60 text-blue-700 font-medium'
                            : 'text-slate-700 hover:bg-slate-50'
                          } ${option.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        {option.label}
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-1.5 h-1.5 rounded-full bg-blue-600 mr-1 shrink-0"
                          />
                        )}
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <motion.span
          initial={{ opacity: 0, y: -2 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-red-500 font-medium block"
        >
          {error}
        </motion.span>
      )}
    </div>
  );
});

SelectField.displayName = 'SelectField';

export default SelectField;
