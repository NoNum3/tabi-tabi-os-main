# Tabi-OS

[🇬🇧 English](#english) | [🇹🇼 繁體中文](#繁體中文)

---

## 🌏 About Tabi-OS | 關於 Tabi-OS

**Tabi-OS** is a modular, user-driven desktop platform inspired by the Japanese word 'Tabi-Tabi' (often, frequently). It provides a streamlined toolkit of reusable utilities, prioritizing performance, minimalist design, and a great user experience. Users can rate and shape the tool collection through feedback.

**Tabi-OS** 名稱源自日語「たびたび」（意為「經常、頻繁」）。本作業系統提供一套流線型、可重用的工具組，重視效能、極簡設計與卓越的使用者體驗，並邀請用戶透過評分與回饋共同完善工具集。

---

## English

## 🚀 Quick Start

```bash
# 1. Install dependencies
bun install

# 2. Start the development server
bun run dev

# 3. Run the linter
bun run lint
```

> **Troubleshooting:**
> - Make sure you have [Bun](https://bun.sh/) installed (`bun --version`).
> - If you see errors, try deleting `node_modules` and running `bun install` again.

---

## 🎬 Demo

> [Live Demo Coming Soon!](https://youtu.be/JIBnQv8xAQs?si=jLk4Cs41zZ09OcvH) <!-- Replace # with your demo link -->

[![appstore-screenshot.png](https://i.postimg.cc/PqLSHLzM/appstore-screenshot.png)](https://postimg.cc/LqptB8Wq) <!-- Replace with real screenshot or GIF -->

---

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) v15.x — Modern React framework for SSR and routing
- **UI Library:** [React](https://reactjs.org/) v19.x — Component-based UI
- **State Management:** [Jotai](https://jotai.org/) — Atomic, scalable state
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) v4.x — Utility-first CSS
- **UI Components:** [Radix UI](https://www.radix-ui.com/), [shadcn/ui](https://ui.shadcn.com/) — Accessible, customizable UI
- **Icons:** [Lucide React](https://lucide.dev/) — Icon library
- **Backend/DB:** [Supabase](https://supabase.io/) — Auth, likes, user preferences
- **Language:** [TypeScript](https://www.typescriptlang.org/) v5.x — Type safety
- **Package Manager:** [Bun](https://bun.sh/) v1.x — Fast JS runtime & package manager
- **Linting:** [ESLint](https://eslint.org/) — Code quality
- **Git Hooks:** [Husky](https://typicode.github.io/husky/) — Pre-commit checks
- **Commit Linting:** [Commitlint](https://commitlint.js.org/) — Commit message standards
- **Containerization:** [Docker](https://www.docker.com/) — Easy deployment
- **Editor:** [Tiptap](https://tiptap.dev/) — Rich text editing
- **Domain/DNS & DDoS Protection:** [Cloudflare](https://www.cloudflare.com/) — Domain management, DNS, and DDoS protection
- **Bot/Spam Protection:** [Google reCAPTCHA](https://www.google.com/recaptcha/) — Prevents automated abuse
- **Deployment:** [Vercel](https://vercel.com/) — Cloud hosting and CI/CD for Next.js

---

## 📁 Folder Structure

Below is the actual structure for the `src/` directory, matching the codebase. This organization makes it easy for contributors to find, add, or update code without breaking other features.

```text
src/
  apps/                       # All user-facing apps (each in its own folder)
    clock/
      components/             # App-specific React components
      atoms/                  # App-specific Jotai atoms (state)
      hooks/                  # App-specific custom hooks
      config.ts               # App config (icon, default size, etc.)
      types.ts                # App-specific TypeScript types
      index.ts                # Main export for app registration
      README.md               # (Optional) App-specific docs
    calculator/
      ...                     # Same structure as above
    ...

  components/
    ui/                       # Shared UI components (Shadcn, Radix, etc.)
    layout/                   # Layout components (Window, Taskbar, Sidebar, etc.)
    appstore/                 # App store/discovery components
    auth/                     # Authentication UI (SignInForm, etc.)
    desktop/                  # Desktop icon and related components
    debug/                    # Debugging tools/components
    shared/                   # Shared components (e.g., LoadingSpinner)
    providers/                # Context providers (Theme, Auth, Jotai, etc.)

  application/
    atoms/                    # Global Jotai atoms (window, auth, etc.)
    hooks/                    # Global custom hooks

  config/
    appRegistry.ts            # Central registry for all available apps
    ...                       # Other global config files

  infrastructure/
    lib/                      # External libraries, SDKs (e.g., Supabase client)
    utils/                    # Utility functions (e.g., report.ts for bug/feedback, localStorage helpers)

  locales/                    # i18n files (en.ts, zh-TW.ts, etc.)
  styles/                     # Global styles (Tailwind, etc.)
  types/                      # Shared types/interfaces
  utils/                      # (Legacy) Utility functions (may be migrated to infrastructure/utils)

  app/                        # Next.js app directory (routing, layouts, API)
    [locale]/                 # Localized pages/layouts
    api/                      # API routes
```

> 💡 **How to add your own app:**
> - Create a new folder under `src/apps/your-app/`.
> - Add your components, config, and logic inside your app folder.
> - Export your app config and main component in `index.ts`.
> - See [CONTRIBUTING.md](./CONTRIBUTING.md) for full details.

---

## 🤝 How to Contribute

We welcome all contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines on:
- Setting up your environment
- Coding standards
- Creating new apps
- Submitting pull requests
- Accessibility and performance requirements

---

## 🌐 Code of Conduct

Please be respectful and inclusive. See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) for details.

---

## ❓ FAQ

**Q: How do I add a new app?**
- A: Create a folder in `src/apps/`, add your code, and export your config/component in `index.ts`. No global changes needed!

**Q: How do I run tests?**
- A: Use `bun test` (if tests are available for your app).

**Q: How do I add translations?**
- A: Add or update `en.json`, `zh-TW.json`, etc. in `src/locales/` or your app's `locales/` folder.

**Q: What if my PR fails lint or test checks?**
- A: Please fix all issues before requesting review.

---

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

[⬆ Back to top](#tabi-os)

---

## 繁體中文

## 🚀 快速開始

```bash
# 1. 安裝依賴
bun install

# 2. 啟動開發伺服器
bun run dev

# 3. 執行 Lint
bun run lint
```

> **疑難排解：**
> - 請確認已安裝 [Bun](https://bun.sh/)（`bun --version`）。
> - 若遇到錯誤，請刪除 `node_modules` 並重新執行 `bun install`。

---

## 🎬 線上展示

> [即將推出！](#) <!-- 可替換為實際 Demo 連結 -->

[![appstore-screenshot.png](https://i.postimg.cc/PqLSHLzM/appstore-screenshot.png)](https://postimg.cc/LqptB8Wq) <!-- 可替換為實際截圖或 GIF -->

---

## 🛠️ 技術棧

- **框架：** [Next.js](https://nextjs.org/) v15.x — 現代 React 框架，支援 SSR 與路由
- **UI 函式庫：** [React](https://reactjs.org/) v19.x — 元件化 UI
- **狀態管理：** [Jotai](https://jotai.org/) — 原子化、可擴展狀態
- **樣式：** [Tailwind CSS](https://tailwindcss.com/) v4.x — 實用優先 CSS
- **UI 元件：** [Radix UI](https://www.radix-ui.com/)、[shadcn/ui](https://ui.shadcn.com/) — 無障礙、可自訂 UI
- **圖示：** [Lucide React](https://lucide.dev/) — 圖示庫
- **後端/資料庫：** [Supabase](https://supabase.io/) — 認證、按讚、偏好設定
- **語言：** [TypeScript](https://www.typescriptlang.org/) v5.x — 型別安全
- **套件管理：** [Bun](https://bun.sh/) v1.x — 快速 JS 執行環境與套件管理
- **Lint 工具：** [ESLint](https://eslint.org/) — 程式碼品質
- **Git Hooks：** [Husky](https://typicode.github.io/husky/) — 提交前檢查
- **Commit Lint：** [Commitlint](https://commitlint.js.org/) — Commit 訊息規範
- **容器化：** [Docker](https://www.docker.com/) — 部署方便
- **編輯器：** [Tiptap](https://tiptap.dev/) — 富文本編輯
- **Domain/DNS & DDoS Protection:** [Cloudflare](https://www.cloudflare.com/) — Domain management, DNS, and DDoS protection
- **Bot/Spam Protection:** [Google reCAPTCHA](https://www.google.com/recaptcha/) — Prevents automated abuse
- **Deployment:** [Vercel](https://vercel.com/) — Cloud hosting and CI/CD for Next.js

---

## 📁 資料夾結構

以下是 `src/` 目錄的實際結構，與專案一致。這種組織方式讓貢獻者能夠輕鬆找到、添加或更新程式碼，而不會影響其他功能。

```text
src/
  apps/                       # 所有用戶應用程式（每個 app 一個資料夾）
    clock/
      components/             # 應用程式專屬 React 元件
      atoms/                  # 應用程式專屬 Jotai atoms（狀態）
      hooks/                  # 應用程式專屬自定義 hooks
      config.ts               # 應用程式設定（icon、預設大小等）
      types.ts                # 應用程式專屬 TypeScript 型別
      index.ts                # 應用程式註冊主入口
      README.md               # （選用）應用程式說明文件
    calculator/
      ...                     # 同上結構
    ...

  components/
    ui/                       # 共用 UI 元件（Shadcn、Radix 等）
    layout/                   # 佈局元件（Window、Taskbar、Sidebar 等）
    appstore/                 # 應用程式商店/探索元件
    auth/                     # 認證 UI（登入表單等）
    desktop/                  # 桌面圖示及相關元件
    debug/                    # 除錯工具/元件
    shared/                   # 共用元件（如 LoadingSpinner）
    providers/                # Context 提供者（Theme, Auth, Jotai 等）

  application/
    atoms/                    # 全域 Jotai atoms（window、auth 等）
    hooks/                    # 全域自定義 hooks

  config/
    appRegistry.ts            # 所有可用 app 的註冊中心
    ...                       # 其他全域設定檔

  infrastructure/
    lib/                      # 外部函式庫、SDK（如 Supabase client）
    utils/                    # 工具函式（如 report.ts、localStorage helpers）

  locales/                    # 多語系檔案（en.ts、zh-TW.ts 等）
  styles/                     # 全域樣式（Tailwind 等）
  types/                      # 共用型別/介面
  utils/                      # （舊）工具函式（可能已遷移至 infrastructure/utils）

  app/                        # Next.js app 目錄（路由、佈局、API）
    [locale]/                 # 多語系頁面/佈局
    api/                      # API 路由
```

> 💡 **如何新增自己的 app：**
> - 在 `src/apps/your-app/` 下建立新資料夾。
> - 將元件、設定與邏輯都放在 app 資料夾內。
> - 在 `index.ts` 匯出 app 設定與主元件。
> - 詳細請見 [CONTRIBUTING.md](./CONTRIBUTING.md)。

---

## 🤝 如何貢獻

歡迎各種貢獻！請參閱 [CONTRIBUTING.md](./CONTRIBUTING.md) 以獲得詳細指引：
- 環境設置
- 程式碼規範
- 新增應用程式
- 提交 Pull Request
- 無障礙與效能要求

---

## 🌐 行為準則

請保持尊重與包容。詳見 [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)。

---

## ❓ 常見問題

**問：如何新增 app？**
- 答：在 `src/apps/` 建立資料夾，新增程式碼，並在 `index.ts` 匯出設定/元件，無需全域更動！

**問：如何執行測試？**
- 答：執行 `bun test`（如有測試）。

**問：如何新增翻譯？**
- 答：在 `src/locales/` 或 app 的 `locales/` 資料夾新增或更新 `en.json`、`zh-TW.json` 等。

**問：PR 沒通過 lint 或測試怎麼辦？**
- 答：請先修正所有問題再請求審查。

---

## 📜 授權

本專案採用 MIT 授權，詳見 LICENSE 檔案。

[⬆ 回到頂部](#tabi-os)
