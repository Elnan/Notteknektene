# Nøtteknektene - Interactive Puzzle Game Platform

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black)](https://vercel.com)
[![Firebase](https://img.shields.io/badge/Backend-Firebase-orange)](https://firebase.google.com)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org)
[![Vite](https://img.shields.io/badge/Vite-5-purple)](https://vitejs.dev)

A comprehensive puzzle game platform featuring multiple challenging games including logic puzzles, pattern recognition, and strategic thinking games. Built for competitive gameplay with real-time scoring and season management.

## 🎮 Features

### Game Collection
- **Logic Grid** - Deductive reasoning puzzles
- **Pattern Solver** - Pattern recognition challenges
- **Building Blocks** - Anagram and word puzzles
- **Triads** - Three-way logic puzzles
- **The Keeper** - Strategic memory game
- **Order & Chaos** - Strategic board game
- **S.O.S** - Classic grid game
- **Investigation Mystery** - Multi-stage detective game
- **Pattern Matrix** - Visual pattern matching
- **Sum Grid** - Mathematical logic puzzles

### Platform Features
- 🔐 **Secure Authentication** - Firebase-based user management
- 💾 **Auto-Save System** - Progress saved automatically across sessions
- 📊 **Live Scoreboards** - Real-time rankings and round tables
- 👨‍💼 **Admin Panel** - Complete game and season management
- 📱 **Responsive Design** - Optimized for desktop, tablet, and mobile
- 🎯 **Season System** - Organized competitive gameplay
- 🏆 **Achievement Tracking** - Track progress and completions

## 🛠️ Tech Stack

- **Frontend Framework:** React 18 with Hooks
- **Build Tool:** Vite 5
- **UI Library:** Material-UI (MUI)
- **Styling:** CSS Modules + Emotion
- **Backend:** Firebase (Auth, Firestore, Storage)
- **Routing:** React Router v7
- **Icons:** React Icons
- **Deployment:** Vercel
- **Version Control:** Git + GitHub

## 🚀 Quick Start

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Firebase project
- Git

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Elnan/Notteknektene.git
   cd Notteknektene
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your Firebase credentials:
   ```env
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_firebase_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   VITE_ADMIN_EMAIL=your_admin_email@example.com
   VITE_NODE_ENV=development
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:5173](http://localhost:5173) in your browser.

## 📁 Project Structure

```
notteknektene/
├── public/                 # Static assets
│   ├── avatars/           # User avatar images
│   └── favicon.ico        # Site favicon
├── src/
│   ├── admin/             # Admin panel components
│   │   ├── components/    # Admin UI components
│   │   └── routes/        # Admin routing
│   ├── components/        # Reusable UI components
│   │   ├── auth/          # Authentication components
│   │   ├── GameWrapper/   # Game container logic
│   │   └── ...            # Other shared components
│   ├── context/           # React context providers
│   │   ├── authContext/   # Authentication state
│   │   └── SaveStateContext.jsx
│   ├── firebase/          # Firebase configuration
│   │   ├── firebase-config-notteknektene.js
│   │   └── admin-firebase-utils.js
│   ├── hooks/             # Custom React hooks
│   │   ├── useGameSaveState.js
│   │   └── ...
│   ├── tasks/             # Game components
│   │   ├── season2/       # Season 2 games
│   │   │   ├── triads/
│   │   │   ├── the-keeper/
│   │   │   ├── logic-grid/
│   │   │   └── ...
│   │   └── other/         # Additional games
│   ├── utils/             # Utility functions
│   │   ├── gamesConfig.js
│   │   ├── seasonManager.js
│   │   └── logger.js
│   ├── App.jsx            # Main app component
│   └── main.jsx           # App entry point
├── vercel.json            # Vercel configuration
├── vite.config.js         # Vite configuration
└── package.json           # Dependencies
```

## 🎯 Available Scripts

```bash
npm run dev      # Start development server (port 5173)
npm run build    # Build for production
npm run preview  # Preview production build locally
npm run lint     # Run ESLint
```

## 🚀 Deployment

This project is configured for deployment on Vercel. See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

### Quick Deploy to Vercel

1. Push your code to GitHub
2. Import repository in Vercel
3. Configure environment variables
4. Deploy!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Elnan/Notteknektene)

## 🔒 Security Features

- ✅ Environment-based configuration
- ✅ No hardcoded credentials
- ✅ Protected admin routes
- ✅ Firebase security rules
- ✅ Production-safe logging
- ✅ Secure authentication flow
- ✅ HTTPS-only in production

## 🎨 Key Features Implementation

### Save State System
Games automatically save progress using Firebase Firestore, allowing users to resume games across sessions and devices.

### Admin Panel
Comprehensive admin interface for:
- User management
- Season creation and management
- Game scheduling and configuration
- Score management
- Live schedule updates
- Database migration tools

### Scoring System
- Automatic score calculation
- Round tables for each game
- Season-wide leaderboards
- Point-based ranking system

## 📱 Mobile Support

- Fully responsive design
- Touch-optimized game interfaces
- Mobile navigation menu
- Progressive Web App (PWA) ready
- Optimized for iOS and Android

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style
- Write meaningful commit messages
- Test your changes thoroughly
- Update documentation as needed
- Add comments for complex logic

## 🐛 Bug Reports

Found a bug? Please open an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Browser/device information

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with React and Vite
- UI components from Material-UI
- Backend powered by Firebase
- Deployed on Vercel
- Icons from React Icons

## 📧 Contact

- **Website:** [notteknektene.com](https://notteknektene.com)
- **Email:** support@notteknektene.com
- **GitHub:** [@Elnan](https://github.com/Elnan)

## 🌟 Show Your Support

Give a ⭐️ if you like this project!

---

**Built with ❤️ by the Notteknektene Team**
