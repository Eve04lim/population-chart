import { fetchPopulation } from '@/api/services';
import PopulationChart from '@/components/organisms/PopulationChart';
import { render, screen, waitFor } from '@testing-library/react';
import type React from 'react';

// モックの設定
jest.mock('@/api/services', () => ({
  fetchPopulation: jest.fn(),
}));

// rechartsのモック
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

describe('PopulationChart', () => {
  // モックデータの設定
  const mockSelectedPrefectures = [
    { prefCode: 13, prefName: '東京都' },
  ];

  const mockPopulationData = {
    boundaryYear: 2020,
    data: [
      {
        label: '総人口',
        data: [
          { year: 1980, value: 11618281 },
          { year: 1990, value: 11855563 },
          { year: 2000, value: 12064101 },
        ],
      },
      {
        label: '年少人口',
        data: [
          { year: 1980, value: 2325638 },
          { year: 1990, value: 1713291 },
          { year: 2000, value: 1472818 },
        ],
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (fetchPopulation as jest.Mock).mockResolvedValue(mockPopulationData);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('選択された都道府県がない場合はメッセージを表示する', () => {
    render(<PopulationChart selectedPrefectures={[]} populationType="総人口" />);
    expect(screen.getByText('都道府県を選択してください')).toBeInTheDocument();
  });

  test('選択された都道府県があれば、人口データを取得してグラフを表示する', async () => {
    render(<PopulationChart selectedPrefectures={mockSelectedPrefectures} populationType="総人口" />);
    
    // APIが呼び出されたことを確認
    await waitFor(() => {
      expect(fetchPopulation).toHaveBeenCalledWith(13);
    });
    
    // グラフコンポーネントが表示されるのを待つ
    await waitFor(() => {
      expect(screen.queryByTestId('responsive-container')).toBeInTheDocument();
    });
    
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByTestId('x-axis')).toBeInTheDocument();
    expect(screen.getByTestId('y-axis')).toBeInTheDocument();
  }, 10000); // タイムアウトを10秒に延長

  test('APIエラー時にエラーメッセージを表示する', async () => {
    // APIエラーをモック
    (fetchPopulation as jest.Mock).mockRejectedValue(new Error('API Error'));
    
    render(<PopulationChart selectedPrefectures={mockSelectedPrefectures} populationType="総人口" />);
    
    // エラーメッセージが表示されるのを待つ
    await waitFor(() => {
      expect(screen.queryByText('人口データの取得に失敗しました。')).toBeInTheDocument();
    });
  });
});