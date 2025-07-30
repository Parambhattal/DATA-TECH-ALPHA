import { databases, DATABASE_ID, INTERNSHIPS_COLLECTION_ID } from '../appwriteConfig';
import { ID } from 'appwrite';

interface CreateInternshipData {
  title: string;
  description: string;
  shortDescription: string;
  duration: string;
  level: string;
  slug: string;
  startDate: string;
  endDate: string;
  isActive?: boolean;
  maxStudents?: number;
  price: number;
  currency: string;
  tags?: string[];
  image?: string;
  projects?: any[];
  videos?: any[];
  liveSessions?: any[];
}

export const createInternship = async (internshipData: CreateInternshipData) => {
  try {
    // Add default values
    const data = {
      ...internshipData,
      isActive: internshipData.isActive ?? true,
      currentStudents: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const response = await databases.createDocument(
      DATABASE_ID,
      INTERNSHIPS_COLLECTION_ID,
      ID.unique(),
      data
    );

    return response;
  } catch (error) {
    console.error('Error creating internship:', error);
    throw error;
  }
};

export const updateInternship = async (internshipId: string, updates: Partial<CreateInternshipData>) => {
  try {
    const response = await databases.updateDocument(
      DATABASE_ID,
      INTERNSHIPS_COLLECTION_ID,
      internshipId,
      {
        ...updates,
        updatedAt: new Date().toISOString(),
      }
    );

    return response;
  } catch (error) {
    console.error('Error updating internship:', error);
    throw error;
  }
};
