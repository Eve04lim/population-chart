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
  
  // スクロール位置の保存
  const [hasScrolled, setHasScrolled] = useState(false);

  // 都道府県の選択・選択解除を処理する関数
  const handlePrefectureChange = (prefecture: Prefecture, isChecked: boolean) => {
    if (isChecked) {
      setSelectedPrefectures((prev) => [...prev, prefecture]);
    } else {
      setSelectedPrefectures((prev) => prev.filter((p) => p.prefCode !== prefecture.prefCode));
    }
    
    // 初めて都道府県が選択された時、グラフセクションにスクロール
    if (!hasScrolled && isChecked && selectedPrefectures.length === 0) {
      setTimeout(() => {
        const chartSection = document.getElementById('chart-section');
        if (chartSection) {
          chartSection.scrollIntoView({ behavior: 'smooth' });
          setHasScrolled(true);
        }
      }, 500);
    }
  };

  // 人口タイプの変更を処理する関数
  const handlePopulationTypeChange = (type: string) => {
    setPopulationType(type);
  };

  // 人口タイプの説明文章
  const populationTypeDescriptions: Record<string, string> = {
    '総人口': '全ての年齢層を含む総人口の推移です。',
    '年少人口': '15歳未満の人口推移です。',
    '生産年齢人口': '15歳から64歳までの人口推移です。',
    '老年人口': '65歳以上の人口推移です。'
  };

  return (
    <div className="space-y-8">
      <section className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
          <h2 className="text-xl font-semibold mb-4 md:mb-0">都道府県を選択</h2>
          <div className="text-sm text-gray-500">
            {selectedPrefectures.length > 0 ? (
              <span>選択中: {selectedPrefectures.length}都道府県</span>
            ) : (
              <span>都道府県を選択してグラフを表示</span>
            )}
          </div>
        </div>
        <PrefectureSelector onPrefectureChange={handlePrefectureChange} />
      </section>

      <section id="chart-section" className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-col mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">人口推移グラフ</h2>
            <div className="mt-3 md:mt-0">
              <div className="flex flex-wrap gap-3">
                {['総人口', '年少人口', '生産年齢人口', '老年人口'].map((type) => (
                  <button
                    type="button"
                    key={type}
                    className={`px-3 py-1.5 rounded text-sm transition-colors duration-200 ${
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
          <p className="text-sm text-gray-600 mb-4">
            {populationTypeDescriptions[populationType]}
          </p>
        </div>
        
        <PopulationChart 
          selectedPrefectures={selectedPrefectures} 
          populationType={populationType} 
        />
      </section>

      {selectedPrefectures.length > 0 && (
        <section className="bg-blue-50 p-6 rounded-lg border border-blue-100">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true" role="img">
                <title>情報アイコン</title>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">データについて</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>このグラフは、RESAS（地域経済分析システム）APIから取得した各都道府県の人口推移データを表示しています。</p>
                <p className="mt-1">総人口、年少人口（15歳未満）、生産年齢人口（15〜64歳）、老年人口（65歳以上）の4種類のデータを確認できます。</p>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}