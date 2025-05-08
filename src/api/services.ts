import apiClient from './client';
import type { PopulationResponse, PrefecturesResponse } from './types';

// 都道府県一覧を取得するAPI
export const fetchPrefectures = async () => {
  try {
    const response = await apiClient.get<PrefecturesResponse>('/api/v1/prefectures');
    return response.data.result;
  } catch (error) {
    console.error('Error fetching prefectures:', error);
    throw error;
  }
};

// 指定された都道府県の人口構成データを取得するAPI
export const fetchPopulation = async (prefCode: number) => {
  try {
    const response = await apiClient.get<PopulationResponse>(
      '/api/v1/population/composition/perYear',
      {
        params: {
          prefCode,
        },
      }
    );
    return response.data.result;
  } catch (error) {
    console.error(`Error fetching population data for prefecture ${prefCode}:`, error);
    throw error;
  }
};