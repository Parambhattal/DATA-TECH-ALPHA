import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { databases } from '../appwriteConfig';
import { DATABASE_ID, INTERNSHIPS_COLLECTION_ID, INTERNSHIP_APPLICATIONS_COLLECTION_ID } from '../appwriteConfig';
import { Internship } from '../types/internship';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Calendar, Clock, MapPin, Briefcase, ExternalLink, CheckCircle } from 'lucide-react';
import ApplicationForm from '../components/internships/ApplicationForm';
import { useAuth } from '../contexts/AuthContext';
import { Query } from 'appwrite';

// Function to format description into sections with bullet points
const formatDescription = (description: string) => {
  // Split the description into sections based on double newlines
  const sections = description.split('\n\n').filter(section => section.trim() !== '');
  
  return sections.map(section => {
    // Check if the section has a title (ends with a colon)
    const titleMatch = section.match(/^(.+):/);
    let title = '';
    let content = section;
    
    if (titleMatch) {
      title = titleMatch[1].trim();
      content = section.substring(titleMatch[0].length).trim();
    }
    
    // Split content into bullet points
    const points = content
      .split('•')
      .map(point => point.trim())
      .filter(point => point !== '');
    
    return {
      title,
      points: points.length > 0 ? points : [content]
    };
  });
};

const InternshipDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [internship, setInternship] = useState<Internship | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imageError, setImageError] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Check if user has already applied for this internship
  const checkApplicationStatus = async () => {
    if (!user || !id) {
      setIsCheckingStatus(false);
      return;
    }

    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        INTERNSHIP_APPLICATIONS_COLLECTION_ID,
        [
          Query.equal('user_id', user.$id),
          Query.equal('internship_id', id),
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

  useEffect(() => {
    const fetchInternship = async () => {
      if (!id) return;
      
      console.log('Fetching internship with ID:', id);
      
      // Validate the ID format
      const isValidId = /^[a-zA-Z0-9_]{1,36}$/.test(id);
      if (!isValidId) {
        console.error('Invalid document ID format:', id);
        setError('Invalid internship ID format');
        setLoading(false);
        return;
      }
      
      try {
        // First try to get the internship by ID
        try {
          console.log('Calling databases.getDocument with:', {
            databaseId: DATABASE_ID,
            collectionId: INTERNSHIPS_COLLECTION_ID,
            documentId: id
          });
          
          const response = await databases.getDocument(
            DATABASE_ID,
            INTERNSHIPS_COLLECTION_ID,
            id
          );
          
          console.log('Received response:', response);
          
          // Transform the response to match our Internship type
          const data: Internship = {
            id: response.$id,
            title: response.title,
            slug: response.slug,
            description: response.description || '',
            duration: response.duration || 'Not specified',
            level: response.level || 'Beginner',
            image: response.image || '',
            price: typeof response.price === 'number' ? response.price : 0,
            currency: response.currency || '₹',
            projects: [],
            videos: [],
            liveSessions: []
          };
          
          setInternship(data);
          
          // Check application status after loading internship
          if (user) {
            await checkApplicationStatus();
          } else {
            setIsCheckingStatus(false);
          }
        } catch (err) {
          console.error('Error fetching internship:', err);
          setError('Failed to load internship details');
          setIsCheckingStatus(false);
        }
      } catch (err) {
        console.error('Error:', err);
        setError('An unexpected error occurred');
        setIsCheckingStatus(false);
      } finally {
        setLoading(false);
      }
    };

    fetchInternship();
  }, [id, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-4">
                <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
              <div className="space-y-4">
                <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !internship) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            {error || 'Internship not found'}
          </h2>
          <Link 
            to="/internships" 
            className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Internships
          </Link>
        </div>
      </div>
    );
  }

  // Fallback image if none provided or if there's an error
  const fallbackImage = 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80';
  const bannerImage = imageError || !internship.image ? fallbackImage : internship.image;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Banner */}
      <div className="relative h-64 w-full overflow-hidden bg-gray-200 dark:bg-gray-800">
        <img 
          src={bannerImage}
          alt={internship.title}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
          <div className="container mx-auto px-4 pb-8">
            <Link 
              to="/internships" 
              className="inline-flex items-center text-white/90 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Internships
            </Link>
            <h1 className="text-4xl font-bold text-white mb-2">{internship.title}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-white/90">
              <span className="inline-flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                Remote
              </span>
              <span className="inline-flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {internship.duration}
              </span>
              <span className="inline-flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                Starts: {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-1/4 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <h3 className="font-semibold text-lg mb-4">Quick Info</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Duration</p>
                  <p className="font-medium">{internship.duration}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Level</p>
                  <p className="font-medium capitalize">{internship.level.toLowerCase()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                  <p className="font-medium">Remote</p>
                </div>
                <div className="pt-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Price</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {internship.currency} {internship.price?.toLocaleString()}
                  </p>
                </div>
                {isCheckingStatus ? (
                  <button 
                    disabled
                    className="w-full mt-4 bg-gray-300 dark:bg-gray-600 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-not-allowed"
                  >
                    Checking status...
                  </button>
                ) : hasApplied ? (
                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg flex items-center justify-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <span className="text-green-700 dark:text-green-300 font-medium">Enrolled</span>
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowApplicationForm(true)}
                    className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Briefcase className="w-4 h-4" />
                    Apply Now
                  </button>
                )}
              </div>



            </div>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8"
              >
                {activeTab === 'overview' && (
                  <div>
                    <h2 className="text-2xl font-bold mb-4">About This Internship</h2>
                    <div className="prose dark:prose-invert max-w-none">
                      {internship.description ? (
                        <div className="space-y-4">
                          {formatDescription(internship.description).map((section, index) => (
                            <div key={index} className="mb-6">
                              {section.title && (
                                <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                                  {section.title}
                                </h3>
                              )}
                              <ul className="space-y-2 list-disc pl-6 text-gray-700 dark:text-gray-300">
                                {section.points.map((point, pointIndex) => (
                                  <li key={pointIndex} className="leading-relaxed">
                                    {point}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400">No description available.</p>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'projects' && (
                  <div>
                    <h2 className="text-2xl font-bold mb-4">Projects</h2>
                    {internship.projects && internship.projects.length > 0 ? (
                      <div className="grid gap-6 md:grid-cols-2">
                        {internship.projects.map((project) => (
                          <div key={project.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <h3 className="font-semibold text-lg mb-2">{project.title}</h3>
                            <p className="text-gray-600 dark:text-gray-300 mb-4">{project.description}</p>
                            {project.sourceCodeUrl && (
                              <a 
                                href={project.sourceCodeUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                View Source Code <ExternalLink className="w-4 h-4 ml-1" />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400">No projects listed for this internship.</p>
                    )}
                  </div>
                )}

                {activeTab === 'videos' && (
                  <div>
                    <h2 className="text-2xl font-bold mb-4">Video Content</h2>
                    {internship.videos && internship.videos.length > 0 ? (
                      <div className="grid gap-6">
                        {internship.videos.map((video) => (
                          <div key={video.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                            <div className="aspect-w-16 aspect-h-9 bg-black">
                              {video.thumbnail ? (
                                <img 
                                  src={video.thumbnail} 
                                  alt={video.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-400">
                                  <span>Video: {video.title}</span>
                                </div>
                              )}
                            </div>
                            <div className="p-4">
                              <h3 className="font-semibold text-lg mb-1">{video.title}</h3>
                              <p className="text-gray-600 dark:text-gray-300 mb-2">{video.description}</p>
                              <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                                <span>{video.duration}</span>
                                <a 
                                  href={video.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                                >
                                  Watch <ExternalLink className="w-3.5 h-3.5 ml-1" />
                                </a>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400">No video content available for this internship.</p>
                    )}
                  </div>
                )}

                {activeTab === 'sessions' && (
                  <div>
                    <h2 className="text-2xl font-bold mb-4">Live Sessions</h2>
                    {internship.liveSessions && internship.liveSessions.length > 0 ? (
                      <div className="space-y-4">
                        {internship.liveSessions.map((session) => (
                          <div key={session.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <h3 className="font-semibold text-lg mb-1">{session.title}</h3>
                            <p className="text-gray-600 dark:text-gray-300 mb-3">{session.description}</p>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                              <span className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1.5" />
                                {new Date(session.date).toLocaleDateString()}
                              </span>
                              <span className="flex items-center">
                                <Clock className="w-4 h-4 mr-1.5" />
                                {session.time}
                              </span>
                            </div>
                            <div className="mt-3">
                              <a 
                                href={`https://meet.jit.si/${session.jitsiRoom}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                Join Session <ExternalLink className="w-4 h-4 ml-1" />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400">No live sessions scheduled for this internship.</p>
                    )}
                  </div>
                )}

                {activeTab === 'apply' && (
                  <div>
                    <h2 className="text-2xl font-bold mb-4">How to Apply</h2>
                    <div className="prose dark:prose-invert max-w-none">
                      <p className="mb-4">To apply for this internship, please follow these steps:</p>
                      <ol className="list-decimal pl-6 space-y-2 mb-6">
                        <li>Click the "Apply Now" button in the sidebar</li>
                        <li>Fill out the application form with your details</li>
                        <li>Upload your resume and any required documents</li>
                        <li>Submit your application</li>
                      </ol>
                      <p>We'll review your application and get back to you within 5-7 business days.</p>
                      
                      <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <h3 className="font-semibold text-lg mb-3">Application Deadline</h3>
                        <p className="text-gray-700 dark:text-gray-300">
                          Applications close on {new Date().toLocaleDateString(undefined, { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                        <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors">
                          Apply Now
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      {/* Application Form Modal */}
      {showApplicationForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Apply for {internship.title}</h3>
                <button 
                  onClick={() => setShowApplicationForm(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
                >
                  ✕
                </button>
              </div>
              
              {!user ? (
                <div className="text-center py-8">
                  <p className="mb-4">Please sign in to apply for this internship</p>
                  <button
                    onClick={() => navigate('/login', { state: { from: `/internships/${internship.id}` } })}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Sign In
                  </button>
                </div>
              ) : (
                <ApplicationForm
                  internshipId={internship.id}
                  price={internship.price || 0}
                  currency={internship.currency}
                  onClose={() => setShowApplicationForm(false)}
                  onSuccess={() => {
                    setShowApplicationForm(false);
                    setHasApplied(true);
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InternshipDetail;
