import { useEffect, useRef } from 'react';
import './App.css';
import { io, Socket } from 'socket.io-client';
import { useUserStore } from './store/userStore';
import { Route, Routes, useNavigate } from 'react-router-dom';
import NotFound from './pages/NotFound';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import HomePage from './pages/HomePage';
import InvitationPage from './pages/InvitationPage';
import QuizJoinPage from './pages/QuizJoinPage';
import { authService } from './shared/services/auth.service';
import QuizePage from './pages/QuizePage';
import ResultsPage from './pages/ResultsPage';

// Global socket instance
let globalSocket: Socket;

export const getSocket = (): Socket => {
  return globalSocket;
};

function App() {
  const user = useUserStore((state: any) => state.user);
  const setUser = useUserStore((state: any) => state.setUser);
  const navigate = useNavigate();
  const socketRef = useRef<Socket | null>(null);
  const userInitializedRef = useRef(false);

  // Initialize and authenticate user
  useEffect(() => {
    if (userInitializedRef.current) return;
    userInitializedRef.current = true;

    authService
      .getLoggedInUser(localStorage.getItem('authToken') || '')
      .then((userData) => {
        console.log('Logged in user data:', userData);
        setUser(userData);
      })
      .catch((error) => {
        console.log('User not authenticated:', error);
        navigate('/login');
      });
  }, [setUser, navigate]);

  // Initialize socket connection
  useEffect(() => {
    if (!globalSocket) {
      globalSocket = io('http://localhost:8080', {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      globalSocket.on('connect', () => {
        console.log('Connected to server:', globalSocket?.id);

        // // Emit user:join event if user is authenticated
        // if (user && user.userId && user.username) {
        //   globalSocket?.emit('user:join', {
        //     userId: user.userId,
        //     userName: user.username,
        //   });
        //   console.log('Emitted user:join with:', { userId: user.userId, userName: user.username });
        // }
      });

      globalSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      globalSocket.on('disconnect', (reason) => {
        console.log('Disconnected from server:', reason);
      });

      globalSocket.on('error', (error) => {
        console.error('Socket error:', error);
      });

      socketRef.current = globalSocket;
    }
    return () => {
      // Don't disconnect socket - keep it alive for the app lifetime
    };
  }, [user]);

  const privateRoute = () => {
    if (user) {
      return (
        <>
          <Route path="/" element={<HomePage />} />
          <Route path="/invite" element={<InvitationPage />} />
          <Route path="/quiz/:quizId" element={<QuizJoinPage />} />
          <Route path="/quiz" element={<QuizePage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
          <Route path="*" element={<NotFound />} />
        </>
      );
    }
    return null;
  };

  const publicRoute = () => {
    return (
      <>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<SignUp />} />
        <Route path="/quiz/:quizId" element={<QuizJoinPage />} />
        <Route path="*" element={<NotFound />} />
      </>
    );
  };

  return (
    <Routes>
      {user ? privateRoute() : publicRoute()}
    </Routes>
  );
}

export default App;