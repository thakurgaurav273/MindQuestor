import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { Loader, AlertCircle, CheckCircle, Users } from 'lucide-react';
import { useUserStore } from '../store/userStore';

interface Participant {
    id: string;
    name: string;
}

interface QuizData {
    quizId: string;
    hostName: string;
    numQuestions: number;
    participants: Participant[];
    status: 'waiting' | 'in_progress' | 'completed';
    createdAt: Date;
}

type JoinStep = 'loading' | 'joining' | 'waiting' | 'error' | 'started';

const QuizJoinPage = () => {
    const { quizId } = useParams<{ quizId: string }>();
    const navigate = useNavigate();
    const { user } = useUserStore((state: any) => state);

    const [step, setStep] = useState<JoinStep>('loading');
    const [quiz, setQuiz] = useState<QuizData | null>(null);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [error, setError] = useState<string | null>(null);
    const socketRef = useRef<Socket | null>(null);
    const [quizStarting, setQuizStarting] = useState(false);
    const joinAttemptedRef = useRef(false);

    useEffect(() => {
        // Validation checks
        if (!user) {
            setError('Please log in to join a quiz');
            setStep('error');
            console.error('No user found');
            return;
        }

        if (!quizId) {
            setError('Invalid quiz ID');
            setStep('error');
            console.error('No quizId in params');
            return;
        }

        // Only attempt join once
        if (!joinAttemptedRef.current) {
            joinAttemptedRef.current = true;
            handleJoinQuiz();
        }

        // Cleanup on unmount
        return () => {
            if (socketRef.current) {
                console.log('Cleaning up socket connection');
                socketRef.current.disconnect();
            }
        };
    }, [quizId, user]);

    const handleJoinQuiz = () => {
        try {
            setStep('joining');
            console.log('Starting join process for quiz:', quizId);

            // Create new socket connection
            socketRef.current = io('http://localhost:8080', {
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                reconnectionAttempts: 5,
            });

            socketRef.current.on('connect', () => {
                console.log('Socket connected with ID:', socketRef.current?.id);

                // Emit user:join first
                socketRef.current?.emit('user:join', {
                    userId: user.userId || user.id,
                    userName: user.username || user.name || 'Anonymous',
                });
                console.log('Emitted user:join');

                // Then emit quiz:join after a small delay to ensure user is registered
                setTimeout(() => {
                    console.log('Emitting quiz:join with:', {
                        quizId,
                        participantId: user.userId || user.id,
                        participantName: user.username || user.name || 'Anonymous',
                    });

                    socketRef.current?.emit('quiz:join', {
                        quizId,
                        participantId: user.userId || user.id,
                        participantName: user.username || user.name || 'Anonymous',
                    });
                }, 500);
            });

            // Listen for successful join
            socketRef.current.on('quiz:joined', (data: { quizId: string; quiz: QuizData }) => {
                console.log('Successfully joined quiz:', data);
                setQuiz(data.quiz);
                setParticipants(data.quiz.participants || []);
                setStep('waiting');
            });

            // Listen for participant joining (real-time updates)
            socketRef.current.on('quiz:participant_joined', (data: { participantName: string; participantId: string; participants: Participant[]; totalParticipants: number }) => {
                console.log(`${data.participantName} joined`, 'All participants:', data.participants);
                setParticipants(data.participants);
                
                // Optional: Show a toast notification
                console.log(`New participant joined! Total: ${data.totalParticipants}`);
            });

            // Listen for participant leaving (real-time updates)
            socketRef.current.on('quiz:participant_left', (data: { participantName: string; participantId: string; participants: Participant[]; totalParticipants: number }) => {
                console.log(`${data.participantName} left the quiz`);
                setParticipants(data.participants);
            });

            // Listen for quiz starting
            socketRef.current.on('quiz:started', (data: { quizId: string; totalQuestions: number; participants: Participant[] }) => {
                console.log('Quiz started!', data);
                setQuizStarting(true);
                setTimeout(() => {
                    navigate('/quiz', {
                        state: {
                            isMultiplayer: true,
                            quizId: data.quizId,
                            totalQuestions: data.totalQuestions,
                            participants: data.participants,
                        },
                    });
                }, 1500);
            });

            // Listen for host leaving (quiz cancelled)
            socketRef.current.on('quiz:host_left', (data: { message: string }) => {
                console.error('Host left:', data.message);
                setError('The host has left and the quiz has been cancelled');
                setStep('error');
            });

            // Listen for errors
            socketRef.current.on('quiz:error', (data: { message: string }) => {
                console.error('Quiz error from server:', data.message);
                setError(data.message);
                setStep('error');
            });

            // Connection error handling
            socketRef.current.on('connect_error', (error: any) => {
                console.error('Connection error:', error);
                setError('Failed to connect to server. Please check your connection.');
                setStep('error');
            });

            socketRef.current.on('disconnect', (reason) => {
                console.log('Socket disconnected:', reason);
                if (step === 'waiting') {
                    setError('Connection lost. Please try rejoining.');
                    setStep('error');
                }
            });

        } catch (err) {
            console.error('Error in handleJoinQuiz:', err);
            setError('Failed to join quiz. Please try again.');
            setStep('error');
        }
    };

    const handleRetry = () => {
        setError(null);
        setStep('loading');
        joinAttemptedRef.current = false;
        
        // Disconnect existing socket
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }
        
        // Retry join
        setTimeout(() => {
            handleJoinQuiz();
        }, 500);
    };

    const handleGoBack = () => {
        if (socketRef.current) {
            socketRef.current.disconnect();
        }
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Loading State */}
                {step === 'loading' && (
                    <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                        <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading Quiz</h2>
                        <p className="text-gray-600">Please wait while we prepare the quiz...</p>
                    </div>
                )}

                {/* Joining State */}
                {step === 'joining' && (
                    <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                        <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Joining Quiz</h2>
                        <p className="text-gray-600">Connecting you to the quiz...</p>
                    </div>
                )}

                {/* Waiting for Quiz to Start */}
                {step === 'waiting' && quiz && (
                    <div className="bg-white rounded-2xl shadow-lg p-8">
                        <div className="text-center mb-8">
                            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Successfully Joined!</h2>
                            <p className="text-gray-600">Wait for the host to start the quiz</p>
                        </div>

                        {/* Quiz Info */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                            <div className="grid grid-cols-2 gap-6 mb-6">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Quiz ID</p>
                                    <p className="font-mono font-bold text-gray-900 break-all text-sm">{quiz.quizId}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Number of Questions</p>
                                    <p className="text-2xl font-bold text-blue-600">{quiz.numQuestions}</p>
                                </div>
                            </div>
                            <div className="border-t border-blue-200 pt-6">
                                <p className="text-sm text-gray-600 mb-1">Host</p>
                                <p className="font-semibold text-gray-900">{quiz.hostName}</p>
                            </div>
                        </div>

                        {/* Participants Section */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Users className="w-5 h-5 text-gray-700" />
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Participants ({participants.length})
                                    </h3>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                    <span className="text-xs text-green-600 font-medium">Live Updates</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
                                {participants.map((participant, idx) => {
                                    const isHost = participant.name === quiz.hostName;
                                    const firstLetter = participant.name.charAt(0).toUpperCase();

                                    return (
                                        <div
                                            key={`${participant.id}-${idx}`}
                                            className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg border border-gray-200 animate-fadeIn"
                                        >
                                            <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                                                {firstLetter}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-900">{participant.name}</p>
                                                {isHost && (
                                                    <span className="text-xs text-blue-600 font-medium">Host</span>
                                                )}
                                            </div>
                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Info Box */}
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
                            <div className="flex gap-3">
                                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-yellow-800">
                                    The quiz will start when the host is ready. Keep this page open!
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4">
                            <button
                                onClick={handleGoBack}
                                className="flex-1 border border-gray-300 hover:border-gray-400 text-gray-700 py-3 rounded-lg font-semibold transition"
                            >
                                Leave Quiz
                            </button>
                            <button
                                disabled
                                className="flex-1 bg-gray-400 text-white py-3 rounded-lg font-semibold cursor-not-allowed"
                            >
                                Waiting for Host...
                            </button>
                        </div>

                        {/* Animated Indicator */}
                        <div className="mt-8 text-center">
                            <div className="flex justify-center gap-2 mb-4">
                                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                            </div>
                            <p className="text-sm text-gray-600">Waiting for the quiz to start...</p>
                        </div>
                    </div>
                )}

                {/* Quiz Starting */}
                {quizStarting && (
                    <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                        <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4 animate-bounce" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Quiz Starting!</h2>
                        <p className="text-gray-600">Get ready, the quiz is beginning...</p>
                    </div>
                )}

                {/* Error State */}
                {step === 'error' && (
                    <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                        <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Cannot Join Quiz</h2>
                        <p className="text-gray-600 mb-2">{error}</p>
                        <p className="text-sm text-gray-500 mb-8">
                            {error?.includes('Quiz not found') && 'The quiz ID might be incorrect or expired.'}
                            {error?.includes('already started') && 'You cannot join a quiz that has already started.'}
                            {error?.includes('connection') && 'Check your internet connection and try again.'}
                            {error?.includes('cancelled') && 'The quiz was cancelled by the host.'}
                        </p>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-3">
                            {!error?.includes('already started') && !error?.includes('cancelled') && (
                                <button
                                    onClick={handleRetry}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition"
                                >
                                    Try Again
                                </button>
                            )}
                            <button
                                onClick={handleGoBack}
                                className="w-full border border-gray-300 hover:border-gray-400 text-gray-700 py-3 rounded-lg font-semibold transition"
                            >
                                Go Home
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuizJoinPage;