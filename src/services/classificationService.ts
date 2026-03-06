/**
 * Cancer Classification Service
 * Handles image upload and classification for Brain, Lung, and Skin cancer
 */

const API_BASE_URL = 'http://localhost:5000/api';

export type CancerType = 'brain' | 'lung' | 'skin';

export interface ClassificationResult {
  predicted_class: string;
  confidence: number;
  all_probabilities: { [key: string]: number };
  cancer_type: string;
}

export interface ClassificationResponse {
  success: boolean;
  result?: ClassificationResult;
  error?: string;
}

export interface ModelInfo {
  classes: string[];
  num_classes: number;
  input_size: number;
}

export interface ModelsInfo {
  brain?: ModelInfo;
  lung?: ModelInfo;
  skin?: ModelInfo;
}

/**
 * Check if the API server is healthy
 */
export const checkHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    return data.status === 'healthy';
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
};

/**
 * Get information about available models
 */
export const getModelsInfo = async (): Promise<ModelsInfo> => {
  try {
    const response = await fetch(`${API_BASE_URL}/models`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch models info:', error);
    throw error;
  }
};

/**
 * Classify an image for cancer detection
 * @param file - Image file to classify
 * @param cancerType - Type of cancer to detect (brain/lung/skin)
 * @returns Classification result
 */
export const classifyImage = async (
  file: File,
  cancerType: CancerType
): Promise<ClassificationResponse> => {
  try {
    // Validate file
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/bmp', 'image/tiff'];
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: 'Invalid file type. Please upload PNG, JPEG, or BMP image.'
      };
    }

    // Validate file size (16MB max)
    const maxSize = 16 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        success: false,
        error: 'File size exceeds 16MB limit.'
      };
    }

    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('cancer_type', cancerType);

    // Send request
    const response = await fetch(`${API_BASE_URL}/predict`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Classification failed'
      };
    }

    return data;
  } catch (error) {
    console.error('Classification error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Save classification result to Firestore
 * This can be called after getting a classification result
 */
export const saveClassificationResult = async (
  userId: string,
  userType: 'patient' | 'doctor',
  result: ClassificationResult,
  imageUrl?: string
) => {
  try {
    const { db } = await import('./firebase');
    const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');

    const classificationsRef = collection(db, 'classifications');
    
    await addDoc(classificationsRef, {
      userId,
      userType,
      cancerType: result.cancer_type,
      predictedClass: result.predicted_class,
      confidence: result.confidence,
      allProbabilities: result.all_probabilities,
      imageUrl: imageUrl || null,
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString()
    });

    return { success: true };
  } catch (error) {
    console.error('Error saving classification result:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to save result' 
    };
  }
};

/**
 * Get user's classification history
 */
export const getClassificationHistory = async (userId: string) => {
  try {
    const { db } = await import('./firebase');
    const { collection, query, where, orderBy, getDocs } = await import('firebase/firestore');

    const classificationsRef = collection(db, 'classifications');
    const q = query(
      classificationsRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching classification history:', error);
    throw error;
  }
};
