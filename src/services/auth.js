import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth } from './firebase';

export const loginAdmin = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Check if the logged-in user is an admin
    if (userCredential.user.email === 'scam6390@gmail.com') {
      return { success: true, user: userCredential.user };
    } else {
      // If not the specific admin, sign them out
      await signOut(auth);
      return { success: false, error: 'Access denied. Admin privileges required.' };
    }
  } catch (error) {
    console.error('Login error:', error);
    let errorMessage = 'Login failed. Please check your credentials.';
    
    switch (error.code) {
      case 'auth/invalid-email':
        errorMessage = 'Invalid email address.';
        break;
      case 'auth/user-disabled':
        errorMessage = 'This account has been disabled.';
        break;
      case 'auth/user-not-found':
        errorMessage = 'No account found with this email.';
        break;
      case 'auth/wrong-password':
        errorMessage = 'Incorrect password.';
        break;
      default:
        errorMessage = error.message;
    }
    
    return { success: false, error: errorMessage };
  }
};

export const logoutAdmin = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: error.message };
  }
};

export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, (user) => {
    // Only consider user authenticated if it's the specific admin
    if (user && user.email === 'scam6390@gmail.com') {
      callback(user);
    } else {
      callback(null);
    }
  });
};

export const getCurrentUser = () => {
  const user = auth.currentUser;
  // Only return user if it's the specific admin
  if (user && user.email === 'scam6390@gmail.com') {
    return user;
  }
  return null;
};
