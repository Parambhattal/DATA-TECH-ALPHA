// src/contexts/CourseContext.tsx
import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { allCourses, Course } from '../pages/courseData';

type CourseContextType = {
  course: Course | null;
  loading: boolean;
  error: string | null;
  selectedVideo: string | null;
  setSelectedVideo: (videoId: string | null) => void;
  courseId: string | undefined;
  setCourseId: (id: string) => void;
};

const CourseContext = createContext<CourseContextType | undefined>(undefined);

export const CourseProvider: React.FC<{ children: ReactNode; initialCourse?: Course }> = ({
  children,
  initialCourse,
}) => {
  const { courseId: urlCourseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(initialCourse || null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [currentCourseId, setCurrentCourseId] = useState<string | undefined>(
    urlCourseId || initialCourse?.id || initialCourse?.courseId
  );
  
  // Debug log
  console.log('CourseContext - Initial course ID:', {
    urlCourseId,
    initialCourseId: initialCourse?.id,
    initialCourseCourseId: initialCourse?.courseId,
    currentCourseId
  });

  // Update course ID when URL changes
  useEffect(() => {
    if (urlCourseId) {
      setCurrentCourseId(urlCourseId);
    }
  }, [urlCourseId]);

  // Use either the URL courseId or the initialCourse's id
  const courseId = currentCourseId;

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        console.log('Fetching course with ID:', courseId);
        
        if (initialCourse) {
          // If we have an initial course, use it
          const normalizedCourse = {
            ...initialCourse,
            id: initialCourse.id,
            courseId: initialCourse.courseId || initialCourse.id
          };
          console.log('Using initial course:', normalizedCourse);
          setCourse(normalizedCourse);
          setError(null);
          setLoading(false);
          return;
        }
        
        if (!courseId) {
          console.error('No course ID provided');
          setError('No course ID provided');
          setLoading(false);
          return;
        }

        // Flatten all courses from all categories
        const allCoursesFlat = allCourses.flatMap(category => category.courses);
        
        console.log('Searching in courses:', allCoursesFlat.map(c => ({
          id: c.id,
          courseId: c.courseId,
          title: c.title
        })));
        
        // Try to find the course by ID or courseId
        const foundCourse = allCoursesFlat.find(course => 
          course.id === courseId || course.courseId === courseId
        );

        console.log('Course search results:', {
          searchId: courseId,
          foundCourse: foundCourse ? {
            id: foundCourse.id,
            courseId: foundCourse.courseId,
            title: foundCourse.title
          } : null
        });

        if (foundCourse) {
          // Ensure both id and courseId are set
          const courseWithIds = {
            ...foundCourse,
            id: foundCourse.id,
            courseId: foundCourse.courseId || foundCourse.id
          };
          console.log('Setting course:', courseWithIds);
          setCourse(courseWithIds);
          setError(null);
        } else {
          console.error('Course not found with ID:', courseId);
          setError(`Course not found (ID: ${courseId})`);
          setCourse(null);
        }
      } catch (err) {
        console.error('Error fetching course:', err);
        setError('Failed to load course data');
        setCourse(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [currentCourseId, initialCourse]);

  const contextValue = {
    course,
    loading,
    error,
    selectedVideo,
    setSelectedVideo,
    courseId,
    setCourseId: setCurrentCourseId
  };

  return (
    <CourseContext.Provider value={contextValue}>
      {children}
    </CourseContext.Provider>
  );
};

export const useCourse = () => {
  const context = useContext(CourseContext);
  if (context === undefined) {
    throw new Error('useCourse must be used within a CourseProvider');
  }
  return context;
};