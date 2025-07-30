import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Briefcase, CheckCircle } from 'lucide-react';
import ApplicationForm from './ApplicationForm';
import { useAuth } from '../../contexts/AuthContext';
import { databases } from '../../appwriteConfig';
import { DATABASE_ID, INTERNSHIP_APPLICATIONS_COLLECTION_ID } from '../../appwriteConfig';
import { Query } from 'appwrite';

// Using any type to avoid type conflicts for now
interface Internship {
  id: string;
  title: string;
  description?: string;
  duration?: string;
  level?: string;
  image?: string;
  slug?: string;
  price?: number;
  currency?: string;
}

interface InternshipCardProps {
  internship: Internship;
}

const InternshipCard: React.FC<InternshipCardProps> = ({ internship }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const { user } = useAuth();

  // Check application status on component mount
  useEffect(() => {
    const checkApplicationStatus = async () => {
      if (!user || !internship.id) {
        setIsCheckingStatus(false);
        return;
      }

      try {
        const response = await databases.listDocuments(
          DATABASE_ID,
          INTERNSHIP_APPLICATIONS_COLLECTION_ID,
          [
            Query.equal('user_id', user.$id),
            Query.equal('internship_id', internship.id),
            Query.equal('payment_status', 'completed')
          ]
        );

        setHasApplied(response.documents.length > 0);
      } catch (error) {
        console.error('Error checking application status:', error);
      } finally {
        setIsCheckingStatus(false);
      }
    };

    checkApplicationStatus();
  }, [user, internship.id]);

  // Log rendering for debugging
  useEffect(() => {
    console.log('Rendering InternshipCard with:', {
      id: internship.id,
      title: internship.title,
      hasImage: !!internship.image,
      hasDescription: !!internship.description,
      hasApplied,
      isCheckingStatus
    });

    // Force visibility after a short delay to prevent FOUC
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50);

    return () => clearTimeout(timer);
  }, [internship, hasApplied, isCheckingStatus]);

  // Fallback image if none provided or if there's an error
  const fallbackImage = 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80';
  const imageUrl = imageError || !internship.image ? fallbackImage : internship.image;

  const handleApplyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Redirect to the internship details page
    window.location.href = `/internships/${internship.id}`;
  };

  return (
    <>
      <motion.div 
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden h-full flex flex-col border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
        transition={{ duration: 0.3 }}
        onClick={(e) => e.stopPropagation()}
      >
      <div className="relative h-48 w-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
        <Link to={`/internships/${internship.id}`} className="block w-full h-full">
          <img 
            src={imageUrl} 
            alt={internship.title || 'Internship'}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            onLoad={() => {
              setIsVisible(true);
              setImageError(false);
            }}
            onError={() => {
              console.error('Error loading image:', imageUrl);
              setImageError(true);
            }}
          />
        </Link>
        <div className="absolute top-2 right-2">
          <span className="bg-white/90 dark:bg-gray-800/90 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {internship.level || 'All Levels'}
          </span>
        </div>
      </div>
      <div className="p-6 flex-1 flex flex-col">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {internship.title || 'Untitled Internship'}
        </h3>
        
        {internship.description && (
          <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
            {internship.description}
          </p>
        )}
        
        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Price</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {internship.currency || '₹'} {internship.price?.toLocaleString() || 'Contact for pricing'}
              </p>
            </div>
            <Link 
              to={`/internships/${internship.id}`}
              className="text-blue-600 dark:text-blue-400 hover:underline flex items-center text-sm font-medium"
            >
              Learn More
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          
          <div className="mt-4">
            {isCheckingStatus ? (
              <button
                disabled
                className="w-full py-2 px-4 bg-gray-300 dark:bg-gray-600 text-white font-medium rounded-lg flex items-center justify-center gap-2 cursor-not-allowed"
              >
                Loading...
              </button>
            ) : hasApplied ? (
              <div className="p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="text-green-700 dark:text-green-300 font-medium">Enrolled</span>
              </div>
            ) : (
              <button
                onClick={handleApplyClick}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Briefcase className="w-4 h-4" />
                Apply Now
              </button>
            )}
          </div>
          </div>
        </div>
      </motion.div>
      
      {/* Application Form Modal */}
      {showApplicationForm && internship.price !== undefined && (
        <ApplicationForm
          internshipId={internship.id}
          price={internship.price}
          currency={internship.currency}
          onClose={() => setShowApplicationForm(false)}
        />
      )}
    </>
  );
};

export default InternshipCard;
