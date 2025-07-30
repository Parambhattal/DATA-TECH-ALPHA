import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TestCard } from '@/components/test/TestCard';
import { CategoryCard } from '@/components/test/CategoryCard';
import { getTestCategories, TestCategory } from '@/Services/categoryService';
import { Input } from '@/components/ui/input';
import { Search, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { courseTests } from './Testdata';
import { useAuth } from '@/contexts/AuthContext';

// Simple notification function to replace toast
const showNotification = (title: string, description?: string) => {
  console.log(`[${title}] ${description || ''}`);
  // You can replace this with a more sophisticated notification system later
  alert(`${title}: ${description || ''}`);
};



interface Test {
  $id: string;
  title: string;
  description: string;
  duration: number;
  questions?: any[];
  sections?: any[];
  category?: string;
  thumbnail?: string;
  passingScore?: number;
  categoryThumbnail?: string;
  // Add these fields to match the actual test data structure
  TestTitle?: string;
  TestDescription?: string;
  TestDuration?: number;
}

export default function TestzPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<TestCategory[]>([]);
  
  // Get category from URL or default to 'all'
  const categoryFilter = searchParams.get('category') || 'all';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch categories from the original service
        const categoriesData = await getTestCategories();
        setCategories(categoriesData);
        
        let filteredTests = [];
        
        if (categoryFilter === 'all') {
          // If 'all' is selected, show all tests from courseTests
          filteredTests = [...courseTests];
        } else {
          // Find the selected category
          const selectedCategory = categoriesData.find(cat => cat.$id === categoryFilter);
          
          if (selectedCategory && selectedCategory.TestId && selectedCategory.TestId.length > 0) {
            // Filter tests based on TestId from the category
            filteredTests = courseTests.filter(test => 
              selectedCategory.TestId.includes(test.TestId)
            );
          } else {
            // Fallback to courseId if no TestId is found
            filteredTests = courseTests.filter(test => test.courseId === categoryFilter);
          }
        }
        
        // Map the test data to match the expected format
        const formattedTests = filteredTests.map(test => ({
          $id: test.TestId || test.courseId,
          title: test.title,
          description: test.description,
          duration: test.duration,
          passingScore: test.passingScore,
          thumbnail: test.thumbnail || 'https://via.placeholder.com/300x200',
          questions: test.questions || [],
          sections: test.sections || [],
          TestTitle: test.title,
          TestDescription: test.description,
          TestDuration: test.duration,
          category: test.courseId
        }));
        
        setTests(formattedTests);
      } catch (error) {
        console.error('Error processing test data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [categoryFilter]);

  const filteredTests = tests.filter((test: Test) => {
    const title = test.title || test.TestTitle || '';
    const description = test.description || test.TestDescription || '';
    const searchLower = searchQuery.toLowerCase();
    return title.toLowerCase().includes(searchLower) ||
           description.toLowerCase().includes(searchLower);
  });
  
  const currentCategory = categories.find(cat => cat.$id === categoryFilter);
  
  const handleCategorySelect = (category: string) => {
    // Update URL with the selected category
    const params = new URLSearchParams(searchParams);
    if (category === 'all') {
      params.delete('category');
    } else {
      params.set('category', category);
    }
    setSearchParams(params);
    window.scrollTo(0, 0);
  };

  const handleTestClick = (testId: string) => {
    if (!user) {
      showNotification('Authentication Required', 'Please sign in to take this test.');
      return;
    }
    
    // Navigate to the test conductor with the test ID
    navigate(`/test/${testId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  // Show categories view if 'all' is selected
  if (categoryFilter === 'all') {
    return (
      <AnimatePresence mode="wait">
        <motion.div 
          key="categories-view"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="container mx-auto px-4 pt-24 pb-16"
        >
          {/* Hero Section */}
          <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 md:p-8 mb-8 text-white">
            <div className="relative z-10 max-w-4xl mx-auto text-center">
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-3">
                Master Your Test Preparation
              </h1>
              <p className="text-lg text-blue-100 max-w-3xl mx-auto mb-6">
                Join thousands of successful candidates with our comprehensive practice tests designed by top educators
              </p>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mt-6 max-w-md mx-auto">
                <div className="text-center">
                  <div className="text-2xl font-bold">50,000+</div>
                  <div className="text-blue-100 text-xs">Students</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">1,200+</div>
                  <div className="text-blue-100 text-xs">Selections</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">92%</div>
                  <div className="text-blue-100 text-xs">Success Rate</div>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500 rounded-full opacity-20"></div>
              <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-blue-400 rounded-full opacity-20"></div>
            </div>
          </div>

          {/* Search and Filter */}
          {/* All Categories Section */}
          <section className="mt-2">
            <div className="relative overflow-hidden bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 mb-4">
              <div className="relative z-10">
                {/* Header with title and categories count */}
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">All Categories</h2>
                  <span className="text-sm text-blue-700 dark:text-blue-300 font-medium px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    {categories.filter(category => {
                      if (!searchQuery) return true;
                      const query = searchQuery.toLowerCase();
                      return (
                        (category.Title || '').toLowerCase().includes(query) ||
                        (category.description || '').toLowerCase().includes(query) ||
                        (category.languages?.some(lang => lang.toLowerCase().includes(query)) || false)
                      );
                    }).length} {searchQuery ? 'results' : 'categories available'}
                  </span>
                </div>
                
                {/* Search bar */}
                <div className="mb-4">
                  <div className="relative max-w-x2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search categories..."
                      className="w-full pl-10 pr-4 py-3 text-base bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-blue-100 dark:bg-blue-900/20 rounded-full"></div>
              <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-indigo-100 dark:bg-indigo-900/20 rounded-full"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {categories
                .filter(category => {
                  if (!searchQuery) return true;
                  const query = searchQuery.toLowerCase();
                  return (
                    (category.Title || '').toLowerCase().includes(query) ||
                    (category.description || '').toLowerCase().includes(query) ||
                    (category.languages?.some(lang => lang.toLowerCase().includes(query)) || false)
                  );
                })
                .map((category) => {
                // Ensure category has all required fields with defaults
                const categoryData: TestCategory = {
                  $id: category.$id,
                  Title: category.Title || 'Uncategorized',
                  description: category.description || 'Test your knowledge with our practice tests',
                  categoryThumbnail: category.categoryThumbnail || '',
                  TestId: Array.isArray(category.TestId) ? category.TestId : [],
                  rating: typeof category.rating === 'number' ? category.rating : 4.5, // Default rating
                  languages: Array.isArray(category.languages) ? category.languages : ['English', 'Hindi'] // Default languages
                };
                
                return (
                  <CategoryCard
                    key={category.$id}
                    category={categoryData}
                    testCount={category.TestId?.length || 0}
                    onClick={() => handleCategorySelect(category.$id)}
                  />
                );
              })}
            </div>
          </section>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div 
        key={categoryFilter}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="container mx-auto px-4 pt-24 pb-16"
      >
        <Button 
          variant="ghost" 
          className="mb-8 text-primary hover:bg-primary/10"
          onClick={() => setSearchParams({ category: 'all' })}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Categories
        </Button>
      
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">
            {currentCategory?.Title || 'Tests'}
          </h1>
          <p className="text-muted-foreground">
            {currentCategory?.TestId?.length || 0} {currentCategory?.TestId?.length === 1 ? 'test' : 'tests'} available
          </p>
        </div>
        
        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search tests..."
              className="w-full pl-10 pr-4 py-6 text-base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        {/* Test List */}
        <motion.div 
          className="mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.1 }}
        >
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredTests.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-6">
              {filteredTests.map((test: Test) => (
                <motion.div
                  key={test.$id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <TestCard
                    id={test.$id}
                    title={test.title || test.TestTitle || 'Untitled Test'}
                    description={test.description || test.TestDescription || 'No description available'}
                    duration={test.duration || test.TestDuration || 0}
                    questionCount={test.questions?.length || 0}
                    category={test.category || currentCategory?.Title || 'Uncategorized'}
                    thumbnail={test.thumbnail}
                    passingScore={test.passingScore}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No tests found {searchQuery ? `matching "${searchQuery}"` : 'in this category'}.
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Global type declarations for window object
type GlobalWindow = Window & typeof globalThis & {
  // Add any global window properties here if needed
};

declare const window: GlobalWindow;
