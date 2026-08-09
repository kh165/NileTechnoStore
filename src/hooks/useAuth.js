import { useState, useEffect } from "react";
import { auth } from "../lib/firebase";
import { storage } from "../lib/storage";
import {
  getUserProfile,
  logoutUser,
  updateUserProfile,
  createUserProfile,
  checkGoogleRedirectResult,
  getUserCartFromFirestore,
  saveUserCartToFirestore,
  getUserWishlistFromFirestore,
  saveUserWishlistToFirestore
} from "../lib/firebaseService";
import { useCartStore } from "../store/useCartStore";
import { useWishlistStore } from "../store/useWishlistStore";

export function useAuth() {
  const [currentUser, setCurrentUser] = useState(() => storage.getCurrentUser());
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [unverifiedUser, setUnverifiedUser] = useState(null);

  const setCart = useCartStore((state) => state.setCart);
  const cart = useCartStore((state) => state.cart);
  const setWishlist = useWishlistStore((state) => state.setWishlist);
  const wishlist = useWishlistStore((state) => state.wishlist);

  useEffect(() => {
    checkGoogleRedirectResult()
      .then((profile) => {
        if (profile) {
          setCurrentUser(profile);
          storage.setCurrentUser(profile);
          storage.removeGoogleSignInInProgress();
        }
      })
      .catch((err) => {
        console.error("Google redirect result error:", err);
        storage.removeGoogleSignInInProgress();
      });
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const isGoogleUser = firebaseUser.providerData.some(p => p.providerId === "google.com");
          let profile = await getUserProfile(firebaseUser.uid);
          const isVerified = isGoogleUser || firebaseUser.emailVerified;

          if (!isVerified) {
            setCurrentUser(null);
            storage.removeCurrentUser();
            setUnverifiedUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: profile?.name || firebaseUser.displayName || firebaseUser.email.split("@")[0]
            });
            setIsAuthLoading(false);
            return;
          }

          setUnverifiedUser(null);
          if (profile) {
            setCurrentUser(profile);
            storage.setCurrentUser(profile);
          } else {
            const pending = storage.getPendingRegistrationProfile();
            const isGoogleProgress = storage.getGoogleSignInInProgress();
            const creationTime = firebaseUser.metadata.creationTime ? new Date(firebaseUser.metadata.creationTime).getTime() : Date.now();
            const isNewUser = (Date.now() - creationTime) < 120000;

            if (pending && pending.email === firebaseUser.email) {
              const fullProfile = { ...pending, uid: firebaseUser.uid };
              await createUserProfile(firebaseUser.uid, fullProfile);
              setCurrentUser(fullProfile);
              storage.setCurrentUser(fullProfile);
            } else if (isGoogleProgress || isNewUser) {
              const fallbackProfile = {
                uid: firebaseUser.uid,
                name: firebaseUser.displayName || firebaseUser.email.split("@")[0],
                email: firebaseUser.email,
                phone: firebaseUser.phoneNumber || "",
                address: "",
                points: 100,
                favoritesCount: 0,
                role: "user",
                createdAt: new Date().toISOString()
              };
              await createUserProfile(firebaseUser.uid, fallbackProfile);
              setCurrentUser(fallbackProfile);
              storage.setCurrentUser(fallbackProfile);
              storage.removeGoogleSignInInProgress();
            } else {
              await auth.signOut();
              setCurrentUser(null);
              storage.removeCurrentUser();
            }
          }
        } catch (err) {
          console.error("Error syncing profile with Firestore:", err);
        }
      } else {
        setCurrentUser(null);
        setUnverifiedUser(null);
        storage.removeCurrentUser();
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser?.uid) {
      getUserCartFromFirestore(currentUser.uid).then((remoteCart) => {
        if (remoteCart && remoteCart.length > 0) {
          setCart(remoteCart);
        }
      });
      getUserWishlistFromFirestore(currentUser.uid).then((remoteWishlist) => {
        if (remoteWishlist && remoteWishlist.length > 0) {
          setWishlist(remoteWishlist);
        }
      });
    }
  }, [currentUser?.uid]);

  useEffect(() => {
    if (currentUser?.uid) {
      saveUserCartToFirestore(currentUser.uid, cart);
    }
  }, [cart, currentUser?.uid]);

  useEffect(() => {
    if (currentUser?.uid) {
      saveUserWishlistToFirestore(currentUser.uid, wishlist);
    }
  }, [wishlist, currentUser?.uid]);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (e) {
      console.error("Firebase Signout failed", e);
    }
    storage.removeCurrentUser();
    storage.removePendingRegistrationProfile();
    storage.removeGoogleSignInInProgress();
    setCurrentUser(null);
  };

  const handleUpdateUser = async (updated) => {
    if (currentUser?.uid) {
      try {
        const newProfile = await updateUserProfile(currentUser.uid, updated);
        setCurrentUser(newProfile);
      } catch (e) {
        console.error("Failed to update profile:", e);
      }
    } else {
      setCurrentUser(updated);
    }
  };

  return {
    currentUser,
    setCurrentUser,
    isAuthLoading,
    unverifiedUser,
    setUnverifiedUser,
    handleLogout,
    handleUpdateUser
  };
}
