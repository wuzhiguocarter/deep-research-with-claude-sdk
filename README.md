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

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Next.js API Routes
- **AI Engine**: Claude Agent SDK (TypeScript)
- **Database**: SQLite (Prisma ORM)
- **Search**: Web Search via Claude Agent SDK

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Anthropic API key ([Get one here](https://console.anthropic.com/))

### Installation

1. Clone the repository and navigate to the project:
```bash
cd deep-research-with-claude-sdk
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your Anthropic API key:
```
ANTHROPIC_API_KEY="your-api-key-here"
```

4. Initialize the database:
```bash
npx prisma migrate dev
npx prisma generate
```

5. Run the development server:
```bash
npm run dev
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
npm run dev
```

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key | Yes |
| `DATABASE_URL` | SQLite database path | No (auto-generated) |
| `ZHIPU_API_KEY` | Zhipu AI API key for enhanced search | No |

## License

This project is built for educational and research purposes.

## Acknowledgments

- Built with [Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Powered by [Next.js](https://nextjs.org/)
