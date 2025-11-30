import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../store/userStore";
import { 
  Clock, 
  Calendar, 
  Trophy, 
  ChevronRight, 
  Loader, 
  AlertCircle,
  BarChart3,
  Target,
  Award
} from "lucide-react";

interface QuizHistoryItem {
  _id: string;
  inviteCode: string;
  category: string;
  sessionStatus: string;
  createdAt: string;
  questions: any[];
  createdBy: string;
}

const QuizHistoryPage = () => {
  const navigate = useNavigate();
  const { user } = useUserStore((state: any) => state);
  
  const [quizHistory, setQuizHistory] = useState<QuizHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    totalQuestions: 0,
    averageScore: 0,
    categories: [] as string[]
  });

  useEffect(() => {
    fetchQuizHistory();
  }, [user]);

  const fetchQuizHistory = async () => {
    if (!user?.userId) {
      setError('Please login to view quiz history');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:8080/user/quiz-history/${user.userId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch quiz history');
      }

      const data = await response.json();
      console.log('Quiz history:', data);

      setQuizHistory(data.quizHistory || []);
      
      // Calculate stats
      const totalQuizzes = data.quizHistory?.length || 0;
      const totalQuestions = data.quizHistory?.reduce(
        (sum: number, quiz: QuizHistoryItem) => sum + (quiz.questions?.length || 0), 
        0
      ) || 0;
      const uniqueCategories = [...new Set(
        data.quizHistory?.map((quiz: QuizHistoryItem) => quiz.category) || []
      )];

      setStats({
        totalQuizzes,
        totalQuestions,
        averageScore: 0, // You can calculate this based on actual results
        categories: uniqueCategories as string[]
      });

      setError(null);
    } catch (err) {
      console.error('Error fetching quiz history:', err);
      setError('Failed to load quiz history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: { [key: string]: { bg: string; text: string; label: string } } = {
      'COMPLETED': { bg: 'bg-green-100', text: 'text-green-700', label: 'Completed' },
      'WAITING': { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Waiting' },
      'IN_PROGRESS': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'In Progress' },
    };

    const config = statusConfig[status] || statusConfig['WAITING'];

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const handleViewDetails = (quizId: string) => {
    navigate(`/quiz-details/${quizId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading History...</h2>
          <p className="text-gray-600">Fetching your quiz data</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Quiz History</h1>
              <p className="text-gray-600">Track your learning journey</p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              Take New Quiz
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <Trophy className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-sm text-blue-700 font-medium mb-1">Total Quizzes</p>
              <p className="text-3xl font-bold text-blue-900">{stats.totalQuizzes}</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-sm text-green-700 font-medium mb-1">Questions Answered</p>
              <p className="text-3xl font-bold text-green-900">{stats.totalQuestions}</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <BarChart3 className="w-8 h-8 text-purple-600" />
              </div>
              <p className="text-sm text-purple-700 font-medium mb-1">Categories</p>
              <p className="text-3xl font-bold text-purple-900">{stats.categories.length}</p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
              <div className="flex items-center justify-between mb-2">
                <Award className="w-8 h-8 text-orange-600" />
              </div>
              <p className="text-sm text-orange-700 font-medium mb-1">Avg Score</p>
              <p className="text-3xl font-bold text-orange-900">{stats.averageScore}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quiz List */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {quizHistory.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Quiz History Yet</h3>
            <p className="text-gray-600 mb-6">Start taking quizzes to track your progress!</p>
            <button
              onClick={() => navigate('/')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition inline-flex items-center gap-2"
            >
              Take Your First Quiz
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Recent Quizzes ({quizHistory.length})
            </h2>
            
            {quizHistory.map((quiz) => (
              <div
                key={quiz._id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-6 border border-gray-200 cursor-pointer"
                onClick={() => handleViewDetails(quiz._id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <BarChart3 className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {quiz.category.charAt(0).toUpperCase() + quiz.category.slice(1)} Quiz
                        </h3>
                        <p className="text-sm text-gray-500">Code: {quiz.inviteCode}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(quiz.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        <span>{quiz.questions?.length || 0} Questions</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>~{(quiz.questions?.length || 0) * 10}s</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {getStatusBadge(quiz.sessionStatus)}
                    <ChevronRight className="w-6 h-6 text-gray-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizHistoryPage;