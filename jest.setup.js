import '@testing-library/jest-dom';

// グローバルのJest拡張
global.jest = jest;

// コンソールエラーの一部を抑制（オプション）
console.error = jest.fn();
console.warn = jest.fn();