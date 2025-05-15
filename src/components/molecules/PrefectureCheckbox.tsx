import type { Prefecture } from '@/api/types';
import type React from 'react';
import { useEffect, useState } from 'react';
import Checkbox from '../atoms/Checkbox';

interface PrefectureCheckboxProps {
  prefecture: Prefecture;
  onChange: (prefecture: Prefecture, isChecked: boolean) => void;
  isChecked: boolean;
}

const PrefectureCheckbox: React.FC<PrefectureCheckboxProps> = ({ 
  prefecture, 
  onChange,
  isChecked 
}) => {
  const [checked, setChecked] = useState(isChecked);
  
  // 親コンポーネントからのisCheckedの変更を監視
  useEffect(() => {
    setChecked(isChecked);
  }, [isChecked]);

  // チェックボックスの状態が変更されたときの処理
  const handleChange = (isChecked: boolean) => {
    setChecked(isChecked);
    onChange(prefecture, isChecked);
  };

  return (
    <div className="m-1">
      <div 
        className={`p-2 rounded-md transition-colors duration-200 ${
          checked ? 'bg-blue-100' : 'hover:bg-gray-100'
        }`}
      >
        <Checkbox
          id={`prefecture-${prefecture.prefCode}`}
          label={prefecture.prefName}
          checked={checked}
          onChange={handleChange}
        />
      </div>
    </div>
  );
};

export default PrefectureCheckbox;