import { fetchPopulation } from '@/api/services';
import type { PopulationData, Prefecture } from '@/api/types';
import RangeSlider from '@/components/atoms/RangeSlider';
import { downloadCSV, generateCSV } from '@/utils/csv';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  type TooltipProps,
  XAxis,
  YAxis,
} from 'recharts';

interface PopulationChartProps {
  selectedPrefectures: Prefecture[];
  populationType: string;
  darkMode?: boolean;
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

// recharts の tooltip 型
type TooltipContentProps = TooltipProps<number, string> & {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: ChartData;
    dataKey: string;
    color: string;
  }>;
  label?: string;
};

const PopulationChart: React.FC<PopulationChartProps> = ({ selectedPrefectures, populationType, darkMode = false }) => {
  const [prefPopulations, setPrefPopulations] = useState<PrefecturePopulation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [filteredChartData, setFilteredChartData] = useState<ChartData[]>([]);
  const [isTableVisible, setIsTableVisible] = useState(false);
  const [yearRange, setYearRange] = useState<[number, number]>([1980, 2045]);
  const [availableYears, setAvailableYears] = useState<[number, number]>([1980, 2045]);
  
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
      setFilteredChartData([]);
      setAvailableYears([1980, 2045]); // デフォルト値
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
    
    // 利用可能な年の範囲を設定
    if (years.length > 0) {
      const minYear = years[0];
      const maxYear = years[years.length - 1];
      setAvailableYears([minYear, maxYear]);
      setYearRange([minYear, maxYear]); // 初期値は全範囲
    }
    
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
    setFilteredChartData(data); // 初期状態では全データを表示
  }, [prefPopulations, populationType]);

  // 年範囲が変更されたらチャートデータをフィルタリング
  useEffect(() => {
    if (chartData.length === 0) return;

    const filtered = chartData.filter(
      data => data.year >= yearRange[0] && data.year <= yearRange[1]
    );
    
    setFilteredChartData(filtered);
  }, [chartData, yearRange]);

  // 年範囲の変更を処理する関数
  const handleYearRangeChange = (values: [number, number]) => {
    setYearRange(values);
  };

  // 選択された都道府県を色に対応付けるための配列
  const colors = [
    '#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', 
    '#1abc9c', '#d35400', '#34495e', '#7f8c8d', '#c0392b',
    '#16a085', '#f1c40f', '#8e44ad', '#27ae60', '#e67e22',
  ];

  // グラフの数値を適切にフォーマットする関数
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
  const CustomTooltip = ({ active, payload, label }: TooltipContentProps) => {
    if (active && payload && payload.length > 0) {
      return (
        <div className={`p-3 border border-gray-200 shadow-md rounded ${darkMode ? 'bg-gray-800 text-white' : 'bg-white'}`}>
          <p className="font-bold text-sm">{label}年</p>
          <div className="mt-1">
            {payload.map((entry, index) => (
              <div key={`tooltip-item-${index}`} className="flex items-center mt-1">
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

  // CSVファイルのダウンロード処理
  const handleDownloadCSV = () => {
    // ファイル名の生成
    const date = new Date().toISOString().slice(0, 10);
    const yearRangeText = `${yearRange[0]}-${yearRange[1]}`;
    const filename = `${populationType}_人口データ_${yearRangeText}_${date}.csv`;
    
    // CSVデータを生成してダウンロード
    const csvData = generateCSV(filteredChartData, selectedPrefectures, populationType);
    downloadCSV(csvData, filename);
  };

  // 全期間を表示する関数
  const handleResetYearRange = () => {
    setYearRange(availableYears);
  };

  if (selectedPrefInfo.isEmpty) {
    return (
      <div className={`p-8 rounded-md text-center ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-500'}`}>
        <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true" role="img">
          <title>グラフアイコン</title>
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
          <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
            <div>
              <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : ''}`}>表示期間</h3>
              <div className="w-full md:w-96 mt-1">
                <RangeSlider
                  min={availableYears[0]}
                  max={availableYears[1]}
                  defaultValues={yearRange}
                  onChange={handleYearRangeChange}
                  step={5}
                  disabled={loading}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleResetYearRange}
                className={`px-3 py-1.5 rounded text-sm ${
                  darkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
                disabled={yearRange[0] === availableYears[0] && yearRange[1] === availableYears[1]}
              >
                全期間表示
              </button>
              <button
                type="button"
                onClick={handleDownloadCSV}
                className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors duration-200"
                aria-label="CSVファイルをダウンロード"
                data-testid="csv-download-button"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true" role="img">
                  <title>ダウンロードアイコン</title>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                CSVダウンロード
              </button>
            </div>
          </div>

          <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={filteredChartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#444' : '#eee'} />
                <XAxis 
                  dataKey="year" 
                  label={{ 
                    value: '年度', 
                    position: 'insideBottomRight', 
                    offset: -10,
                    fill: darkMode ? '#aaa' : '#666'
                  }} 
                  stroke={darkMode ? '#aaa' : '#666'}
                />
                <YAxis 
                  tickFormatter={formatYAxis}
                  label={{ 
                    value: '人口数', 
                    angle: -90, 
                    position: 'insideLeft',
                    fill: darkMode ? '#aaa' : '#666'
                  }} 
                  stroke={darkMode ? '#aaa' : '#666'}
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

          <div className={`mt-6 pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : ''}`}>{populationType}データ ({yearRange[0]}年〜{yearRange[1]}年)</h3>
              <button
                type="button"
                className={`flex items-center ${
                  darkMode 
                    ? 'text-blue-400 hover:text-blue-300' 
                    : 'text-blue-600 hover:text-blue-800'
                }`}
                onClick={() => setIsTableVisible(!isTableVisible)}
                aria-expanded={isTableVisible}
                aria-controls="population-data-table"
              >
                {isTableVisible ? '詳細を隠す' : '詳細を表示'}
                <svg 
                  className={`ml-1 w-5 h-5 transform transition-transform ${isTableVisible ? 'rotate-180' : ''}`} 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                  role="img"
                >
                  <title>矢印アイコン</title>
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            {isTableVisible && (
              <div id="population-data-table" className="overflow-x-auto mt-2">
                <table className={`min-w-full divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  <thead className={darkMode ? 'bg-gray-800' : 'bg-gray-50'}>
                    <tr>
                      <th scope="col" className={`px-4 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                        都道府県
                      </th>
                      {filteredChartData.map(item => (
                        <th 
                          key={item.year} 
                          scope="col" 
                          className={`px-4 py-3 text-right text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}
                        >
                          {item.year}年
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                    {selectedPrefectures.map((prefecture, index) => (
                      <tr key={prefecture.prefCode} className={`${
                        index % 2 === 0 
                          ? darkMode ? 'bg-gray-800/50' : 'bg-gray-50' 
                          : darkMode ? 'bg-gray-900' : 'bg-white'
                      }`}>
                        <td className={`px-4 py-3 whitespace-nowrap ${darkMode ? 'text-white' : ''}`}>
                          <div className="flex items-center">
                            <div 
                              className="w-3 h-3 mr-2 rounded-full" 
                              style={{ backgroundColor: colors[index % colors.length] }}
                            />
                            <div className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                              {prefecture.prefName}
                            </div>
                          </div>
                        </td>
                        {filteredChartData.map(data => (
                          <td key={data.year} className={`px-4 py-3 whitespace-nowrap text-right text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
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