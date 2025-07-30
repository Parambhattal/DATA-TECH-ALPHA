import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { formatDuration } from '@/lib/utils';
import { Clock, FileText, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TestCardProps {
  id: string;
  title: string;
  description: string;
  duration: number;
  questionCount?: number;
  category?: string;
  thumbnail?: string | null;
  passingScore?: number;
}

export const TestCard: React.FC<TestCardProps> = ({
  id,
  title,
  description,
  duration,
  questionCount = 0,
  category = 'Uncategorized',
  thumbnail = null,
  passingScore = 0
}) => {
  const navigate = useNavigate();

  const handleStartTest = () => {
    // Navigate to the direct test start URL which will automatically begin the test
    navigate(`/test/start/${id}`);
  };

  return (
    <Card 
      id={id}
      className="w-full max-w-xs overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
    >
      {/* Thumbnail */}
      <div className="relative h-32 w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
        {thumbnail ? (
          <img 
            src={thumbnail} 
            alt={title}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to icon if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = target.parentElement?.querySelector('.thumbnail-fallback');
              if (fallback) {
                (fallback as HTMLElement).style.display = 'flex';
              }
            }}
          />
        ) : null}
        <div className="thumbnail-fallback w-full h-full flex items-center justify-center" style={{ display: thumbnail ? 'none' : 'flex' }}>
          <FileText className="h-12 w-12 text-primary" />
        </div>
      </div>
      
      <CardHeader className="p-4">
        <h3 className="font-semibold text-lg line-clamp-2">{title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
      </CardHeader>
      
      <CardContent className="p-4 pt-0">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{formatDuration(duration)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span>{questionCount} {questionCount === 1 ? 'Question' : 'Questions'}</span>
          </div>
          {passingScore > 0 && (
            <div className="flex items-center space-x-2">
              <Award className="h-4 w-4 text-muted-foreground" />
              <span>Passing: {passingScore}%</span>
            </div>
          )}
          {category && (
            <div className="flex items-center space-x-2">
              <span className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-full">
                {category}
              </span>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        <Button 
          className="w-full" 
          variant="outline"
          onClick={handleStartTest}
        >
          Start Test
        </Button>
      </CardFooter>
    </Card>
  );
};


