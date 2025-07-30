import React, { useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, XCircle, Flag, Sun, Moon, ChevronDown, X, AlertTriangle, Bookmark, Check, ChevronLeft, ChevronRight, Maximize, Minimize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import useTestTaker from './hooks/useTestTaker';
import { Test } from './types';

// Simple toast notification function
const showToast = (title: string, description?: string, variant: 'default' | 'destructive' = 'default') => {
  console.log(`[${variant.toUpperCase()}] ${title}: ${description || ''}`);
  // You can replace this with a more sophisticated toast implementation later
  alert(`${title}: ${description || ''}`);
};

// Mock test data - replace with actual API call
const mockTest: Test = {
  id: 'test-1',
  title: 'Sample Test',
  description: 'This is a sample test for demonstration purposes',
  duration: 30, // minutes
  totalMarks: 100,
  passingScore: 35,
  negativeMarking: true,
  instructions: [
    'This test contains 10 questions',
    'Each question carries 10 marks',
    'There is negative marking for wrong answers',
    'You have 30 minutes to complete the test',
  ],
  questions: [
    {
      id: 'q1',
      text: 'What is the capital of France?',
      options: [
        { id: 'a', text: 'London' },
        { id: 'b', text: 'Paris' },
        { id: 'c', text: 'Berlin' },
        { id: 'd', text: 'Madrid' },
      ],
      correctAnswer: 'b',
      marks: 10,
      explanation: 'Paris is the capital of France.',
    },
    // Add more questions as needed
  ],
};

const TestConductor: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const { user } = useAuth();
  // Using our simple toast function instead of the toast hook
  const navigate = useNavigate();
  const testContainerRef = useRef<HTMLDivElement>(null);
  
  // Initialize test taker hook
  const {
    test,
    currentQuestion,
    currentQuestionNumber,
    totalQuestions,
    isFirstQuestion,
    isLastQuestion,
    progress,
    isSubmitted,
    answers,
    timeLeft,
    formattedTimeLeft,
    isTimerRunning,
    isTimerPaused,
    bookmarks,
    markedForReview,
    results,
    
    // Navigation
    goToNextQuestion,
    goToPreviousQuestion,
    goToQuestion,
    
    // Actions
    selectAnswer,
    toggleBookmark,
    toggleMarkForReview,
    submitTest,
    exitTest,
    
    // Accessibility
    accessibility,
  } = useTestTaker({
    test: mockTest, // Replace with actual test data from API
    autoStart: true,
    showTimer: true,
    allowNavigation: true,
    allowReview: true,
    allowBookmarking: true,
    saveProgress: true,
  });
  
  // Handle test submission
  const handleSubmitTest = async () => {
    try {
      await submitTest();
      showToast('Test Submitted', 'Your test has been submitted successfully.');
    } catch (error) {
      console.error('Failed to submit test:', error);
      showToast('Error', 'Failed to submit test. Please try again.', 'destructive');
    }
  };
  
  // Handle exit test
  const handleExit = () => {
    // Show confirmation dialog
    if (window.confirm('Are you sure you want to exit the test? Your progress will be saved.')) {
      exitTest();
      navigate('/dashboard');
    }
  };
  
  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      testContainerRef.current?.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen().catch(console.error);
    }
  };
  
  // Render test instructions
  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-6">
              <Bookmark className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
              {test?.title}
            </h1>
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {test?.description}
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-2xl">
            <div className="p-8">
              <div className="mb-10">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 mb-6">
                  <span className="text-blue-600 dark:text-blue-400 font-medium">📋 Test Guidelines</span>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 pb-3 border-b border-gray-200 dark:border-gray-700">
                  Instructions to Follow
                </h2>
                <div className="prose dark:prose-invert max-w-none">
                  <ul className="space-y-5">
                    {Array.isArray(test?.instructions) ? (
                      test.instructions.map((instruction, index) => (
                        <li key={index} className="flex items-start group">
                          <span className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 flex items-center justify-center mr-4 mt-0.5 transform transition-transform group-hover:scale-110">
                            {index + 1}
                          </span>
                          <span className="text-lg text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-blue-100 transition-colors">
                            {instruction}
                          </span>
                        </li>
                      ))
                    ) : (
                      <li className="text-lg text-gray-700 dark:text-gray-300">{test?.instructions}</li>
                    )}
                  </ul>
                </div>
              </div>
              
              <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between gap-6">
                <Button 
                  variant="outline" 
                  onClick={() => navigate(-1)}
                  className="px-8 py-4 text-base font-medium rounded-xl border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 hover:shadow-md text-gray-800 dark:text-gray-200 hover:border-blue-500 dark:hover:border-blue-400"
                >
                  <ChevronLeft className="w-5 h-5 mr-2" />
                  Back to Tests
                </Button>
                <Button 
                  onClick={() => goToQuestion(0, 0)}
                  className="px-10 py-4 text-base font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all duration-300 shadow-md hover:shadow-lg hover:scale-[1.02] flex items-center"
                >
                  Start Test Now
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
            
            {/* Test Info Footer */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800/50 dark:to-gray-800/30 px-8 py-6 border-t border-gray-100 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center bg-white dark:bg-gray-700/50 p-4 rounded-xl shadow-sm">
                  <div className="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 mr-4">
                    <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Duration</p>
                    <p className="text-lg font-semibold text-gray-800 dark:text-white">{test?.duration} minutes</p>
                  </div>
                </div>
                <div className="flex items-center bg-white dark:bg-gray-700/50 p-4 rounded-xl shadow-sm">
                  <div className="p-2.5 rounded-lg bg-green-100 dark:bg-green-900/30 mr-4">
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Passing Score</p>
                    <p className="text-lg font-semibold text-gray-800 dark:text-white">{test?.passingScore}% Required</p>
                  </div>
                </div>
                <div className="flex items-center bg-white dark:bg-gray-700/50 p-4 rounded-xl shadow-sm">
                  <div className="p-2.5 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 mr-4">
                    <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Negative Marking</p>
                    <p className="text-lg font-semibold text-gray-800 dark:text-white">
                      {test?.negativeMarking ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Accessibility Note */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Need accessibility adjustments? You can modify display settings after starting the test.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  // Render test results
  if (isSubmitted && results) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-4">
              {results.isPassed ? (
                <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
              ) : (
                <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
              )}
            </div>
            <h1 className="text-2xl font-bold mb-2">
              {results.isPassed ? 'Test Passed!' : 'Test Failed'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              You scored {results.score} out of {results.totalMarks} ({results.percentage.toFixed(1)}%)
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="text-sm text-gray-500 dark:text-gray-400">Correct Answers</div>
              <div className="text-2xl font-bold">{results.correctAnswers}</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="text-sm text-gray-500 dark:text-gray-400">Incorrect Answers</div>
              <div className="text-2xl font-bold">{results.incorrectAnswers}</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="text-sm text-gray-500 dark:text-gray-400">Time Spent</div>
              <div className="text-2xl font-bold">
                {Math.floor(results.timeSpent / 60)}m {results.timeSpent % 60}s
              </div>
            </div>
          </div>
          
          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
            <Button onClick={() => window.location.reload()}>
              Review Answers
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // Render test interface
  return (
    <div 
      ref={testContainerRef}
      className={cn(
        'min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200',
        accessibility.highContrast && 'high-contrast',
        accessibility.reduceMotion && 'reduce-motion'
      )}
      style={{
        '--font-size': {
          small: '14px',
          medium: '16px',
          large: '18px',
        }[accessibility.fontSize],
      } as React.CSSProperties}
    >
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="font-semibold">
              {test?.title}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Question {currentQuestionNumber} of {totalQuestions}
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-md">
              <Clock className="w-4 h-4 mr-2 text-gray-500" />
              <span className="font-mono">{formattedTimeLeft}</span>
            </div>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleFullscreen}
              aria-label={document.fullscreenElement ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {document.fullscreenElement ? (
                <Minimize className="w-5 h-5" />
              ) : (
                <Maximize className="w-5 h-5" />
              )}
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                if (window.confirm('Are you sure you want to end the test?')) {
                  handleSubmitTest();
                }
              }}
            >
              Submit Test
            </Button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Panel */}
          <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Question {currentQuestionNumber}
                </span>
                {bookmarks.has(currentQuestion.id) && (
                  <Bookmark className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                )}
                {markedForReview.has(currentQuestion.id) && (
                  <Flag className="w-4 h-4 text-orange-500 fill-orange-500" />
                )}
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => toggleMarkForReview(currentQuestion.id)}
                  className={cn(
                    'flex items-center space-x-1',
                    markedForReview.has(currentQuestion.id) ? 'bg-orange-50 dark:bg-orange-900/30' : ''
                  )}
                >
                  <Flag className={cn(
                    'w-4 h-4',
                    markedForReview.has(currentQuestion.id) ? 'fill-orange-500 text-orange-500' : ''
                  )} />
                  <span>{markedForReview.has(currentQuestion.id) ? 'Marked' : 'Mark'}</span>
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => toggleBookmark(currentQuestion.id)}
                  className={cn(
                    'flex items-center space-x-1',
                    bookmarks.has(currentQuestion.id) ? 'bg-yellow-50 dark:bg-yellow-900/30' : ''
                  )}
                >
                  <Bookmark className={cn(
                    'w-4 h-4',
                    bookmarks.has(currentQuestion.id) ? 'fill-yellow-500 text-yellow-500' : ''
                  )} />
                  <span>Bookmark</span>
                </Button>
              </div>
            </div>
            
            {/* Question Text */}
            <div className="prose dark:prose-invert max-w-none mb-8">
              <p className="text-lg">{currentQuestion.text}</p>
              
              {/* Question Image */}
              {currentQuestion.imageUrl && (
                <div className="my-4">
                  <img 
                    src={currentQuestion.imageUrl} 
                    alt="Question illustration" 
                    className="max-w-full h-auto rounded border border-gray-200 dark:border-gray-700"
                  />
                </div>
              )}
            </div>
            
            {/* Options */}
            <div className="space-y-3 mb-8">
              {currentQuestion.options.map((option) => {
                const isSelected = answers[currentQuestion.id]?.selectedOption === option.id;
                const isCorrect = currentQuestion.correctAnswer === option.id;
                const showResults = isSubmitted && results;
                
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => !isSubmitted && selectAnswer(currentQuestion.id, option.id)}
                    disabled={isSubmitted}
                    className={cn(
                      'w-full text-left p-4 rounded-lg border transition-colors',
                      'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
                      'disabled:opacity-70 disabled:cursor-not-allowed',
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700',
                      showResults && isCorrect && 'border-green-500 dark:border-green-600 bg-green-50 dark:bg-green-900/30',
                      showResults && isSelected && !isCorrect && 'border-red-500 dark:border-red-600 bg-red-50 dark:bg-red-900/30',
                      showResults && !isSelected && !isCorrect && 'opacity-70'
                    )}
                  >
                    <div className="flex items-start">
                      <div className={cn(
                        'flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center mr-3 mt-0.5',
                        isSelected 
                          ? 'bg-blue-500 border-blue-500 text-white'
                          : 'border-gray-300 dark:border-gray-600',
                        showResults && isCorrect && 'bg-green-500 border-green-500',
                        showResults && isSelected && !isCorrect && 'bg-red-500 border-red-500'
                      )}>
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                      <div className="flex-1">
                        <span className="block font-medium">{option.text}</span>
                        
                        {/* Show explanation after submission */}
                        {showResults && isCorrect && currentQuestion.explanation && (
                          <div className="mt-2 text-sm text-green-700 dark:text-green-400">
                            {currentQuestion.explanation}
                          </div>
                        )}
                        
                        {showResults && isSelected && !isCorrect && currentQuestion.explanation && (
                          <div className="mt-2 text-sm text-red-700 dark:text-red-400">
                            {currentQuestion.explanation}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            
            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button 
                variant="outline" 
                onClick={goToPreviousQuestion}
                disabled={isFirstQuestion || isSubmitted}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              
              <div className="flex space-x-2">
                {!isLastQuestion && (
                  <Button 
                    variant="outline"
                    onClick={() => {
                      const answer = answers[currentQuestion.id];
                      if (answer?.selectedOption) {
                        goToNextQuestion();
                      } else if (window.confirm('You have not selected an answer. Are you sure you want to continue?')) {
                        goToNextQuestion();
                      }
                    }}
                    disabled={isSubmitted}
                  >
                    Skip
                  </Button>
                )}
                
                <Button 
                  onClick={isLastQuestion ? handleSubmitTest : goToNextQuestion}
                  disabled={isSubmitted}
                >
                  {isLastQuestion ? 'Submit Test' : 'Next'}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sticky top-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium">Questions</h3>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {Object.keys(answers).length} / {totalQuestions}
                </div>
              </div>
              
              <div className="grid grid-cols-5 gap-2 mb-4">
                {Array.from({ length: totalQuestions }).map((_, index) => {
                  const questionIndex = index;
                  const question = test?.questions?.[questionIndex];
                  const isCurrent = questionIndex === currentQuestionNumber - 1;
                  const isAnswered = question && answers[question.id]?.selectedOption !== undefined;
                  const isMarked = question && markedForReview.has(question.id);
                  const isBookmarked = question && bookmarks.has(question.id);
                  
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => goToQuestion(0, questionIndex)}
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
                        isCurrent 
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-100 border-2 border-blue-500'
                          : isAnswered
                          ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-100 border border-green-300 dark:border-green-700'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600',
                        isMarked && 'border-orange-500 dark:border-orange-600',
                        isBookmarked && 'ring-1 ring-yellow-400 dark:ring-yellow-500'
                      )}
                      aria-label={`Go to question ${index + 1}${isAnswered ? ' (answered)' : ''}${isMarked ? ' (marked for review)' : ''}${isBookmarked ? ' (bookmarked)' : ''}`}
                    >
                      {index + 1}
                      {isMarked && (
                        <span className="absolute -top-1 -right-1">
                          <Flag className="w-3 h-3 text-orange-500" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  <span>Answered</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600 mr-2"></div>
                  <span>Unanswered</span>
                </div>
                <div className="flex items-center">
                  <Flag className="w-3 h-3 text-orange-500 mr-2" />
                  <span>Marked for review</span>
                </div>
                <div className="flex items-center">
                  <Bookmark className="w-3 h-3 text-yellow-500 fill-yellow-500 mr-2" />
                  <span>Bookmarked</span>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleExit}
                >
                  Exit Test
                </Button>
              </div>
            </div>
            
            {/* Accessibility Controls */}
            <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h3 className="font-medium mb-3">Accessibility</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>High Contrast</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => accessibility.toggleHighContrast()}
                    className={accessibility.highContrast ? 'bg-blue-100 dark:bg-blue-900' : ''}
                  >
                    {accessibility.highContrast ? 'On' : 'Off'}
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Font Size</span>
                  <div className="flex space-x-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => accessibility.decreaseFontSize()}
                      disabled={accessibility.fontSize === 'small'}
                    >
                      A-
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => accessibility.increaseFontSize()}
                      disabled={accessibility.fontSize === 'large'}
                    >
                      A+
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Reduce Motion</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => accessibility.toggleReduceMotion()}
                    className={accessibility.reduceMotion ? 'bg-blue-100 dark:bg-blue-900' : ''}
                  >
                    {accessibility.reduceMotion ? 'On' : 'Off'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {user?.email && `Logged in as ${user.email}`}
            </div>
            
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => accessibility.toggleHighContrast()}
              >
                {accessibility.highContrast ? (
                  <Moon className="w-4 h-4 mr-2" />
                ) : (
                  <Sun className="w-4 h-4 mr-2" />
                )}
                {accessibility.highContrast ? 'Dark Mode' : 'Light Mode'}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  if (window.confirm('Are you sure you want to submit the test?')) {
                    handleSubmitTest();
                  }
                }}
                disabled={isSubmitted}
              >
                Submit Test
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TestConductor;
