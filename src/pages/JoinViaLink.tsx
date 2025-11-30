import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link2, ArrowRight, AlertCircle, Loader } from 'lucide-react';
import { useUserStore } from '../store/userStore';

const JoinViaLink = () => {
    const navigate = useNavigate();
    const { user } = useUserStore((state: any) => state);
    const [link, setLink] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const extractQuizId = (inputLink: string): string | null => {
        try {
            // Remove whitespace
            const cleanLink = inputLink.trim();

            // Check if it's just the quiz ID (e.g., "QUIZ_1234_ABC")
            if (cleanLink.startsWith('QUIZ_')) {
                return cleanLink;
            }

            // Try to extract from full URL
            // Matches: http://localhost:3000/quiz/QUIZ_1234_ABC or /quiz/QUIZ_1234_ABC
            const urlPattern = /\/quiz\/([A-Z0-9_]+)/i;
            const match = cleanLink.match(urlPattern);

            if (match && match[1]) {
                return match[1];
            }

            // Try URL object parsing as fallback
            const url = new URL(cleanLink);
            const pathParts = url.pathname.split('/');
            const quizIndex = pathParts.indexOf('quiz');
            
            if (quizIndex !== -1 && pathParts[quizIndex + 1]) {
                return pathParts[quizIndex + 1];
            }

            return null;
        } catch (e) {
            // If URL parsing fails, return null
            return null;
        }
    };

    const handleJoinQuiz = () => {
        // Reset error
        setError(null);

        // Validate user
        if (!user) {
            setError('Please log in to join a quiz');
            return;
        }

        // Validate input
        if (!link.trim()) {
            setError('Please enter a quiz link or ID');
            return;
        }

        setLoading(true);

        // Extract quiz ID
        const quizId = extractQuizId(link);

        if (!quizId) {
            setError('Invalid quiz link or ID. Please check and try again.');
            setLoading(false);
            return;
        }

        // Navigate to join page
        console.log('Navigating to quiz:', quizId);
        navigate(`/quiz/${quizId}`);
    };

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setLink(text);
            setError(null);
        } catch (err) {
            console.error('Failed to read clipboard:', err);
            setError('Failed to paste from clipboard. Please paste manually.');
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLink(e.target.value);
        if (error) setError(null);
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleJoinQuiz();
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Link2 className="w-8 h-8 text-blue-600" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-3">Join a Quiz</h1>
                    <p className="text-lg text-gray-600">
                        Enter the quiz link or ID to join your friend's challenge
                    </p>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-2xl shadow-lg p-8">
                    {/* Input Section */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                            Quiz Link or ID
                        </label>
                        
                        <div className="relative">
                            <input
                                type="text"
                                value={link}
                                onChange={handleInputChange}
                                onKeyPress={handleKeyPress}
                                placeholder="Paste link (e.g., http://localhost:3000/quiz/QUIZ_123...) or ID (QUIZ_123...)"
                                className={`w-full px-4 py-4 pr-24 border-2 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 transition ${
                                    error
                                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                                        : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'
                                }`}
                            />
                            <button
                                onClick={handlePaste}
                                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-semibold transition"
                            >
                                Paste
                            </button>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mt-3 flex items-start gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <p className="text-sm">{error}</p>
                            </div>
                        )}
                    </div>

                    {/* Example Box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
                        <p className="text-sm font-semibold text-blue-900 mb-2">Examples:</p>
                        <div className="space-y-2 text-sm text-blue-800 font-mono">
                            <p>✓ http://localhost:3000/quiz/QUIZ_123_ABC</p>
                            <p>✓ QUIZ_123_ABC</p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <button
                            onClick={() => navigate('/')}
                            disabled={loading}
                            className="flex-1 border-2 border-gray-300 hover:border-gray-400 text-gray-700 py-4 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Back
                        </button>
                        <button
                            onClick={handleJoinQuiz}
                            disabled={loading || !link.trim()}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white py-4 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader className="w-5 h-5 animate-spin" />
                                    Joining...
                                </>
                            ) : (
                                <>
                                    Join Quiz
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </div>

                    {/* Info Box */}
                    <div className="mt-8 bg-gray-50 rounded-lg p-4">
                        <div className="flex gap-3">
                            <AlertCircle className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-gray-700">
                                <p className="font-semibold mb-1">Tips:</p>
                                <ul className="list-disc list-inside space-y-1 text-gray-600">
                                    <li>Ask the host to share the quiz link</li>
                                    <li>You can paste the full URL or just the quiz ID</li>
                                    <li>Make sure you're logged in before joining</li>
                                    <li>The quiz must be in waiting status to join</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Additional Help */}
                <div className="mt-8 text-center">
                    <p className="text-gray-600 text-sm">
                        Don't have a quiz link?{' '}
                        <button
                            onClick={() => navigate('/invite')}
                            className="text-blue-600 hover:text-blue-700 font-semibold underline"
                        >
                            Create your own quiz
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default JoinViaLink;