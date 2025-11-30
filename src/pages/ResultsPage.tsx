import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Trophy, Clock, Target, TrendingUp, CheckCircle, XCircle, Home, Share2, Loader } from 'lucide-react';
import { useUserStore } from '../store/userStore';

interface UserAnswer {
    question: string;
    selectedAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    timeSpent: number;
}

const ResultsPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useUserStore((state: any) => state);
    const [updating, setUpdating] = useState(false);
    const [updateError, setUpdateError] = useState<string | null>(null);

    const {
        userAnswers = [],
        totalQuestions = 0,
        correctCount = 0,
        totalTime = 0,
        category = 'General',
        quizId,
    } = (location.state || {}) as {
        userAnswers: UserAnswer[];
        totalQuestions: number;
        correctCount: number;
        totalTime: number;
        category: string;
        quizId?: string;
    };

    // Calculate stats
    const incorrectCount = totalQuestions - correctCount;
    const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const averageTime = totalQuestions > 0 ? Math.round(totalTime / totalQuestions) : 0;

    // Determine performance level
    const getPerformanceLevel = () => {
        if (accuracy >= 90) return { level: 'Excellent', color: 'text-green-600', bg: 'bg-green-50' };
        if (accuracy >= 70) return { level: 'Good', color: 'text-blue-600', bg: 'bg-blue-50' };
        if (accuracy >= 50) return { level: 'Fair', color: 'text-yellow-600', bg: 'bg-yellow-50' };
        return { level: 'Needs Improvement', color: 'text-red-600', bg: 'bg-red-50' };
    };

    const performance = getPerformanceLevel();

    // Update user stats in database
    useEffect(() => {
        const updateUserStats = async () => {
            if (!user || !quizId) {
                console.log('Missing user or quizId, skipping update');
                return;
            }

            setUpdating(true);
            setUpdateError(null);

            try {
                const response = await fetch('http://localhost:8080/quiz/updateUserStats', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        userId: user.userId || user.id,
                        quizId: quizId,
                        correctCount: correctCount,
                        totalQuestions: totalQuestions,
                        accuracy: accuracy,
                        totalTime: totalTime,
                        answers: userAnswers.map(answer => ({
                            question: answer.question,
                            selectedAnswer: answer.selectedAnswer,
                            correctAnswer: answer.correctAnswer,
                            isCorrect: answer.isCorrect,
                            timeSpent: answer.timeSpent,
                        })),
                    }),
                });

                if (!response.ok) {
                    throw new Error('Failed to update user stats');
                }

                const data = await response.json();
                console.log('User stats updated:', data);
            } catch (error) {
                console.error('Error updating user stats:', error);
                setUpdateError('Failed to save your results. They may not appear in your history.');
            } finally {
                setUpdating(false);
            }
        };

        updateUserStats();
    }, [user, quizId, correctCount, totalQuestions, accuracy, totalTime, userAnswers]);

    const handleShare = () => {
        const shareText = `I scored ${correctCount}/${totalQuestions} (${accuracy}%) on ${category} quiz! Can you beat my score?`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Quiz Results',
                text: shareText,
            }).catch(err => console.log('Error sharing:', err));
        } else {
            navigator.clipboard.writeText(shareText);
            alert('Results copied to clipboard!');
        }
    };

    if (userAnswers.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">No results to display</p>
                    <button
                        onClick={() => navigate('/')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <Trophy className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Quiz Complete!</h1>
                    <p className="text-xl text-gray-600">{category.toUpperCase()} Quiz Results</p>
                </div>

                {/* Update Status */}
                {updating && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center gap-3">
                        <Loader className="w-5 h-5 animate-spin text-blue-600" />
                        <p className="text-sm text-blue-800">Saving your results...</p>
                    </div>
                )}

                {updateError && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-center gap-3">
                        <XCircle className="w-5 h-5 text-yellow-600" />
                        <p className="text-sm text-yellow-800">{updateError}</p>
                    </div>
                )}

                {/* Performance Card */}
                <div className={`${performance.bg} border-2 ${performance.color.replace('text-', 'border-')} rounded-xl p-6 mb-8`}>
                    <div className="text-center">
                        <p className={`text-sm font-semibold ${performance.color} uppercase tracking-wide mb-2`}>
                            Performance
                        </p>
                        <p className={`text-4xl font-bold ${performance.color}`}>{performance.level}</p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    {/* Score */}
                    <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                        <Target className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                        <p className="text-sm text-gray-600 mb-1">Score</p>
                        <p className="text-3xl font-bold text-gray-900">
                            {correctCount}/{totalQuestions}
                        </p>
                    </div>

                    {/* Accuracy */}
                    <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                        <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-3" />
                        <p className="text-sm text-gray-600 mb-1">Accuracy</p>
                        <p className="text-3xl font-bold text-gray-900">{accuracy}%</p>
                    </div>

                    {/* Time */}
                    <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                        <Clock className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                        <p className="text-sm text-gray-600 mb-1">Total Time</p>
                        <p className="text-3xl font-bold text-gray-900">{totalTime}s</p>
                    </div>

                    {/* Average Time */}
                    <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                        <Clock className="w-8 h-8 text-orange-600 mx-auto mb-3" />
                        <p className="text-sm text-gray-600 mb-1">Avg Time</p>
                        <p className="text-3xl font-bold text-gray-900">{averageTime}s</p>
                    </div>
                </div>

                {/* Correct vs Incorrect */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Answer Breakdown</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-4">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                            <div>
                                <p className="text-sm text-green-700 font-medium">Correct</p>
                                <p className="text-2xl font-bold text-green-900">{correctCount}</p>
                            </div>
                        </div>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-4">
                            <XCircle className="w-10 h-10 text-red-600" />
                            <div>
                                <p className="text-sm text-red-700 font-medium">Incorrect</p>
                                <p className="text-2xl font-bold text-red-900">{incorrectCount}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Detailed Answers */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Review Your Answers</h2>
                    <div className="space-y-4">
                        {userAnswers.map((answer, index) => (
                            <div
                                key={index}
                                className={`p-4 rounded-lg border-2 ${
                                    answer.isCorrect
                                        ? 'bg-green-50 border-green-200'
                                        : 'bg-red-50 border-red-200'
                                }`}
                            >
                                <div className="flex items-start gap-3 mb-3">
                                    {answer.isCorrect ? (
                                        <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                                    ) : (
                                        <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                                    )}
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900 mb-2">
                                            {index + 1}. {answer.question}
                                        </p>
                                        <div className="space-y-1 text-sm">
                                            <p className={answer.isCorrect ? 'text-green-700' : 'text-red-700'}>
                                                <span className="font-medium">Your answer:</span> {answer.selectedAnswer}
                                            </p>
                                            {!answer.isCorrect && (
                                                <p className="text-green-700">
                                                    <span className="font-medium">Correct answer:</span> {answer.correctAnswer}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-xs text-gray-600">Time</p>
                                        <p className="text-sm font-bold text-gray-900">{answer.timeSpent}s</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                    >
                        <Home className="w-5 h-5" />
                        Back to Home
                    </button>
                    <button
                        onClick={handleShare}
                        className="flex-1 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 py-4 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                    >
                        <Share2 className="w-5 h-5" />
                        Share Results
                    </button>
                </div>

                {/* Footer Message */}
                <div className="mt-8 text-center">
                    <p className="text-gray-600 text-sm">
                        {accuracy >= 90 && "Outstanding performance! You're a quiz master! 🎉"}
                        {accuracy >= 70 && accuracy < 90 && "Great job! Keep up the good work! 👏"}
                        {accuracy >= 50 && accuracy < 70 && "Good effort! Practice makes perfect! 💪"}
                        {accuracy < 50 && "Don't give up! Try again to improve your score! 🚀"}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ResultsPage;