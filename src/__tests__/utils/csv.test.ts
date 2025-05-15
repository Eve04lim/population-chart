import type { Prefecture } from '@/api/types';
import { downloadCSV, escapeCSVValue, generateCSV } from '@/utils/csv';
import '@testing-library/jest-dom';

// テスト用の型定義
interface ChartData {
  year: number;
  [key: string]: number | string;
}

describe('CSV Utility Functions', () => {
  // Blobとdocument操作のモック
  beforeAll(() => {
    // Blobのモック
    global.Blob = jest.fn().mockImplementation((content, options) => ({
      content,
      options,
      size: 123,
      type: options?.type || '',
    }));

    // URL関数のモック
    global.URL.createObjectURL = jest.fn().mockReturnValue('mock-url');
    global.URL.revokeObjectURL = jest.fn();

    // DOM要素のモック
    const mockAnchorElement = {
      setAttribute: jest.fn(),
      click: jest.fn(),
      style: { visibility: '' },
    };

    document.createElement = jest.fn().mockImplementation((tag) => {
      if (tag === 'a') return mockAnchorElement;
      // デフォルトの実装を呼び出す
      const originalCreateElement = jest.requireActual('document').createElement;
      return originalCreateElement(tag);
    });

    document.body.appendChild = jest.fn();
    document.body.removeChild = jest.fn();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateCSV', () => {
    test('returns empty string when no data is provided', () => {
      const chartData: ChartData[] = [];
      const prefectures: Prefecture[] = [];
      const populationType = '総人口';
      
      const result = generateCSV(chartData, prefectures, populationType);
      expect(result).toBe('');
    });

    test('correctly formats header and data rows', () => {
      const chartData: ChartData[] = [
        { year: 2000, '東京都': 12064101, '大阪府': 8805081 },
        { year: 2010, '東京都': 13159388, '大阪府': 8865245 }
      ];
      
      const prefectures: Prefecture[] = [
        { prefCode: 13, prefName: '東京都' },
        { prefCode: 27, prefName: '大阪府' }
      ];
      
      const populationType = '総人口';
      
      const result = generateCSV(chartData, prefectures, populationType);
      
      // 期待されるCSV形式
      const expected = 
        '年度,東京都,大阪府\n' +
        '2000,12064101,8805081\n' +
        '2010,13159388,8865245';
      
      expect(result).toBe(expected);
    });

    test('handles missing data with empty values', () => {
      const chartData: ChartData[] = [
        { year: 2000, '東京都': 12064101 }, // 大阪府のデータがない
        { year: 2010, '東京都': 13159388, '大阪府': 8865245 }
      ];
      
      const prefectures: Prefecture[] = [
        { prefCode: 13, prefName: '東京都' },
        { prefCode: 27, prefName: '大阪府' }
      ];
      
      const populationType = '総人口';
      
      const result = generateCSV(chartData, prefectures, populationType);
      
      // 期待されるCSV形式（欠損値は空文字）
      const expected = 
        '年度,東京都,大阪府\n' +
        '2000,12064101,\n' +
        '2010,13159388,8865245';
      
      expect(result).toBe(expected);
    });
  });

  describe('escapeCSVValue', () => {
    test('wraps values with commas in double quotes', () => {
      expect(escapeCSVValue('データ, カンマ付き')).toBe('"データ, カンマ付き"');
      expect(escapeCSVValue('通常データ')).toBe('通常データ');
      expect(escapeCSVValue(12345)).toBe('12345');
    });
  });

  describe('downloadCSV', () => {
    test('does not create blob when csv is empty', () => {
      downloadCSV('', 'test.csv');
      expect(global.Blob).not.toHaveBeenCalled();
      expect(global.URL.createObjectURL).not.toHaveBeenCalled();
    });

    test('creates blob and triggers download', () => {
      const csvData = 'header1,header2\nvalue1,value2';
      const filename = 'test.csv';
      
      downloadCSV(csvData, filename);
      
      // Blobが作成されたことを確認
      expect(global.Blob).toHaveBeenCalledWith([csvData], { type: 'text/csv;charset=utf-8;' });
      
      // URL.createObjectURLが呼び出されたことを確認
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      
      // aタグの属性が設定されたことを確認
      expect(document.createElement('a').setAttribute).toHaveBeenCalledWith('href', 'mock-url');
      expect(document.createElement('a').setAttribute).toHaveBeenCalledWith('download', filename);
      
      // クリックイベントが発生したことを確認
      expect(document.createElement('a').click).toHaveBeenCalled();
      
      // DOMの追加・削除が行われたことを確認
      expect(document.body.appendChild).toHaveBeenCalled();
      expect(document.body.removeChild).toHaveBeenCalled();
      
      // URL.revokeObjectURLが呼び出されたことを確認（メモリリーク防止）
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('mock-url');
    });
  });
});