# People's Bill Platform - Ghana
## Citizen-Powered Legislation for Reverse Burden Act

A democratic platform enabling Ghanaian citizens to contribute to and shape the "People's Bill on Reverse Burden" - legislation requiring public officials to explain wealth disproportionate to their income.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+
- PostgreSQL 14+
- Redis (optional, for production)

### Local Development Setup

1. **Clone and Install**
```bash
# Clone repository
git clone https://github.com/yourusername/peoples-bill-ghana.git
cd peoples-bill-ghana

# Install backend dependencies
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Install frontend dependencies
cd ../frontend
npm install
```

2. **Database Setup**
```bash
# Create database
createdb peoples_bill_ghana

# Run migrations
cd backend
python setup_db.py
```

3. **Environment Variables**
```bash
# Backend (.env in backend/)
DATABASE_URL=postgresql://user:password@localhost/peoples_bill_ghana
SECRET_KEY=your-secret-key-here
SMS_API_KEY=your-africastalking-key  # Optional for Phase 1

# Frontend (.env.local in frontend/)
NEXT_PUBLIC_API_URL=http://localhost:8000
```

4. **Run Development Servers**
```bash
# Terminal 1: Backend
cd backend
uvicorn main:app --reload --port 8000

# Terminal 2: Frontend  
cd frontend
npm run dev
```

Visit http://localhost:3000

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Radix UI
- **Backend**: FastAPI (Python), SQLAlchemy, Pydantic
- **Database**: PostgreSQL with pgvector extension
- **AI/ML**: Sentence Transformers, OpenAI API (optional)
- **SMS/USSD**: Africa's Talking API (Phase 2)

### Project Structure
```
peoples-bill-ghana/
├── frontend/               # Next.js application
│   ├── app/               # App router pages
│   ├── components/        # Reusable components
│   └── lib/              # Utilities and API client
├── backend/               # FastAPI application
│   ├── api/              # API endpoints
│   ├── models/           # Database models
│   ├── services/         # Business logic
│   └── ml/              # AI/ML clustering
├── docker-compose.yml     # Container orchestration
└── deployment/           # Deployment configurations
```

## 🎯 Features (Phase 1)

### Citizen Portal
- ✅ Submit suggestions in English (Twi/Ga coming in Phase 2)
- ✅ View draft bill sections
- ✅ See how submissions shape the legislation
- ✅ Regional representation tracking

### Admin Dashboard  
- ✅ Review and moderate submissions
- ✅ AI-powered clustering of similar suggestions
- ✅ Generate draft clauses from clusters
- ✅ Export reports for Parliament

### Transparency
- ✅ Public statistics dashboard
- ✅ Submission-to-clause mapping
- ✅ Version history tracking

## 📱 Deployment

### Quick Deploy to Cloud

**Option 1: Deploy to Vercel (Frontend) + Railway (Backend)**
```bash
# Frontend
vercel --prod

# Backend  
railway up
```

**Option 2: Docker Deployment**
```bash
docker-compose up -d
```

**Option 3: Traditional VPS**
See `deployment/DEPLOY.md` for nginx + systemd setup

## 🇬🇭 Ghana-Specific Considerations

- **Languages**: UI supports English with Twi/Ga translations coming
- **Regions**: All 16 regions tracked for representation
- **Mobile-First**: Optimized for mobile devices (majority access)
- **Low Bandwidth**: Lightweight, works on 3G connections
- **SMS Integration**: Ready for Africa's Talking API

## 📊 Database Schema

Key tables:
- `submissions` - Citizen inputs
- `clusters` - AI-grouped themes  
- `bill_clauses` - Generated legislation text
- `users` - Admin accounts
- `regions` - Ghana's 16 regions

## 🔐 Security

- SQL injection protection via parameterized queries
- XSS prevention with React's default escaping
- CORS configured for production domain
- Rate limiting on submission endpoints
- Data encryption at rest and in transit

## 🤝 Contributing

We welcome contributions! Please see CONTRIBUTING.md

## 📄 License

MIT License - Free to use and modify

## 🆘 Support

- Issues: GitHub Issues
- Email: support@peoplesbill.gh
- WhatsApp: +233 XX XXX XXXX

---

**Built with ❤️ for Ghana's democratic future**
