import type { FC } from 'react';

interface CheckboxProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const Checkbox: FC<CheckboxProps> = ({ id, label, checked, onChange }) => {
  return (
    <div className="inline-flex items-center">
      <input
        id={id}
        type="checkbox"
        className="form-checkbox h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={label}
      />
      <label htmlFor={id} className="ml-2 text-sm font-medium text-gray-700">
        {label}
      </label>
    </div>
  );
};

export default Checkbox;