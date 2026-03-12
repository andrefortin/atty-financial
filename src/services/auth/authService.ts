/**
 * Authentication Service
 *
 * Service layer for authentication operations.
 * Handles login, registration, password reset, and profile updates.
 *
 * @module services/auth/authService
 */

import { getFirebaseAuth, getFirebaseDB, convertFirebaseError } from '../../lib/firebase';
import type { User as FirebaseUser } from 'firebase/auth';

// ============================================
// Types
// ============================================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  displayName: string;
  role?: 'Admin' | 'User' | 'Viewer';
}

export interface UpdateProfileData {
  displayName?: string;
  photoURL?: string;
}

export interface AuthResult {
  success: boolean;
  user?: any;
  error?: string;
}

// ============================================
// Constants
// ============================================

const USERS_COLLECTION = 'users';

// ============================================
// Auth Service Class
// ============================================

class AuthService {
  private auth = getFirebaseAuth();
  private db = getFirebaseDB();

  /**
   * Login user with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      const userCredential = await this.auth.signInWithEmailAndPassword(
        credentials.email,
        credentials.password
      );

      const user = await this.getUserProfile(userCredential.user.uid);
      return {
        success: true,
        user,
      };
    } catch (error) {
      const firebaseError = convertFirebaseError(error);
      return {
        success: false,
        error: firebaseError.message,
      };
    }
  }

  /**
   * Register new user
   */
  async register(credentials: RegisterCredentials): Promise<AuthResult> {
    try {
      const userCredential = await this.auth.createUserWithEmailAndPassword(
        credentials.email,
        credentials.password
      );

      // Update profile with display name
      if (credentials.displayName) {
        await this.auth.updateProfile(userCredential.user, {
          displayName: credentials.displayName,
        });
      }

      // Create user document in Firestore
      await this.db.collection(USERS_COLLECTION).doc(userCredential.user.uid).set({
        uid: userCredential.user.uid,
        email: credentials.email,
        displayName: credentials.displayName,
        role: credentials.role || 'User',
        createdAt: new Date(),
        isActive: true,
      });

      const user = await this.getUserProfile(userCredential.user.uid);
      return {
        success: true,
        user,
      };
    } catch (error) {
      const firebaseError = convertFirebaseError(error);
      return {
        success: false,
        error: firebaseError.message,
      };
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<AuthResult> {
    try {
      await this.auth.signOut();
      return {
        success: true,
      };
    } catch (error) {
      const firebaseError = convertFirebaseError(error);
      return {
        success: false,
        error: firebaseError.message,
      };
    }
  }

  /**
   * Reset user password
   */
  async resetPassword(email: string): Promise<AuthResult> {
    try {
      await this.auth.sendPasswordResetEmail(email);
      return {
        success: true,
      };
    } catch (error) {
      const firebaseError = convertFirebaseError(error);
      return {
        success: false,
        error: firebaseError.message,
      };
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: UpdateProfileData): Promise<AuthResult> {
    try {
      // Update Firebase profile
      if (data.displayName || data.photoURL) {
        await this.auth.updateProfile(this.auth.currentUser!, {
          displayName: data.displayName,
          photoURL: data.photoURL,
        });
      }

      // Update Firestore profile
      await this.db.collection(USERS_COLLECTION).doc(userId).update({
        ...(data.displayName && { displayName: data.displayName }),
        ...(data.photoURL && { photoURL: data.photoURL }),
        updatedAt: new Date(),
      });

      const user = await this.getUserProfile(userId);
      return {
        success: true,
        user,
      };
    } catch (error) {
      const firebaseError = convertFirebaseError(error);
      return {
        success: false,
        error: firebaseError.message,
      };
    }
  }

  /**
   * Get user profile from Firestore
   */
  private async getUserProfile(userId: string): Promise<any> {
    try {
      const doc = await this.db.collection(USERS_COLLECTION).doc(userId).get();

      if (!doc.exists) {
        return null;
      }

      return doc.data();
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<any> {
    try {
      const user = this.auth.currentUser;
      if (!user) {
        return null;
      }

      return await this.getUserProfile(user.uid);
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Verify email
   */
  async sendEmailVerification(): Promise<AuthResult> {
    try {
      if (!this.auth.currentUser) {
        return {
          success: false,
          error: 'No user is currently logged in',
        };
      }

      await this.auth.currentUser.sendEmailVerification();
      return {
        success: true,
      };
    } catch (error) {
      const firebaseError = convertFirebaseError(error);
      return {
        success: false,
        error: firebaseError.message,
      };
    }
  }

  /**
   * Reload user data
   */
  async reloadUser(): Promise<AuthResult> {
    try {
      if (!this.auth.currentUser) {
        return {
          success: false,
          error: 'No user is currently logged in',
        };
      }

      await this.auth.currentUser.reload();
      const user = await this.getUserProfile(this.auth.currentUser.uid);
      return {
        success: true,
        user,
      };
    } catch (error) {
      const firebaseError = convertFirebaseError(error);
      return {
        success: false,
        error: firebaseError.message,
      };
    }
  }
}

// ============================================
// Export Singleton Instance
// ============================================

const authService = new AuthService();
export default authService;
