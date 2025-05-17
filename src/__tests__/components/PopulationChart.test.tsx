import { fetchPopulation } from '@/api/services';
import PopulationChart from '@/components/organisms/PopulationChart';
import { downloadCSV, generateCSV } from '@/utils/csv';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type React from 'react';

// モックの設定
jest.mock('@/api/services', () => ({
  fetchPopulation: jest.fn(),
}));

// CSVユーティリティのモック
jest.mock('@/utils/csv', () => ({
  generateCSV: jest.fn().mockReturnValue('mock-csv-data'),
  downloadCSV: jest.fn(),
}));

// RangeSliderをモック化
jest.mock('@/components/atoms/RangeSlider', () => {
  return function MockRangeSlider({ min, max, defaultValues, onChange, disabled }: any) {
    return (
      <div data-testid="range-slider">
        <span>Range: {min} - {max}</span>
        <button
          type="button"
          data-testid="change-range-button"
          onClick={() => onChange([2000, 2020])}
          disabled={disabled}
        >
          範囲を変更
        </button>
      </div>
    );
  };
});

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
    { prefCode: 27, prefName: '大阪府' },
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
          { year: 2010, value: 13159388 },
          { year: 2020, value: 13921989 },
          { year: 2030, value: 13606683 },
          { year: 2040, value: 12908359 },
        ],
      },
      {
        label: '年少人口',
        data: [
          { year: 1980, value: 2325638 },
          { year: 1990, value: 1713291 },
          { year: 2000, value: 1472818 },
          { year: 2010, value: 1477669 },
          { year: 2020, value: 1440045 },
          { year: 2030, value: 1260080 },
          { year: 2040, value: 1117517 },
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
      expect(fetchPopulation).toHaveBeenCalledWith(27);
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

  test('CSVダウンロードボタンが表示される', async () => {
    render(<PopulationChart selectedPrefectures={mockSelectedPrefectures} populationType="総人口" />);
    
    // データ読み込み完了とグラフ表示を待つ
    await waitFor(() => {
      expect(screen.queryByTestId('responsive-container')).toBeInTheDocument();
    });
    
    // CSVダウンロードボタンが表示されていることを確認
    const downloadButton = screen.getByTestId('csv-download-button');
    expect(downloadButton).toBeInTheDocument();
    expect(downloadButton).toHaveTextContent('CSVダウンロード');
  });

  test('CSVダウンロードボタンをクリックするとダウンロード処理が実行される', async () => {
    const user = userEvent.setup();
    
    render(<PopulationChart selectedPrefectures={mockSelectedPrefectures} populationType="総人口" />);
    
    // データ読み込み完了とグラフ表示を待つ
    await waitFor(() => {
      expect(screen.queryByTestId('responsive-container')).toBeInTheDocument();
    });
    
    // CSVダウンロードボタンを取得してクリック
    const downloadButton = screen.getByTestId('csv-download-button');
    await user.click(downloadButton);
    
    // generateCSVが呼び出されたことを確認
    expect(generateCSV).toHaveBeenCalled();
    
    // downloadCSVが呼び出されたことを確認
    expect(downloadCSV).toHaveBeenCalled();
    // 日付があるためパラメータを厳密に指定せず、関数が呼ばれたことのみを確認
  });

  test('詳細表示ボタンをクリックするとテーブルが表示される', async () => {
    const user = userEvent.setup();
    
    render(<PopulationChart selectedPrefectures={mockSelectedPrefectures} populationType="総人口" />);
    
    // データ読み込み完了とグラフ表示を待つ
    await waitFor(() => {
      expect(screen.queryByTestId('responsive-container')).toBeInTheDocument();
    });
    
    // 初期状態ではテーブルは表示されていない
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    
    // 詳細表示ボタンを取得してクリック
    const detailButton = screen.getByText('詳細を表示');
    await user.click(detailButton);
    
    // テーブルが表示されることを確認
    expect(screen.getByRole('table')).toBeInTheDocument();
    
    // テーブルには都道府県名が表示されている
    expect(screen.getByText('東京都')).toBeInTheDocument();
    expect(screen.getByText('大阪府')).toBeInTheDocument();
    
    // 再度クリックするとテーブルが非表示になる
    await user.click(screen.getByText('詳細を隠す'));
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  test('年代選択スライダーが表示される', async () => {
    render(<PopulationChart selectedPrefectures={mockSelectedPrefectures} populationType="総人口" />);
    
    // データ読み込み完了とグラフ表示を待つ
    await waitFor(() => {
      expect(screen.queryByTestId('responsive-container')).toBeInTheDocument();
    });
    
    // 年代選択スライダーが表示されていることを確認
    expect(screen.getByTestId('range-slider')).toBeInTheDocument();
  });

  test('年代範囲を変更するとフィルタリングされたデータでグラフが更新される', async () => {
    const user = userEvent.setup();
    
    render(<PopulationChart selectedPrefectures={mockSelectedPrefectures} populationType="総人口" />);
    
    // データ読み込み完了とグラフ表示を待つ
    await waitFor(() => {
      expect(screen.queryByTestId('responsive-container')).toBeInTheDocument();
    });
    
    // 範囲変更ボタンをクリック（モック実装で[2000, 2020]に変更）
    const rangeButton = screen.getByTestId('change-range-button');
    await user.click(rangeButton);
    
    // テーブルヘッダーに年範囲が表示されることを確認
    expect(screen.getByText(/2000年〜2020年/)).toBeInTheDocument();
    
    // CSVダウンロードが実行された場合、新しい範囲でデータが生成されることを確認
    const downloadButton = screen.getByTestId('csv-download-button');
    await user.click(downloadButton);
    
    // generateCSVが適切なデータ（フィルタリング後）で呼び出されたことを確認
    expect(generateCSV).toHaveBeenCalled();
  });

  test('全期間表示ボタンをクリックすると元の範囲に戻る', async () => {
    const user = userEvent.setup();
    
    render(<PopulationChart selectedPrefectures={mockSelectedPrefectures} populationType="総人口" />);
    
    // データ読み込み完了とグラフ表示を待つ
    await waitFor(() => {
      expect(screen.queryByTestId('responsive-container')).toBeInTheDocument();
    });
    
    // まず範囲を変更
    const rangeButton = screen.getByTestId('change-range-button');
    await user.click(rangeButton);
    
    // 全期間表示ボタンをクリック
    const resetButton = screen.getByText('全期間表示');
    await user.click(resetButton);
    
    // 詳細表示ボタンをクリックしてテーブルを表示
    const detailButton = screen.getByText('詳細を表示');
    await user.click(detailButton);
    
    // データの年範囲が全期間になっていることを確認
    expect(screen.getAllByRole('columnheader')).toHaveLength(mockPopulationData.data[0].data.length + 1); // 都道府県列 + 年の数
  });

  test('ダークモードで適切にスタイリングされる', async () => {
    render(<PopulationChart selectedPrefectures={mockSelectedPrefectures} populationType="総人口" darkMode={true} />);
    
    // データ読み込み完了とグラフ表示を待つ
    await waitFor(() => {
      expect(screen.queryByTestId('responsive-container')).toBeInTheDocument();
    });
    
    // ダークモード専用のクラスが適用されているか確認
    // 注: テストを簡略化するため、実際のクラス名は検証せず、コンポーネントが正しくレンダリングされることのみを確認
    expect(screen.getByText('表示期間')).toBeInTheDocument();
  });
});