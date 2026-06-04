---
description: 數據統計分析與雙面板圖表生成流程（包含獨立樣本 t 檢定與圖表製作）
---

# 數據統計分析與圖表生成技能 (Data Analysis & Chart Generation Skill)

此技能定義了從 CSV 數據進行描述性統計、獨立樣本 t 檢定，並生成雙面板圖表與統計報告的完整自動化流程。

## 適用情境
當需要對兩組獨立數據（例如 Boys 與 Girls）進行平均數對比、數據分佈可視化與 t 檢定分析時。

## 執行步驟

### 1. 數據探索與準備
1. 確認輸入的 CSV 檔案（例如 `data.csv`）結構，欄位應包含需要比較的兩個組別名稱。
2. 檢查是否有缺失值，並在後續分析中進行適當處理（例如 `dropna()`）。

### 2. 撰寫測試程式碼 (TDD 規範)
> [!IMPORTANT]
> 根據執行規則，**必須在開發功能前先撰寫測試程式碼**，且程式碼需遵循 PEP8 規範，具備 Docstring 與詳細註解。

撰寫一個測試檔 `test_analysis.py`，內容需驗證：
* 輸入數據檔案是否存在。
* 執行數據分析與圖表生成後，產出的圖片與報告檔案是否存在且大小大於 0。

### 3. 實作數據統計與圖表生成腳本
撰寫數據分析與繪圖腳本 `analyze_data.py`。要求如下：
1. **統計檢定**：使用 `scipy.stats.ttest_ind` 執行獨立樣本 t 檢定。
2. **圖表風格**：採用現代化高級配色與樣式（如 `seaborn-v0_8-whitegrid`）。
3. **支援中文**：設定字型支援微軟正黑體，防止中文亂碼：
   ```python
   plt.rcParams['font.sans-serif'] = ['Microsoft JhengHei', 'Segoe UI', 'sans-serif']
   plt.rcParams['axes.unicode_minus'] = False
   ```
4. **雙面板佈局 (Dual Panel Layout)**：
   * **左圖 (Box Plot)**：展示四分位距、中位數分布與個別樣本抖動點 (Jitter Points)。並疊加文字卡片展示 N、均值與標準差。
   * **右圖 (Bar Plot)**：展示均值，搭配 95% 信心區間誤差線，並繪製顯著性連線標註 t 值、p 值與顯著性結果（如 ns 代表無顯著差異）。
5. **程式碼品質**：全檔案符合 PEP8、包含模組級與函數級 Docstrings、關鍵步驟需有中文註解。

### 4. 執行測試並驗證
使用 `uv` 執行測試，確保測試完全通過且無警告：
```bash
uv run --with pandas --with matplotlib --with seaborn --with scipy python test_analysis.py
```

### 5. 撰寫與更新統計分析報告
建立或更新 Traditional Chinese Markdown 報告 `analysis_report.md`，結構應包含：
1. **描述性統計分析**：以表格呈現樣本數、平均數、中位數、標準差、最大與最小值。
2. **假設檢定結論**：說明 t 統計量、p 顯著性值，並對顯著性差異給予明確結論。
3. **圖表嵌入**：使用相對路徑嵌入剛生成的 PNG 圖片：
   ```markdown
   ![統計圖表](data_chart.png)
   ```
4. **數據特徵總結**：條列核心數據發現。
