import type React from 'react';
import { useEffect, useState } from 'react';

interface RangeSliderProps {
  min: number;
  max: number;
  step?: number;
  defaultValues?: [number, number];
  onChange: (values: [number, number]) => void;
  disabled?: boolean;
}

/**
 * 範囲選択用のスライダーコンポーネント
 * 指定された最小値と最大値の間で範囲を選択できる
 */
const RangeSlider: React.FC<RangeSliderProps> = ({
  min,
  max,
  step = 1,
  defaultValues = [min, max],
  onChange,
  disabled = false
}) => {
  const [minValue, setMinValue] = useState<number>(defaultValues[0]);
  const [maxValue, setMaxValue] = useState<number>(defaultValues[1]);

  // 初期値が変わった場合に状態を更新
  useEffect(() => {
    setMinValue(defaultValues[0]);
    setMaxValue(defaultValues[1]);
  }, [defaultValues]);

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMinValue = Math.min(Number(e.target.value), maxValue - step);
    setMinValue(newMinValue);
    onChange([newMinValue, maxValue]);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMaxValue = Math.max(Number(e.target.value), minValue + step);
    setMaxValue(newMaxValue);
    onChange([minValue, newMaxValue]);
  };

  // スライダーの進捗状況を計算（CSSスタイリング用）
  const minPos = ((minValue - min) / (max - min)) * 100;
  const maxPos = ((maxValue - min) / (max - min)) * 100;

  return (
    <div className="relative w-full py-4">
      <div className="flex justify-between mb-2 text-sm text-gray-600 dark:text-gray-300">
        <span>{min}</span>
        <span>選択: {minValue} - {maxValue}</span>
        <span>{max}</span>
      </div>
      <div className="relative h-2">
        {/* スライダーの背景 */}
        <div
          className="absolute h-2 rounded bg-gray-200 dark:bg-gray-700 w-full"
          aria-hidden="true"
        />
        {/* 選択範囲のハイライト */}
        <div
          className="absolute h-2 rounded bg-blue-500 dark:bg-blue-600"
          style={{ left: `${minPos}%`, width: `${maxPos - minPos}%` }}
          aria-hidden="true"
        />
        {/* 最小値スライダー */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={minValue}
          onChange={handleMinChange}
          className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none"
          style={{
            // カスタムスタイルでスライダーのつまみを強調
            WebkitAppearance: 'none',
            appearance: 'none',
            pointerEvents: 'all',
            outline: 'none',
            zIndex: 10
          }}
          disabled={disabled}
          aria-label={`最小値: ${minValue}`}
        />
        {/* 最大値スライダー */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={maxValue}
          onChange={handleMaxChange}
          className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none"
          style={{
            WebkitAppearance: 'none',
            appearance: 'none',
            pointerEvents: 'all',
            outline: 'none',
            zIndex: 11
          }}
          disabled={disabled}
          aria-label={`最大値: ${maxValue}`}
        />
      </div>
    </div>
  );
};

export default RangeSlider;