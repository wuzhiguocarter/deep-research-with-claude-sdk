# Deep Research Assistant

AI-powered research application using Claude Agent SDK and web search capabilities. Generate comprehensive research reports with automatic citations for any topic.

## Features

- **Three Research Types**:
  - **Comparison**: Compare products, technologies, or approaches with detailed pros/cons
  - **Analysis**: Deep dive with feature matrices, SWOT analysis, and insights
  - **Summary**: Aggregate multiple sources and extract key points

- **Real-time Progress Tracking**: Watch your research being conducted live
- **Automatic Citations**: All sources are properly cited and linked
- **Research History**: Browse and reload past research sessions
- **Export Options**: Download results as Markdown files

## Tech Stack

- **Frontend**: Next.js 16 + React 19 + TypeScript + Tailwind CSS 4
- **UI Components**: Radix UI + shadcn/ui + Lucide Icons
- **Markdown Rendering**: react-markdown + rehype/remark plugins (rehype-highlight, rehype-react, rehype-sanitize, remark-breaks, remark-gfm)
- **Backend**: Next.js API Routes
- **AI Engine**: Claude Agent SDK (TypeScript) + OpenAI SDK
- **Database**: SQLite (Prisma ORM)
- **Search**: Web Search via Claude Agent SDK
- **Validation**: Zod
- **Build Tool**: ESLint + TypeScript compiler
- **Package Manager**: pnpm

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Zhipu AI API key ([Get one here](https://open.bigmodel.cn/usercenter/apikeys))
  - The application uses Zhipu AI's Anthropic-compatible endpoint

### Installation

1. Clone the repository and navigate to the project:
```bash
cd deep-research-with-claude-sdk
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your Zhipu AI API key:
```
ANTHROPIC_API_KEY="your-zhipu-api-key-here"
ANTHROPIC_BASE_URL="https://open.bigmodel.cn/api/anthropic"
```

4. Initialize the database:
```bash
npx prisma migrate dev
npx prisma generate
```

5. Run the development server:
```bash
pnpm dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Start a Research**:
   - Navigate to the Research page
   - Select a research type (Comparison, Analysis, or Summary)
   - Enter your research query
   - Click "Start Research"

2. **Monitor Progress**:
   - Watch real-time updates as Claude searches, reads, and synthesizes information
   - View the current step and progress percentage

3. **Review Results**:
   - Read the comprehensive report with citations
   - Click on source links to verify information
   - Download the report as a Markdown file

4. **Manage History**:
   - View all past research sessions
   - Reload previous results
   - Delete unwanted sessions

## Project Structure

```
├── app/                      # Next.js app directory
│   ├── api/                  # API routes
│   │   ├── research/         # Research endpoints
│   │   └── history/          # History management
│   ├── research/             # Research page
│   └── page.tsx              # Landing page
├── components/               # React components
│   ├── ui/                   # shadcn/ui components
│   ├── ResearchForm.tsx
│   ├── ProgressTracker.tsx
│   ├── ResultsViewer.tsx
│   └── HistoryPanel.tsx
├── lib/                      # Utilities and services
│   ├── research/             # Research service
│   │   ├── service.ts        # Claude Agent SDK integration
│   │   ├── prompts.ts        # Research prompts
│   │   └── types.ts          # TypeScript types
│   └── db.ts                 # Prisma client
└── prisma/                   # Database schema
```

## API Endpoints

- `POST /api/research` - Start a new research task
- `GET /api/research/[id]` - Get research results
- `GET /api/history` - List all research sessions
- `GET /api/history/[id]` - Get a specific session
- `DELETE /api/history/[id]` - Delete a session

## Development

### Run Development Server
```bash
pnpm dev
```

### Build for Production
```bash
pnpm build
```

### Start Production Server
```bash
pnpm start
```

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `ANTHROPIC_API_KEY` | Your Zhipu AI API key (used with Anthropic-compatible endpoint) | Yes | - |
| `ANTHROPIC_BASE_URL` | Zhipu AI API endpoint URL | Yes | `https://open.bigmodel.cn/api/anthropic` |
| `DATABASE_URL` | SQLite database path | No | `file:./dev.db` |

## License

This project is built for educational and research purposes.

## Acknowledgments

- Built with [Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Powered by [Next.js](https://nextjs.org/)
