'use client';

import type { Prefecture } from '@/api/types';
import PopulationChart from '@/components/organisms/PopulationChart';
import PrefectureSelector from '@/components/organisms/PrefectureSelector';
import { useState } from 'react';

export default function Home() {
  // 選択された都道府県を管理するstate
  const [selectedPrefectures, setSelectedPrefectures] = useState<Prefecture[]>([]);
  
  // 人口タイプ（総人口・年少人口・生産年齢人口・老年人口）を管理するstate
  const [populationType, setPopulationType] = useState<string>('総人口');

  // 都道府県の選択・選択解除を処理する関数
  const handlePrefectureChange = (prefecture: Prefecture, isChecked: boolean) => {
    if (isChecked) {
      setSelectedPrefectures((prev) => [...prev, prefecture]);
    } else {
      setSelectedPrefectures((prev) => prev.filter((p) => p.prefCode !== prefecture.prefCode));
    }
  };

  // 人口タイプの変更を処理する関数
  const handlePopulationTypeChange = (type: string) => {
    setPopulationType(type);
  };

  return (
    <div className="space-y-8">
      <section className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">都道府県を選択</h2>
        <PrefectureSelector onPrefectureChange={handlePrefectureChange} />
      </section>

      <section className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">人口推移グラフ</h2>
          <div className="mt-3 md:mt-0">
            <div className="flex flex-wrap gap-3">
              {['総人口', '年少人口', '生産年齢人口', '老年人口'].map((type) => (
                <button
                  type="button"
                  key={type}
                  className={`px-3 py-1 rounded text-sm ${
                    populationType === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  onClick={() => handlePopulationTypeChange(type)}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>
        <PopulationChart 
          selectedPrefectures={selectedPrefectures} 
          populationType={populationType} 
        />
      </section>
    </div>
  );
}