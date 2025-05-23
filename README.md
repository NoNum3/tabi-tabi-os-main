# Tabi-OS

<p align="center">
  <a href="#english-version">🇬🇧 English</a> | <a href="#繁體中文版本">🇹🇼 繁體中文</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/build-passing-brightgreen" alt="Build Status" />
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License" />
  <img src="https://img.shields.io/badge/version-1.0.0-orange" alt="Version" />
  <a href="#demo"><img src="https://img.shields.io/badge/demo-live-green" alt="Demo" /></a>
</p>

---

# <a name="english-version"></a>🇬🇧 English Version

> **Tabi-OS** is inspired by the Japanese word 'Tabi-Tabi' (often, frequently). This OS provides a streamlined toolkit of reusable utilities. We prioritize performance, minimalist design, and a great user experience, inviting users to rate and shape the tool collection through feedback.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
bun install

# 2. Start the development server
bun run dev

# 3. Run the linter
bun run lint
```

---

## 🎬 Demo

> [Live Demo Coming Soon!](#) <!-- Replace # with your demo link -->

![Tabi-OS Screenshot](https://placehold.co/800x400?text=Tabi-OS+Demo) <!-- Replace with real screenshot or GIF -->

---

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) v15.x
- **UI Library:** [React](https://reactjs.org/) v19.x
- **State Management:** [Jotai](https://jotai.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) v4.x
- **UI Components:** [Radix UI](https://www.radix-ui.com/), [shadcn/ui](https://ui.shadcn.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Backend/DB:** [Supabase](https://supabase.io/) (for Auth, Likes, User Preferences)
- **Language:** [TypeScript](https://www.typescriptlang.org/) v5.x
- **Package Manager:** [Bun](https://bun.sh/) v1.x
- **Linting:** [ESLint](https://eslint.org/)
- **Git Hooks:** [Husky](https://typicode.github.io/husky/)
- **Commit Linting:** [Commitlint](https://commitlint.js.org/)
- **Containerization:** [Docker](https://www.docker.com/)
- **Editor:** [Tiptap](https://tiptap.dev/)

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

> 💡 **Contributor Note:**
> - Keep all app logic inside your app folder (under `src/apps/`).
> - Use global atoms/hooks only for truly global state (in `src/application/`).
> - Place shared UI in `src/components/ui/` and shared logic in `src/infrastructure/utils/` or `src/types/`.
> - Name files and folders clearly and consistently.
> - Document your app with a README.md if it has complex logic.
> - Avoid cross-app imports unless absolutely necessary.
> - Test your app independently before submitting a PR.
> - Follow the naming conventions and code guidelines in this README.
> - **Report/Feedback modals:** Cooldown is persisted for 30 minutes (even after refresh) and supports i18n (English/Chinese).

---

# <a name="繁體中文版本"></a>🇹🇼 繁體中文版本

> **Tabi-OS** 名稱源自日語「たびたび」（意為「經常、頻繁」）。本作業系統提供一套流線型、可重用的工具組。我們重視效能、極簡設計與卓越的使用者體驗，並邀請用戶透過評分與回饋共同完善工具集。

---

## 🚀 快速開始

```bash
# 1. 安裝依賴
bun install

# 2. 啟動開發伺服器
bun run dev

# 3. 執行 Lint
bun run lint
```

---

## 🎬 線上展示

> [即將推出！](#) <!-- 可替換為實際 Demo 連結 -->

![Tabi-OS Screenshot](https://placehold.co/800x400?text=Tabi-OS+Demo) <!-- 可替換為實際截圖或 GIF -->

---

## 🛠️ 技術棧

- **框架：** [Next.js](https://nextjs.org/) v15.x
- **UI 函式庫：** [React](https://reactjs.org/) v19.x
- **狀態管理：** [Jotai](https://jotai.org/)
- **樣式：** [Tailwind CSS](https://tailwindcss.com/) v4.x
- **UI 元件：** [Radix UI](https://www.radix-ui.com/)、[shadcn/ui](https://ui.shadcn.com/)
- **圖示：** [Lucide React](https://lucide.dev/)
- **後端/資料庫：** [Supabase](https://supabase.io/)（用於認證、按讚、偏好設定）
- **語言：** [TypeScript](https://www.typescriptlang.org/) v5.x
- **套件管理：** [Bun](https://bun.sh/) v1.x
- **Lint 工具：** [ESLint](https://eslint.org/)
- **Git Hooks：** [Husky](https://typicode.github.io/husky/)
- **Commit Lint：** [Commitlint](https://commitlint.js.org/)
- **容器化：** [Docker](https://www.docker.com/)
- **編輯器：** [Tiptap](https://tiptap.dev/)

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

> 💡 **貢獻者注意：**
> - 請將所有 app 邏輯維持在 app 資料夾內（`src/apps/`）。
> - 僅將真正全域的狀態放在全域 atoms/hooks（`src/application/`）。
> - 共用 UI 請放在 `src/components/ui/`，共用邏輯請放在 `src/infrastructure/utils/` 或 `src/types/`。
> - 檔案與資料夾命名需清楚且一致。
> - 若 app 較複雜，請於 app 資料夾內補充 README.md。
> - 除非必要，避免跨 app 引用。
> - PR 前請獨立測試你的 app。
> - 請遵循本 README 的命名與程式碼規範。
> - **回報/回饋表單：** 冷卻時間 30 分鐘（即使重新整理也會記憶），並支援中英文 i18n。

---

For more details, see the [Development Guidelines](#-development-guidelines) and
[Project Structure](#-folder-structure) sections above.

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for
details.
