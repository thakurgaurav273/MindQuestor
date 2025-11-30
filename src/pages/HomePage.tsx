import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar'
import QuizCard from '../components/ui/QuizCard'
import { useState } from 'react';
import { useUserStore } from '../store/userStore';
const HomePage = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const history = useNavigate();
  const user = useUserStore((state) => state.user);
  const categories = [
    {
      id: "gk",
      title: 'General Knowledge',
      description: 'Test your knowledge across a variety of topics and see how much you really know!',
      onClick: () => {
        if (user) {
          history('/invite', { state: { category: 'gk' } });
        } else {
          alert('Please log in to access the History quiz.');
          history('/login', { state: { category: 'gk' } });

        }
      }
    },
    {
      id: "science",
      title: 'Science',
      description: 'Dive into the world of science and challenge your understanding of the natural world.',
      onClick: () => {
        if (user) {
          history('/invite', { state: { category: 'science' } });
        } else {
          alert('Please log in to access the History quiz.');
          history('/login', { state: { category: 'science' } });

        }
      }
    },
    {
      id: "history",
      title: 'History',
      description: 'Explore historical events and figures while testing your knowledge of the past.',
      onClick: () => {
        if (user) {
          history('/invite', { state: { category: 'history' } });
        } else {
          alert('Please log in to access the History quiz.');
          history('/login', { state: { category: 'history' } });

        }
      }
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar onNavClick={setCurrentPage} />

      {currentPage === 'home' && (
        <main className="flex-grow flex flex-col items-center justify-center px-6 py-16">
          <div className="text-center max-w-2xl mb-16">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Welcome to MindQuestor
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Challenge yourself with our interactive quizzes. Test your knowledge, learn something new, and have fun while doing it.
            </p>
          </div>

          <div className="w-full max-w-5xl">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-8 text-center">
              Choose a category
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {categories.map(category => (
                <QuizCard
                  key={category.id}
                  quiz={category}
                  handleClick={category.onClick}
                />
              ))}
            </div>
          </div>
        </main>
      )}
    </div>
  );
};

export default HomePage;