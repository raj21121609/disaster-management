# CRISIS.ONE - Complete UI & Feature Documentation

## Overview

**CRISIS.ONE** is a real-time, map-based emergency coordination platform connecting **Citizens**, **Volunteers**, and **Agencies** for rapid crisis response.

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                    │
│     React 19 + Vite + Firebase SDK + Leaflet Maps + Lucide Icons        │
├─────────────────────────────────────────────────────────────────────────┤
│  LandingPage │ AuthPage │ DashboardPage │ VolunteerDashboard │ Agency   │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           FIREBASE SERVICES                              │
│              Authentication (Email/Password) + Firestore                 │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              BACKEND                                     │
│               Express.js + Firebase Admin SDK (Port 8080)                │
│   /analyze-incident │ /update-status │ /dispatch │ /predict │ /alert    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Pages & UI Components

### 1. Landing Page (`LandingPage.jsx`)

**Purpose:** Marketing/informational home page introducing the platform.

**UI Sections:**
| Section | Description |
|---------|-------------|
| **Hero Section** | Headline with tagline, animated "Live Emergency Response Network" badge |
| **Call-to-Action Buttons** | "Report an Emergency" (primary, pulse animation) and "View Live Dashboard" (secondary) |
| **Trust Indicators** | "Verified by Agencies" shield icon, "50k+ Volunteers" badge |
| **Hero Visual** | Animated map visualization with floating incident cards |
| **Features Grid** | 3 cards: Live Geolocation, Volunteer Mobilization, Agency Command |

**Components Used:** `Button`, `Card`

**Visual Style:**
- Dark theme (`#0f172a` background)
- Emergency red accent (`#ef4444`)
- Glowing pulsing effects on critical elements

---

### 2. Authentication Page (`AuthPage.jsx`)

**Purpose:** User login and registration with role selection.

**UI Features:**
| Feature | Description |
|---------|-------------|
| **Login/Signup Toggle** | Switch between "Welcome Back" and "Join Crisis.One" modes |
| **Role Selection Grid** | 3 buttons: Citizen (orange), Volunteer (green), Agency (blue) |
| **Form Fields** | Email, Password (with show/hide toggle), Display Name (signup only) |
| **Error Display** | Red alert box with icon for validation/auth errors |
| **Demo Mode Notice** | Footer text for demo exploration |

**Roles:**
| Role | Icon | Color | Description |
|------|------|-------|-------------|
| Citizen | User | `#f59e0b` (orange) | Report & Track incidents |
| Volunteer | Heart | `#10b981` (green) | Help & Respond to emergencies |
| Agency | Briefcase | `#3b82f6` (blue) | Manage & Dispatch resources |

**Post-Login Routing:**
- Citizen → Dashboard
- Volunteer → Volunteer Dashboard
- Agency → Agency Command Center

---

### 3. Dashboard Page (`DashboardPage.jsx`)

**Purpose:** Main map view showing all active incidents.

**Layout:**
```
┌──────────────────┬───────────────────────────────────────────┐
│   Sidebar (320px)│           Map View (Leaflet)              │
│                  │                                           │
│ - Header Stats   │  - Full-screen interactive map           │
│ - Filter Buttons │  - Incident markers (severity colors)    │
│ - Incident List  │  - Search overlay                        │
│ - Live Indicator │  - Stats pills (Critical, Active)        │
│                  │  - Legend                                 │
└──────────────────┴───────────────────────────────────────────┘
```

**Sidebar Components:**
| Component | Description |
|-----------|-------------|
| **Header** | "Active Incidents" title with Critical/High badges |
| **Filter Bar** | All / Critical / High toggle buttons |
| **Incident List** | Scrollable cards with severity indicator, type, time, location, status chip |
| **Live Footer** | Green pulsing dot with "Live Updates Active" |

**Incident Card Details:**
- Colored severity indicator bar (left edge)
- Incident type badge
- Time ago (e.g., "5m ago")
- Location with MapPin icon
- Status chip (reported/assigned/in_progress/resolved)
- Volunteer count if assigned

**Map Features:**
| Feature | Description |
|---------|-------------|
| **Markers** | Color-coded by severity (red/orange/blue/green) |
| **User Location** | Blue pulsing dot showing current position |
| **Click Selection** | Click marker to highlight in sidebar |
| **Legend** | Bottom bar showing severity color meanings |

**Severity Color Coding:**
| Severity | Color | Hex |
|----------|-------|-----|
| Critical | Red | `#ef4444` |
| High | Amber | `#f59e0b` |
| Medium | Blue | `#3b82f6` |
| Low/Resolved | Green | `#10b981` |

---

### 4. Incident Report Page (`IncidentReportPage.jsx`)

**Purpose:** Multi-step form for citizens to report emergencies.

**Step Flow:**
```
Step 1 (Location)  ───►  Step 2 (Details)  ───►  Step 3 (Confirmation)
     ●────────────────────●────────────────────●
```

**Step 1 - Confirm Location:**
| Element | Description |
|---------|-------------|
| **Map Preview** | 200px embedded map showing selected location |
| **Location Display** | Address text + GPS coordinates |
| **Refresh Button** | Re-fetch current GPS position |
| **Confirm Button** | Proceed to Step 2 |

**Step 2 - Incident Details:**
| Field | Type | Options |
|-------|------|---------|
| **Incident Type** | Grid of 6 buttons | Medical 🏥, Fire 🔥, Accident 🚗, Flood 🌊, Police 🚔, Other ⚠️ |
| **Severity Level** | 4-button slider | Low (green), Medium (blue), High (amber), Critical (red) |
| **Description** | Textarea | Free-text description of situation |
| **Contact Phone** | Phone input | Optional callback number |

**Step 3 - Confirmation:**
| Element | Description |
|---------|-------------|
| **Success Icon** | Large green checkmark |
| **Incident Summary** | ID, Type, AI Severity, Priority Score |
| **Auto-Redirect** | 3-second countdown to dashboard |

**AI Integration:**
- Incident analyzed by backend `/analyze-incident` endpoint
- Severity auto-adjusted based on keywords
- Priority score (0-100) calculated

---

### 5. Volunteer Dashboard (`VolunteerDashboard.jsx`)

**Purpose:** Mission management interface for volunteers.

**Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│  Header: "Volunteer Command" │ Status Toggle │ Go Online/Offline │
├────────────────────────────────┬────────────────────────────────┤
│      Sidebar (Tabs)            │           Map View             │
│  ┌─────────┐ ┌─────────────┐   │                                │
│  │ Nearby  │ │ My Missions │   │   Shows incidents based on    │
│  │  (3)    │ │    (1)      │   │   active tab selection         │
│  └─────────┘ └─────────────┘   │                                │
│                                │                                │
│  - Task Cards                  │   - User location marker       │
│  - Accept/Update buttons       │   - Distance indicators        │
│                                │                                │
└────────────────────────────────┴────────────────────────────────┘
```

**Header Bar:**
| Element | Description |
|---------|-------------|
| **Title** | "Volunteer Command" with subtitle |
| **Status Indicator** | Green "On Call" or gray "Offline" with pulsing dot |
| **Toggle Button** | Switch online/offline status |

**Tabs:**
| Tab | Content |
|-----|---------|
| **Nearby** | Incidents within 15mi radius, not yet accepted |
| **My Missions** | Incidents assigned to current volunteer |

**Task Card (Nearby):**
- Priority badge (severity color-coded)
- Time since report
- Emergency type title
- Description excerpt (80 chars)
- Location + distance in miles
- "Accept Mission" button

**Task Card (My Missions):**
- Priority badge + current status
- Location + contact phone (clickable)
- Status update buttons:
  - Assigned → "On My Way"
  - On The Way → "Arrived"
  - In Progress → "Mark Resolved"
- "Drop" button to abandon mission

**Real-time Features:**
- GPS watch position updates every 30s
- Live incident subscription
- Distance calculation from user location

---

### 6. Agency Dashboard (`AgencyDashboard.jsx`)

**Purpose:** Command center for emergency agencies to monitor and dispatch.

**Layout:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│  Header: "Agency Command Center"                    │ Refresh Button    │
├─────────────────────────────────────────────────────────────────────────┤
│            Stats Grid (4 Cards)                                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │   Active    │ │   Avg Resp  │ │  Available  │ │  Resolved   │       │
│  │  Incidents  │ │    Time     │ │    Units    │ │   Today     │       │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘       │
├────────────────┬──────────────────────────┬─────────────────────────────┤
│ Priority Queue │       Map Panel          │    AI Predictions +         │
│                │                          │    Resource Status          │
│ - Filter select│  (Full incident map)     │                             │
│ - Queue items  │                          │  - AI Panel (collapsible)   │
│ - Dispatch btn │                          │  - Resource bars            │
│                │                          │  - Available units list     │
│                │                          │  - Critical alerts          │
└────────────────┴──────────────────────────┴─────────────────────────────┘
```

**Stats Cards:**
| Card | Icon | Data |
|------|------|------|
| Active Incidents | Activity | Count + critical sub-count |
| Avg Response Time | Clock | Minutes + target comparison |
| Available Units | Truck | X/Y ratio + deployed count |
| Resolved Today | CheckCircle | Count + total incidents |

**Priority Queue:**
| Element | Description |
|---------|-------------|
| **Filter Dropdown** | All Status / Active Only / Reported / Assigned / Resolved |
| **Queue Items** | Priority tag (P1-P4), type, location, time, status, Dispatch button |

**Priority Tags:**
- P1+ (Critical overdue >30min)
- P1 (Critical)
- P2 (High)
- P3 (Medium)
- P4 (Low)

**AI Prediction Panel (`AIPredictionPanel.jsx`):**
| Section | Content |
|---------|---------|
| **Header** | Brain icon + "AI Resource Prediction" |
| **Context Badge** | Severity + incident type |
| **Risk Assessment** | Color-coded risk level message |
| **Metrics Grid** | Est. Response Time, Personnel, Confidence % |
| **Required Resources** | List with icons, quantities, priorities |
| **Required Supplies** | Grid of supply items |
| **AI Recommendations** | Bullet list of action items |
| **Action Buttons** | Auto-Dispatch + Refresh Prediction |

**Resource Panel:**
| Element | Description |
|---------|-------------|
| **Utilization Bars** | Ambulance / Fire / Police usage percentages |
| **Available Units List** | Icons (🚑🚒🚔) with ID and "Ready" status |
| **Critical Alert Box** | Red warning when critical incidents exist |

**Dispatch Modal:**
- Triggered when clicking "Dispatch" on queue item
- Shows available units with icons
- Click to assign resource to incident

---

## Shared Components

### Navbar (`Navbar.jsx`)

**Structure:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│  Logo (CRISIS.ONE)  │  Nav Links  │  Notifications  │  User  │  Logout  │
└─────────────────────────────────────────────────────────────────────────┘
```

**Conditional Navigation:**
| Role | Links |
|------|-------|
| Guest | Live Map, Report Incident, Login, SOS Report |
| Citizen | Live Map, Report Incident |
| Volunteer | Live Map, Report Incident, My Missions |
| Agency | Live Map, Report Incident, Command Center |

**Notification System:**
- Bell icon with unread count badge
- Dropdown panel showing recent notifications
- Mark as read / Mark all read actions
- Severity-colored dots (critical/high/medium/low)

**Mobile Menu:**
- Hamburger toggle
- Full-screen overlay menu
- All nav items + auth actions

---

### Button (`Button.jsx`)

**Variants:**
| Variant | Style |
|---------|-------|
| `primary` | Red emergency background |
| `secondary` | Gray bordered |
| `ghost` | Transparent with hover |
| `success` | Green background |

**Sizes:** `xs`, `sm`, `md`, `lg`

**Props:** `icon`, `disabled`, `className`, `fullWidth`

---

### Card (`Card.jsx`)

Simple container component with:
- Dark glassmorphic background
- Subtle border
- Border radius
- Accepts `className` for customization

---

### MapView (`MapView.jsx`)

**Features:**
| Feature | Description |
|---------|-------------|
| **Map Library** | Leaflet with OpenStreetMap tiles |
| **Theme** | Dark mode tiles (CartoDB Dark Matter) |
| **Markers** | Custom colored circles by severity |
| **Popups** | Incident details on click |
| **User Location** | Blue pulsing marker |
| **Dynamic Center** | Can be controlled via props |

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `incidents` | array | List of incident objects |
| `onIncidentClick` | function | Callback when marker clicked |
| `selectedIncidentId` | string | Highlighted incident |
| `userLocation` | object | `{lat, lng}` |
| `showUserLocation` | boolean | Show user marker |
| `center` | object | Map center coordinates |
| `zoom` | number | Initial zoom level |
| `height` | string | CSS height |

---

### AlertBanner (`AlertBanner.jsx`)

Critical incident banner that appears at top of screen when new critical incidents are detected.

---

### Toast (`Toast.jsx`)

Toast notification component for temporary feedback messages.

---

## AI Severity Analysis System

### Overview

The AI Severity Analysis is a **rule-based AI system** that automatically analyzes incident reports to determine severity and priority.

### How It Works

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         INCIDENT SUBMISSION                              │
│          User submits: Type + Description + Location                     │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    BACKEND: /analyze-incident                            │
│                                                                          │
│  1. Extract keywords from description                                    │
│  2. Match against severity keyword lists                                 │
│  3. Apply base score by incident type                                    │
│  4. Calculate final priority score (0-100)                               │
│  5. Return severity level + priority score                               │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND DISPLAY                                 │
│     AISeverityBadge component shows severity + score prominently         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Keyword Detection

| Severity | Keywords | Base Score |
|----------|----------|------------|
| **Critical** | fire, gun, shooter, cardiac, stroke, explosion, trapped, unconscious, collapse, not breathing, dying, bomb, gas leak | 95 |
| **High** | accident, crash, blood, injury, broken, breathing, severe, assault, robbery, drowning, choking, chest pain | 75 |
| **Medium** | fight, dispute, minor injury, theft, vandalism, smoke, alarm, suspicious | 50 |
| **Low** | (default for non-matching descriptions) | 25 |

### Base Scores by Incident Type

| Type | Base Score |
|------|------------|
| Fire | 65 |
| Medical | 55 |
| Accident | 50 |
| Police | 45 |
| Flood | 40 |
| Other | 25 |

### Priority Score Calculation

```javascript
// Final score is the MAX of:
// - Base score from incident type
// - Score from keyword matches

priorityScore = Math.min(100, Math.max(0, baseScore));
```

### Where AI Analysis is Displayed

| Location | Component | Description |
|----------|-----------|-------------|
| **Incident Report Step 3** | `AISeverityBadge` | Large badge showing AI-determined severity and score after submission |
| **Dashboard Cards** | Severity indicator bar | Color-coded left edge on incident cards |
| **Agency Dashboard** | Priority tags (P1-P4) | Queue items show priority based on AI score |
| **AI Prediction Panel** | `AIPredictionPanel` | Full resource prediction when incident selected |

### AISeverityBadge Component (`AISeverityBadge.jsx`)

Visual component displaying AI analysis results:

```
┌─────────────────────────────────────────┐
│  🧠 AI Analysis             ⚡          │
│                                         │
│  CRITICAL                    95/100     │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░           │
└─────────────────────────────────────────┘
```

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `severity` | string | critical/high/medium/low |
| `priorityScore` | number | 0-100 score |
| `showScore` | boolean | Show numerical score |
| `size` | string | sm/md/lg |

### AI Resource Prediction Service (`aiPredictionService.js`)

Predicts required resources based on incident type and severity:

**Functions:**
| Function | Description |
|----------|-------------|
| `predictResources(incident)` | Returns predicted resources, personnel, supplies, response time |
| `localResourcePrediction(incident)` | Fallback when backend unavailable |
| `analyzeIncidentTrends(incidents)` | Analyze patterns for hotspots, peak hours |

**Prediction Output:**
```javascript
{
  resources: [
    { type: 'Ambulance', quantity: 2, icon: '🚑', priority: 'high' },
    { type: 'Fire Engine', quantity: 1, icon: '🚒', priority: 'critical' }
  ],
  estimatedResponseTime: 5,  // minutes
  requiredPersonnel: 12,
  confidence: 85,            // percentage
  riskAssessment: 'HIGH RISK - Immediate action required',
  recommendations: [
    'Dispatch nearest available unit',
    'Alert receiving hospital'
  ],
  supplies: [
    { name: 'First Aid Kit', quantity: 2 },
    { name: 'Defibrillator', quantity: 1 }
  ]
}
```

### Resource Predictions by Type

| Incident Type | Primary Resources | Secondary Resources |
|---------------|-------------------|---------------------|
| **Medical** | Ambulance (1-2) | ALS Unit (if critical) |
| **Fire** | Fire Engine (2-3), Ladder Truck | Rescue Squad, Ambulance |
| **Accident** | Police Unit (2), Ambulance | Fire/Rescue (if trapped) |
| **Flood** | Water Rescue Team, Evacuation Bus | Emergency Shelter |
| **Police** | Police Unit (2-4) | SWAT (if armed), Ambulance |

---

## Services

### Incident Service (`incidentService.js`)

**Constants:**
```javascript
IncidentStatus: {REPORTED, ASSIGNED, IN_PROGRESS, ON_THE_WAY, RESOLVED, CANCELLED}
IncidentType: {MEDICAL, FIRE, ACCIDENT, FLOOD, POLICE, OTHER}
SeverityLevel: {LOW, MEDIUM, HIGH, CRITICAL}
```

**Functions:**
| Function | Description |
|----------|-------------|
| `createIncident` | Creates new incident with AI analysis |
| `updateIncidentStatus` | Updates status, syncs with backend |
| `assignVolunteer` | Adds volunteer to incident |
| `unassignVolunteer` | Removes volunteer from incident |
| `assignResource` | Assigns agency resource to incident |
| `getIncident` | Fetches single incident |
| `getActiveIncidents` | Fetches all active incidents |
| `subscribeToIncidents` | Real-time listener for all incidents |
| `subscribeToActiveIncidents` | Real-time listener for active only |
| `getIncidentStats` | Aggregated statistics |
| `getNearbyIncidents` | Filter by distance from coordinates |
| `calculateDistance` | Haversine formula distance calc |

---

## Context Providers

### AuthContext (`AuthContext.jsx`)

**State:**
| State | Description |
|-------|-------------|
| `currentUser` | Firebase user object |
| `userRole` | citizen/volunteer/agency |
| `isAuthenticated` | Boolean auth status |
| `loading` | Auth state loading |

**Methods:**
| Method | Description |
|--------|-------------|
| `login(email, password)` | Sign in user |
| `signup(email, password, role, name)` | Register new user |
| `logout()` | Sign out user |
| `getIdToken()` | Get Firebase ID token |
| `updateUserLocation(lat, lng)` | Update Firestore location |
| `updateVolunteerStatus(online)` | Toggle volunteer availability |

---

### NotificationContext (`NotificationContext.jsx`)

**State:**
| State | Description |
|-------|-------------|
| `notifications` | Array of notification objects |
| `unreadCount` | Count of unread notifications |

**Methods:**
| Method | Description |
|--------|-------------|
| `addNotification(notif)` | Add new notification |
| `markAsRead(id)` | Mark single as read |
| `markAllAsRead()` | Mark all as read |

**Notification Object:**
```javascript
{
  id: string,
  type: 'incident' | 'success' | 'error' | 'info',
  severity: 'critical' | 'high' | 'medium' | 'low',
  message: string,
  timestamp: Date,
  read: boolean,
  incidentId?: string
}
```

---

## Backend API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/` | GET | No | Health check & API info |
| `/health` | GET | No | Server health status |
| `/analyze-incident` | POST | Optional | AI severity analysis |
| `/update-status` | POST | Required | Update incident status |
| `/dispatch` | POST | Required | Dispatch resource to incident |
| `/stats` | GET | Optional | Get incident statistics |
| `/predict` | POST | Optional | AI resource prediction |
| `/alert` | POST | Required | Create critical alert |

**AI Severity Analysis:**
- Critical keywords: fire, gun, shooter, cardiac, stroke, explosion, trapped, etc.
- High keywords: accident, crash, blood, injury, assault, etc.
- Base scores by type: fire (65), medical (55), accident (50), police (45)

---

## Design System

### Colors

| Name | Hex | Usage |
|------|-----|-------|
| Emergency Red | `#ef4444` | Critical alerts, primary CTAs |
| Warning Amber | `#f59e0b` | High priority, warnings |
| Info Blue | `#3b82f6` | Medium priority, links |
| Success Green | `#10b981` | Resolved, success states |
| Background | `#0f172a` | Main dark background |
| Surface | `#1e293b` | Card backgrounds |
| Text Primary | `#f8fafc` | Main text |
| Text Secondary | `#94a3b8` | Muted text |

### Typography

- Font Family: **Inter**
- Weights: 400, 500, 600, 700, 800

### Spacing

- Base unit: 4px
- Common: 8px, 12px, 16px, 24px, 32px

---

## Real-time Features

1. **Firestore Listeners** - All incident lists auto-update
2. **GPS Tracking** - Continuous position updates for volunteers
3. **Notification System** - In-app alerts for new critical incidents
4. **Live Status Badges** - Pulsing indicators for active connections
5. **Optimistic Updates** - UI updates before server confirmation

---

## Mobile Responsiveness

- Collapsible sidebar on dashboard
- Hamburger menu navigation
- Touch-friendly buttons and inputs
- Full-width forms on mobile
- Responsive map that fills available space
