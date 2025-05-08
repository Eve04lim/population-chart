import { fetchPopulation } from '@/api/services';
import type { PopulationData, Prefecture } from '@/api/types';
import type React from 'react';
import { useEffect, useState } from 'react';
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

  // 選択された都道府県が変更されたら、対応する人口データを取得
  useEffect(() => {
    const fetchData = async () => {
      if (selectedPrefectures.length === 0) {
        setPrefPopulations([]);
        return;
      }

      setLoading(true);
      try {
        // 未取得の都道府県のみAPIリクエストを行う
        const fetchPromises = selectedPrefectures
          .filter((pref) => !prefPopulations.some((p) => p.prefCode === pref.prefCode))
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
        setPrefPopulations((prev) => {
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
  }, [selectedPrefectures, prefPopulations]);

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
    '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', 
    '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
    '#aec7e8', '#ffbb78', '#98df8a', '#ff9896', '#c5b0d5',
    '#c49c94', '#f7b6d2', '#c7c7c7', '#dbdb8d', '#9edae5',
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

  if (selectedPrefectures.length === 0) {
    return (
      <div className="bg-gray-50 p-8 rounded-md text-center text-gray-500">
        <p>都道府県を選択してください</p>
      </div>
    );
  }

  return (
    <div className="h-96 w-full">
      {loading && <div className="text-center py-4">データ読み込み中...</div>}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">
          <p>{error}</p>
        </div>
      )}
      {!loading && !error && chartData.length > 0 && (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="year" 
              label={{ value: '年度', position: 'insideBottomRight', offset: -10 }} 
            />
            <YAxis 
              tickFormatter={formatYAxis}
              label={{ value: '人口数', angle: -90, position: 'insideLeft' }} 
            />
            <Tooltip formatter={(value: number) => value.toLocaleString()} />
            <Legend />
            {selectedPrefectures.map((prefecture, index) => (
              <Line
                key={prefecture.prefCode}
                type="monotone"
                dataKey={prefecture.prefName}
                stroke={colors[index % colors.length]}
                activeDot={{ r: 8 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default PopulationChart;