import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Copy, Users, Zap, ArrowRight, Loader, AlertCircle } from 'lucide-react';
import { useUserStore } from '../store/userStore';
import { useLocation, useNavigate } from 'react-router-dom';
import JoinViaLink from './JoinViaLink';
import { getSocket } from '../App';

interface Participant {
    id: string;
    name: string;
}

interface Quiz {
    quizId: string;
    hostName: string;
    numQuestions: number;
    participants: Participant[];
    status: 'WAITING' | 'ACTIVE' | 'COMPLETED';
    createdAt: Date;
}

const InvitationPage = () => {
    const { user } = useUserStore((state: any) => state);
    const [step, setStep] = useState<'main' | 'create' | 'invite' | 'join'>('main');
    const [numQuestions, setNumQuestions] = useState(20);
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [participants, setParticipants] = useState<Participant[]>([user.userId]);
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(false);
    const socketRef = useRef<Socket | null>(null);
    const navigate = useNavigate();

    const location = useLocation();
    const category = location.state?.category;

    console.log("category for quiz", category);
    useEffect(() => {
        // Check if user is authenticated
        if (!user) {
            navigate('/login');
            return;
        }

        // Initialize socket connection
        if (!socketRef.current) {
            socketRef.current = getSocket();
            // Socket connection handler
            socketRef.current.on('connect', () => {
                console.log('Socket connected:', socketRef.current?.id);
                if (socketRef.current && user) {
                    socketRef.current.emit('user:join', {
                        userId: user.userId || user.id,
                        userName: user.username || user.name || 'Anonymous',
                    });
                }
            });

            // Listen for quiz created confirmation
            socketRef.current.on('quiz:created', (data: { quizId: string; message: string; quiz: any }) => {
                console.log('Quiz created confirmation:', data);
                // Update local quiz state with the quiz data from socket
                if (data.quiz) {
                    setQuiz({
                        quizId: data.quiz.quizId,
                        hostName: data.quiz.hostName,
                        numQuestions: data.quiz.numQuestions,
                        participants: data.quiz.participants || [],
                        status: 'WAITING',
                        createdAt: new Date(data.quiz.createdAt),
                    });
                    setParticipants(data.quiz.participants || []);
                    setStep('invite');
                }
            });

            // Listen for participants joining
            socketRef.current.on('quiz:participant_joined', (data: { participantName: string; participantId: string; participants: Participant[]; totalParticipants: number }) => {
                console.log(`${data.participantName} joined the quiz`);
                setParticipants(data.participants);

                // Show notification toast (optional)
                console.log(`Total participants: ${data.totalParticipants}`);
            });

            // Listen for participants leaving
            socketRef.current.on('quiz:participant_left', (data: { participantName: string; participantId: string; participants: Participant[]; totalParticipants: number }) => {
                console.log(`${data.participantName} left the quiz`);
                setParticipants(data.participants);
            });

            // Listen for quiz started
            socketRef.current.on('quiz:started', (data: { quizId: string; totalQuestions: number; participants: Participant[] }) => {
                console.log('Quiz started!', data);
                // Navigate to quiz page
                setTimeout(() => {
                    navigate('/quiz', {
                        state: {
                            isMultiplayer: true,
                            isHost: true,
                            quizId: data.quizId,
                            totalQuestions: data.totalQuestions,
                            participants: data.participants,
                            category: category,
                            numQuestions: numQuestions
                        },
                    });
                }, 1000);
            });

            // Error handling
            socketRef.current.on('quiz:error', (data: { message: string }) => {
                console.error('Quiz error:', data.message);
                alert(`Error: ${data.message}`);
                setLoading(false);
            });

            socketRef.current.on('connect_error', (error) => {
                console.error('Connection error:', error);
                alert('Failed to connect to server. Please check your connection.');
            });
        }

        // Cleanup on unmount
        return () => {
            if (socketRef.current) {
                socketRef.current.off('quiz:created');
                socketRef.current.off('quiz:participant_joined');
                socketRef.current.off('quiz:participant_left');
                socketRef.current.off('quiz:started');
                socketRef.current.off('quiz:error');
            }
        };
    }, [user, navigate]);

    const generateQuizId = (): string => {
        return `QUIZ_${Date.now()}_${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
    };

    const handleCreateQuiz = async () => {
        if (!user) {
            alert('Please log in first');
            return;
        }

        if (!socketRef.current || !socketRef.current.connected) {
            alert('Socket connection failed. Please refresh and try again.');
            return;
        }

        setLoading(true);
        const quizId = generateQuizId();
        const hostName = user.username || user.name || 'Anonymous';
        const hostId = user.userId || user.id;

        try {
            // 1. Create quiz in database
            const response = await fetch('http://localhost:8080/quiz/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    category: 'science',
                    count: numQuestions,
                    inviteCode: quizId,
                    sessionStatus: 'WAITING',
                    participants: participants,
                    createdBy: hostId,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to create quiz on server.');
            }

            const result = await response.json();
            console.log('Quiz created in database:', result);

            // 2. Emit socket event to create real-time session
            socketRef.current.emit('quiz:create', {
                quizId: quizId,
                hostId: hostId,
                hostName: hostName,
                numQuestions: numQuestions,
            });

            // The quiz:created event will handle the rest

        } catch (error) {
            console.error('Quiz creation failed:', error);
            alert('Could not create quiz. Please try again.');
            setLoading(false);
        }
    };

    const handleCopyLink = () => {
        if (quiz) {
            const inviteLink = `${window.location.origin}/quiz/${quiz.quizId}`;
            navigator.clipboard.writeText(inviteLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleShareVia = (platform: string) => {
        if (quiz) {
            const inviteLink = `${window.location.origin}/quiz/${quiz.quizId}`;
            const message = `Join my quiz challenge! ${inviteLink}`;

            const urls = {
                whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`,
                twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`,
                facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(inviteLink)}`,
                email: `mailto:?subject=Join My Quiz&body=${encodeURIComponent(message)}`,
            };

            if (platform in urls) {
                window.open(urls[platform as keyof typeof urls], '_blank');
            }
        }
    };

    const handleStartQuiz = () => {
        if (!socketRef.current) {
            alert('Socket connection lost. Please refresh.');
            return;
        }

        if (!quiz) {
            alert('Quiz not found.');
            return;
        }

        if (participants.length < 2) {
            const confirmStart = window.confirm('You are the only participant. Start the quiz anyway?');
            if (!confirmStart) return;
        }

        console.log('Starting quiz:', quiz.quizId);
        socketRef.current.emit('quiz:start', {
            quizId: quiz.quizId,
            hostId: user.userId || user.id,
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">

            <div className="max-w-4xl mx-auto">
                {step === 'join' && <JoinViaLink />}

                {step !== 'join' && <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Challenge Your Friends</h1>
                    <p className="text-lg text-gray-600">Create a quiz and invite friends to compete with you</p>
                </div>}

                {step === 'main' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Create Quiz Card */}
                        <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                                <Zap className="w-6 h-6 text-blue-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Quiz</h2>
                            <p className="text-gray-600 mb-6">Set up a new quiz and invite friends to join</p>
                            <button
                                onClick={() => setStep('create')}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                            >
                                Create <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Join Quiz Card */}
                        <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                                <Users className="w-6 h-6 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Join Quiz</h2>
                            <p className="text-gray-600 mb-6">Join a friend's quiz using the invite link</p>
                            <button
                                onClick={() => setStep('join')}
                                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                            >
                                Join Quiz <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Create Quiz Step */}
                {step === 'create' && (
                    <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl mx-auto">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Your Quiz</h2>

                        {/* Question Count Slider */}
                        <div className="mb-8">
                            <label className="block text-sm font-semibold text-gray-700 mb-4">
                                Number of Questions: <span className="text-blue-600 text-lg">{numQuestions}</span>
                            </label>
                            <input
                                type="range"
                                min="10"
                                max="50"
                                step="5"
                                value={numQuestions}
                                onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                            <div className="flex justify-between text-xs text-gray-600 mt-2">
                                <span>10 Questions</span>
                                <span>50 Questions</span>
                            </div>
                        </div>

                        {/* Settings Summary */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-semibold">
                                    ✓
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">Quiz Configuration</p>
                                    <p className="text-gray-700 text-sm mt-1">
                                        You'll be hosting a <strong>{numQuestions} question</strong> quiz. Participants will have 10 seconds per question.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4">
                            <button
                                onClick={() => setStep('main')}
                                disabled={loading}
                                className="flex-1 border border-gray-300 hover:border-gray-400 text-gray-700 py-3 rounded-lg font-semibold transition disabled:opacity-50"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleCreateQuiz}
                                disabled={loading}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader className="w-5 h-5 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    'Create Quiz'
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Invite Step */}
                {step === 'invite' && quiz && (
                    <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl mx-auto">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Share Your Quiz</h2>

                        {/* Quiz Details */}
                        <div className="bg-gray-50 rounded-lg p-6 mb-8">
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <p className="text-sm text-gray-600">Quiz ID</p>
                                    <p className="font-mono font-bold text-gray-900 break-all text-sm">{quiz.quizId}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Questions</p>
                                    <p className="text-2xl font-bold text-blue-600">{quiz.numQuestions}</p>
                                </div>
                            </div>
                            <div className="border-t border-gray-200 pt-4">
                                <p className="text-sm text-gray-600 mb-3">
                                    Participants ({participants.length})
                                    <span className="ml-2 inline-flex items-center gap-1">
                                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                        <span className="text-xs text-green-600">Live</span>
                                    </span>
                                </p>
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {participants.map((participant, idx) => (
                                        <div
                                            key={`${participant.id}-${idx}`}
                                            className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-200"
                                        >
                                            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                                {participant.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-gray-900 font-medium">{participant.name}</span>
                                            {participant.name === quiz.hostName && (
                                                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded ml-auto font-semibold">
                                                    Host
                                                </span>
                                            )}
                                            <div className="w-2 h-2 bg-green-500 rounded-full ml-auto"></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Invite Link */}
                        <div className="mb-8">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Invite Link</label>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={`${window.location.origin}/quiz/${quiz.quizId}`}
                                    readOnly
                                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm text-gray-600"
                                />
                                <button
                                    onClick={handleCopyLink}
                                    className={`px-4 py-3 rounded-lg font-semibold transition flex items-center gap-2 flex-shrink-0 ${copied
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                        }`}
                                >
                                    <Copy className="w-5 h-5" />
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                        </div>

                        {/* Share Options */}
                        <div className="mb-8">
                            <p className="text-sm font-semibold text-gray-700 mb-3">Or share via</p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <button
                                    onClick={() => handleShareVia('whatsapp')}
                                    className="p-3 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg font-semibold transition text-sm"
                                >
                                    WhatsApp
                                </button>
                                <button
                                    onClick={() => handleShareVia('twitter')}
                                    className="p-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg font-semibold transition text-sm"
                                >
                                    Twitter
                                </button>
                                <button
                                    onClick={() => handleShareVia('facebook')}
                                    className="p-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg font-semibold transition text-sm"
                                >
                                    Facebook
                                </button>
                                <button
                                    onClick={() => handleShareVia('email')}
                                    className="p-3 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-lg font-semibold transition text-sm"
                                >
                                    Email
                                </button>
                            </div>
                        </div>

                        {/* Info Box */}
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8 flex gap-3">
                            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-yellow-800">
                                Share this link with friends. They can join anytime before you start the quiz.
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4">
                            <button
                                onClick={() => {
                                    setStep('main');
                                    setQuiz(null);
                                    setParticipants([]);
                                }}
                                className="flex-1 border border-gray-300 hover:border-gray-400 text-gray-700 py-3 rounded-lg font-semibold transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleStartQuiz}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                            >
                                <Zap className="w-5 h-5" />
                                Start Quiz ({participants.length})
                            </button>
                        </div>

                        {/* Waiting Animation */}
                        <div className="mt-8 text-center">
                            <div className="flex justify-center gap-2 mb-4">
                                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                            </div>
                            <p className="text-sm text-gray-600">Waiting for participants to join...</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InvitationPage;