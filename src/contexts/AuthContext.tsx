import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../services/firebase';
import {
  createBaseUser,
  createDoctorProfile,
  createPatientProfile,
  createManagementProfile,
  getBaseUser,
  getUserProfile
} from '../services/userService';
import type {
  UserType,
  DoctorRegistrationData,
  PatientRegistrationData,
  ManagementRegistrationData,
  Doctor,
  Patient,
  Management
} from '../types';

type RegistrationData = DoctorRegistrationData | PatientRegistrationData | ManagementRegistrationData;
type UserProfile = Doctor | Patient | Management | null;

interface AuthContextType {
  user: User | null;
  userType: UserType | null;
  userProfile: UserProfile;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    email: string,
    password: string,
    userType: UserType,
    profileData: RegistrationData
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>(null);
  const [loading, setLoading] = useState(true);

  // Session storage keys for tab-specific authentication
  const SESSION_USER_KEY = 'session_user_id';
  const SESSION_USER_TYPE_KEY = 'session_user_type';

  // Function to fetch and set user profile
  const fetchUserProfile = async (userId: string, type: UserType) => {
    try {
      const profile = await getUserProfile(userId, type);
      setUserProfile(profile);
      return profile;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUserProfile(null);
      return null;
    }
  };

  // Refresh profile data (useful after profile updates)
  const refreshProfile = async () => {
    if (user && userType) {
      await fetchUserProfile(user.uid, userType);
    }
  };

  // Save session data to sessionStorage (tab-specific)
  const saveSessionData = (userId: string, type: UserType) => {
    sessionStorage.setItem(SESSION_USER_KEY, userId);
    sessionStorage.setItem(SESSION_USER_TYPE_KEY, type);
  };

  // Clear session data from sessionStorage
  const clearSessionData = () => {
    sessionStorage.removeItem(SESSION_USER_KEY);
    sessionStorage.removeItem(SESSION_USER_TYPE_KEY);
  };

  // Load session data on mount
  useEffect(() => {
    const loadSessionData = async () => {
      const sessionUserId = sessionStorage.getItem(SESSION_USER_KEY);
      const sessionUserType = sessionStorage.getItem(SESSION_USER_TYPE_KEY) as UserType | null;

      if (sessionUserId && sessionUserType) {
        try {
          // Verify the session is still valid
          const baseUser = await getBaseUser(sessionUserId);
          
          if (baseUser && baseUser.userType === sessionUserType) {
            // Get current Firebase Auth user
            const currentUser = auth.currentUser;
            
            if (currentUser && currentUser.uid === sessionUserId) {
              setUser(currentUser);
              setUserType(sessionUserType);
              await fetchUserProfile(sessionUserId, sessionUserType);
            } else {
              // Session is invalid, clear it
              clearSessionData();
            }
          } else {
            clearSessionData();
          }
        } catch (error) {
          console.error('Error loading session data:', error);
          clearSessionData();
        }
      }
      
      setLoading(false);
    };

    loadSessionData();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Only update if this matches our session OR if we have no session
      const sessionUserId = sessionStorage.getItem(SESSION_USER_KEY);
      
      if (!sessionUserId) {
        // No session data, this is a new login or page refresh
        setUser(firebaseUser);
        
        if (firebaseUser) {
          try {
            // Fetch user type from Firestore
            const baseUser = await getBaseUser(firebaseUser.uid);
            
            if (baseUser) {
              setUserType(baseUser.userType);
              saveSessionData(firebaseUser.uid, baseUser.userType);
              // Fetch complete user profile
              await fetchUserProfile(firebaseUser.uid, baseUser.userType);
            }
          } catch (error) {
            console.error('Error loading user data:', error);
            setUserType(null);
            setUserProfile(null);
            clearSessionData();
          }
        } else {
          setUserType(null);
          setUserProfile(null);
          clearSessionData();
        }
        
        setLoading(false);
      } else if (firebaseUser && firebaseUser.uid === sessionUserId) {
        // Firebase user matches our session, update user object
        setUser(firebaseUser);
      } else if (!firebaseUser) {
        // User logged out, clear session if it exists
        const currentSessionUser = sessionStorage.getItem(SESSION_USER_KEY);
        if (currentSessionUser) {
          setUser(null);
          setUserType(null);
          setUserProfile(null);
          clearSessionData();
        }
      }
      // Ignore auth changes from other tabs that don't match our session
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;
      
      // Fetch user type and save to session
      const baseUser = await getBaseUser(userId);
      if (baseUser) {
        setUser(userCredential.user);
        setUserType(baseUser.userType);
        saveSessionData(userId, baseUser.userType);
        await fetchUserProfile(userId, baseUser.userType);
      } else {
        throw new Error('User profile not found');
      }
    } catch (error) {
      clearSessionData();
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (
    email: string,
    password: string,
    userType: UserType,
    profileData: RegistrationData
  ) => {
    setLoading(true);
    
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const userId = userCredential.user.uid;

    try {
      // Create base user document
      await createBaseUser(userId, email, userType);

      // Create type-specific profile
      if (userType === 'doctor') {
        await createDoctorProfile(userId, email, profileData as DoctorRegistrationData);
      } else if (userType === 'patient') {
        await createPatientProfile(userId, email, profileData as PatientRegistrationData);
      } else if (userType === 'management') {
        await createManagementProfile(userId, email, profileData as ManagementRegistrationData);
      }

      setUser(userCredential.user);
      setUserType(userType);
      saveSessionData(userId, userType);
      
      // Fetch the newly created profile
      await fetchUserProfile(userId, userType);
    } catch (error) {
      // If Firestore operations fail, delete the Auth user
      await userCredential.user.delete();
      clearSessionData();
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    // Clear session data first
    clearSessionData();
    
    // Clear local state
    setUser(null);
    setUserType(null);
    setUserProfile(null);
    
    // DO NOT call signOut(auth) - it would log out all tabs
    // Instead, just clear this tab's session and state
    // The user remains authenticated in Firebase, but this tab is "logged out"
  };

  const value = {
    user,
    userType,
    userProfile,
    loading,
    login,
    signup,
    logout,
    refreshProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper hooks for type-safe profile access
export const useDoctorProfile = () => {
  const { userProfile, userType } = useAuth();
  if (userType === 'doctor') {
    return userProfile as Doctor | null;
  }
  return null;
};

export const usePatientProfile = () => {
  const { userProfile, userType } = useAuth();
  if (userType === 'patient') {
    return userProfile as Patient | null;
  }
  return null;
};

export const useManagementProfile = () => {
  const { userProfile, userType } = useAuth();
  if (userType === 'management') {
    return userProfile as Management | null;
  }
  return null;
};

// Type guard functions for runtime checks
export const isDoctor = (profile: UserProfile): profile is Doctor => {
  return profile !== null && 'doctorId' in profile;
};

export const isPatient = (profile: UserProfile): profile is Patient => {
  return profile !== null && 'patientId' in profile;
};

export const isManagement = (profile: UserProfile): profile is Management => {
  return profile !== null && 'empId' in profile;
};