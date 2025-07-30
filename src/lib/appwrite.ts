import { Client, Databases, Storage, ID, Query } from 'appwrite';

// Log environment variables for debugging
console.log('Appwrite Endpoint:', import.meta.env.VITE_APPWRITE_ENDPOINT);
console.log('Appwrite Project ID:', import.meta.env.VITE_APPWRITE_PROJECT_ID);
console.log('Database ID:', import.meta.env.VITE_APPWRITE_DATABASE_ID);

// Validate environment variables
const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT;
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID;

if (!endpoint || !projectId) {
  console.error('Missing required Appwrite environment variables');
  console.error('VITE_APPWRITE_ENDPOINT:', endpoint);
  console.error('VITE_APPWRITE_PROJECT_ID:', projectId);
  throw new Error('Missing required Appwrite environment variables');
}

// Initialize the Appwrite client
const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId);

// Initialize services
const databases = new Databases(client);
const storage = new Storage(client);

// Database and Collection IDs
export const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID as string;
if (!DATABASE_ID) {
  console.error('Missing VITE_APPWRITE_DATABASE_ID environment variable');
}

export const LIVE_LECTURES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_LIVE_LECTURES_COLLECTION_ID as string;
export const PAYMENTS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_PAYMENTS_COLLECTION_ID as string;
export const STUDY_MATERIALS_COLLECTION_ID = '682c0545000d9a62893e'; // Your study materials collection ID
export const STUDY_MATERIALS_BUCKET_ID = import.meta.env.VITE_APPWRITE_STUDY_MATERIALS_BUCKET_ID as string;

export { ID, Query, databases, storage };

// Log client configuration
console.log('Appwrite client initialized with:', {
  endpoint,
  projectId,
  databaseId: DATABASE_ID,
  studyMaterialsCollectionId: STUDY_MATERIALS_COLLECTION_ID,
  studyMaterialsBucketId: STUDY_MATERIALS_BUCKET_ID
});

export interface SavePaymentParams {
  userId: string;
  courseId: string;
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  status: string;
  receipt: string;
  metadata?: Record<string, any>;
}

export const savePaymentToAppwrite = async ({
  userId,
  courseId,
  paymentId,
  orderId,
  amount,
  currency,
  status,
  receipt,
  metadata = {},
}: SavePaymentParams) => {
  if (!DATABASE_ID || !PAYMENTS_COLLECTION_ID) {
    throw new Error('Appwrite database or collection ID not configured');
  }

  try {
    if (!DATABASE_ID || !PAYMENTS_COLLECTION_ID) {
      throw new Error('Appwrite database or collection ID not configured');
    }

    const document = await databases.createDocument(
      DATABASE_ID,
      PAYMENTS_COLLECTION_ID,
      ID.unique(),
      {
        userId,
        courseId,
        paymentId,
        orderId,
        amount,
        currency,
        status,
        receipt,
        ...metadata,
      }
    );
    return document;
  } catch (error) {
    console.error('Error saving payment to Appwrite:', error);
    throw error;
  }
};

export const getPaymentByOrderId = async (orderId: string) => {
  if (!process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || !process.env.NEXT_PUBLIC_APPWRITE_PAYMENTS_COLLECTION_ID) {
    throw new Error('Appwrite database or collection ID not configured');
  }

  try {
    const response = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
      process.env.NEXT_PUBLIC_APPWRITE_PAYMENTS_COLLECTION_ID,
      [
        `orderId=${orderId}`,
      ]
    );
    
    return response.documents[0] || null;
  } catch (error) {
    console.error('Error fetching payment from Appwrite:', error);
    throw error;
  }
};
