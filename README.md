# Meow - AI-Powered Backend

## Quick Setup

### Backend Setup (Linux/macOS)

```bash
cd backend && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt
```

### Backend Setup (Windows)

```bash
cd backend && python -m venv venv && venv\Scripts\activate && pip install -r requirements.txt
```

### Frontend Setup (Linux/macOS)

```bash
cd frontend && npm install
```

### Frontend Setup (Windows)

```bash
cd frontend && npm install
```

## Running the Application

### Backend

**Linux/macOS:**
```bash
cd backend && source venv/bin/activate && uvicorn api.main:app --reload
```

**Windows:**
```bash
cd backend && venv\Scripts\activate && python -m uvicorn api.main:app --reload
```

### Frontend

```bash
cd frontend && npm start
```

## API Documentation

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

## Project Structure

```
backend/
├── api/              # API routes
├── core/             # Core utilities
├── models/           # Data models
├── services/         # Business logic
├── tests/            # Tests
└── requirements.txt

frontend/            # Frontend application
infrastructure/
├── docker/          # Docker configuration
```
