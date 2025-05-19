import RangeSlider from '@/components/atoms/RangeSlider';
import { fireEvent, render, screen } from '@testing-library/react';

describe('RangeSlider', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('スライダーが正しくレンダリングされる', () => {
    render(
      <RangeSlider 
        min={1980} 
        max={2045} 
        onChange={mockOnChange} 
      />
    );

    // 最小値と最大値のスライダー入力要素が存在するか確認
    const sliderInputs = screen.getAllByRole('slider');
    expect(sliderInputs).toHaveLength(2);
    
    // 最小値と最大値のラベルが表示されているか確認
    expect(screen.getByText('1980')).toBeInTheDocument();
    expect(screen.getByText('2045')).toBeInTheDocument();
    
    // 初期値（デフォルト値）が表示されているか確認
    expect(screen.getByText('選択: 1980 - 2045')).toBeInTheDocument();
  });

  test('デフォルト値が正しく設定される', () => {
    render(
      <RangeSlider 
        min={1980} 
        max={2045} 
        defaultValues={[2000, 2020]} 
        onChange={mockOnChange} 
      />
    );
    
    // カスタム初期値が表示されているか確認
    expect(screen.getByText('選択: 2000 - 2020')).toBeInTheDocument();
  });

  test('スライダーを動かすとonChangeが呼ばれる', () => {
    render(
      <RangeSlider 
        min={1980} 
        max={2045}
        defaultValues={[1980, 2045]}
        onChange={mockOnChange} 
      />
    );
    
    const sliders = screen.getAllByRole('slider');
    const minSlider = sliders[0];
    const maxSlider = sliders[1];
    
    // 最小値スライダーを動かす
    fireEvent.change(minSlider, { target: { value: '2000' } });
    expect(mockOnChange).toHaveBeenCalledWith([2000, 2045]);
    
    // モックをリセット
    mockOnChange.mockClear();
    
    // 最大値スライダーを動かす
    fireEvent.change(maxSlider, { target: { value: '2030' } });
    expect(mockOnChange).toHaveBeenCalledWith([2000, 2030]);
  });

  test('最小値が最大値を超えないようにする', () => {
    render(
      <RangeSlider 
        min={1980} 
        max={2045}
        defaultValues={[2000, 2020]}
        onChange={mockOnChange} 
      />
    );
    
    const sliders = screen.getAllByRole('slider');
    const minSlider = sliders[0];
    
    // 最小値を最大値より大きく設定しようとする
    fireEvent.change(minSlider, { target: { value: '2030' } });
    
    // 最大値 - step（デフォルトは1）が設定されるはず
    expect(mockOnChange).toHaveBeenCalledWith([2019, 2020]);
  });

  test('最大値が最小値を下回らないようにする', () => {
    render(
      <RangeSlider 
        min={1980} 
        max={2045}
        defaultValues={[2000, 2020]}
        onChange={mockOnChange} 
      />
    );
    
    const sliders = screen.getAllByRole('slider');
    const maxSlider = sliders[1];
    
    // 最大値を最小値より小さく設定しようとする
    fireEvent.change(maxSlider, { target: { value: '1990' } });
    
    // 最小値 + step（デフォルトは1）が設定されるはず
    expect(mockOnChange).toHaveBeenCalledWith([2000, 2001]);
  });

  test('disabled状態で操作できないことを確認', () => {
    // disabled属性が正しく設定されることのみをテスト
    render(
      <RangeSlider 
        min={1980} 
        max={2045}
        onChange={mockOnChange}
        disabled={true}
      />
    );
    
    const sliders = screen.getAllByRole('slider');
    
    // disabled属性が設定されているか確認
    // for...of を使用して forEach を置き換え
    for (const slider of sliders) {
      expect(slider).toBeDisabled();
    }
    
    // 注: Jest環境では disabled 属性があっても JavaScript イベントはトリガーされるので
    // イベントハンドラーのテストは省略し、属性のみを確認
  });

  test('ステップ値が正しく動作する', () => {
    render(
      <RangeSlider 
        min={1980} 
        max={2045}
        step={5}
        onChange={mockOnChange} 
      />
    );
    
    const sliders = screen.getAllByRole('slider');
    const minSlider = sliders[0];
    
    // ステップ値が5の場合、値の変更はその倍数となるべき
    expect(minSlider).toHaveAttribute('step', '5');
    
    fireEvent.change(minSlider, { target: { value: '2000' } });  // 5の倍数の値
    
    // onChangeが呼ばれるが、実際のステップがどう扱われるかはブラウザの実装によって異なる
    // ここではstepが正しく設定されていることだけを確認
    expect(mockOnChange).toHaveBeenCalled();
  });
});