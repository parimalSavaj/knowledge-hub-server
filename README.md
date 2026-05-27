# Knowledge Hub Server

## Prerequisites

You need **one of these** to run the project:

| Option | What you need |
|--------|--------------|
| **With Docker** | [Docker](https://www.docker.com/products/docker-desktop/) installed |
| **Without Docker** | [Node.js](https://nodejs.org/) v24+ installed |

---

## Setup

### 1. Clone the repo

```bash
git clone <your-repo-url>
cd knowledge-hub-server
```

### 2. Create environment file

```bash
cp .env.example .env
```

Edit `.env` if you need to change any values.

---

## Run the Project

### Option A: With Docker (Recommended)

**Start development server:**

```bash
docker compose up --build
```

**Start production server:**

```bash
docker compose -f docker-compose.prod.yml up --build
```

**Stop the server:**

```bash
docker compose down
```

---

### Option B: Without Docker (Using Node.js)

**Install dependencies:**

```bash
npm install
```

**Start development server (with auto-reload):**

```bash
npm run dev
```

**Build for production:**

```bash
npm run build
```

**Start production server:**

```bash
npm run start
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with auto-reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run start` | Run compiled production server |
| `npm run lint` | Check code for errors |

---

## Server

Once running, the server starts at:

```
http://localhost:5000
```
