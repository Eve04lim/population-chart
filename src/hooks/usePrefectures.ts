import { fetchPrefectures } from '@/api/services';
import type { Prefecture } from '@/api/types';
import { useEffect, useState } from 'react';

export const usePrefectures = () => {
  const [prefectures, setPrefectures] = useState<Prefecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return { prefectures, loading, error };
};