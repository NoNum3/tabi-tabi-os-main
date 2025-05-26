[English](#contributing-to-tabi-os) | [繁體中文](#貢獻指南)

---

# Contributing to Tabi OS

Welcome to Tabi OS! We're excited to have you contribute to our modular, app-based desktop platform. Please read this guide to ensure your contributions are effective, maintainable, and consistent with our standards.

---

## 🚀 Project Overview
Tabi OS is a modular, Next.js-based desktop environment. Each feature or app lives in its own folder under `/src/apps/`, enabling easy contribution, isolation, and future growth. All apps are auto-discovered—no global code changes are required to add new apps!

---

## 🤝 Ways to Contribute
- Report bugs or request features via GitHub Issues
- Improve documentation (including this file)
- Add translations (per-app i18n in `/locales/`)
- Contribute to existing apps (see below)
- Create your own app (see below)

---

## ⚡ Quick Start
1. **Install dependencies:**
   ```sh
   bun install
   ```
2. **Start the dev server:**
   ```sh
   bun dev
   ```
3. **Lint and auto-fix:**
   ```sh
   bun lint
   ```
4. **Run tests (if available):**
   ```sh
   bun test
   ```

---

## 🧑‍💻 Code Standards & Best Practices
- All code for a feature/app stays in its folder (`/src/apps/[app]/`)
- Use shared code from `/src/shared/` if needed
- No unnecessary cross-app imports
- Auto-discovery for app registration (no manual imports)
- Naming: App folders (kebab-case/lowerCamelCase), Components (PascalCase), Utilities (camelCase)
- Accessibility: labels, keyboard navigation, semantic HTML/ARIA, color contrast
- Performance: lazy-load heavy dependencies, optimize images, code splitting
- Every app must have a `README.md` and (if needed) `manifest.json`

---

## 🏗️ How to Create a New App
- Create your app folder in `/src/apps/[your-app]/` (use kebab-case or lowerCamelCase)
- Add `index.ts` (main export), `config.ts` (window config), `README.md`, `manifest.json` (if needed)
- Add `/locales/` for translations, `/public/` for assets, `/tests/` for tests (optional)
- Use the platform window system and provide window config
- Make your app responsive and accessible
- Use per-app keys/namespaces for persistent data
- Document migrations/versioning in your app's README
- No global code changes required! Your app will be auto-discovered

---

## 🛠️ How to Contribute to Existing Apps
- Make changes only within that app's directory (`/src/apps/[app]/`)
- Follow the app's own `README.md` and structure
- Do not introduce cross-app imports unless absolutely necessary
- Ensure your changes are documented and tested

---

## 🌏 How to Contribute Translations
- Add or update translation files in `/src/locales/` (for platform) or `/src/apps/[app]/locales/` (for apps)
- For Chinese, use `zh.json` (Traditional Chinese)
- Example: `/src/locales/zh.json` or `/src/apps/notepad/locales/zh.json`
- Follow the structure of `en.json` for consistency
- Test your translations in the UI
- Add your name to the translators' list in the app's `README.md` if you wish
- Open an issue or PR for translation help or review

---

## 🔄 Pull Request Process
- Branch from `main` and use descriptive branch names (e.g., `feature/my-new-app`, `fix/bug-description`)
- Follow Conventional Commits for commit messages
- Ensure all code is linted, tested, and documented
- No global code changes for new apps
- Open a Pull Request: fill out the PR template, link related issues, ensure all checks pass
- Address feedback promptly; only merge when all requirements are met

---

## ❓ FAQ / Common Pitfalls
- **Q: Can I add my own app without changing global files?**
  - A: Yes! Just add your app to `/src/apps/` and it will be auto-discovered.
- **Q: How do I add translations?**
  - A: See the translation section above.
- **Q: What if my PR fails lint or test checks?**
  - A: Please fix all issues before requesting review.

---

## 🌐 Code of Conduct
Please be respectful and inclusive. See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) for details.

---

## 📚 Resources
- [Project README](./README.md)
- [Architecture & Rules](see `/explanation.txt` and `/src/config/appRegistry.ts`)
- [Product Roadmap](see `/explanation.txt`)
- [Shadcn UI](https://ui.shadcn.com/)
- [Next.js Docs](https://nextjs.org/docs)
- [Bun Docs](https://bun.sh/docs)
- [i18next Docs](https://www.i18next.com/)

---

## ✅ Contributor Checklist
- I followed the folder and naming conventions
- My code is accessible and responsive
- I added or updated documentation
- I ran lint and tests, and fixed all issues
- My app or feature is self-contained in its folder
- I added translations if needed
- I did not make unnecessary global changes

---

Thank you for helping make Tabi OS better! 🎉


# 貢獻指南

歡迎來到 Tabi OS！我們很高興您能為我們的模組化應用桌面平台做出貢獻。請閱讀本指南，以確保您的貢獻高效、可維護且符合我們的標準。

---

## 🚀 專案簡介
Tabi OS 是一個模組化、基於 Next.js 的桌面環境。每個功能或應用程式都在 `/src/apps/` 下有自己的資料夾，方便貢獻、隔離與未來擴展。所有應用程式都會自動被發現，新增應用無需全域程式碼更動！

---

## 🤝 貢獻方式
- 透過 GitHub Issues 回報錯誤或提出新功能需求
- 改進文件（包括本文件）
- 新增翻譯（每個應用的 i18n 於 `/locales/`）
- 為現有應用程式做出貢獻（見下文）
- 創建您自己的應用程式（見下文）

---

## ⚡ 快速開始
1. **安裝依賴：**
   ```sh
   bun install
   ```
2. **啟動開發伺服器：**
   ```sh
   bun dev
   ```
3. **執行程式碼檢查與自動修復：**
   ```sh
   bun lint
   ```
4. **執行測試（如有）：**
   ```sh
   bun test
   ```

---

## 🧑‍💻 代碼規範與最佳實踐
- 所有功能/應用程式的程式碼都應放在其資料夾內（`/src/apps/[app]/`）
- 如有需要，請使用 `/src/shared/` 的共用程式碼
- 不要有不必要的跨應用程式引用
- 應用註冊採用自動發現（無需手動引入）
- 命名規則：應用資料夾（kebab-case/lowerCamelCase）、元件（PascalCase）、工具（camelCase）
- 無障礙設計：標籤、鍵盤導航、語意化 HTML/ARIA、色彩對比
- 效能：延遲載入大型依賴、優化圖片、程式碼分割
- 每個應用程式必須有 `README.md`，如有需要也要有 `manifest.json`

---

## 🏗️ 如何建立新應用程式
- 在 `/src/apps/[your-app]/` 建立您的應用程式資料夾（使用 kebab-case 或 lowerCamelCase）
- 新增 `index.ts`（主要匯出）、`config.ts`（視窗設定）、`README.md`、`manifest.json`（如有需要）
- 新增 `/locales/`（翻譯）、`/public/`（資產）、`/tests/`（測試，選用）
- 使用平台視窗系統並提供視窗設定
- 讓您的應用程式具備響應式與無障礙設計
- 使用每應用程式專屬的 key/命名空間來保存資料
- 在 README 中記錄遷移/版本資訊
- 不需全域程式碼更動！您的應用會自動被發現

---

## 🛠️ 如何為現有應用程式做出貢獻
- 僅在該應用程式的資料夾內進行更動（`/src/apps/[app]/`）
- 遵循該應用程式的 `README.md` 與結構
- 除非必要，請勿跨應用程式引用
- 確保您的更動有文件說明並經過測試

---

## 🌏 如何貢獻翻譯
- 在 `/src/locales/`（平台）或 `/src/apps/[app]/locales/`（應用程式）中新增或更新翻譯檔案
- 中文請使用 `zh.json`（繁體中文）
- 範例：`/src/locales/zh.json` 或 `/src/apps/notepad/locales/zh.json`
- 請參考 `en.json` 的結構保持一致
- 在 UI 中測試你的翻譯效果
- 如願意，可在應用程式的 `README.md` 中新增你的名字到譯者名單
- 如需協助或審核，請提交 issue 或 PR

---

## 🔄 PR 流程
- 從 `main` 分支建立新分支，並使用具描述性的分支名稱（如 `feature/my-new-app`、`fix/bug-description`）
- 遵循 Conventional Commits 規範提交訊息
- 確保所有程式碼已通過 lint、測試並有文件說明
- 新應用程式不得更動全域程式碼
- 提交 Pull Request：填寫 PR 模板，連結相關 issue，確保所有檢查通過
- 及時回應審查意見，僅在所有要求都滿足時合併

---

## ❓ 常見問題
- 問：我可以不用更動全域檔案就新增自己的應用程式嗎？
  - 答：可以！只要將您的應用程式加入 `/src/apps/`，系統會自動發現。
- 問：我要如何新增翻譯？
  - 答：請參考上方的翻譯說明。
- 問：如果我的 PR 沒通過 lint 或測試怎麼辦？
  - 答：請先修正所有問題再請求審查。

---

## 🌐 行為準則
請保持尊重與包容。詳見 [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)。

---

## 📚 資源
- [專案說明文件](./README.md)
- [架構與規則](請參閱 `/explanation.txt` 及 `/src/config/appRegistry.ts`)
- [產品路線圖](請參閱 `/explanation.txt`)
- [Shadcn UI](https://ui.shadcn.com/)
- [Next.js 文件](https://nextjs.org/docs)
- [Bun 文件](https://bun.sh/docs)
- [i18next 文件](https://www.i18next.com/)

---

## ✅ 貢獻者自查清單
- 我已遵循資料夾與命名規範
- 我的程式碼具備無障礙與響應式設計
- 我已新增或更新文件
- 我已執行 lint 與測試並修正所有問題
- 我的應用程式或功能已自成一格於其資料夾
- 如有需要，我已新增翻譯
- 我未做不必要的全域更動

---

感謝你為 Tabi OS 做出的貢獻！🎉
