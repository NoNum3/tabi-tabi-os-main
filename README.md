# Tabi Tabi OS

"Inspired by the Japanese word 'Tabi-Tabi' (often, frequently), this OS provides
a streamlined toolkit of reusable utilities. We prioritize performance,
minimalist design, and a great user experience, inviting users to rate and shape
the tool collection through feedback.

**(繁體中文)**
受日語「Tabi-Tabi」（たびたび，意為「經常、頻繁」）的啟發，此作業系統提供了一套流線型的可重用工具。我們優先考慮效能、簡約設計和卓越的使用者體驗，並邀請使用者透過評分和回饋來共同塑造工具集。

**(Bahasa Indonesia)** Terinspirasi dari kata Jepang 'Tabi-Tabi' (sering), OS
ini menyediakan perangkat utilitas yang ramping dan dapat digunakan kembali.
Kami memprioritaskan performa, desain minimalis, dan pengalaman pengguna yang
luar biasa, mengundang pengguna untuk memberi peringkat dan membentuk koleksi
alat melalui umpan balik.

Built with a cutting-edge stack including Next.js 15, React 19, and Tailwind CSS
v4, Tabi Tabi OS offers a customizable and performant workspace. It features a
**personalized dashboard**, an **app discovery** mechanism with community
ratings, and a windowing system for multitasking. Leveraging Radix UI and
shadcn/ui, it provides a collection of useful tools accessible from any browser.
Ideal for anyone seeking a consistent and efficient toolkit for online
activities.

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) v15.x
- **UI Library:** [React](https://reactjs.org/) v19.x
- **State Management:** [Jotai](https://jotai.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) v4.x
- **UI Components:** [Radix UI](https://www.radix-ui.com/),
  [shadcn/ui](https://ui.shadcn.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Backend/DB:** [Supabase](https://supabase.io/) (for Auth, Likes, User
  Preferences)
- **Language:** [TypeScript](https://www.typescriptlang.org/) v5.x
- **Package Manager:** [Bun](https://bun.sh/) v1.x
- **Linting:** [ESLint](https://eslint.org/)
- **Git Hooks:** [Husky](https://typicode.github.io/husky/)
- **Commit Linting:** [Commitlint](https://commitlint.js.org/)
- **Containerization:** [Docker](https://www.docker.com/)

## 📁 Folder Structure

```
.
├── .husky/                 # Husky git hooks configuration
│
├── public/                 # Static assets (icons, sounds, backgrounds)
│
├── src/
│   ├── app/                # Next.js App Router pages & layouts
│   │   ├── [locale]/       # Locale-based routes
│   │   ├── api/            # API routes (e.g., NextAuth)
│   │   └── (appFeatures)/  # Route groups for specific apps (e.g., (calculator))
│   │
│   ├── application/
│   │   ├── atoms/          # Jotai state atoms (windowAtoms, authAtoms, dashboardAtoms, etc.)
│   │   └── hooks/          # Custom React hooks
│   │
│   ├── components/         # Shared React components (Use /presentation/ instead? TBD)
│   │   ├── ui/             # Shadcn UI components
│   │   ├── layout/         # Core layout (Taskbar, Sidebar, Window, etc.)
│   │   ├── apps/           # Specific app UI components (Calculator, MusicPlayer, etc.)
│   │   ├── dashboard/      # Components for the user dashboard
│   │   ├── appstore/       # Components for the app discovery/store view
│   │   └── auth/           # Authentication components (SignInForm, etc.)
│   │
│   ├── config/             # App configuration (appRegistry.ts)
│   │
│   ├── infrastructure/
│   │   ├── lib/            # Libraries, SDKs (Supabase client)
│   │   └── utils/          # Utility functions (storage.ts)
│   │
│   ├── locales/            # Internationalization configuration & files
│   │
│   ├── styles/             # Global CSS, Tailwind base styles
│   │
│   └── types/              # Shared TypeScript types and interfaces
│
├── supabase/               # Supabase migrations and configuration
│
├── .dockerignore
├── .env.local              # Local environment variables (GITIGNORED)
├── .eslintrc.json          # ESLint configuration
├── .gitignore
├── Dockerfile
├── README.md               # This file
├── bun.lockb               # Bun lock file
├── commitlint.config.mjs
├── components.json         # shadcn/ui configuration
├── docker-compose.yml
├── next-env.d.ts
├── next.config.ts
├── package.json
├── postcss.config.mjs
└── tsconfig.json
```

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18.x
- [Bun](https://bun.sh/) >= 1.0.0
- [Docker](https://www.docker.com/) (If running via Docker)

### Installation

1. Clone the repository:

   ```bash
   git clone <your-repository-url>
   cd tabi-tabi-os-main
   ```

2. Install dependencies with Bun:
   ```bash
   bun install
   ```

### Running the Development Server

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the
result.

### Building for Production

```bash
bun run build
```

### Starting the Production Server

```bash
bun run start
```

### Linting Code

```bash
bun run lint
```

### Running with Docker

1. Build the Docker image:

   ```bash
   docker build -t tabi-tabi-os .
   ```

2. Run the container:

   ```bash
   docker run -p 3000:3000 tabi-tabi-os
   ```

   Alternatively, using docker-compose:

   ```bash
   docker-compose up -d
   ```

## 📝 Development Guidelines

### Commit Message Format

This project uses [Conventional Commits](https://www.conventionalcommits.org/)
for standardized commit messages:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

Common types:

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code changes that neither fix bugs nor add features
- `test`: Adding or modifying tests
- `chore`: Changes to the build process or auxiliary tools

Commit messages are enforced using commitlint and Husky.

### Key Concepts & Rules

- **Refer to the `/rules - Copy/` directory** for detailed guidelines on:
  - Project Structure & Code Organization
  - Component Design (Client vs. Server, Shadcn)
  - State Management (Jotai)
  - Window System Integration
  - App Integration (Dashboard, Discovery, Likes)
  - Storage & Persistence (LocalStorage, Supabase Sync)
  - Naming Conventions
  - Development Workflow

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes using the conventional commit format
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## 📦 App Structure & Adding New Apps

To make Tabi Tabi OS easy to extend and maintain, **each app is organized as a
self-contained folder** under `src/apps/`. This lets contributors add new apps
or update existing ones without needing to touch global code, window system, or
other apps.

### Recommended Folder Structure (Detailed)

Below is the recommended structure for the `src/` directory. This organization
makes it easy for contributors to find, add, or update code without breaking
other features.

```
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

  presentation/
    components/
      ui/                     # Shared UI components (Shadcn, Radix, etc.)
      layout/                 # Layout components (Window, Taskbar, Sidebar)
      dashboard/              # Dashboard-specific components
      appstore/               # App discovery/store components
      auth/                   # Authentication UI (SignInForm, etc.)

  application/
    atoms/                    # Truly global Jotai atoms (window, auth, dashboard)
    hooks/                    # Global custom hooks (used by multiple apps)
    types/                    # Shared types/interfaces used across the app

  config/
    appRegistry.ts            # Central registry for all available apps
    ...                       # Other global config files

  infrastructure/
    lib/                      # External libraries, SDKs (e.g., Supabase client)
    utils/                    # Utility functions (localStorage, formatting, etc.)

  locales/                    # Internationalization (i18n) files
  styles/                     # Global CSS, Tailwind config

  # (Other folders as needed)
```

#### Folder Descriptions

- **`src/apps/`**: Each app is a folder containing all its logic (components,
  atoms, hooks, config, types). Contributors should add new apps here.
- **`src/presentation/components/ui/`**: Shared UI building blocks (buttons,
  modals, etc.). Use Shadcn/Radix here.
- **`src/presentation/components/layout/`**: Core layout (window system,
  taskbar, sidebar). Only core maintainers should modify.
- **`src/presentation/components/dashboard/`**: Dashboard grid, icon, and
  related UI.
- **`src/presentation/components/appstore/`**: App discovery/store UI.
- **`src/application/atoms/`**: Global state (window, auth, dashboard).
  App-specific state should stay in the app folder.
- **`src/application/hooks/`**: Global hooks used by multiple features/apps.
- **`src/application/types/`**: Shared types/interfaces.
- **`src/config/`**: App registry and global config.
- **`src/infrastructure/lib/`**: External service integrations (e.g., Supabase
  client).
- **`src/infrastructure/utils/`**: Utility functions (localStorage, formatting,
  etc.).
- **`src/locales/`**: i18n files.
- **`src/styles/`**: Global styles.

### How to Add a New App

1. **Create a new folder** under `src/apps/your-app/`.
2. **Add your components, atoms, hooks, config, and types** inside that folder.
3. **Export your main app component and config in `index.ts`** (see other apps
   for examples).
4. **Register your app** by adding it to `src/config/appRegistry.ts`.
5. **(Optional) Add a README.md** in your app folder for app-specific
   documentation.
6. **Submit a Pull Request!**

**You do NOT need to touch the window system, dashboard, or other apps.**

#### Example: `src/apps/clock/index.ts`

```typescript
import { ClockApp } from "./components/ClockApp";
import { clockAtom } from "./atoms/clockAtom";
import { CLOCK_ICON } from "./config";

export default {
   appId: "clock",
   title: "Clock",
   icon: CLOCK_ICON,
   component: ClockApp,
   atom: clockAtom,
   // ...other config
};
```

#### Example: Registering Your App

In `src/config/appRegistry.ts`:

```typescript
import clock from "@/apps/clock";
import calculator from "@/apps/calculator";
// ...

export const appRegistry = [clock, calculator /* ... */];
```

### Best Practices for Contributors

- **Keep all app logic inside your app folder.**
- **Use global atoms/hooks only for truly global state.**
- **Name files and folders clearly and consistently.**
- **Document your app with a README.md if it has complex logic.**
- **Avoid cross-app imports unless absolutely necessary.**
- **Use shared UI components from `src/presentation/components/ui/` for
  consistency.**
- **Test your app independently before submitting a PR.**
- **Follow the naming conventions and code guidelines in this README.**

### Why This Structure?

- **Isolation:** Contributors can work on an app without breaking others.
- **Discoverability:** All code for an app is in one place.
- **Open Source Friendly:** New apps can be added as PRs with minimal risk.
- **Scalability:** Hundreds of apps can be managed without cluttering global
  folders.
- **Maintainability:** Easy to refactor, update, or remove apps without side
  effects.

### Global Features

- **Window system, dashboard, app store, and shared UI** remain in their own
  folders.
- **App registration:** The global `appRegistry.ts` just imports from each app's
  `index.ts` and registers it.
- **Shared atoms/hooks:** If truly global, keep in `src/application/atoms/` or
  `src/application/hooks/`. But most app state should be local to the app
  folder.

---

For more details, see the [Development Guidelines](#-development-guidelines) and
[Project Structure](#-folder-structure) sections above.

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for
details.

## 🙏 Acknowledgements

This project utilizes and acknowledges the contributions of the following
open-source software:

- [Next.js](https://nextjs.org/) - The React Framework
- [React](https://react.dev/) - UI Library
- [Tailwind CSS](https://tailwindcss.com/) - Utility-First CSS Framework
- [shadcn/ui](https://ui.shadcn.com/) - Re-usable UI components
- [Radix UI](https://www.radix-ui.com/) - Primitives for building accessible
  design systems
- [Lucide React](https://lucide.dev/) - Icon library
- [Jotai](https://jotai.org/) - State management
- [Tiptap](https://tiptap.dev/) - Headless WYSIWYG editor framework
- [TypeScript](https://www.typescriptlang.org/) - Superset of JavaScript
- [Bun](https://bun.sh/) - JavaScript runtime & toolkit
- [Husky](https://typicode.github.io/husky/) - Git hooks manager
- [Commitlint](https://commitlint.js.org/) - Commit message linter
- [ESLint](https://eslint.org/) - Code linter
- [Supabase](https://supabase.io/) - Backend as a Service
