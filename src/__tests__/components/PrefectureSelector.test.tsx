import { fetchPrefectures } from '@/api/services';
import PrefectureSelector from '@/components/organisms/PrefectureSelector';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// APIモック
jest.mock('@/api/services', () => ({
  fetchPrefectures: jest.fn(),
}));

describe('PrefectureSelector', () => {
  const mockPrefectures = [
    { prefCode: 1, prefName: '北海道' },
    { prefCode: 2, prefName: '青森県' },
    { prefCode: 13, prefName: '東京都' },
  ];

  const mockOnPrefectureChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (fetchPrefectures as jest.Mock).mockResolvedValue(mockPrefectures);
  });

  test('都道府県一覧を表示する', async () => {
    render(<PrefectureSelector onPrefectureChange={mockOnPrefectureChange} />);
    
    // 読み込み中の表示
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
    
    // データが読み込まれたら都道府県が表示される
    await waitFor(() => {
      expect(screen.getByLabelText('北海道')).toBeInTheDocument();
      expect(screen.getByLabelText('青森県')).toBeInTheDocument();
      expect(screen.getByLabelText('東京都')).toBeInTheDocument();
    });
  });

  test('チェックボックスがクリックされたらコールバックが呼ばれる', async () => {
    const user = userEvent.setup();
    render(<PrefectureSelector onPrefectureChange={mockOnPrefectureChange} />);
    
    // データ読み込み完了を待つ
    await waitFor(() => {
      expect(screen.getByLabelText('北海道')).toBeInTheDocument();
    });
    
    // チェックボックスをクリック
    const checkbox = screen.getByLabelText('北海道');
    await user.click(checkbox);
    
    // コールバックが正しく呼ばれることを確認
    expect(mockOnPrefectureChange).toHaveBeenCalledWith(
      expect.objectContaining({ prefCode: 1, prefName: '北海道' }),
      true
    );
  });

  test('APIエラー時にエラーメッセージを表示する', async () => {
    // APIエラーをモック
    (fetchPrefectures as jest.Mock).mockRejectedValue(new Error('API Error'));
    
    render(<PrefectureSelector onPrefectureChange={mockOnPrefectureChange} />);
    
    // エラーメッセージが表示される
    await waitFor(() => {
      expect(screen.getByText('都道府県データの取得に失敗しました。')).toBeInTheDocument();
    });
  });
});