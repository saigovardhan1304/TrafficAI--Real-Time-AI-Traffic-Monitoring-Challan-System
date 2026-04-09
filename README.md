# 🚦 TrafficAI  
### Real-Time Motorcycle Violation Detection & Automated Enforcement System

---

## 📌 Project Info

TrafficAI is an AI-powered traffic monitoring and enforcement system designed to detect motorcycle-related violations such as **triple riding**, **helmet absence**, and **mobile phone usage** in real-time. The system integrates deep learning, computer vision, OCR, and a full-stack web application to automate detection, identification, and challan generation.

---

## 🚀 Features

- Real-time traffic violation detection  
- Motorcycle & rider detection  
- Triple riding detection  
- Helmet violation detection  
- Mobile usage detection  
- OCR-based number plate recognition  
- Automated challan generation (PDF)  
- Admin dashboard for monitoring  
- Violation logs and audit tracking  
- End-to-end pipeline (Detection → Enforcement)

---

## 🧠 System Workflow
Camera → Frames → YOLOv8 Detection →
Rider Mapping → Violation Detection →
OCR → Database Lookup →
Challan Generation → Admin Dashboard



---

## 🛠️ Tech Stack

### Frontend
- React  
- TypeScript  
- Tailwind CSS  
- shadcn/ui  
- Vite  

### Backend
- Python  
- Flask  

### AI / ML
- YOLOv8 (Ultralytics)  
- OpenCV  
- Tesseract OCR  

### Database
- SQLite / SQL  

---

## 💻 How to Run the Project

---

### 🔧 Prerequisites

Make sure you have installed:
- Node.js (v16 or above)
- npm
- Python 3.9+

---

## 📥 Installation & Setup

### 1️⃣ Clone Repository

```bash
git clone <my git url>
cd <PROJECTNAME>

npm install
npm run dev
