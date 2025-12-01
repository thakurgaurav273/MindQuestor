// QuizDetailsPage.tsx (bonus component)

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle, ArrowLeft } from "lucide-react";

const QuizDetailsPage = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quizDetails, setQuizDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuizDetails();
  }, [quizId]);

  const fetchQuizDetails = async () => {
    try {
      const response = await fetch(`http://localhost:8080/quiz/getQuizByCode/${quizId}`);
      const data = await response.json();
      setQuizDetails(data.quizDetails);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <button
        onClick={() => navigate('/quiz-history')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to History
      </button>

      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm p-8">
        <h1 className="text-3xl font-bold mb-6">
          {quizDetails?.category[0].toUpperCase() + quizDetails?.category.slice(1)} Quiz Details
        </h1>
        
        <div className="space-y-4">
          {quizDetails?.questions?.map((q: any, idx: number) => (
            <div key={idx} className="border-b pb-4">
              <h3 className="font-semibold mb-2">
                {idx + 1}. {q.questionText}
              </h3>
              <div className="space-y-2">
                {q.options?.map((option: string, optIdx: number) => (
                  <div
                    key={optIdx}
                    className={`p-3 rounded ${
                      optIdx === q.correctAnswerIndex
                        ? 'bg-green-50 border border-green-300'
                        : 'bg-gray-50'
                    }`}
                  >
                    {option}
                    {optIdx === q.correctAnswerIndex && (
                      <CheckCircle className="inline ml-2 w-4 h-4 text-green-600" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuizDetailsPage;