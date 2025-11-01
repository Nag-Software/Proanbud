import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail,
  confirmPasswordReset as firebaseConfirmPasswordReset,
  updateProfile,
  sendEmailVerification,
  applyActionCode
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

import {ref, set} from 'firebase/database';
import { db } from '@/lib/firebase';

export const loginWithEmail = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return { user: result.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
};

export const signupWithEmail = async (
  email: string, 
  password: string, 
  displayName?: string,
  businessSettings?: {
    companyName?: string;
    organizationNumber?: string;
    businessType?: string;
  }
) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update display name if provided
    if (displayName && result.user) {
      await updateProfile(result.user, { displayName });
    }
    
    // Wait a bit for auth token to propagate
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Save user data to Realtime Database with proper structure
    const userRef = ref(db, `users/${result.user.uid}`);
    const userData: any = {
      email: result.user.email,
      displayName,
      profile: {
        createdAt: Date.now(),
        lastLogin: Date.now(),
      },
      kunder: {},
      tilbud: {},
      analytics: {
        totalCustomers: 0,
        totalTilbud: 0,
        vunnetTilbud: 0,
        totalRevenue: 0,
        totalProfit: 0,
        winRate: 0,
        lastUpdated: Date.now(),
        monthlyData: [],
        jobbypeStats: [],
      }
    };

    // Add business settings if provided
    if (businessSettings && (businessSettings.companyName || businessSettings.organizationNumber)) {
      userData.businessSettings = {
        companyName: businessSettings.companyName || '',
        organizationNumber: businessSettings.organizationNumber || '',
        businessType: businessSettings.businessType || ''
      };
    }

    await set(userRef, userData);

    return { user: result.user, error: null };
  } catch (error: any) {
    console.error('signupWithEmail error:', error);
    // Return the error code if available, otherwise the message
    return { user: null, error: error.code || error.message };
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

export const confirmPasswordReset = async (oobCode: string, newPassword: string) => {
  try {
    await firebaseConfirmPasswordReset(auth, oobCode, newPassword);
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

export const sendVerificationEmail = async () => {
  try {
    if (auth.currentUser) {
      console.log('Sending verification email to:', auth.currentUser.email);
      // Configure action code settings to redirect to production URL
      const actionCodeSettings = {
        url: 'https://proanbud.no/dashboard',
        handleCodeInApp: false,
      };
      
      await sendEmailVerification(auth.currentUser, actionCodeSettings);
      console.log('Verification email sent successfully');
      return { error: null };
    }
    console.error('No user logged in when trying to send verification email');
    return { error: 'No user logged in' };
  } catch (error: any) {
    console.error('sendVerificationEmail error:', error);
    return { error: error.code || error.message };
  }
};

export const verifyEmail = async (oobCode: string) => {
  try {
    await applyActionCode(auth, oobCode);
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

export const getAuthErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'E-post eller passord er feil';
    case 'auth/wrong-password':
      return 'E-post eller passord er feil';
    case 'auth/email-already-in-use':
      return 'Det finnes allerede en konto med denne e-postadressen';
    case 'auth/weak-password':
      return 'Passordet må være minst 6 tegn';
    case 'auth/invalid-email':
      return 'Ugyldig e-postadresse';
    case 'auth/too-many-requests':
      return 'For mange mislykkede forsøk. Prøv igjen senere';
    case 'auth/invalid-phone-number':
      return 'Ugyldig telefonnummer-format';
    case 'auth/missing-phone-number':
      return 'Telefonnummer er påkrevd';
    case 'auth/invalid-verification-code':
      return 'Ugyldig verifiseringskode';
    case 'auth/code-expired':
      return 'Verifiseringskoden har utløpt';
    case 'auth/missing-verification-code':
      return 'Verifiseringskode er påkrevd';
    case 'auth/expired-action-code':
      return 'Tilbakestillingslenken har utløpt. Be om en ny lenke.';
    case 'auth/invalid-action-code':
      return 'Ugyldig tilbakestillingslenke. Be om en ny lenke.';
    case 'auth/user-disabled':
      return 'Denne kontoen er deaktivert';
    case 'auth/weak-password':
      return 'Passordet er for svakt. Bruk minst 6 tegn.';
    case 'auth/invalid-credential':
      return 'E-post eller passord er feil';
    default:
      return 'En feil oppstod. Prøv igjen';
  }
};