import type { Prefecture } from '@/api/types';

interface ChartData {
  year: number;
  [key: string]: number | string;
}

/**
 * グラフデータをCSV形式に変換する
 * @param chartData グラフに表示されているデータ
 * @param selectedPrefectures 選択された都道府県
 * @returns CSV形式の文字列
 */
export const generateCSV = (
  chartData: ChartData[],
  selectedPrefectures: Prefecture[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _populationType: string // 将来の拡張性のために残しておく
): string => {
  if (chartData.length === 0 || selectedPrefectures.length === 0) return '';

  // ヘッダー行の生成 (年度, 都道府県1, 都道府県2, ...)
  const headers = ['年度', ...selectedPrefectures.map(pref => escapeCSVValue(pref.prefName))];
  const headerRow = headers.join(',');

  // データ行の生成
  const rows = chartData.map(data => {
    const rowValues = [data.year.toString()]; // yearを文字列に変換
    
    for (const prefecture of selectedPrefectures) {
      const value = data[prefecture.prefName];
      rowValues.push(value !== undefined ? String(value) : ''); // 値を文字列に変換
    }
    
    return rowValues.join(',');
  });

  // ヘッダーとデータ行を結合してCSVを作成
  return [headerRow, ...rows].join('\n');
};

/**
 * CSVファイルをダウンロードする
 * @param csv CSV形式の文字列
 * @param filename ダウンロードするファイル名
 */
export const downloadCSV = (csv: string, filename: string): void => {
  if (!csv) return;

  // CSVファイルの作成とダウンロード
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url); // メモリリークを防ぐためにURLを解放
};

/**
 * CSV値をエスケープする（カンマを含む場合はダブルクォートで囲む）
 * @param value エスケープする値
 * @returns エスケープされた値
 */
export const escapeCSVValue = (value: string | number): string => {
  const stringValue = String(value);
  return stringValue.includes(',') ? `"${stringValue}"` : stringValue;
};