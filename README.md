# Improv-It
**Advanced Student Performance Prediction & Academic Analytics Platform**

Improv-It is an enterprise-grade web application designed to help educational institutions track, analyze, and predict student academic performance. By combining traditional academic record management with machine learning, the platform shifts the focus from simple record-keeping to proactive student intervention.

The system analyzes historical semester data (Semesters 1-6) to forecast future performance (Semester 7), allowing educators to identify high-potential achievers and at-risk students before final examinations occur.

---

## Capabilities & Workflows

### 1. institutional Dashboard
The central hub provides a real-time health check of the academic cohort.
*   **KPI Tracking**: Instantly view total student count, cohort average, and critical alert counts.
*   **System Health Monitoring**: Built-in monitoring for CPU, RAM, and Disk usage ensures the application infrastructure is performing optimally.
*   **Smart Notifications**: Automated alerts for students falling below performance thresholds (<60%) or achieving excellence (>90%).
*   **Personalized Workspace**: Integrated "Quick Notes" section for administrators to track tasks and reminders directly within the workflow.

### 2. Student Data Management
A robust record-keeping system allows for precise data handling.
*   **Comprehensive Profiles**: unique IDs (USN), names, and granular semester-wise academic records.
*   **Bulk Operations**: Support for importing large datasets effectively (up to 100 records per batch) to streamline semester transitions.
*   **Data Export**: Capability to export full student datasets to CSV for external reporting or offline archiving.
*   **Search & Filtering**: targeted search by USN or Name to quickly locate specific student records.

### 3. Predictive Analysis Engine
The core differentiator of Improv-It is its ML-powered forecasting capability.
*   **Grade Forecasting**: Uses regression models to predict Semester 7 outcomes based on the trajectory of Semesters 1 through 6.
*   **Confidence Scoring**: Every prediction is accompanied by a confidence score, giving educators context on the reliability of the forecast.
*   **Batch Prediction**: Run predictions on the entire student body simultaneously to generate a "predicted class performance" report.
*   **Fallback Logic**: A robust fallback system ensures approximate predictions are available even if the primary ML service is temporarily unreachable, ensuring business continuity.

### 4. Deep-Dive Analytics & Reporting
Transforms raw grades into actionable intelligence.
*   **Distribution Analysis**: Visualizes the spread of grades (Excellent, Good, Average, Below Average) to understand class difficulty and grading standards.
*   **Semester Trends**: Tracks cohort performance across all six semesters to identify "dip" semesters where students historically struggle.
*   **Improvement Tracking**: Algorithms identify students with the most significant positive trajectory between Sem 1 and Sem 6.
*   **Individual Insights**: AI-generated textual insights that analyze a student's trend (Increasing, Decreasing, Stable) and provide specific recommendations (e.g., "Focus on Sem 3 subjects", "Consider peer mentoring").

### 5. Security & Architecture
Built with modern security best practices.
*   **Role-Based Access**: Secure login system protects sensitive academic data.
*   **Session Management**: JWT (JSON Web Tokens) with automatic expiration and refresh token rotation.
*   **Audit Logging**: Background tracking of critical actions for security compliance.
*   **Performance Caching**: Redis integration ensures that heavy analytics queries load instantly by caching results for 5 minutes.

---

## Technical Architecture

The application follows a modern microservices-styled arquitecture:

*   **Frontend**: React ecosystem (Vite, TypeScript, Zustand) providing a responsive Single Page Application (SPA).
*   **Backend API**: High-performance FastAPI (Python) server handling business logic, database ORM (SQLAlchemy), and request validation (Pydantic).
*   **Data Persistence**: PostgreSQL serves as the relational source of truth for all structured user and student data.
*   **In-Memory Store**: Redis handles session caching and complex analytics query caching to reduce database load.
*   **ML Service**: A dedicated BentoML service that hosts the scikit-learn prediction models, exposing them via an internal API to the main backend.

---

## Deployment & Setup

### Requirements
*   **Docker Engine** & **Docker Compose** (Recommended)
*   *Or for manual runs:* Python 3.10+, Node.js 18+, PostgreSQL 15+, Redis 7+

### Rapid Deployment (Docker)
This is the preferred method as it orchestrates the Database, Cache, API, ML Service, and Frontend interface automatically.

1.  **Clone resources**
    ```bash
    git clone <repository_url>
    cd Improv-It
    ```

2.  **Launch application**
    ```bash
    docker compose up --build
    ```

3.  **Access points**
    *   **User Interface**: http://localhost:5173
    *   **API Documentation**: http://localhost:8081/docs

### Manual Installation

**1. Database Services**
Ensure PostgreSQL is running on port `5432` (database: `improvit`) and Redis on `6379`.

**2. Backend API**
```bash
cd backend
python -m venv evn
source evn/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Configure your DB credentials here
uvicorn app.main:app --port 8081 --reload
```

**3. Frontend Interface**
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

---

## Application Version
**Current Version**: v2.1.0

## License
MIT License
