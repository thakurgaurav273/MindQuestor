import { useLocation, useNavigate } from "react-router-dom";
import { useUserStore } from "../store/userStore";
import { useCallback, useEffect, useRef, useState } from "react";
import { User, Lightbulb, Clock, CheckCircle, XCircle, SkipForward, Loader, AlertCircle } from "lucide-react";
import { getSocket } from "../App";
import type { Socket } from "socket.io-client";
import MessageList from "../components/MessageList";
import MessageComposer from "../components/MessageComposer";

interface Question {
    _id: string
    questionText: string;
    options: string[];
    hint: string;
}

interface QuizData {
    id: string;
    inviteCode: string;
    category: string;
    questions: Question[];
    sessionStatus: string;
    createdBy: string;
}

interface Message {
    text: string;
    timeStamp: number;
    isUser?: boolean;
    username?: string;
    senderId?: string;
}

const QuizePage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useUserStore((state: any) => state);

    // State
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(10);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [isHintVisible, setIsHintVisible] = useState(false);
    const [answered, setAnswered] = useState(false);
    const [quizData, setQuizData] = useState<QuizData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [userAnswers, setUserAnswers] = useState<Array<{
        id: string;
        question: string;
        selectedAnswer: string;
        correctAnswer: string;
        isCorrect: boolean;
        timeSpent: number;
    }>>([]);

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startTimeRef = useRef<number>(Date.now());
    const socketRef = useRef<Socket | null>(null);


    const currentQuestion = quizData?.questions[currentQuestionIndex];
    const totalQuestions = quizData?.questions.length || 0;

    // Get data from location state
    const { category, quizId, isMultiplayer } = (location.state || {}) as {
        category?: string;
        quizId?: string;
        isMultiplayer?: boolean;
    };

    const addMessage = (text: string) => {
        const newMessage: Message = {
            text,
            timeStamp: Date.now(),
            isUser: true,
            username: user?.username || user?.name || 'You',
            senderId: user.userId
        };
        // Optimistically add user's message to the chat
        setMessages((prev) => [...prev, newMessage]);

        // Send message via socket
        if (socketRef.current && quizData?.inviteCode) {
            socketRef.current.emit("message:sent", {
                quizId: quizData.inviteCode,
                senderId: user.userId,
                username: user.username || user.name || 'You',
                text: text,
                messageType: 'chat'
            });
        }
    };

    const handleBeforeUnload = (e: any) => {
        e.preventDefault();
        e.returnValue = "";
        if (socketRef.current) {
            socketRef.current.emit("quiz:exit", { userId: user.userId, quizId: quizId });
        }
    };

    const handlePopState = () => {
        if (socketRef.current) {
            socketRef.current.emit("quiz:exit", { userId: user.userId, quizId: quizId });
        }
        window.history.pushState(null, "", window.location.href);
    };

    useEffect(() => {
        window.addEventListener("beforeunload", handleBeforeUnload);
        window.history.pushState(null, "", window.location.href);
        window.addEventListener("popstate", handlePopState);
        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
            window.removeEventListener("popstate", handlePopState);
        };
    }, []);


    const goToNextQuestion = useCallback(() => {
        if (!quizData) return;

        if (currentQuestionIndex < quizData.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            // Quiz completed
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }
    }, [currentQuestionIndex, quizData]);

    // Initialize socket, fetch quiz data, and REJOIN the room
    useEffect(() => {
        socketRef.current = getSocket();

        if (!socketRef.current || !quizId || !user?.userId) {
            console.error('Missing socket, quizId, or userId.');
            setLoading(false);
            setError('Missing required information to load quiz.');
            return;
        }

        console.log('=== QUIZ PAGE MOUNTED ===');
        console.log('Socket ID:', socketRef.current.id);
        console.log('Quiz ID:', quizId);
        console.log('User:', user?.username);

        // --- FIX: RELIABLE ROOM REJOIN ON MOUNT ---
        if (isMultiplayer) {
            console.log('Multiplayer mode. Emitting quiz:rejoin to ensure room membership...');

            // This ensures the current active socket is added to the room
            socketRef.current.emit('quiz:rejoin', {
                quizId,
                participantId: user.userId,
            });
        }
        // ------------------------------------------

        const fetchQuizData = async () => {
            try {
                setLoading(true);
                const response = await fetch(`http://localhost:8080/quiz/getQuizByCode/${quizId}`);

                if (!response.ok) {
                    throw new Error('Failed to fetch quiz data');
                }

                const data = await response.json();
                console.log('✓ Quiz data fetched:', data);

                setQuizData(data.quizDetails);
                setError(null);
            } catch (err) {
                console.error('❌ Error fetching quiz:', err);
                setError('Failed to load quiz. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchQuizData();

        // Clean up sessionStorage key if it exists, as the user is actively here
        // sessionStorage.removeItem(`quiz_${quizId}_joined`);

    }, [quizId, user?.userId, isMultiplayer]);

    // Listen for answer validation from server
    useEffect(() => {
        if (!socketRef.current) return;

        const handleAnswerResult = (data: {
            questionId: string;
            isCorrect: boolean;
            correctAnswer: string;
        }) => {
            console.log('Answer validation received:', data);

            if (data.questionId === currentQuestion?._id) {
                setIsCorrect(data.isCorrect);
                setCorrectAnswer(data.correctAnswer);

                // Record answer after receiving validation
                if (selectedAnswer) {
                    const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);

                    setUserAnswers(prev => [...prev, {
                        id: currentQuestion._id,
                        question: currentQuestion.questionText,
                        selectedAnswer: selectedAnswer,
                        correctAnswer: data.correctAnswer,
                        isCorrect: data.isCorrect,
                        timeSpent,
                    }]);
                }

                // Auto-advance after showing result
                setTimeout(() => {
                    goToNextQuestion();
                }, 1500);
            }
        };

        socketRef.current.on('quiz:isCorrect', handleAnswerResult);

        return () => {
            socketRef.current?.off('quiz:isCorrect', handleAnswerResult);
        };
    }, [currentQuestion, selectedAnswer, goToNextQuestion]); // Added goToNextQuestion dependency

    // Listen for messages and rejoin confirmation
    useEffect(() => {
        if (!socketRef.current) return;

        const handleMessageReceived = (data: {
            quizId: string;
            senderId: string;
            username: string;
            text: string;
            messageType: string;
            timestamp: number;
        }) => {
            console.log('📨 Message received via socket:', data);

            setMessages(prev => [...prev, {
                text: data.text,
                timeStamp: data.timestamp,
                // Note: isUser is true if the SENDER ID is the current user ID
                isUser: data.senderId === user.userId,
                username: data.username,
                senderId: data.senderId,
            }]);
        };

        const handleRoomInfo = (data: any) => {
            console.log('=== DEBUG ROOM INFO RECEIVED ===');
            console.log(data);
        };

        const handleRejoined = (data: any) => {
            console.log('✓ Successfully rejoined quiz room:', data);
        };

        socketRef.current.on('message:received', handleMessageReceived);
        socketRef.current.on('debug:room_info', handleRoomInfo);
        socketRef.current.on('quiz:rejoined', handleRejoined);

        return () => {
            socketRef.current?.off('message:received', handleMessageReceived);
            socketRef.current?.off('debug:room_info', handleRoomInfo);
            socketRef.current?.off('quiz:rejoined', handleRejoined);
        };
    }, [user?.userId]);

    // Debug: Check room status periodically
    useEffect(() => {
        if (!socketRef.current || !quizId) return;

        const checkRoomStatus = () => {
            // Request room debug info from server
            socketRef.current?.emit('debug:check_rooms', { quizId });
        };

        // Check immediately
        // Note: The first check will run before fetchQuizData completes, 
        // subsequent checks are more reliable.
        checkRoomStatus();

        // Check after 2 seconds
        const timer = setTimeout(checkRoomStatus, 2000);
        // Check every 10 seconds (optional)
        // const interval = setInterval(checkRoomStatus, 10000);

        return () => {
            clearTimeout(timer);
            // clearInterval(interval);
        };
    }, [quizId]);


    const startTimer = useCallback(() => {
        setTimeLeft(10);
        setSelectedAnswer(null);
        setIsHintVisible(false);
        setAnswered(false);
        setIsCorrect(null);
        setCorrectAnswer(null);
        startTimeRef.current = Date.now();

        if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    handleTimeOut();
                    return 10;
                }
                return prev - 1;
            });
        }, 1000);
    }, []);

    const handleTimeOut = () => {
        if (!answered && currentQuestion) {
            // --- FIX 1: Clear the interval when timeout occurs ---
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null; // Clear ref after clearing interval
            }
            // ----------------------------------------------------

            const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);

            // Send timeout to server to get correct answer
            if (socketRef.current) {
                socketRef.current.emit('quiz:timeout', {
                    quizId: quizId,
                    participantId: user.userId,
                    questionId: currentQuestion._id,
                    timeSpent: timeSpent,
                });
            }

            setAnswered(true);

            // Record "No answer"
            setUserAnswers(prev => [...prev, {
                id: currentQuestion._id,
                question: currentQuestion.questionText,
                selectedAnswer: 'No answer',
                correctAnswer: 'Server Validation Needed', // Placeholder
                isCorrect: false,
                timeSpent,
            }]);

            setTimeout(() => {
                goToNextQuestion();
            }, 1500);
        }
    };
    useEffect(() => {
        if (!loading && quizData) {
            startTimer();
        }
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [currentQuestionIndex, startTimer, loading, quizData]);

    const handleAnswerClick = (option: string) => {
        if (answered || !currentQuestion) return;

        setSelectedAnswer(option);
        setAnswered(true);

        const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);

        // Send answer to server for validation
        if (socketRef.current) {
            socketRef.current.emit('quiz:answer', {
                quizId: quizId,
                participantId: user.userId,
                questionId: currentQuestion._id,
                answer: option,
                timeSpent: timeSpent,
            });
        }

        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
    };

    const handleFinishQuiz = () => {
        // Calculate results
        const correctCount = userAnswers.filter(a => a.isCorrect).length;
        const totalTime = userAnswers.reduce((sum, a) => sum + a.timeSpent, 0);

        // Navigate to results page
        navigate('/results', {
            state: {
                userAnswers,
                totalQuestions,
                correctCount,
                totalTime,
                category: quizData?.category,
                quizId,
            }
        });
    };

    // Loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading Quiz...</h2>
                    <p className="text-gray-600">Please wait while we prepare your quiz</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !quizData) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
                    <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Failed to Load Quiz</h2>
                    <p className="text-gray-600 mb-6">{error || 'Quiz not found'}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;
    const isQuizCompleted = currentQuestionIndex === totalQuestions - 1 && answered;

    if (isQuizCompleted && socketRef.current) {
        socketRef.current.emit("quiz:finishedForOne", { data: userAnswers });
    }

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            <nav className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                            {quizData.category?.toUpperCase() || 'GENERAL'} QUIZ
                        </p>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Question {currentQuestionIndex + 1} of {totalQuestions}
                        </h1>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold ${timeLeft <= 3
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-700'
                            }`}>
                            <Clock className="w-5 h-5" />
                            <span>{timeLeft}s</span>
                        </div>

                        <div className="flex items-center gap-3">
                            <User className="w-5 h-5 text-gray-600" />
                            <p className="text-gray-700 font-medium">
                                {user?.username || user?.name || 'Guest'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white px-6 pb-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-600 mt-2">{Math.round(progress)}% Complete</p>
                </div>
            </nav>

            <main className="flex-1 overflow-y-auto py-8 px-4 flex gap-3">
                <div className="max-w-2xl">
                    <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
                        <div className="flex items-start justify-between gap-4 mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 leading-relaxed flex-1">
                                {currentQuestion?.questionText}
                            </h2>
                            {currentQuestion?.hint && (
                                <button
                                    onClick={() => !answered && setIsHintVisible(!isHintVisible)}
                                    disabled={answered}
                                    className={`flex-shrink-0 p-2 rounded-lg transition ${isHintVisible
                                        ? 'bg-yellow-100 text-yellow-600'
                                        : 'hover:bg-gray-100 text-gray-600'
                                        } ${answered ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                    title="Show Hint"
                                >
                                    <Lightbulb className="w-6 h-6" />
                                </button>
                            )}
                        </div>

                        {isHintVisible && currentQuestion?.hint && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                                <div className="flex gap-3">
                                    <Lightbulb className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-semibold text-yellow-900 mb-1">Hint</p>
                                        <p className="text-yellow-800">{currentQuestion.hint}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-3">
                        {currentQuestion?.options.map((option, index) => {
                            const isSelected = selectedAnswer === option;
                            const isOptionCorrect = answered && correctAnswer === option;
                            let bgColor = 'bg-white';
                            let borderColor = 'border-gray-200';
                            let textColor = 'text-gray-900';

                            if (answered && isCorrect !== null) {
                                if (isSelected && isCorrect) {
                                    bgColor = 'bg-green-50';
                                    borderColor = 'border-green-300';
                                } else if (isSelected && !isCorrect) {
                                    bgColor = 'bg-red-50';
                                    borderColor = 'border-red-300';
                                } else if (isOptionCorrect && !isSelected) {
                                    bgColor = 'bg-green-50';
                                    borderColor = 'border-green-300';
                                }
                            }

                            return (
                                <button
                                    key={index}
                                    onClick={() => handleAnswerClick(option)}
                                    disabled={answered}
                                    className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${answered ? 'cursor-not-allowed' : 'cursor-pointer hover:border-blue-300'
                                        } ${bgColor} ${borderColor} ${textColor} ${!answered && !isSelected ? 'hover:bg-gray-50' : ''
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold">{option}</span>
                                        {answered && isCorrect !== null && isSelected && (
                                            <span>
                                                {isCorrect ? (
                                                    <CheckCircle className="w-6 h-6 text-green-600" />
                                                ) : (
                                                    <XCircle className="w-6 h-6 text-red-600" />
                                                )}
                                            </span>
                                        )}
                                        {answered && isOptionCorrect && !isSelected && (
                                            <CheckCircle className="w-6 h-6 text-green-600" />
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {answered && !isQuizCompleted && (
                        <div className="mt-8 flex gap-4">
                            <button
                                onClick={goToNextQuestion}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                            >
                                <span>Next Question</span>
                                <SkipForward className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                    {isQuizCompleted && (
                        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
                            <div className="text-center mb-6">
                                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                                <h3 className="text-2xl font-bold text-green-900 mb-2">Quiz Completed!</h3>
                                <p className="text-green-700">Great job! You've finished all questions.</p>
                            </div>
                            <div className="bg-white rounded-lg p-4 mb-4">
                                <div className="grid grid-cols-2 gap-4 text-center">
                                    <div>
                                        <p className="text-sm text-gray-600">Correct Answers</p>
                                        <p className="text-2xl font-bold text-green-600">
                                            {userAnswers.filter(a => a.isCorrect).length}/{totalQuestions}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Accuracy</p>
                                        <p className="text-2xl font-bold text-blue-600">
                                            {Math.round((userAnswers.filter(a => a.isCorrect).length / totalQuestions) * 100)}%
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={handleFinishQuiz}
                                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition"
                            >
                                View Detailed Results
                            </button>
                        </div>
                    )}
                </div>

                {/* Chat Section */}
                <div className="flex flex-col w-[40%] h-[calc(100vh-200px)] border border-gray-300 rounded-lg bg-white shadow-sm">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 rounded-t-lg">
                        <h3 className="font-semibold text-gray-900">Quiz Chat</h3>
                        <p className="text-xs text-gray-600">Talk with other participants</p>
                    </div>
                    <MessageList messages={messages} />
                    <MessageComposer onSend={addMessage} quizId={quizData.inviteCode} />
                </div>
            </main>
        </div>
    );
};

export default QuizePage;