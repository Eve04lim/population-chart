import { fetchPopulation } from '@/api/services';
import type { PopulationData, Prefecture } from '@/api/types';
import { useEffect, useState } from 'react';

interface PrefecturePopulation {
  prefCode: number;
  prefName: string;
  data: PopulationData[];
}

export const usePopulation = (selectedPrefectures: Prefecture[]) => {
  const [populations, setPopulations] = useState<PrefecturePopulation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (selectedPrefectures.length === 0) {
        setPopulations([]);
        return;
      }

      setLoading(true);
      try {
        // 未取得の都道府県のみAPIリクエストを行う
        const fetchPromises = selectedPrefectures
          .filter((pref) => !populations.some((p: PrefecturePopulation) => p.prefCode === pref.prefCode))
          .map(async (pref) => {
            const result = await fetchPopulation(pref.prefCode);
            return {
              prefCode: pref.prefCode,
              prefName: pref.prefName,
              data: result.data,
            };
          });

        const newPopulations = await Promise.all(fetchPromises);
        
        // 既存のデータと新しいデータを結合
        setPopulations((prev: PrefecturePopulation[]) => {
          const updatedPops = [...prev];
          
          // 選択されていない都道府県を除外
          const filteredPops = updatedPops.filter((pop) => 
            selectedPrefectures.some((pref) => pref.prefCode === pop.prefCode)
          );
          
          // 新しいデータを追加
          return [...filteredPops, ...newPopulations];
        });
        
        setError(null);
      } catch (err) {
        setError('人口データの取得に失敗しました。');
        console.error('Error fetching population data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedPrefectures, populations]);

  return { populations, loading, error };
};