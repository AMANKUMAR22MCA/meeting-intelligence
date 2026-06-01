<div align="center">

<img src="https://img.shields.io/badge/AI-Meeting%20Intelligence-6366f1?style=for-the-badge&logoColor=white" alt="Meeting Intelligence"/>

<h1>🎙️ Meeting Intelligence</h1>

<h3>
  <samp>🤖 Upload. Transcribe. Summarize. Act.</samp>
</h3>

<p>
  <em>Transform any meeting recording into actionable intelligence — powered by Whisper, Groq LLaMA, Celery async pipeline, and delivered straight to your inbox.</em>
</p>

<br/>

[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io)
[![Celery](https://img.shields.io/badge/Celery-37814A?style=for-the-badge&logo=celery&logoColor=white)](https://docs.celeryq.dev)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)
[![AWS](https://img.shields.io/badge/AWS%20EC2-FF9900?style=for-the-badge&logo=amazon-aws&logoColor=white)](https://aws.amazon.com)
[![Python](https://img.shields.io/badge/Python_3.12-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)

<br/>

<div align="center">
<h2>🚀 Live Demo</h2>
<a href="http://50.19.61.16" target="_blank">
  🔗 Click here to try the app
</a>
<br/><br/>
<p><em>Upload a meeting audio file → get transcript + summary + action items in seconds</em></p>
</div>

</div>

---
## 📸 Screenshots

### Dashboard
![Dashboard]<img width="947" height="410" alt="image" src="https://github.com/user-attachments/assets/4fcbed61-4644-48e8-b67f-6e835c5dd168" />


### Upload Meeting
![Upload](assets/upload.png)

### Meeting Results & Action Items
![Meeting Card](assets/meeting-card.png)

### Email Summary
![Email](assets/email.png)

## 🧠 What is Meeting Intelligence?

Companies like **Otter.ai** and **Fireflies.ai** are valued at hundreds of millions — doing exactly this. Meeting Intelligence is a full-stack AI system that:

- 🎙️ **Transcribes** meeting audio using OpenAI Whisper (via Groq)
- 🤖 **Summarizes** the meeting using LLaMA 3.1 via Groq
- ✅ **Extracts action items** with owner and deadline
- 📧 **Emails the summary** automatically via SendGrid
- 💾 **Persists everything** to PostgreSQL for future retrieval
- ⚡ **Processes asynchronously** via Celery + Redis (no waiting!)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎙️ Audio Upload | Supports MP3, WAV, M4A, MP4, WebM, OGG up to 25MB |
| 📝 AI Transcription | Whisper Large V3 via Groq — industry-best accuracy |
| 🧠 Smart Summarization | LLaMA 3.1 extracts summary, key points, action items |
| 📊 Sentiment Analysis | Detects meeting mood — positive, neutral, negative |
| ⚡ Async Processing | Celery + Redis — instant response, background processing |
| 📧 Email Automation | SendGrid delivers formatted summary to any inbox |
| 🗄️ Meeting History | PostgreSQL stores all meetings with full search |
| 📱 Responsive Dashboard | React UI with dark mode, pagination, expandable cards |
| 🐳 Fully Dockerized | One command to run the entire stack |
| ☁️ AWS Deployed | Live on EC2 with Nginx reverse proxy |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client (React)                        │
│         Upload Audio + Email → Poll Job Status           │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP
┌──────────────────────▼──────────────────────────────────┐
│                  Nginx (Port 80)                         │
│         Serves Frontend + Proxies /api → FastAPI         │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                FastAPI (Port 8000)                       │
│   • POST /api/v1/upload-async  → returns job_id         │
│   • GET  /api/v1/jobs/{id}     → check status           │
│   • GET  /api/v1/meetings      → list all meetings      │
│   • GET  /api/v1/meetings/{id} → get one meeting        │
└────────────┬─────────────────────────┬──────────────────┘
             │                         │
┌────────────▼──────────┐   ┌─────────▼────────────────── ┐
│    Redis (Broker)      │   │    PostgreSQL               │
│  Job Queue Management  │   │  Meetings, Transcripts,     │
└────────────┬──────────┘   │  Action Items, Status       │
             │               └─────────────────────────────┘
┌────────────▼──────────────────────────────────────────── ┐
│                  Celery Worker                            │
│   1. Decode audio bytes                                   │
│   2. Groq Whisper → transcript                           │
│   3. Groq LLaMA  → summary + action items               │
│   4. Update PostgreSQL → status: completed               │
│   5. SendGrid    → email summary to user                 │
└───────────────────────────────────────────────────────── ┘
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **API** | FastAPI + Python 3.12 | Async REST API with auto docs |
| **Speech to Text** | Groq Whisper Large V3 | Industry-best transcription, free |
| **LLM** | Groq LLaMA 3.1 8B | Summarization + action item extraction |
| **Task Queue** | Celery + Redis | Async background processing |
| **Database** | PostgreSQL + SQLAlchemy | Persistent meeting storage |
| **Migrations** | Alembic | Database schema versioning |
| **Email** | SendGrid API | Automated summary delivery |
| **Frontend** | React + Tailwind CSS | Modern responsive dashboard |
| **Container** | Docker + docker-compose | One-command deployment |
| **Server** | AWS EC2 + Nginx | Production deployment |
| **Validation** | Pydantic v2 | Request/response type safety |
| **Logging** | Python logging | Structured timestamped logs |

---

## 🚀 Quick Start

### Prerequisites
- Docker + Docker Compose
- Groq API key (free at [console.groq.com](https://console.groq.com))
- SendGrid API key (free at [sendgrid.com](https://sendgrid.com))

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/meeting-intelligence.git
cd meeting-intelligence
```

### 2. Set up environment variables
```bash
cp .env.example .env
```

Edit `.env` with your actual keys:
```env
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key
DATABASE_URL=postgresql+asyncpg://postgres:postgres123@postgres:5432/meeting_intelligence
REDIS_URL=redis://redis:6379
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=your_verified_email@gmail.com
APP_DEBUG=false
```

### 3. Start the entire stack
```bash
docker-compose up -d --build
```

### 4. Run database migrations
```bash
docker-compose exec fastapi alembic upgrade head
```

### 5. Open the app
| Service | URL |
|---|---|
| Frontend Dashboard | http://localhost:80 |
| API Documentation | http://localhost:8000/docs |
| API Base URL | http://localhost:8000/api/v1 |

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/api/v1/upload` | Sync upload + process |
| `POST` | `/api/v1/upload-async` | Async upload → returns job_id |
| `GET` | `/api/v1/jobs/{job_id}` | Check background job status |
| `GET` | `/api/v1/meetings` | List all meetings (paginated) |
| `GET` | `/api/v1/meetings/{id}` | Get single meeting details |

### Example Response
```json
{
  "filename": "weekly-sync.mp3",
  "transcript": "Good afternoon team...",
  "analysis": {
    "summary": "Weekly product sync covering Q2 budget approval and sprint planning.",
    "key_points": ["Budget approved", "Sprint 12 kicked off", "Release on June 15th"],
    "action_items": [
      {
        "task": "Finalize API documentation",
        "owner": "Alex",
        "deadline": "Thursday"
      }
    ],
    "meeting_sentiment": "positive"
  }
}
```

---

## 📁 Project Structure

```
meeting-intelligence/
├── app/
│   ├── api/
│   │   └── audio.py          # Upload, meetings, job status endpoints
│   ├── core/
│   │   ├── config.py         # Settings from environment
│   │   ├── database.py       # Async SQLAlchemy engine + session
│   │   ├── logger.py         # Structured logging
│   │   └── celery_app.py     # Celery configuration
│   ├── models/
│   │   ├── meeting.py        # SQLAlchemy Meeting model
│   │   └── schemas.py        # Pydantic request/response schemas
│   ├── services/
│   │   ├── groq_service.py   # Whisper transcription + LLM summarization
│   │   └── email_service.py  # SendGrid email automation
│   ├── tasks/
│   │   └── audio_tasks.py    # Celery background task
│   └── main.py               # FastAPI app entry point
├── alembic/                   # Database migrations
├── frontend/                  # React dashboard
├── Dockerfile                 # FastAPI container
├── docker-compose.yml         # Full stack orchestration
├── requirements.txt
└── .env.example
```

---

## 🔄 How It Works

```
1. User uploads audio file + email via dashboard
        ↓
2. FastAPI saves "pending" meeting to PostgreSQL
        ↓
3. File encoded as base64 → sent to Redis queue
        ↓
4. API returns job_id instantly (< 100ms)
        ↓
5. Celery worker picks up job from Redis
        ↓
6. Groq Whisper transcribes audio → raw transcript
        ↓
7. Groq LLaMA analyzes transcript → summary + action items
        ↓
8. PostgreSQL updated → status: "completed"
        ↓
9. SendGrid sends formatted email to user
        ↓
10. Frontend polls job status → shows results
```

---

## 🐳 Docker Services

```yaml
services:
  postgres    # PostgreSQL 15 — persistent meeting storage
  redis       # Redis 7 — Celery message broker
  fastapi     # FastAPI app — REST API
  celery      # Celery worker — background processing
```

---

## 🌟 Why This Project?

This project demonstrates **production-grade engineering**:

- ✅ **Async architecture** — handles concurrent uploads without blocking
- ✅ **Background processing** — users never wait for AI processing
- ✅ **Database migrations** — schema versioning with Alembic
- ✅ **Type safety** — Pydantic models for all request/response
- ✅ **Structured logging** — timestamped logs with processing times
- ✅ **Error handling** — automatic Celery retries on failure
- ✅ **Docker** — reproducible environment, one-command deploy
- ✅ **Cloud deployment** — live on AWS EC2 with Nginx reverse proxy

---

## 📧 Contact

Built by **Aman Kumar**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/in/aman-kumar-6506a0245/)
[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/AMANKUMAR22MCA)

---

<div align="center">
  <p>⭐ Star this repo if you found it useful!</p>
  <p><em>Built with ❤️ using FastAPI, Groq, Celery, PostgreSQL, React, Docker, and AWS</em></p>
</div>
