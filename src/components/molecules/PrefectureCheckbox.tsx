import type { Prefecture } from '@/api/types';
import type React from 'react';
import { useState } from 'react';
import Checkbox from '../atoms/Checkbox';

interface PrefectureCheckboxProps {
  prefecture: Prefecture;
  onChange: (prefecture: Prefecture, isChecked: boolean) => void;
}

const PrefectureCheckbox: React.FC<PrefectureCheckboxProps> = ({ prefecture, onChange }) => {
  const [checked, setChecked] = useState(false);

  // チェックボックスの状態が変更されたときの処理
  const handleChange = (isChecked: boolean) => {
    setChecked(isChecked);
    onChange(prefecture, isChecked);
  };

  return (
    <div className="m-1">
      <Checkbox
        id={`prefecture-${prefecture.prefCode}`}
        label={prefecture.prefName}
        checked={checked}
        onChange={handleChange}
      />
    </div>
  );
};

export default PrefectureCheckbox;