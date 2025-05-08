import { fetchPrefectures } from '@/api/services';
import type { Prefecture } from '@/api/types';
import React, { useEffect, useState } from 'react';
import PrefectureCheckbox from '../molecules/PrefectureCheckbox';

interface PrefectureSelectorProps {
  onPrefectureChange: (prefecture: Prefecture, isChecked: boolean) => void;
}

const PrefectureSelector: React.FC<PrefectureSelectorProps> = ({ onPrefectureChange }) => {
  const [prefectures, setPrefectures] = useState<Prefecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1">
        {prefectures.map((prefecture) => (
          <PrefectureCheckbox
            key={prefecture.prefCode}
            prefecture={prefecture}
            onChange={onPrefectureChange}
          />
        ))}
      </div>
    </div>
  );
};

export default PrefectureSelector;