<<<<<<< HEAD
# 🚨 CRISIS.ONE

## Integrated Community Resource & Crisis Response Platform

A real-time, map-based web platform that enables rapid emergency coordination between citizens, volunteers, and agencies.

![CRISIS.ONE](https://img.shields.io/badge/Status-Hackathon%20Ready-brightgreen)
![React](https://img.shields.io/badge/React-19.2-blue)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)

---

## 🎯 Problem Statement

During emergencies and public crises, incident reporting, resource availability, and coordination between citizens, volunteers, and agencies are fragmented. This causes delayed response, inefficient resource allocation, and loss of lives.

## 💡 Solution

CRISIS.ONE provides a centralized, real-time platform that:
- **Citizens** report incidents with GPS location
- **Volunteers** accept and respond to nearby emergencies
- **Agencies** monitor, dispatch resources, and analyze response data

---

## ✨ Features

### 🔐 Authentication System
- Firebase Email/Password authentication
- Role-based access (Citizen, Volunteer, Agency)
- Persistent sessions with Firestore user profiles

### 📍 Incident Reporting
- One-click incident submission
- Auto GPS location detection
- Multiple incident types (Medical, Fire, Accident, Flood, Police)
- AI-powered severity analysis

### 🗺️ Real-Time Map Dashboard
- Google Maps integration with custom dark theme
- Live incident markers with severity colors
  - 🔴 Red → Critical
  - 🟠 Amber → High Priority
  - 🔵 Blue → Medium
  - 🟢 Green → Low/Resolved
- Real-time updates via Firestore listeners

### 👥 Volunteer Workflow
- View nearby incidents based on location
- Accept/reject missions
- Update status (On the way, Arrived, Resolved)
- Track active missions

### 🏢 Agency Command Center
- Comprehensive incident queue
- Resource dispatch system
- Real-time analytics dashboard
- Response time tracking
- Resource utilization monitoring

### 🔔 Alert System
- Critical incident notifications
- In-app notification center
- Browser notification support (push-ready)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  React 19 + Vite + Firebase SDK + Google Maps API           │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ Landing  │  │Dashboard │  │ Volunteer│  │  Agency  │    │
│  │   Page   │  │  (Map)   │  │Dashboard │  │Dashboard │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Firebase Services                         │
│  ┌────────────────┐  ┌────────────────┐                     │
│  │ Authentication │  │   Firestore    │                     │
│  │  (Email/Pass)  │  │ (Real-time DB) │                     │
│  └────────────────┘  └────────────────┘                     │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                        Backend                               │
│  Express.js + Firebase Admin SDK                             │
│                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐  │
│  │ /analyze-      │  │ /update-status │  │  /dispatch   │  │
│  │  incident      │  │                │  │              │  │
│  └────────────────┘  └────────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or pnpm
- Firebase account
- Google Cloud account (for Maps API)

### 1. Clone and Install

```bash
# Clone the repository
cd crisis-one

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable **Authentication** → Email/Password
4. Create **Firestore Database** in production mode
5. Get your web app config from Project Settings

### 3. Google Maps Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable these APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
4. Create an API key and restrict it to your domains

### 4. Environment Configuration

```bash
# Copy example env files
cp .env.example .env
cp backend/.env.example backend/.env
```

Edit `.env`:
```env
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123

VITE_GOOGLE_MAPS_API_KEY=your_maps_api_key
VITE_BACKEND_URL=http://localhost:8080
```

### 5. Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

### 6. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

Open http://localhost:5173 in your browser.

---

## 📁 Project Structure

```
crisis-one/
├── src/
│   ├── components/
│   │   ├── AlertBanner.jsx      # Critical alert display
│   │   ├── Button.jsx           # Reusable button component
│   │   ├── Card.jsx             # Card container component
│   │   ├── GoogleMap.jsx        # Google Maps integration
│   │   ├── IncidentMarker.jsx   # Map marker component
│   │   └── Navbar.jsx           # Navigation with auth
│   ├── contexts/
│   │   ├── AuthContext.jsx      # Authentication state
│   │   └── NotificationContext.jsx # Notifications
│   ├── pages/
│   │   ├── AgencyDashboard.jsx  # Agency command center
│   │   ├── AuthPage.jsx         # Login/Signup
│   │   ├── DashboardPage.jsx    # Main map dashboard
│   │   ├── IncidentReportPage.jsx # Report incidents
│   │   ├── LandingPage.jsx      # Home page
│   │   └── VolunteerDashboard.jsx # Volunteer missions
│   ├── services/
│   │   └── incidentService.js   # Firestore operations
│   ├── App.jsx                  # Main app component
│   ├── firebase.js              # Firebase configuration
│   └── index.css                # Global styles
├── backend/
│   ├── index.js                 # Express server
│   ├── package.json
│   └── Dockerfile               # Cloud Run deployment
├── .env.example
├── firebase.json
├── firestore.rules
└── README.md
```

---

## 🔌 API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/` | GET | No | Health check & API info |
| `/health` | GET | No | Server health status |
| `/analyze-incident` | POST | Optional | AI severity analysis |
| `/update-status` | POST | Yes | Update incident status |
| `/dispatch` | POST | Yes | Dispatch resource to incident |
| `/stats` | GET | Optional | Get incident statistics |
| `/alert` | POST | Yes | Create critical alert |

### Example: Analyze Incident

```bash
curl -X POST http://localhost:8080/analyze-incident \
  -H "Content-Type: application/json" \
  -d '{"type": "fire", "description": "Building on fire with people trapped"}'
```

Response:
```json
{
  "severity": "critical",
  "priorityScore": 95,
  "analysis": {
    "type": "fire",
    "criticalMatch": true,
    "highMatch": false,
    "baseScore": 95
  }
}
```

---

## ☁️ Deployment

### Frontend (Firebase Hosting)

```bash
# Build the app
npm run build

# Deploy to Firebase
firebase deploy --only hosting
```

### Backend (Google Cloud Run)

```bash
cd backend

# Build Docker image
docker build -t crisis-one-backend .

# Tag for Google Container Registry
docker tag crisis-one-backend gcr.io/YOUR_PROJECT_ID/crisis-one-backend

# Push to GCR
docker push gcr.io/YOUR_PROJECT_ID/crisis-one-backend

# Deploy to Cloud Run
gcloud run deploy crisis-one-backend \
  --image gcr.io/YOUR_PROJECT_ID/crisis-one-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

---

## 🧪 Testing the Platform

### Demo Flow

1. **Sign Up** as different roles:
   - Create a Citizen account
   - Create a Volunteer account
   - Create an Agency account

2. **Report an Incident** (as Citizen):
   - Navigate to "Report Incident"
   - Allow location access
   - Select incident type and severity
   - Submit the report

3. **Accept Mission** (as Volunteer):
   - Log in as volunteer
   - View nearby incidents
   - Accept a mission
   - Update status: On the way → Arrived → Resolved

4. **Monitor & Dispatch** (as Agency):
   - View all incidents in priority queue
   - Dispatch resources to critical incidents
   - Monitor response times and analytics

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite |
| Styling | CSS Variables, Custom Design System |
| Maps | Google Maps JavaScript API |
| Auth | Firebase Authentication |
| Database | Cloud Firestore (real-time) |
| Backend | Node.js, Express.js |
| Admin SDK | Firebase Admin |
| Icons | Lucide React |
| Deployment | Firebase Hosting, Google Cloud Run |

---

## 🔒 Security

- Firebase Authentication tokens
- Firestore security rules
- Role-based access control
- CORS configuration
- Input validation
- No secrets in client code

---

## 📊 AI Severity Scoring

The backend uses rule-based AI to analyze incident severity:

```javascript
// Critical keywords (Score: 95)
['fire', 'gun', 'shooter', 'cardiac', 'stroke', 'explosion', 'trapped']

// High keywords (Score: 75)
['accident', 'crash', 'blood', 'injury', 'broken', 'assault']

// Base scores by type
{ fire: 65, medical: 55, accident: 50, police: 45 }
```

---

## 🎨 Design System

### Colors
- Emergency Red: `#ef4444`
- Warning Amber: `#f59e0b`
- Success Green: `#10b981`
- Info Blue: `#3b82f6`
- Background: `#0f172a` (Dark slate)

### Typography
- Font: Inter
- Weights: 400, 500, 600, 700, 800

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📜 License

MIT License - See [LICENSE](LICENSE) for details.

---

## 🏆 Hackathon Ready

This project is designed to be:
- ✅ Fully functional and runnable
- ✅ Visually impressive with dark mode UI
- ✅ Real-time with live updates
- ✅ Scalable architecture
- ✅ Well-documented
- ✅ Easy to demo

**Good luck with your hackathon! 🚀**
=======
# disaster-management
>>>>>>> fe60ee5f330944400d0c8e7cd0b88401bba4a171
