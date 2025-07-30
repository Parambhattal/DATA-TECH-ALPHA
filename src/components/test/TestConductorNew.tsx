import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, XCircle, Flag, Sun, Moon, ChevronDown } from 'lucide-react';
import { CourseTest, getTestByTestId } from '../../pages/Testdata';
import { useAuth } from '../../contexts/AuthContext';
import { useTestData } from '../../pages/Tests';

interface TestQuestion {
  id: string | number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  imageUrl?: string;
}

interface TestSection {
  name: string;
  questions: TestQuestion[];
}

interface TestResult {
  score: number;
  totalMarks: number;
  passed: boolean;
  answers: Record<string | number, number>;
  timeSpent: number;
  completionTime: Date;
}

interface TestConductorNewProps {
  testId?: string;
  autoStart?: boolean;
  onComplete?: (result: TestResult) => void;
}

// Translation dictionary
const translations = {
  english: {
    practiceTests: "Practice Tests",
    startTest: "Start Test",
    testInstructions: "Test Instructions",
    question: "Question",
    of: "of",
    mark: "Mark",
    marked: "Marked",
    previous: "Previous",
    next: "Next",
    nextSection: "Next Section",
    submitEnd: "SUBMIT/END",
    submitTest: "Submit Test",
    endTest: "End Test",
    testPassed: "Test Passed!",
    testCompleted: "Test Completed",
    answered: "Answered",
    retakeTest: "Retake Test",
    endTestConfirmation: "End Test Confirmation",
    endTestMessage: "Are you sure you want to end the test? The test will be submitted with your current answers.",
    confirmEnd: "Type \"END\" in capital letters to confirm:",
    cancel: "Cancel",
    confirmEndTest: "Confirm End Test",
    completeAllQuestions: "Complete All Questions",
    continueTest: "Continue Test",
    goToMarked: "Go to Marked",
    tabSwitchWarning: "Warning: Tab Switch Detected",
    tabSwitchMessage: "You have switched tabs {count} time(s). You have {remaining} remaining switch(es) before the test is automatically submitted.",
    tabSwitchWarningDetail: "Please remain on this tab during the test to avoid automatic submission.",
    understand: "I Understand",
    questions: "Questions",
    marksObtained: "Marks Obtained",
    markingScheme: "Marking Scheme",
    markingSchemeDetail: "Marking Scheme: +2 for correct, -0.5 for wrong",
    passingScore: "Passing Score",
    loadingQuestions: "Loading test questions..."
  }
};

interface TestConductorNewProps {
  testId?: string;
  autoStart?: boolean;
}

const TestConductorNew: React.FC<TestConductorNewProps> = ({
  testId: propTestId,
  autoStart = true,
  onComplete
}) => {
  const navigate = useNavigate();
  const { testId: urlTestId } = useParams<{ testId: string }>();
  const { user } = useAuth();
  const testId = propTestId || urlTestId;
  
  // Theme and language state
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [language, setLanguage] = useState<'english' | 'hindi'>('english');
  
  // Test state
  const { test: testData, loading, error } = useTestData(testId || '');
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'started' | 'submitted'>('idle');
  
  // Question state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string | number, number>>({});
  const [markedQuestions, setMarkedQuestions] = useState<Array<{sectionIndex: number, questionIndex: number}>>([]);
  
  // Timer and scoring
  const [timeLeft, setTimeLeft] = useState(0);
  const [testStartTime, setTestStartTime] = useState<Date | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  
  // UI state
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showTabSwitchWarning, setShowTabSwitchWarning] = useState(false);
  
  // Constants
  const MAX_TAB_SWITCHES = 3;
  const TEST_TIMER_UPDATE_INTERVAL = 1000; // 1 second

  // Memoized derived state
  const currentQuestions = useMemo(() => {
    if (!testData) return [];
    if (testData.sections?.length) {
      return testData.sections[currentSectionIndex]?.questions || [];
    }
    return testData.questions || [];
  }, [testData, currentSectionIndex]);

  const currentQuestion = currentQuestions[currentQuestionIndex];
  const testStarted = testStatus === 'started';
  const isSubmitted = testStatus === 'submitted';

  // Initialize test when data is loaded
  useEffect(() => {
    if (!testData || loading) return;
    
    setTestStatus('idle');
    setTimeLeft(testData.duration);
    
    if (autoStart) {
      startTest();
    }
  }, [testData, loading, autoStart]);
  
  // Start the test
  const startTest = useCallback(() => {
    if (!testData) return;
    
    setTestStatus('started');
    setTestStartTime(new Date());
    setCurrentQuestionIndex(0);
    setCurrentSectionIndex(0);
    setAnswers({});
    setMarkedQuestions([]);
    setTabSwitchCount(0);
    window.scrollTo(0, 0);
  }, [testData]);
  
  // Handle answer selection
  const handleAnswerSelect = useCallback((questionId: string | number, optionIndex: number) => {
    if (isSubmitted) return;
    
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  }, [isSubmitted]);
  
  // Navigate between questions
  const goToNext = useCallback(() => {
    if (currentQuestionIndex < currentQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else if (testData?.sections && currentSectionIndex < testData.sections.length - 1) {
      setCurrentSectionIndex(prev => prev + 1);
      setCurrentQuestionIndex(0);
    }
  }, [currentQuestionIndex, currentQuestions.length, testData?.sections, currentSectionIndex]);
  
  const goToPrevious = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    } else if (testData?.sections && currentSectionIndex > 0) {
      setCurrentSectionIndex(prev => prev - 1);
      const prevSectionQuestions = testData.sections[currentSectionIndex - 1]?.questions || [];
      setCurrentQuestionIndex(prevSectionQuestions.length - 1);
    }
  }, [currentQuestionIndex, currentSectionIndex, testData?.sections]);
  
  // Toggle mark question
  const toggleMarkQuestion = useCallback(() => {
    if (!currentQuestion) return;
    
    setMarkedQuestions(prev => {
      const existingMark = prev.findIndex(
        mark => mark.sectionIndex === currentSectionIndex && 
               mark.questionIndex === currentQuestionIndex
      );
      
      if (existingMark >= 0) {
        return prev.filter((_, i) => i !== existingMark);
      } else {
        return [...prev, { sectionIndex: currentSectionIndex, questionIndex: currentQuestionIndex }];
      }
    });
  }, [currentQuestion, currentQuestionIndex, currentSectionIndex]);

  // Timer effect
  useEffect(() => {
    if (!testStarted || isSubmitted) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, TEST_TIMER_UPDATE_INTERVAL);

    return () => clearInterval(timer);
  }, [testStarted, isSubmitted, TEST_TIMER_UPDATE_INTERVAL]);
  
  // Handle tab visibility changes
  useEffect(() => {
    if (!testStarted || isSubmitted) return;
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const newCount = tabSwitchCount + 1;
        setTabSwitchCount(newCount);
        
        if (newCount > MAX_TAB_SWITCHES) {
          // Auto-submit if max tab switches exceeded
          handleSubmit();
        } else {
          setShowTabSwitchWarning(true);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [testStarted, isSubmitted, tabSwitchCount, MAX_TAB_SWITCHES]);

  // Format time as MM:SS
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }, []);
  
  // Calculate test statistics
  const testStats = useMemo(() => {
    if (!testData) return { totalQuestions: 0, answered: 0, marked: 0 };
    
    let total = 0;
    let answered = 0;
    
    const countQuestions = (questions?: TestQuestion[]) => {
      if (!questions || !Array.isArray(questions)) return;
      
      total += questions.length;
      questions.forEach(q => {
        if (q && answers[q.id] !== undefined) answered++;
      });
    };
    
    if (testData.sections && Array.isArray(testData.sections)) {
      testData.sections.forEach(section => {
        if (section && section.questions) {
          countQuestions(section.questions);
        }
      });
    } else if (testData.questions) {
      countQuestions(testData.questions);
    }
    
    return {
      totalQuestions: total,
      answered,
      marked: markedQuestions.length,
      remaining: total - answered
    };
  }, [testData, answers, markedQuestions]);

  // Handle test submission
  const handleSubmit = useCallback(async () => {
    if (!testData || isSubmitted) return;
    
    // Calculate score
    let score = 0;
    let totalMarks = 0;
    
    const calculateSection = (questions: TestQuestion[]) => {
      questions.forEach(q => {
        totalMarks += 1; // Each question is worth 1 point
        if (answers[q.id] !== undefined) {
          if (answers[q.id] === q.correctAnswer) {
            score += 1;
          } else if (testData.negativeMarking) {
            score -= testData.negativeMarking;
          }
        }
      });
    };

    if (testData.sections) {
      testData.sections.forEach(section => calculateSection(section.questions));
    } else if (testData.questions) {
      calculateSection(testData.questions);
    }
    
    const passed = score >= (testData.passingScore || 0) * totalMarks / 100;
    const timeSpent = testStartTime ? Math.floor((new Date().getTime() - testStartTime.getTime()) / 1000) : 0;
    
    const result: TestResult = {
      score,
      totalMarks,
      passed,
      answers: { ...answers },
      timeSpent,
      completionTime: new Date()
    };
    
    setTestResult(result);
    setTestStatus('submitted');
    
    if (onComplete) {
      onComplete(result);
    }
    
    // Save test attempt
    try {
      // TODO: Implement save test attempt logic
      console.log('Test submitted', result);
    } catch (err) {
      console.error('Failed to save test attempt:', err);
    }
  }, [testData, answers, isSubmitted, testStartTime, onComplete]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>{t('loadingQuestions')}</p>
          {testId && <p className="text-sm text-gray-500 mt-2">Test ID: {testId}</p>}
        </div>
      </div>
    );
  }
  
  // Show error state
  if (error || !testData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Error Loading Test</h2>
          <p className="text-gray-600 mb-4">
            {error?.message || 'Failed to load test. Please try again.'}
          </p>
          <div className="space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
            <button
              onClick={() => navigate('/tests')}
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Back to Tests
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Show test instructions if not started
  if (!testStarted) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold mb-4">{testData.title}</h1>
          
          <div className="prose dark:prose-invert max-w-none mb-6">
            <p className="text-lg">{testData.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Test Details</h3>
                <ul className="space-y-2">
                  <li>Duration: {Math.floor(testData.duration / 60)} minutes</li>
                  <li>Total Questions: {testStats.totalQuestions}</li>
                  <li>Passing Score: {testData.passingScore || 0}%</li>
                  <li>Negative Marking: {testData.negativeMarking ? 'Yes' : 'No'}</li>
                </ul>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Instructions</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Read each question carefully before answering</li>
                  <li>You can mark questions for review and come back to them later</li>
                  <li>Use the navigation buttons to move between questions</li>
                  <li>The test will auto-submit when time runs out</li>
                  {testData.negativeMarking && (
                    <li>Negative marking is enabled for wrong answers</li>
                  )}
                </ul>
              </div>
            </div>
            
            <div className="mt-8 flex justify-center">
              <button
                onClick={startTest}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
              >
                Start Test
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show test completion screen
  if (isSubmitted && testResult) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full p-8 text-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
            testResult.passed ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
          }`}>
            {testResult.passed ? (
              <CheckCircle className="h-12 w-12 text-green-500" />
            ) : (
              <XCircle className="h-12 w-12 text-red-500" />
            )}
          </div>
          
          <h2 className="text-3xl font-bold mb-2">
            {testResult.passed ? 'Test Passed!' : 'Test Completed'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="text-2xl font-bold">
                {testResult.score.toFixed(2)}/{testResult.totalMarks}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Score</div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="text-2xl font-bold">
                {Math.round((testResult.score / testResult.totalMarks) * 100)}%
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Percentage</div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="text-2xl font-bold">
                {Math.floor(testResult.timeSpent / 60)}:{String(testResult.timeSpent % 60).padStart(2, '0')}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Time Spent</div>
            </div>
          </div>
          
          <div className="space-x-4 mt-8">
            <button
              onClick={startTest}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retake Test
            </button>
            <button
              onClick={() => navigate('/tests')}
              className="px-6 py-2.5 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Back to Tests
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Test in progress screen
  return (
    <div className="fixed inset-0 bg-gray-100 dark:bg-gray-900 p-4 overflow-auto">
      <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden h-full flex flex-col">
        {/* Test header */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">{testData.title}</h1>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                <span>
                  {t('question')} {currentQuestionIndex + 1} {t('of')} {currentQuestions.length}
                  {testData.sections?.length > 1 && ` (${testData.sections[currentSectionIndex]?.name || 'Section ' + (currentSectionIndex + 1)})`}
                </span>
                <span className="mx-2">•</span>
                <span>{testStats.answered} of {testStats.totalQuestions} answered</span>
                {testStats.marked > 0 && (
                  <>
                    <span className="mx-2">•</span>
                    <span className="text-yellow-600 dark:text-yellow-400">
                      {testStats.marked} marked
                    </span>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-4 mt-3 md:mt-0">
              <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-lg">
                <Clock className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                <span className="font-medium">{formatTime(timeLeft)}</span>
              </div>
              
              <button
                onClick={() => setShowSubmitConfirm(true)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
              >
                {t('submitEnd')}
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex flex-1 overflow-hidden">
          {/* Question navigation sidebar */}
          <div className="w-full md:w-64 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 overflow-y-auto p-4">
            <h3 className="font-medium mb-3">Questions</h3>
            <div className="grid grid-cols-5 md:grid-cols-4 gap-2">
              {currentQuestions.map((_, index) => {
                const isCurrent = index === currentQuestionIndex;
                const isMarked = markedQuestions.some(
                  m => m.sectionIndex === currentSectionIndex && m.questionIndex === index
                );
                const isAnswered = answers[currentQuestions[index]?.id] !== undefined;
                
                return (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestionIndex(index)}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${
                      isCurrent
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100'
                        : isMarked
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : isAnswered
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-white text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-2">
                <div className="w-4 h-4 rounded-full bg-blue-500 mr-2"></div>
                <span className="text-sm">Current</span>
              </div>
              <div className="flex items-center mb-2">
                <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
                <span className="text-sm">Answered</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-yellow-500 mr-2"></div>
                <span className="text-sm">Marked</span>
              </div>
            </div>
          </div>
          
          {/* Main question area */}
          <div className="flex-1 overflow-y-auto p-6">
            {currentQuestion && (
              <>
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-xl font-semibold">
                    Question {currentQuestionIndex + 1}
                    {testData.sections?.length > 1 && ` (${testData.sections[currentSectionIndex]?.name || 'Section ' + (currentSectionIndex + 1)})`}
                  </h2>
                  
                  <button
                    onClick={toggleMarkQuestion}
                    className={`p-2 rounded-lg ${
                      markedQuestions.some(
                        m => m.sectionIndex === currentSectionIndex && 
                             m.questionIndex === currentQuestionIndex
                      ) 
                        ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' 
                        : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    title="Mark for review"
                  >
                    <Flag className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="prose dark:prose-invert max-w-none mb-8">
                  <p className="text-lg">{currentQuestion.question}</p>
                  {currentQuestion.imageUrl && (
                    <div className="my-4">
                      <img 
                        src={currentQuestion.imageUrl} 
                        alt="Question illustration" 
                        className="max-w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700"
                      />
                    </div>
                  )}
                </div>
                
                <div className="space-y-3 mb-8">
                  {currentQuestion.options.map((option, index) => (
                    <div
                      key={index}
                      onClick={() => handleAnswerSelect(currentQuestion.id, index)}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        answers[currentQuestion.id] === index
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <div className="flex items-start">
                        <div className={`flex-shrink-0 h-6 w-6 rounded-full border flex items-center justify-center mr-3 mt-0.5 ${
                          answers[currentQuestion.id] === index
                            ? 'border-blue-500 bg-blue-100 dark:bg-blue-900/30'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {String.fromCharCode(65 + index)}
                        </div>
                        <div>{option}</div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={goToPrevious}
                    disabled={currentQuestionIndex === 0 && (!testData.sections || currentSectionIndex === 0)}
                    className="px-5 py-2.5 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  <div className="space-x-3">
                    <button
                      onClick={toggleMarkQuestion}
                      className={`px-4 py-2.5 rounded-lg font-medium ${
                        markedQuestions.some(
                          m => m.sectionIndex === currentSectionIndex && 
                               m.questionIndex === currentQuestionIndex
                        )
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {markedQuestions.some(
                        m => m.sectionIndex === currentSectionIndex && 
                             m.questionIndex === currentQuestionIndex
                      ) ? 'Unmark' : 'Mark for Review'}
                    </button>
                    
                    {currentQuestionIndex < currentQuestions.length - 1 || 
                    (testData.sections && currentSectionIndex < testData.sections.length - 1) ? (
                      <button
                        onClick={goToNext}
                        className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        {testData.sections && 
                         currentQuestionIndex === currentQuestions.length - 1 && 
                         currentSectionIndex < testData.sections.length - 1
                          ? 'Next Section'
                          : 'Next'}
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowSubmitConfirm(true)}
                        className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Submit Test
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Submit confirmation modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Submit Test</h3>
            <p className="mb-6">
              Are you sure you want to submit the test? You have {testStats.answered} of {testStats.totalQuestions} questions answered.
              {testStats.marked > 0 && (
                <span className="block mt-2 text-yellow-600 dark:text-yellow-400">
                  You have {testStats.marked} marked questions for review.
                </span>
              )}
            </p>
            
            <div className="space-y-4">
              <input
                type="text"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder="Type 'SUBMIT' to confirm"
                className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded"
              />
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowSubmitConfirm(false);
                    setConfirmationText('');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (confirmationText.trim().toUpperCase() === 'SUBMIT') {
                      handleSubmit();
                      setShowSubmitConfirm(false);
                    }
                  }}
                  disabled={confirmationText.trim().toUpperCase() !== 'SUBMIT'}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Test
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Tab switch warning modal */}
      {showTabSwitchWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <div className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 text-yellow-500 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">Warning: Tab Switch Detected</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  You have switched tabs {tabSwitchCount} {tabSwitchCount === 1 ? 'time' : 'times'}.
                  {tabSwitchCount < MAX_TAB_SWITCHES 
                    ? ` You have ${MAX_TAB_SWITCHES - tabSwitchCount} more ${MAX_TAB_SWITCHES - tabSwitchCount === 1 ? 'attempt' : 'attempts'} before the test is automatically submitted.`
                    : ' This is your final warning. The test will be submitted if you switch tabs again.'}
                </p>
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowTabSwitchWarning(false)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    I Understand
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Helper function to translate strings with placeholders
  function t(key: keyof typeof translations.english, params: Record<string, string | number> = {}) {
    let translation = translations[language][key];
    Object.entries(params).forEach(([param, value]) => {
      translation = translation.replace(`{${param}}`, value.toString());
    });
    return translation;
  }

  // Calculate and submit score
  async function calculateScoreAndSubmit() {
    if (!selectedTest) return;

    let marks = 0;
    let maxMarks = 0;

    const calculateSection = (questions: any[]) => {
      questions.forEach(q => {
        maxMarks += 2;
        if (answers[q.id] !== undefined) {
          if (answers[q.id] === q.correctAnswer) {
            marks += 2;
          } else if (selectedTest.negativeMarking) {
            marks -= selectedTest.negativeMarking;
          }
        }
      });
    };

    if (selectedTest.sections) {
      selectedTest.sections.forEach(section => calculateSection(section.questions));
    } else if (selectedTest.questions) {
      calculateSection(selectedTest.questions);
    }

    setTotalMarks(marks);
    setMaxPossibleMarks(maxMarks);
    setIsSubmitted(true);
  }
};

export default TestConductorNew;
