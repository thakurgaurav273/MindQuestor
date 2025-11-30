import { Globe, BookOpen, Clock } from "lucide-react";

const QuizCard = ({ quiz, handleClick }: { quiz: any, handleClick: any }) => {
    const icons: any = {
        gk: <Globe className="w-8 h-8 text-blue-600" />,
        science: <BookOpen className="w-8 h-8 text-purple-600" />,
        history: <Clock className="w-8 h-8 text-amber-600" />,
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:border-gray-300 hover:shadow-md transition-all duration-300 flex flex-col h-full">
            <div className="mb-4">
                {icons[quiz.id]}
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{quiz.title}</h2>
            <p className="text-gray-600 text-sm mb-6 leading-relaxed flex-grow">{quiz.description}</p>
            <button
                onClick={handleClick}
                className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 transition duration-200"
            >
                Invite Friends to Play
            </button>
        </div>
    );
};

export default QuizCard;
