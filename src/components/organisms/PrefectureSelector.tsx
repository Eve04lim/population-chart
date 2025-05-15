import { fetchPrefectures } from '@/api/services';
import type { Prefecture } from '@/api/types';
import type React from 'react';
import { useEffect, useState } from 'react';
import PrefectureCheckbox from '../molecules/PrefectureCheckbox';

interface PrefectureSelectorProps {
  onPrefectureChange: (prefecture: Prefecture, isChecked: boolean) => void;
}

const PrefectureSelector: React.FC<PrefectureSelectorProps> = ({ onPrefectureChange }) => {
  const [prefectures, setPrefectures] = useState<Prefecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPrefCodes, setSelectedPrefCodes] = useState<number[]>([]);

  // コンポーネントマウント時に都道府県一覧を取得
  useEffect(() => {
    const getPrefectures = async () => {
      try {
        setLoading(true);
        const data = await fetchPrefectures();
        setPrefectures(data);
        setError(null);
      } catch (err) {
        setError('都道府県データの取得に失敗しました。');
        console.error('Error fetching prefectures:', err);
      } finally {
        setLoading(false);
      }
    };

    getPrefectures();
  }, []);

  // 選択状態を内部で追跡
  const handlePrefectureChange = (prefecture: Prefecture, isChecked: boolean) => {
    if (isChecked) {
      setSelectedPrefCodes(prev => [...prev, prefecture.prefCode]);
    } else {
      setSelectedPrefCodes(prev => prev.filter(code => code !== prefecture.prefCode));
    }
    onPrefectureChange(prefecture, isChecked);
  };

  // 全選択/全解除の実装
  const handleToggleAll = () => {
    const allSelected = selectedPrefCodes.length === prefectures.length;
    
    if (allSelected) {
      // 全解除
      for (const pref of prefectures) {
        onPrefectureChange(pref, false);
      }
      setSelectedPrefCodes([]);
    } else {
      // 全選択
      for (const pref of prefectures) {
        if (!selectedPrefCodes.includes(pref.prefCode)) {
          onPrefectureChange(pref, true);
        }
      }
      setSelectedPrefCodes(prefectures.map(pref => pref.prefCode));
    }
  };

  // 検索フィルタリング
  const filteredPrefectures = prefectures.filter(prefecture => 
    prefecture.prefName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 都道府県がチェックされているかどうかを判定
  const isPrefectureChecked = (prefCode: number): boolean => {
    return selectedPrefCodes.includes(prefCode);
  };

  if (loading) {
    return <div className="text-center py-4">読み込み中...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-col sm:flex-row justify-between gap-2">
        <div className="relative">
          <input
            type="search"
            placeholder="都道府県を検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border rounded-md px-3 py-2 w-full sm:w-64"
            aria-label="都道府県を検索"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
              aria-label="検索をクリア"
            >
              ✕
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={handleToggleAll}
          className={`rounded-md px-4 py-2 text-white ${
            selectedPrefCodes.length === prefectures.length
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {selectedPrefCodes.length === prefectures.length ? '全て解除' : '全て選択'}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1">
        {filteredPrefectures.map((prefecture) => (
          <PrefectureCheckbox
            key={prefecture.prefCode}
            prefecture={prefecture}
            onChange={handlePrefectureChange}
            isChecked={isPrefectureChecked(prefecture.prefCode)}
          />
        ))}
      </div>
      
      {filteredPrefectures.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          <p>「{searchTerm}」に一致する都道府県はありません</p>
        </div>
      )}
    </div>
  );
};

export default PrefectureSelector;