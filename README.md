# MindQuestor Frontend 🎮

A modern, real-time multiplayer quiz application built with React, TypeScript, and Socket.IO.

## ✨ Features

- **Real-time Multiplayer** - Compete with friends in live quiz sessions
- **Interactive UI** - Smooth animations and responsive design
- **Timer-based Questions** - Race against the clock
- **Hint System** - Get help when you need it
- **Live Leaderboard** - Track your performance
- **Category Selection** - Choose from various quiz categories
- **Results Dashboard** - Detailed performance analytics

## 🛠️ Tech Stack

- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Routing:** React Router v6
- **Real-time:** Socket.IO Client
- **Icons:** Lucide React

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend server running

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone <repository-url>
cd MindQuestorFrontend
```

### 2. Install dependencies
```bash
npm install
```
### 3. Run the application

**Development mode:**
```bash
npm run dev
```

**Build for production:**
```bash
npm run build
```
The app will be available at `http://localhost:5173`

## 📁 Project Structure

```
MindQuestorFrontend/
├── src/
│   ├── components/         # Reusable components
│   ├── pages/             # Page components
│   │   ├── HomePage.tsx
│   │   ├── QuizPage.tsx
│   │   ├── WaitingRoom.tsx
│   │   └── ResultsPage.tsx
│   ├── store/             # Zustand stores
│   │   └── userStore.ts
│   ├── App.tsx            # Main app component
│   ├── main.tsx           # Entry point
│   └── index.css          # Global styles
├── public/                # Static assets
├── .env                   # Environment variables
├── tailwind.config.js     # Tailwind configuration
├── vite.config.ts         # Vite configuration
└── package.json
```

## 🎮 User Flow

1. **Authentication** - Sign up or login
2. **Home** - Choose solo or multiplayer mode
3. **Category Selection** - Pick a quiz category
4. **Waiting Room** - (Multiplayer) Wait for other players
5. **Quiz** - Answer timed questions
6. **Results** - View detailed performance

## 🔌 Socket Events

### Emit Events
- `user:join` - Connect to socket server
- `quiz:create` - Create new quiz session
- `quiz:join` - Join existing quiz
- `quiz:start` - Start the quiz (host only)
- `quiz:answer` - Submit answer

### Listen Events
- `quiz:created` - Quiz created successfully
- `quiz:joined` - Joined quiz successfully
- `quiz:participant_joined` - New player joined
- `quiz:started` - Quiz has begun
- `quiz:isCorrect` - Answer validation result
- `quiz:error` - Error notifications

## 🎨 Features Breakdown

### Quiz Page
- **Timer Display** - Countdown for each question
- **Hint System** - Optional hints for difficult questions
- **Real-time Validation** - Instant feedback on answers
- **Progress Bar** - Visual progress tracking
- **Responsive Design** - Works on all devices

### Waiting Room
- **Live Participant List** - See who's joining
- **Invite Code** - Share with friends
- **Host Controls** - Start quiz when ready

### Results Page
- **Performance Stats** - Accuracy, time spent, score
- **Question Review** - See correct/incorrect answers
- **Leaderboard** - Compare with other players

## 🎯 Key Components

### Quiz Page
```typescript
// Features:
- Timer management
- Answer submission
- Socket communication
- Progress tracking
- Hint system
```

### User Store (Zustand)
```typescript
// Manages:
- User authentication state
- User profile data
- Persistent storage
```

## 🎨 Tailwind Configuration

Custom colors, animations, and responsive breakpoints configured for optimal UX.

## 📝 Scripts

```json
{
  "dev": "vite",
  "build": "tsc && vite build",
  "preview": "vite preview",
  "lint": "eslint . --ext ts,tsx"
}
```

## 🔒 Security

- JWT token storage
- Secure WebSocket connections
- No client-side answer exposure
- Protected routes

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🚀 Deployment

### Build
```bash
npm run build
```

### Deploy to Vercel/Netlify
1. Connect your repository
2. Set environment variables
3. Deploy with one click

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Gaurav**

---

Made with ❤️ using React and TypeScript
