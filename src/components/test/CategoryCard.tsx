import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Star, BookOpen, ChevronRight, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategoryCardProps {
  category: {
    $id: string;
    Title: string;
    description: string;
    categoryThumbnail: string;
    rating?: number;
    languages?: string[];
    attempts?: number;
  };
  testCount: number;
  onClick: () => void;
}

// Color variants for different categories
const categoryColors = [
  'bg-gradient-to-r from-blue-500 to-blue-600',
  'bg-gradient-to-r from-purple-500 to-pink-500',
  'bg-gradient-to-r from-green-500 to-teal-500',
  'bg-gradient-to-r from-yellow-500 to-orange-500',
  'bg-gradient-to-r from-red-500 to-pink-500',
  'bg-gradient-to-r from-indigo-500 to-purple-600',
];

// Function to get a consistent color based on category ID
const getCategoryColor = (id: string) => {
  const index = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % categoryColors.length;
  return categoryColors[index];
};

export function CategoryCard({ category, testCount, onClick }: CategoryCardProps) {
  const colorClass = getCategoryColor(category.$id);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ 
        y: -8, 
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ 
        type: 'spring', 
        stiffness: 400, 
        damping: 15,
        duration: 0.3
      }}
      className="w-full h-full"
      onClick={onClick}
    >
      <Card className="cursor-pointer overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 h-full flex flex-col w-full max-w-[320px] mx-auto bg-white dark:bg-gray-800">
        {/* Header with colored background */}
        <motion.div 
          className={cn("h-2 w-full", colorClass)}
          whileHover={{ height: 4, transition: { duration: 0.3 } }}
        />
        
        <CardContent className="p-6 flex flex-col flex-grow">
          <motion.div 
            className="flex items-start gap-5 mb-5"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <div className={cn("p-5 rounded-2xl flex-shrink-0", colorClass, 'bg-opacity-10')}>
              {category.categoryThumbnail ? (
                <img
                  src={category.categoryThumbnail}
                  alt={category.Title}
                  className="w-14 h-14 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = document.createElement('div');
                    fallback.innerHTML = '<BookOpen className="w-8 h-8 text-current" />';
                    target.parentNode?.insertBefore(fallback.firstChild!, target.nextSibling);
                  }}
                />
              ) : (
                <BookOpen className="w-10 h-10 text-current" />
              )}
            </div>
            
            <div className="flex-1">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-2">
                  {category.Title || 'Uncategorized'}
                </h3>
                
                {/* Rating */}
                {category.rating !== undefined && (
                  <div className="flex items-center mt-1">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-4 h-4 ${i < Math.floor(category.rating || 0) ? 'fill-current' : ''}`} 
                        />
                      ))}
                    </div>
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                      {category.rating.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
          
          {/* Description */}
          <motion.p 
            className="text-base text-gray-600 dark:text-gray-300 mb-5 line-clamp-3 flex-grow"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            {category.description || 'No description available'}
          </motion.p>
          
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            {/* Languages */}
            <motion.div 
              className="space-y-1"
              whileHover={{ scale: 1.03 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            >
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Languages</p>
              <div className="flex flex-wrap gap-1">
                {category.languages && category.languages.length > 0 ? (
                  category.languages.slice(0, 2).map((lang, index) => (
                    <motion.span 
                      key={index}
                      className="text-xs px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full inline-block"
                      whileHover={{ scale: 1.1 }}
                      transition={{ type: 'spring', stiffness: 500 }}
                    >
                      {lang}
                    </motion.span>
                  ))
                ) : (
                  <span className="text-xs text-gray-400">Not specified</span>
                )}
              </div>
            </motion.div>
            
            {/* Attempts */}
            <motion.div 
              className="space-y-1"
              whileHover={{ scale: 1.03 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            >
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Attempts</p>
              <motion.div 
                className="flex items-center"
                whileHover={{ x: 2 }}
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
                >
                  <Users className="w-4 h-4 mr-1 text-gray-400" />
                </motion.div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {category.attempts !== undefined ? (
                    <motion.span 
                      className="px-2 py-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full inline-block"
                      whileHover={{ scale: 1.1 }}
                      transition={{ type: 'spring', stiffness: 500 }}
                    >
                      {category.attempts.toLocaleString()}
                    </motion.span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </span>
              </motion.div>
            </motion.div>
          </div>
          
          {/* Footer */}
          <motion.div 
            className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100 dark:border-gray-700"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <BookOpen className="w-4 h-4 mr-1.5" />
              {testCount} {testCount === 1 ? 'Test' : 'Tests'}
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}