# MediMind App Architecture

## Tech Stack
- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui (Radix UI primitives)
- **Routing**: React Router DOM v6 (lazy-loaded routes)
- **Backend**: Supabase (auth + database)
- **AI**: Google Generative AI (Gemini)
- **State**: React Hook Form + Zod validation

## Project Structure
```
src/
├── pages/           # Route pages (Dashboard, Login, AddMedicine, etc.)
├── components/     # UI components (AIButton, BottomTabBar, etc.)
│   └── ui/         # shadcn/ui components
├── context/        # React Context (AuthContext)
├── utils/          # Utilities (storage, notifications, ai-assistant)
├── integrations/   # External services (Supabase client)
├── hooks/          # Custom hooks
├── data/           # Static data (medicineDatabase)
└── lib/            # Library utilities
```

## Pages
| Route | Component | Description |
|-------|-----------|-------------|
| `/` | Index | Landing page |
| `/login` | Login | Authentication |
| `/signup` | SignUp | Registration |
| `/dashboard` | Dashboard | Main dashboard |
| `/add-medicine` | AddMedicine | Add new medication |
| `/history` | MedicationHistory | View medication history |
| `/family-members` | FamilyMembers | Manage family profiles |
| `/progress` | Progress | Track progress |

## Key Components
- **BottomTabBar**: Mobile-style bottom navigation
- **AIButton**: Floating AI assistant trigger
- **AIChatModal**: Chat interface for AI assistant
- **AIAssistant**: Core AI logic using Gemini
- **MedicineSelector**: Drug search/selection
- **DoseList**: Medication dose display
- **HistoryCalendar**: Calendar view for history

## Data Flow
1. Auth via Supabase → AuthContext provides user state
2. AI features use Google Gemini API
3. Local storage via storage.ts utilities
4. Notifications via notifications.ts

## Routing
- Lazy-loaded pages via `React.lazy()`
- BottomTabBar always visible (mobile navigation)
- AIButton floating overlay on all pages