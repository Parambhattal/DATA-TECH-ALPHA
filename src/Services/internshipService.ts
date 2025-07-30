import { client, databases, DATABASE_ID, INTERNSHIPS_COLLECTION_ID, account, authenticatedRequest } from '../appwriteConfig';
import { Query, Models } from 'appwrite';

// Types
export interface Internship {
  $id?: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  duration: string;
  level: string;
  startDate: string;
  endDate: string;
  isActive?: boolean;
  maxStudents?: number;
  currentStudents?: number;
  price: number;
  currency: string;
  tags?: string[];
  image?: string;
  projects?: any[];
  videos?: any[];
  liveSessions?: any[];
}

export const createInternship = async (internshipData: Omit<Internship, '$id'>) => {
  try {
    const response = await databases.createDocument(
      DATABASE_ID,
      INTERNSHIPS_COLLECTION_ID,
      'unique()', // Auto-generate document ID
      internshipData
    );
    return response;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create internship';
    console.error('Error creating internship:', errorMessage);
    throw new Error(errorMessage);
  }
};

export const getInternshipBySlug = async (slug: string): Promise<Internship> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      INTERNSHIPS_COLLECTION_ID,
      [Query.equal('slug', slug)]
    );
    
    if (response.documents.length === 0) {
      throw new Error('Internship not found');
    }
    
    return response.documents[0] as unknown as Internship;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch internship';
    console.error('Error fetching internship:', errorMessage);
    throw new Error(errorMessage);
  }
};

/**
 * Get all internships with proper authentication handling
 * Uses the authenticatedRequest pattern to automatically handle session refresh
 */
export const getAllInternships = async (): Promise<Internship[]> => {
  try {
    console.log('Fetching internships from Appwrite...', {
      databaseId: DATABASE_ID,
      collectionId: INTERNSHIPS_COLLECTION_ID
    });

    // Use the authenticated request pattern which will handle session refresh automatically
    const response = await authenticatedRequest(
      async () => {
        // Prepare the queries
        const queries = [
          Query.orderDesc('$createdAt'),
          Query.limit(50)
        ];
        
        // Make the API call
        return await databases.listDocuments(
          DATABASE_ID,
          INTERNSHIPS_COLLECTION_ID,
          queries
        );
      },
      { retryOnAuthFailure: true }
    );
    
    // Process the response
    if (!response || !response.documents) {
      console.error('Invalid response format from Appwrite:', response);
      throw new Error('Failed to fetch internships: Invalid response format');
    }
    
    // Map the documents to Internship objects
    const internships = response.documents.map((doc: Models.Document) => ({
      $id: doc.$id,
      title: doc.title,
      slug: doc.slug,
      description: doc.description,
      shortDescription: doc.shortDescription,
      duration: doc.duration,
      level: doc.level,
      startDate: doc.startDate,
      endDate: doc.endDate,
      isActive: doc.isActive || false,
      maxStudents: doc.maxStudents || 0,
      currentStudents: doc.currentStudents || 0,
      price: doc.price || 0,
      currency: doc.currency || 'INR',
      tags: doc.tags || [],
      image: doc.image || '',
      projects: doc.projects || [],
      videos: doc.videos || [],
      liveSessions: doc.liveSessions || [],
      $createdAt: doc.$createdAt,
      $updatedAt: doc.$updatedAt,
    }));
    
    console.log(`Fetched ${internships.length} internships`);
    return internships;
  } catch (error) {
    console.error('Error fetching internships:', error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'An unknown error occurred while fetching internships'
    );
  }
};

export const updateInternship = async (internshipId: string, updates: Partial<Internship>) => {
  try {
    const response = await databases.updateDocument(
      DATABASE_ID,
      INTERNSHIPS_COLLECTION_ID,
      internshipId,
      updates
    );
    return response;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update internship';
    console.error('Error updating internship:', errorMessage);
    throw new Error(errorMessage);
  }
};

export const enrollInInternship = async (internshipId: string, userId: string) => {
  try {
    // First, get the current internship to check max students
    const internship = await databases.getDocument(
      DATABASE_ID,
      INTERNSHIPS_COLLECTION_ID,
      internshipId
    ) as unknown as Internship;

    // Check if there's space available
    if (internship.maxStudents && internship.currentStudents && 
        internship.currentStudents >= internship.maxStudents) {
      throw new Error('This internship is already at maximum capacity');
    }

    // In a real app, you would create a new enrollment record in a separate collection
    // For now, we'll just increment the currentStudents count
    const updatedInternship = await databases.updateDocument(
      DATABASE_ID,
      INTERNSHIPS_COLLECTION_ID,
      internshipId,
      {
        currentStudents: (internship.currentStudents || 0) + 1
      }
    );

    return updatedInternship;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to enroll in internship';
    console.error('Error enrolling in internship:', errorMessage);
    throw new Error(errorMessage);
  }
};
