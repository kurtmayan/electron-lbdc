# Mr. DIY - LOCAL (LBDC)

## Overview

**Mr. DIY - LOCAL** is a **Biometrics Data Consolidator (LBDC)** - a desktop application designed to manage, synchronize, and process biometric data locally. The application combines a modern React-based UI with a Python FastAPI backend to provide seamless biometric data handling with offline-first capabilities.

**Current Version**: 1.2.4

## Tech Stack

### Frontend

- React - UI library
- TypeScript - Type-safe JavaScript
- Vite - Build tool
- TailwindCSS - Utility-first CSS framework
- Shadcn/UI - React components
- React Router - Client-side routing
- React Query - Data fetching and caching
- React Hook Form - Form handling
- Zustand - State management
- Axios - HTTP client

### Desktop (Electron)

- Electron - Cross-platform desktop framework
- Electron Forge - Build tooling
- Electron Builder - Application packaging and distribution
- Electron Updater - Automatic update management
- Express - Local server for IPC communication

### Backend

- FastAPI - Python web framework
- Python - Backend language
- Uvicorn - ASGI server
- SQLAlchemy - ORM for database operations
- PyJWT - JWT authentication

### Developer Tools

- TypeScript - Type checking
- ESLint - Code linting
- Prettier - Code formatting
- tsx - TypeScript executor

## Project Structure

```
electron-lbdc/
├── client/                  # React frontend (git submodule)
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── layouts/        # Layout wrappers
│   │   ├── routes/         # Route definitions
│   │   ├── store/          # Zustand stores
│   │   ├── lib/            # Utility functions
│   │   ├── api.ts          # API client configuration
│   │   └── main.tsx        # React entry point
│   ├── vite.config.ts      # Vite configuration
│   └── package.json        # Client dependencies
│
├── server/                 # Python FastAPI backend (git submodule)
│   ├── app/
│   │   ├── main.py         # FastAPI application
│   │   ├── core/           # Core functionality (auth, db, models)
│   │   ├── modules/        # Feature modules
│   │   └── schemas/        # Pydantic schemas
│   ├── requirements.txt     # Python dependencies
│   └── Dockerfile          # Container configuration
│
├── src/                    # Electron main process
│   ├── main.ts             # Main process entry point
│   ├── preload.ts          # Preload script for IPC
│   └── renderer.ts         # Renderer process setup
│
├── scripts/                # Build and installation scripts
│   ├── build-server.ts     # Server build script
│   └── install-server.ts   # Server installation script
│
├── resources/              # Application assets
│   └── icon/               # Application icon
│
├── forge.config.ts         # Electron Forge configuration
├── vite.main.config.ts     # Vite config for main process
├── vite.renderer.config.ts # Vite config for renderer
├── electron-builder.yml    # Electron Builder config
└── package.json            # Root dependencies & scripts
```

## Prerequisites

Before getting started, ensure you have the following installed:

- **Node.js** 18+ and npm/yarn
- **Python** 3.8+
- **Git** with submodule support
- **Mac/Windows/Linux** OS (cross-platform support)

## Installation

### 1. Clone the Repository with Submodules

```bash
# Clone with submodules
git clone --recurse-submodules https://github.com/kurtmayan/electron-lbdc.git

# OR if you already cloned without --recursive
git clone https://github.com/kurtmayan/electron-lbdc.git
cd electron-lbdc
git submodule update --init --recursive
```

### 2. Install Dependencies

```bash
# Install all dependencies (client + server + root)
npm run install:all

# OR install separately:
# - Install client dependencies
npm run install:client

# - Install server dependencies (Python virtual environment + packages)
npm run install:server

# - Install root dependencies
npm install
```

### 3. Setup Environment Variables

Create a `.env` file in the `server/` directory with the following variables:

```env
# Database
DATABASE_URL=sqlite:///./lbdc.db

# JWT Configuration
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Server Configuration
SERVER_PORT=8000
DEBUG=True
```

## Development

### Starting Development Server

```bash
# Build client dist/ and compile server first
npm run build:all

# Then start Electron app with hot reload
npm start

# This will:
# 1. Start the Python FastAPI backend
# 2. Start the Vite dev server for React frontend
# 3. Launch the Electron app
```

### Running Individual Services

```bash
# Frontend only (from client directory)
cd client
npm run dev

# Backend only (from server directory)
cd server
python -m uvicorn app.main:app --reload
```

### Linting & Type Checking

```bash
# Lint TypeScript files (excluding client and server)
npm run lint

# Type check client
cd client && npm run typecheck

# Format code
cd client && npm run format
```

## Build & Release Workflow

Follow these steps to build and publish a new version:

```bash
# Step 1: Install all dependencies (client + server + root)
npm run install:all

# Step 2: Build client dist/ and compile server to .exe
npm run build:all

# Step 3: Generate the final .exe file
npm run build

# Step 4: Publish a new version
npm run publish
```

## Architecture

### Component Structure

```
Electron Main Process (TypeScript)
    ├── Window Management
    ├── File System Access
    ├── Native Module Integration
    └── IPC Communication

                ↓

    Preload Script (IPC Bridge)

                ↓

React Frontend (TypeScript/React)
    ├── Pages & Routes
    ├── Components
    ├── State Management (Zustand)
    └── Data Fetching (React Query)

                ↓

    HTTP Requests (Axios)

                ↓

FastAPI Backend (Python)
    ├── Authentication
    ├── Database Models
    ├── Business Logic
    └── Data Processing
```

### Communication Flow

1. **Electron Main** ↔ **Preload Script** (IPC)
2. **React Frontend** ↔ **FastAPI Backend** (HTTP/REST)
3. **Backend** ↔ **Database** (SQLAlchemy ORM)

## Development Workflow

### Making Changes

1. **Frontend Changes**: Edit files in `client/src/`, changes auto-reload via Vite HMR
2. **Backend Changes**: Edit files in `server/app/`, restart backend service
3. **Main Process Changes**: Edit files in `src/`, requires app restart
4. **Styling**: TailwindCSS classes - no need to configure, auto-purged on build

### Git Workflow with Submodules

```bash
# Update all submodules to latest commits
git submodule update --remote

# Commit submodule changes
git add client server
git commit -m "Update submodules"

# Clone and setup in one command
git clone --recursive <repo-url>
```

## Environment Variables

### Server (.env in server/)

```env
DATABASE_URL=sqlite:///./lbdc.db
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
SERVER_PORT=8000
```

## Author

**Mayan Solutions Inc.**  
Contact: johnkurt@mayan.com.ph, laurence@mayan.com.ph

**Last Updated**: May 2026  
**Maintained By**: Development Team
