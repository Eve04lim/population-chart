module.exports = {
    extends: [
      "next/core-web-vitals", 
      "eslint:recommended", 
      "plugin:@typescript-eslint/recommended", 
      "prettier" // Prettierとの衝突を回避
    ],
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint"],
    rules: {
      // プロジェクト固有のルールをここに追加
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/no-explicit-any": "error",
    },
  };