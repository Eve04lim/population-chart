import { fetchPopulation } from '@/api/services';
import type { PopulationData, Prefecture } from '@/api/types';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface PopulationChartProps {
  selectedPrefectures: Prefecture[];
  populationType: string;
}

// 人口タイプの英語名（APIのレスポンスに対応）
const populationTypeMap: Record<string, string> = {
    '総人口': '総人口',
    '年少人口': '年少人口',
    '生産年齢人口': '生産年齢人口',
    '老年人口': '老年人口',
};

interface PrefecturePopulation {
  prefCode: number;
  prefName: string;
  data: PopulationData[];
}

interface ChartData {
  year: number;
  [key: string]: number | string;
}

const PopulationChart: React.FC<PopulationChartProps> = ({ selectedPrefectures, populationType }) => {
  const [prefPopulations, setPrefPopulations] = useState<PrefecturePopulation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isTableVisible, setIsTableVisible] = useState(false);
  
  // prefPopulationsの最新値にアクセスするためのref
  const prefPopulationsRef = useRef<PrefecturePopulation[]>([]);
  
  // refを更新
  useEffect(() => {
    prefPopulationsRef.current = prefPopulations;
  }, [prefPopulations]);

  // selectedPrefecturesの情報をメモ化
  const selectedPrefInfo = useMemo(() => {
    const codes = selectedPrefectures.map(pref => pref.prefCode);
    const names = selectedPrefectures.map(pref => pref.prefName);
    const prefMap = new Map(selectedPrefectures.map(pref => [pref.prefCode, pref]));
    const isEmpty = selectedPrefectures.length === 0;
    
    return { codes, names, prefMap, isEmpty };
  }, [selectedPrefectures]);

  // APIから人口データを取得する関数
  const fetchPrefectureData = useCallback(async (prefecture: Prefecture) => {
    try {
      const result = await fetchPopulation(prefecture.prefCode);
      return {
        prefCode: prefecture.prefCode,
        prefName: prefecture.prefName,
        data: result.data,
      };
    } catch (err) {
      console.error(`Error fetching population data for ${prefecture.prefName}:`, err);
      throw err;
    }
  }, []);

  // 選択された都道府県が変更されたら、対応する人口データを取得
  useEffect(() => {
    const fetchData = async () => {
      if (selectedPrefInfo.isEmpty) {
        setPrefPopulations([]);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        // 現在のprefPopulationsを取得 (refから)
        const currentPopulations = [...prefPopulationsRef.current];
        
        // 選択されていない都道府県を除外
        const filteredPopulations = currentPopulations.filter(pop => 
          selectedPrefInfo.codes.includes(pop.prefCode)
        );
        
        // まだデータを取得していない都道府県を特定
        const prefecturesToFetch = Array.from(selectedPrefInfo.prefMap.values()).filter(
          pref => !filteredPopulations.some(p => p.prefCode === pref.prefCode)
        );
        
        if (prefecturesToFetch.length > 0) {
          // 新たに選択された都道府県のデータをフェッチ
          const newDataPromises = prefecturesToFetch.map(fetchPrefectureData);
          const newData = await Promise.all(newDataPromises);
          
          // 新しいデータと既存のデータを結合
          setPrefPopulations([...filteredPopulations, ...newData]);
        } else if (filteredPopulations.length !== currentPopulations.length) {
          // 選択解除された都道府県がある場合、フィルタリングした結果を設定
          setPrefPopulations(filteredPopulations);
        }
      } catch (err) {
        setError('人口データの取得に失敗しました。');
        console.error('Error fetching population data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedPrefInfo, fetchPrefectureData]);

  // 選択された都道府県または人口タイプが変更されたら、グラフデータを作成
  useEffect(() => {
    if (prefPopulations.length === 0) {
      setChartData([]);
      return;
    }

    // グラフデータの作成
    const yearsSet = new Set<number>();
    
    // 全ての年を取得
    for (const prefPop of prefPopulations) {
      const populationData = prefPop.data.find((d) => d.label === populationTypeMap[populationType]);
      if (populationData) {
        for (const d of populationData.data) {
          yearsSet.add(d.year);
        }
      }
    }
    
    // 年の順番に並び替え
    const years = Array.from(yearsSet).sort((a, b) => a - b);
    
    // チャートデータの作成
    const data = years.map((year) => {
      const yearData: ChartData = { year };
      
      for (const prefPop of prefPopulations) {
        const populationData = prefPop.data.find((d) => d.label === populationTypeMap[populationType]);
        if (populationData) {
          const yearValue = populationData.data.find((d) => d.year === year);
          if (yearValue) {
            yearData[prefPop.prefName] = yearValue.value;
          }
        }
      }
      
      return yearData;
    });
    
    setChartData(data);
  }, [prefPopulations, populationType]);

  // 選択された都道府県を色に対応付けるための配列
  const colors = [
    '#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', 
    '#1abc9c', '#d35400', '#34495e', '#7f8c8d', '#c0392b',
    '#16a085', '#f1c40f', '#8e44ad', '#27ae60', '#e67e22',
  ];

  // グラフ上の数値を適切にフォーマットする関数
  const formatYAxis = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } 
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
  };

  // カスタムツールチップの実装
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-md rounded">
          <p className="font-bold text-sm">{label}年</p>
          <div className="mt-1">
            {payload.map((entry: any, index: number) => (
              <div key={`tooltip-${index}`} className="flex items-center mt-1">
                <div 
                  className="w-3 h-3 mr-2 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="mr-1">{entry.name}:</span>
                <span className="font-semibold">{entry.value.toLocaleString()}人</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  if (selectedPrefInfo.isEmpty) {
    return (
      <div className="bg-gray-50 p-8 rounded-md text-center text-gray-500">
        <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-lg font-medium">都道府県を選択してください</p>
        <p className="text-sm mt-1">人口推移グラフを表示するには、都道府県を選択してください</p>
      </div>
    );
  }

  return (
    <div>
      {loading && <div className="text-center py-4">データ読み込み中...</div>}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">
          <p>{error}</p>
        </div>
      )}
      {!loading && !error && chartData.length > 0 && (
        <>
          <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis 
                  dataKey="year" 
                  label={{ value: '年度', position: 'insideBottomRight', offset: -10 }} 
                />
                <YAxis 
                  tickFormatter={formatYAxis}
                  label={{ value: '人口数', angle: -90, position: 'insideLeft' }} 
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {selectedPrefectures.map((prefecture, index) => (
                  <Line
                    key={prefecture.prefCode}
                    type="monotone"
                    dataKey={prefecture.prefName}
                    stroke={colors[index % colors.length]}
                    activeDot={{ r: 8 }}
                    strokeWidth={2}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">{populationType}データ</h3>
              <button
                className="text-blue-600 hover:text-blue-800 flex items-center"
                onClick={() => setIsTableVisible(!isTableVisible)}
              >
                {isTableVisible ? '詳細を隠す' : '詳細を表示'}
                <svg 
                  className={`ml-1 w-5 h-5 transform transition-transform ${isTableVisible ? 'rotate-180' : ''}`} 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            {isTableVisible && (
              <div className="overflow-x-auto mt-2">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        都道府県
                      </th>
                      {chartData.map(item => (
                        <th 
                          key={item.year} 
                          scope="col" 
                          className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {item.year}年
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedPrefectures.map((prefecture, index) => (
                      <tr key={prefecture.prefCode} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <div 
                              className="w-3 h-3 mr-2 rounded-full" 
                              style={{ backgroundColor: colors[index % colors.length] }}
                            />
                            <div className="text-sm font-medium text-gray-900">{prefecture.prefName}</div>
                          </div>
                        </td>
                        {chartData.map(data => (
                          <td key={data.year} className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-500">
                            {data[prefecture.prefName] 
                              ? (data[prefecture.prefName] as number).toLocaleString() 
                              : '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default PopulationChart;