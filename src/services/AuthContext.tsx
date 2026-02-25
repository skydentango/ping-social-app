import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile, User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { User, UserStatus } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserStatus: (status: UserStatus) => Promise<void>;
  updateProfilePicture: (imageUri: string) => Promise<void>;
  updatePushToken: (token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeUser: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      // Clean up previous user listener if it exists
      if (unsubscribeUser) {
        unsubscribeUser();
        unsubscribeUser = null;
      }

      if (firebaseUser) {
        // Set up real-time listener for user document
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        unsubscribeUser = onSnapshot(userDocRef, (userDoc) => {
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email!,
              displayName: firebaseUser.displayName || userData.displayName,
              profilePicture: userData.profilePicture || undefined,
              status: userData.status ? {
                emoji: userData.status.emoji,
                text: userData.status.text,
                updatedAt: userData.status.updatedAt?.toDate ? userData.status.updatedAt.toDate() : new Date(userData.status.updatedAt || Date.now())
              } : { emoji: '🟢', text: 'Free', updatedAt: new Date() },
              createdAt: userData.createdAt?.toDate() || new Date(),
              updatedAt: userData.updatedAt?.toDate() || new Date(),
            });
          } else {
            console.log('User document does not exist, creating...');
            // User document doesn't exist, create a basic one
            const basicUserData = {
              displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              email: firebaseUser.email!,
              profilePicture: '',
              status: { emoji: '🟢', text: 'Free', updatedAt: new Date() },
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            setDoc(userDocRef, basicUserData).then(() => {
              console.log('User document created');
            }).catch((error) => {
              console.error('Error creating user document:', error);
            });
          }
          setLoading(false);
        }, (error) => {
          console.error('User document listener error:', error);
          setLoading(false);
        });
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    // Cleanup function
    return () => {
      unsubscribeAuth();
      if (unsubscribeUser) {
        unsubscribeUser();
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update the user's display name
    await updateProfile(firebaseUser, { displayName });

    // Create user document in Firestore
    const userData = {
      displayName,
      email,
      profilePicture: '', // Initialize empty profile picture
      status: { emoji: '🟢', text: 'Free', updatedAt: new Date() },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await setDoc(doc(db, 'users', firebaseUser.uid), userData);
  };

  const updateUserStatus = async (status: UserStatus) => {
    if (!user) throw new Error('No user logged in');

    const userRef = doc(db, 'users', user.id);
    await updateDoc(userRef, {
      status: {
        emoji: status.emoji,
        text: status.text,
        updatedAt: new Date(),
      },
      updatedAt: new Date(),
    });
  };

  const updateProfilePicture = async (imageUri: string) => {
    if (!user) throw new Error('No user logged in');

    const userRef = doc(db, 'users', user.id);
    await updateDoc(userRef, {
      profilePicture: imageUri,
      updatedAt: new Date(),
    });
  };

  const updatePushToken = async (token: string) => {
    if (!user) throw new Error('No user logged in');

    const userRef = doc(db, 'users', user.id);
    await updateDoc(userRef, {
      pushToken: token,
      updatedAt: new Date(),
    });
  };

  const logout = async () => {
    await signOut(auth);
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    logout,
    updateUserStatus,
    updateProfilePicture,
    updatePushToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 