import { auth, db } from "./firebase";
import { storage } from "./storage";
import { emailApi } from "./emailApi";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  sendEmailVerification,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from "firebase/auth";
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  deleteDoc,
  onSnapshot,
  arrayUnion
} from "firebase/firestore";

// Default user role configuration

// --- Authentication Service ---

export const registerUser = async (email, password, name, phone = "", address = "") => {
  try {
    const tempProfile = {
      uid: "pending",
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      address: address.trim(),
      points: 100, // Welcome gift points
      favoritesCount: 0,
      role: "user",
      createdAt: new Date().toISOString()
    };
    storage.setPendingRegistrationProfile(tempProfile);

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    const profile = {
      ...tempProfile,
      uid: user.uid
    };

    // Save profile to Firestore
    await setDoc(doc(db, "users", user.uid), profile);

    // Send welcome email via Brevo SMTP Email Service
    emailApi.sendWelcomeEmail(email, name).catch(err => console.error("Welcome email error:", err));

    // Send verification email via Brevo SMTP Email Service
    emailApi.sendVerificationEmail(email, name).catch(err => console.error("Verification email error:", err));

    // Send standard native Firebase email verification link with a redirection back to our site
    try {
      const actionCodeSettings = {
        url: window.location.origin,
        handleCodeInApp: false
      };
      await sendEmailVerification(user, actionCodeSettings);
    } catch (e) {
      console.warn("Native Firebase verification link failed, relying on Brevo email:", e.message);
    }

    // Keep the user signed in, App.jsx will check if their email is verified and display the pending screen if not.
    storage.removePendingRegistrationProfile();
    return profile;
  } catch (error) {
    storage.removePendingRegistrationProfile();
    console.error("Firebase Registration Error:", error);
    throw new Error(getFriendlyErrorMessage(error.code) || error.message);
  }
};

export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Fetch profile
    let profile = await getUserProfile(user.uid);
    if (!profile) {
      // Create fallback profile if it doesn't exist
      profile = {
        uid: user.uid,
        name: email.split("@")[0],
        email: email.toLowerCase().trim(),
        phone: "",
        address: "",
        points: 0,
        favoritesCount: 0,
        role: "user",
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, "users", user.uid), profile);
    }

    if (profile && profile.blocked) {
      await signOut(auth);
      throw new Error("تم حظر هذا الحساب من قِبل إدارة المتجر.");
    }

    // Enforce native Firebase email verification status
    if (user && !user.emailVerified) {
      const error = new Error("auth/email-not-verified");
      error.code = "auth/email-not-verified";
      throw error;
    }

    // Trigger login security notification email asynchronously
    emailApi.sendLoginNotification(
      profile.email || email,
      profile.name || email.split("@")[0],
      { loginTime: new Date().toLocaleString("ar-EG", { dateStyle: "full", timeStyle: "medium" }) }
    ).catch(err => console.error("Login notification email error:", err));
    
    return profile;
  } catch (error) {
    console.error("Firebase Login Error:", error);
    throw new Error(getFriendlyErrorMessage(error.code) || error.message);
  }
};

export const loginWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    let result;
    try {
      result = await signInWithPopup(auth, provider);
    } catch (popupError) {
      if (popupError.code === "auth/popup-blocked" || popupError.code === "auth/operation-not-allowed") {
        console.warn("Popup blocked by browser, falling back to signInWithRedirect...");
        storage.setGoogleSignInInProgress(true);
        await signInWithRedirect(auth, provider);
        return null;
      }
      throw popupError;
    }

    if (!result || !result.user) return null;
    const user = result.user;

    let profile = await getUserProfile(user.uid);
    let isNewUser = false;

    if (!profile) {
      isNewUser = true;
      profile = {
        uid: user.uid,
        name: user.displayName || user.email.split("@")[0],
        email: user.email.toLowerCase().trim(),
        phone: user.phoneNumber || "",
        address: "",
        points: 100,
        favoritesCount: 0,
        role: "user",
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, "users", user.uid), profile);

      // Send welcome email for new Google registration
      emailApi.sendWelcomeEmail(profile.email, profile.name)
        .catch(err => console.error("[GOOGLE WELCOME EMAIL ERROR]:", err));
    }

    // Send login notification email for all successful Google logins
    emailApi.sendLoginNotification(
      profile.email,
      profile.name,
      { loginTime: new Date().toLocaleString("ar-EG", { dateStyle: "full", timeStyle: "medium" }) }
    ).catch(err => console.error("[GOOGLE LOGIN NOTIFICATION ERROR]:", err));

    return profile;
  } catch (error) {
    console.error("Firebase Google Login Error:", error);
    if (error.code === "auth/popup-closed-by-user" || error.code === "auth/cancelled-popup-request") {
      const cancelError = new Error("تم إلغاء عملية تسجيل الدخول بواسطة جوجل.");
      cancelError.code = error.code;
      cancelError.isCancelled = true;
      throw cancelError;
    }
    const friendlyMsg = getFriendlyErrorMessage(error.code) || error.message;
    const errObj = new Error(friendlyMsg);
    errObj.code = error.code;
    throw errObj;
  }
};

export const checkGoogleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result && result.user) {
      const user = result.user;
      let profile = await getUserProfile(user.uid);
      if (!profile) {
        profile = {
          uid: user.uid,
          name: user.displayName || user.email.split("@")[0],
          email: user.email.toLowerCase().trim(),
          phone: user.phoneNumber || "",
          address: "",
          points: 100,
          favoritesCount: 0,
          role: "user",
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, "users", user.uid), profile);

        emailApi.sendWelcomeEmail(profile.email, profile.name)
          .catch(err => console.error("[GOOGLE REDIRECT WELCOME EMAIL ERROR]:", err));
      }

      emailApi.sendLoginNotification(
        profile.email,
        profile.name,
        { loginTime: new Date().toLocaleString("ar-EG", { dateStyle: "full", timeStyle: "medium" }) }
      ).catch(err => console.error("[GOOGLE REDIRECT LOGIN NOTIFICATION ERROR]:", err));

      return profile;
    }
    return null;
  } catch (error) {
    console.error("Error checking Google redirect result:", error);
    return null;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Firebase Signout Error:", error);
    throw error;
  }
};

export const resetPassword = async (email) => {
  try {
    const cleanEmail = email.toLowerCase().trim();
    const userName = cleanEmail.split("@")[0];

    // 1. Send password reset email via Brevo SMTP backend
    emailApi.sendPasswordResetEmail(cleanEmail, userName).catch(err => {
      console.error("[BREVO RESET EMAIL ERROR]:", err.message);
    });

    // 2. Also trigger native Firebase password reset as backup
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
    } catch (firebaseErr) {
      console.warn("Native Firebase password reset error (relying on Brevo):", firebaseErr.message);
    }

    return true;
  } catch (error) {
    console.error("Firebase Password Reset Error:", error);
    throw new Error(getFriendlyErrorMessage(error.code) || error.message);
  }
};

export const updateUserPassword = async (currentPassword, newPassword) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("لم يتم العثور على حساب مسجل الدخول حالياً.");
    }

    if (!user.email) {
      throw new Error("لا يوجد بريد إلكتروني مرتبط بهذا الحساب.");
    }

    // Check if user is signed in via Google provider
    const isGoogleUser = user.providerData && user.providerData.some(p => p.providerId === "google.com");
    if (isGoogleUser) {
      throw new Error("حسابك مسجل باستخدام Google ولا يتطلب كلمة مرور مباشرة.");
    }

    // Re-authenticate with current password first
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    // Update to new password
    await updatePassword(user, newPassword);
    return true;
  } catch (error) {
    console.error("Firebase Update Password Error:", error);
    if (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password") {
      throw new Error("كلمة المرور الحالية غير صحيحة.");
    }
    throw new Error(getFriendlyErrorMessage(error.code) || error.message);
  }
};

// --- Profile & Database Services ---

export const getUserProfile = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    return userDoc.exists() ? userDoc.data() : null;
  } catch (error) {
    console.error("Get User Profile Error:", error);
    return null;
  }
};

export const updateUserProfile = async (uid, updatedData) => {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, updatedData);
    return await getUserProfile(uid);
  } catch (error) {
    console.error("Update User Profile Error:", error);
    throw error;
  }
};

export const createUserProfile = async (uid, profileData) => {
  try {
    const userRef = doc(db, "users", uid);
    await setDoc(userRef, profileData);
    return profileData;
  } catch (error) {
    console.error("Create User Profile Error:", error);
    throw error;
  }
};

// --- Orders Services ---

export const createOrderInFirestore = async (orderData) => {
  try {
    const ordersCollection = collection(db, "orders");
    const newDocRef = doc(ordersCollection);
    const docId = newDocRef.id;
    const timestampDigits = Date.now().toString().slice(-6);
    const randomDigits = String(Math.floor(1000 + Math.random() * 9000));
    const orderNumber = `${timestampDigits}${randomDigits}`;
    
    const finalOrder = {
      ...orderData,
      id: docId,
      orderNumber,
      status: "PENDING",
      createdAt: new Date().toISOString(),
      date: new Date().toLocaleDateString("ar-EG")
    };

    await setDoc(newDocRef, finalOrder);

    // Trigger initial Order Created notification email
    const recipientEmail = finalOrder.customerEmail || finalOrder.email || finalOrder.userEmail || finalOrder.shippingDetails?.email;
    if (recipientEmail) {
      emailApi.sendOrderStatusEmail(finalOrder, "PENDING", recipientEmail, finalOrder.customerName || finalOrder.name)
        .catch(err => console.error("[NEW ORDER EMAIL TRIGGER ERROR]:", err));
    }

    return finalOrder;
  } catch (error) {
    console.error("Create Order FireStore Error:", error);
    throw error;
  }
};

export const getUserOrdersFromFirestore = async (userId) => {
  try {
    const ordersCollection = collection(db, "orders");
    const q = query(
      ordersCollection, 
      where("userId", "==", userId)
    );
    const querySnapshot = await getDocs(q);
    const orders = [];
    querySnapshot.forEach((doc) => {
      orders.push(doc.data());
    });
    // Sort in-memory because composite index might not be created yet
    return orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (error) {
    console.error("Get User Orders Firestore Error:", error);
    return [];
  }
};

export const getAllOrdersFromFirestore = async () => {
  try {
    const ordersCollection = collection(db, "orders");
    const querySnapshot = await getDocs(ordersCollection);
    const orders = [];
    querySnapshot.forEach((doc) => {
      orders.push(doc.data());
    });
    return orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (error) {
    console.error("Get All Orders Firestore Error:", error);
    return [];
  }
};

export const listenToOrdersFromFirestore = (callback) => {
  try {
    const ordersCollection = collection(db, "orders");
    return onSnapshot(ordersCollection, (querySnapshot) => {
      const orders = [];
      querySnapshot.forEach((doc) => {
        orders.push(doc.data());
      });
      const sorted = orders.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      callback(sorted);
    }, (error) => {
      console.error("Error listening to orders snapshot:", error);
    });
  } catch (error) {
    console.error("Failed to setup orders snapshot listener:", error);
    return () => {};
  }
};

export const updateOrderStatusInFirestore = async (orderId, newStatus, actorName = "مدير النظام", cancelReason = "", fullOrderData = null) => {
  try {
    let orderData = fullOrderData;
    let orderRef = doc(db, "orders", orderId);

    if (!orderData || (!orderData.customerEmail && !orderData.email && !orderData.userEmail)) {
      try {
        const snap = await getDoc(orderRef);
        if (snap.exists()) {
          orderData = { id: snap.id, ...snap.data(), ...(orderData || {}) };
        } else {
          const q = query(collection(db, "orders"), where("orderNumber", "==", orderId));
          const qSnap = await getDocs(q);
          if (!qSnap.empty) {
            const firstDoc = qSnap.docs[0];
            orderRef = firstDoc.ref;
            orderData = { id: firstDoc.id, ...firstDoc.data(), ...(orderData || {}) };
          }
        }
      } catch (e) {
        console.warn("[FETCH ORDER DATA WARN]:", e);
      }
    }

    let recipientEmail = orderData?.customerEmail || orderData?.email || orderData?.userEmail || orderData?.shippingDetails?.email;
    let recipientName = orderData?.customerName || orderData?.name || orderData?.shippingDetails?.name || "العميل";

    if (!recipientEmail && orderData?.userId) {
      try {
        const uProfile = await getUserProfile(orderData.userId);
        if (uProfile && uProfile.email) {
          recipientEmail = uProfile.email;
          if (!recipientName || recipientName === "العميل") {
            recipientName = uProfile.name || uProfile.displayName || uProfile.customerName || "العميل";
          }
        }
      } catch (uErr) {
        console.warn("[USER EMAIL LOOKUP FOR ORDER STATUS WARN]:", uErr);
      }
    }

    const res = await emailApi.updateOrderStatus(orderId, newStatus, cancelReason, {
      ...orderData,
      customerEmail: recipientEmail,
      customerName: recipientName
    });

    const getStatusLabel = (st) => {
      switch (String(st).toUpperCase()) {
        case "PENDING": return "قيد المراجعة";
        case "PREPARING": return "جاري التجهيز";
        case "SHIPPED": return "جاري الشحن";
        case "DELIVERED": return "تم الاستلام";
        case "COMPLETED": return "مكتمل";
        case "CANCELED": return "ملغي";
        default: return st;
      }
    };

    const logEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      action: `تغيير حالة الطلب إلى: ${getStatusLabel(newStatus)}`,
      actor: actorName,
      type: "STATUS_CHANGE",
      newStatus
    };

    try {
      await updateDoc(orderRef, { 
        status: newStatus,
        ...(cancelReason ? { cancelReason } : {}),
        history: arrayUnion(logEntry)
      });
    } catch (docErr) {
      console.warn("[UPDATE STATUS HISTORY WARN]:", docErr.message);
      try {
        await updateDoc(orderRef, { 
          status: newStatus,
          ...(cancelReason ? { cancelReason } : {})
        });
      } catch (e2) {
        console.error("Client updateDoc error:", e2);
      }
    }

    if (recipientEmail) {
      emailApi.sendOrderStatusEmail(
        orderData || { id: orderId, orderNumber: orderId, status: newStatus },
        newStatus,
        recipientEmail,
        recipientName
      ).then(emailRes => {
        console.log("[STATUS EMAIL DISPATCH SUCCESS]:", emailRes);
      }).catch(e => {
        console.error("[STATUS EMAIL DISPATCH ERROR]:", e);
      });
    }

    return true;
  } catch (error) {
    console.error("Update Order Status error:", error);
    return false;
  }
};

export const updateOrderInternalNoteInFirestore = async (orderId, internalNote, actorName = "مدير النظام") => {
  try {
    const orderRef = doc(db, "orders", orderId);

    const logEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      action: internalNote ? `تحديث الملاحظة الإدارية: "${internalNote}"` : "مسح الملاحظة الإدارية",
      actor: actorName,
      type: "NOTE_UPDATE"
    };

    await updateDoc(orderRef, { 
      internalNote,
      history: arrayUnion(logEntry)
    });
    return true;
  } catch (error) {
    console.error("Update Order Internal Note Firestore error:", error);
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, { internalNote });
      return true;
    } catch (e) {
      return false;
    }
  }
};

export const deleteOrderFromFirestore = async (orderId) => {
  try {
    const orderRef = doc(db, "orders", orderId);
    await deleteDoc(orderRef);
    return true;
  } catch (error) {
    console.error("Delete Order Firestore error:", error);
    return false;
  }
};

// Friendly Error Messages in Arabic
function getFriendlyErrorMessage(code) {
  switch (code) {
    case "auth/email-already-in-use":
      return "هذا البريد الإلكتروني مسجل بالفعل. يرجى استخدام بريد إلكتروني آخر أو تسجيل الدخول.";
    case "auth/invalid-email":
      return "البريد الإلكتروني المدخل غير صالح.";
    case "auth/operation-not-allowed":
      return "عذراً، طريقة تسجيل الدخول هذه غير متوفرة حالياً. يرجى التواصل مع الدعم الفني.";
    case "auth/weak-password":
      return "كلمة المرور ضعيفة جداً. يجب أن تتكون من 6 أحرف على الأقل.";
    case "auth/user-disabled":
      return "تم تعطيل هذا الحساب من قبل إدارة المتجر.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "البريد الإلكتروني أو كلمة المرور غير صحيحة، يرجى التحقق وإعادة المحاولة.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "تم إلغاء عملية تسجيل الدخول بواسطة جوجل.";
    case "auth/popup-blocked":
      return "تم حظر النافذة المنبثقة من قِبل المتصفح. جاري تحويلك لصفحة تسجيل الدخول...";
    case "auth/unauthorized-domain":
      return "عذراً، تسجيل الدخول غير متاح من هذا النطاق حالياً.";
    case "auth/email-not-verified":
      return "بريدك الإلكتروني غير مفعّل بعد. لقد أرسلنا رابط تفعيل إلى بريدك الإلكتروني. يرجى الضغط عليه لتفعيل حسابك.";
    default:
      return "عذراً، حدث خطأ غير متوقع أثناء معالجة طلبك. يرجى المحاولة مرة أخرى لاحقاً.";
  }
}

export const checkEmailExists = async (email) => {
  try {
    const q = query(collection(db, "users"), where("email", "==", email.toLowerCase().trim()));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error("Error checking email existence:", error);
    return false;
  }
};

export const resendVerificationLink = async (email, password) => {
  try {
    let user = auth.currentUser;
    if (!user && email && password) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        user = userCredential.user;
      } catch (loginErr) {
        console.warn("Could not sign in to resend verification:", loginErr.message);
      }
    }
    
    const targetEmail = user?.email || email;
    const targetName = user?.displayName || (targetEmail ? targetEmail.split("@")[0] : "العميل");

    if (targetEmail) {
      // 1. Send verification email via Brevo SMTP
      emailApi.sendVerificationEmail(targetEmail, targetName).catch(err => {
        console.error("[BREVO VERIFICATION RESEND ERROR]:", err.message);
      });

      // 2. Try native Firebase verification if user available
      if (user) {
        try {
          const actionCodeSettings = {
            url: window.location.origin,
            handleCodeInApp: false
          };
          await sendEmailVerification(user, actionCodeSettings);
        } catch (nativeErr) {
          console.warn("Native Firebase resend verification failed:", nativeErr.message);
        }
      }

      return true;
    }

    throw new Error("لم يتم العثور على بريد إلكتروني لإعادة إرسال التفعيل.");
  } catch (error) {
    console.error("Error resending verification email:", error);
    throw new Error(getFriendlyErrorMessage(error.code) || error.message);
  }
};

export const getAllUsersFromFirestore = async () => {
  try {
    const usersCollection = collection(db, "users");
    const querySnapshot = await getDocs(usersCollection);
    const usersList = [];
    querySnapshot.forEach((doc) => {
      usersList.push({ id: doc.id, ...doc.data() });
    });
    return usersList;
  } catch (error) {
    console.error("Error getting all users from firestore:", error);
    throw error;
  }
};

export const updateUserRoleInFirestore = async (userId, newRole) => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { role: newRole });
    return true;
  } catch (error) {
    console.error("Error updating user role:", error);
    throw error;
  }
};

export const getFeaturedProductsFromFirestore = async () => {
  try {
    const configRef = doc(db, "config", "featured_products");
    const docSnap = await getDoc(configRef);
    if (docSnap.exists()) {
      return docSnap.data().productIds || [];
    }
    return [];
  } catch (error) {
    console.error("Error getting featured products from firestore:", error);
    return [];
  }
};

export const saveFeaturedProductsToFirestore = async (productIds) => {
  try {
    const configRef = doc(db, "config", "featured_products");
    await setDoc(configRef, { productIds: productIds || [] });
    return true;
  } catch (error) {
    console.error("Error saving featured products to firestore:", error);
    throw error;
  }
};

export const listenToFeaturedProductsFromFirestore = (callback) => {
  const configRef = doc(db, "config", "featured_products");
  return onSnapshot(configRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data().productIds || []);
    } else {
      callback([]);
    }
  }, (error) => {
    console.error("Error listening to featured products:", error);
  });
};

// --- Reviews Services in Firestore ---

export const getReviewsFromFirestore = async (productId = null, includeAll = false) => {
  try {
    const reviewsRef = collection(db, "reviews");
    let snapshot;
    if (includeAll) {
      // Admin: get all reviews
      snapshot = await getDocs(reviewsRef);
    } else {
      // Public: get approved reviews
      const q = query(reviewsRef, where("approved", "==", true));
      snapshot = await getDocs(q);
    }
    const reviews = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (!productId || String(data.productId) === String(productId)) {
        reviews.push({ id: docSnap.id, ...data });
      }
    });
    return reviews.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  } catch (error) {
    console.error("Error getting reviews from Firestore:", error);
    return [];
  }
};

export const createReviewInFirestore = async (reviewData) => {
  try {
    const key = `${reviewData.orderId || "gen"}-${reviewData.productId}-${Date.now()}`;
    const newReview = {
      id: key,
      productId: String(reviewData.productId),
      orderId: reviewData.orderId || null,
      rating: Number(reviewData.rating),
      comment: reviewData.comment || "",
      customerName: reviewData.customerName || "عميل مميز",
      date: new Date().toISOString().split("T")[0],
      approved: false, // Pending admin approval
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, "reviews", key), newReview);
    return newReview;
  } catch (error) {
    console.error("Error creating review in Firestore:", error);
    throw error;
  }
};

export const approveReviewInFirestore = async (reviewId) => {
  try {
    const reviewRef = doc(db, "reviews", reviewId);
    await updateDoc(reviewRef, { approved: true });
    return true;
  } catch (error) {
    console.error("Error approving review in Firestore:", error);
    throw error;
  }
};

export const deleteReviewFromFirestore = async (reviewId) => {
  try {
    const reviewRef = doc(db, "reviews", reviewId);
    await deleteDoc(reviewRef);
    return true;
  } catch (error) {
    console.error("Error deleting review from Firestore:", error);
    throw error;
  }
};

// --- Discounts & Promotional Offers in Firestore ---

export const getDiscountsFromFirestore = async () => {
  try {
    const configRef = doc(db, "config", "product_discounts");
    const docSnap = await getDoc(configRef);
    if (docSnap.exists()) {
      return docSnap.data().discountsMap || {};
    }
    return {};
  } catch (error) {
    console.error("Error getting discounts from firestore:", error);
    return {};
  }
};

// --- Promo Coupons & Voucher Codes in Firestore ---

export const getCouponsFromFirestore = async () => {
  try {
    const configRef = doc(db, "config", "promo_coupons");
    const docSnap = await getDoc(configRef);
    if (docSnap.exists()) {
      return docSnap.data().coupons || [];
    }
    return [];
  } catch (error) {
    console.error("Error getting coupons from firestore:", error);
    return [];
  }
};

export const saveCouponsToFirestore = async (couponsList) => {
  try {
    const configRef = doc(db, "config", "promo_coupons");
    await setDoc(configRef, { coupons: couponsList || [], updatedAt: new Date().toISOString() });
    return true;
  } catch (error) {
    console.error("Error saving coupons to firestore:", error);
    throw error;
  }
};

// --- Shipping Rates & Governorates Management in Firestore ---

export const EGYPT_GOVERNORATES_DEFAULT = [
  { id: "cairo", name: "القاهرة", price: 50, active: true },
  { id: "giza", name: "الجيزة", price: 50, active: true },
  { id: "alexandria", name: "الإسكندرية", price: 60, active: true },
  { id: "qalyubia", name: "القليوبية", price: 55, active: true },
  { id: "sharqia", name: "الشرقية", price: 65, active: true },
  { id: "dakahlia", name: "الدقهلية", price: 65, active: true },
  { id: "gharbia", name: "الغربية", price: 65, active: true },
  { id: "monufia", name: "المنوفية", price: 60, active: true },
  { id: "beheira", name: "البحيرة", price: 65, active: true },
  { id: "kafr_elsheikh", name: "كفر الشيخ", price: 70, active: true },
  { id: "damietta", name: "دمياط", price: 70, active: true },
  { id: "port_said", name: "بورسعيد", price: 70, active: true },
  { id: "ismailia", name: "الإسماعيلية", price: 70, active: true },
  { id: "suez", name: "السويس", price: 70, active: true },
  { id: "fayoum", name: "الفيوم", price: 75, active: true },
  { id: "beni_suef", name: "بني سويف", price: 75, active: true },
  { id: "minya", name: "المنيا", price: 85, active: true },
  { id: "assiut", name: "أسيوط", price: 90, active: true },
  { id: "sohag", name: "سوهاج", price: 95, active: true },
  { id: "qena", name: "قنا", price: 100, active: true },
  { id: "luxor", name: "الأقصر", price: 105, active: true },
  { id: "aswan", name: "أسوان", price: 110, active: true },
  { id: "red_sea", name: "البحر الأحمر (الغردقة)", price: 120, active: true },
  { id: "matrouh", name: "مطروح والساحل الشمالي", price: 100, active: true },
  { id: "south_sinai", name: "جنوب سيناء (شرم الشيخ)", price: 120, active: true },
  { id: "north_sinai", name: "شمال سيناء", price: 120, active: true },
  { id: "new_valley", name: "الوادي الجديد", price: 130, active: true }
];

export const getShippingRatesFromFirestore = async () => {
  try {
    const configRef = doc(db, "config", "shipping_rates");
    const docSnap = await getDoc(configRef);
    if (docSnap.exists()) {
      return {
        zones: docSnap.data().zones || EGYPT_GOVERNORATES_DEFAULT,
        freeShippingMin: docSnap.data().freeShippingMin || 0
      };
    }
    return { zones: EGYPT_GOVERNORATES_DEFAULT, freeShippingMin: 0 };
  } catch (error) {
    console.error("Error getting shipping rates from firestore:", error);
    return { zones: EGYPT_GOVERNORATES_DEFAULT, freeShippingMin: 0 };
  }
};

export const saveShippingRatesToFirestore = async (zones, freeShippingMin = 0) => {
  try {
    const configRef = doc(db, "config", "shipping_rates");
    await setDoc(configRef, { 
      zones: zones || EGYPT_GOVERNORATES_DEFAULT, 
      freeShippingMin: Number(freeShippingMin) || 0,
      updatedAt: new Date().toISOString() 
    });
    return true;
  } catch (error) {
    console.error("Error saving shipping rates to firestore:", error);
    throw error;
  }
};

export const toggleBlockUserInFirestore = async (userId, isBlocked) => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { blocked: isBlocked, blockedAt: isBlocked ? new Date().toISOString() : null });
    return true;
  } catch (error) {
    console.error("Error toggling block status for user:", error);
    throw error;
  }
};

export const deleteUserFromFirestore = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    await deleteDoc(userRef);
    return true;
  } catch (error) {
    console.error("Error deleting user profile from firestore:", error);
    throw error;
  }
};

// --- Cart Persistence in Firestore ---

export const saveUserCartToFirestore = async (userId, cartItems) => {
  if (!userId) return;
  try {
    const cartRef = doc(db, "user_carts", userId);
    if (!cartItems || cartItems.length === 0) {
      await deleteDoc(cartRef).catch(() => {});
    } else {
      await setDoc(cartRef, {
        items: cartItems,
        updatedAt: new Date().toISOString()
      });
    }
    return true;
  } catch (error) {
    console.error("Error saving user cart to Firestore:", error);
    return false;
  }
};

export const getUserCartFromFirestore = async (userId) => {
  if (!userId) return [];
  try {
    const cartRef = doc(db, "user_carts", userId);
    const docSnap = await getDoc(cartRef);
    if (docSnap.exists()) {
      return docSnap.data().items || [];
    }
    return [];
  } catch (error) {
    console.error("Error getting user cart from Firestore:", error);
    return [];
  }
};

// --- Abandoned Carts Management ---

export const saveAbandonedCartToFirestore = async (cartData) => {
  if (!cartData || !cartData.items || cartData.items.length === 0) return null;
  try {
    const cartId = cartData.id || cartData.phone || cartData.userId || `cart_${Date.now()}`;
    const cartRef = doc(db, "abandoned_carts", cartId);
    
    // Total calculation
    const total = cartData.total || cartData.items.reduce((sum, item) => sum + ((parseFloat(item.price) || 0) * (item.quantity || 1)), 0);

    const payload = {
      id: cartId,
      customerName: cartData.customerName || cartData.name || "زائر المتجر",
      customerPhone: cartData.customerPhone || cartData.phone || "",
      customerEmail: cartData.customerEmail || cartData.email || "",
      governorate: cartData.governorate || "غير حدد",
      items: cartData.items,
      total,
      updatedAt: new Date().toISOString(),
      status: "abandoned"
    };

    await setDoc(cartRef, payload, { merge: true });
    return cartId;
  } catch (error) {
    console.error("Error saving abandoned cart to Firestore:", error);
    return null;
  }
};

export const listenToAbandonedCartsFromFirestore = (callback) => {
  try {
    const q = query(collection(db, "abandoned_carts"));
    return onSnapshot(q, (snapshot) => {
      const carts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const sorted = carts.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
      callback(sorted);
    }, (error) => {
      console.error("Error listening to abandoned carts snapshot:", error);
      callback([]);
    });
  } catch (err) {
    console.error("Failed to setup abandoned carts listener:", err);
    return () => {};
  }
};

export const deleteAbandonedCartFromFirestore = async (cartId) => {
  if (!cartId) return false;
  try {
    const cartRef = doc(db, "abandoned_carts", cartId);
    await deleteDoc(cartRef);
    return true;
  } catch (err) {
    console.error("Error deleting abandoned cart:", err);
    return false;
  }
};

// --- Wishlist Persistence in Firestore ---

export const saveUserWishlistToFirestore = async (userId, wishlistItems) => {
  if (!userId) return;
  try {
    const wishlistRef = doc(db, "user_wishlists", userId);
    if (!wishlistItems || wishlistItems.length === 0) {
      await deleteDoc(wishlistRef).catch(() => {});
    } else {
      await setDoc(wishlistRef, {
        items: wishlistItems,
        updatedAt: new Date().toISOString()
      });
    }
    return true;
  } catch (error) {
    console.error("Error saving user wishlist to Firestore:", error);
    return false;
  }
};

export const getUserWishlistFromFirestore = async (userId) => {
  if (!userId) return [];
  try {
    const wishlistRef = doc(db, "user_wishlists", userId);
    const docSnap = await getDoc(wishlistRef);
    if (docSnap.exists()) {
      return docSnap.data().items || [];
    }
    return [];
  } catch (error) {
    console.error("Error getting user wishlist from Firestore:", error);
    return [];
  }
};

// --- Activity Logs Persistence in Firestore ---

export const saveActivityLogToFirestore = async (logEntry) => {
  try {
    const logsRef = collection(db, "activity_logs");
    await addDoc(logsRef, {
      ...logEntry,
      createdAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error("Error saving activity log to Firestore:", error);
    return false;
  }
};

export const getActivityLogsFromFirestore = async () => {
  try {
    const logsRef = collection(db, "activity_logs");
    const q = query(logsRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const logs = [];
    snapshot.forEach((docSnap) => {
      logs.push({ id: docSnap.id, ...docSnap.data() });
    });
    return logs;
  } catch (error) {
    console.error("Error getting activity logs from Firestore:", error);
    return [];
  }
};

export const listenToActivityLogsFromFirestore = (callback) => {
  try {
    const logsRef = collection(db, "activity_logs");
    const q = query(logsRef, orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      const logs = [];
      snapshot.forEach((docSnap) => {
        logs.push({ id: docSnap.id, ...docSnap.data() });
      });
      callback(logs);
    }, (error) => {
      console.error("Error listening to activity logs:", error);
      callback([]);
    });
  } catch (e) {
    console.error("Failed to setup activity log snapshot listener:", e);
    return () => {};
  }
};

export const clearActivityLogsFromFirestore = async () => {
  try {
    const logsRef = collection(db, "activity_logs");
    const snapshot = await getDocs(logsRef);
    const deletePromises = [];
    snapshot.forEach((docSnap) => {
      deletePromises.push(deleteDoc(doc(db, "activity_logs", docSnap.id)));
    });
    await Promise.all(deletePromises);
    return true;
  } catch (error) {
    console.error("Error clearing activity logs in Firestore:", error);
    return false;
  }
};

// --- Store Search & Product Views Analytics ---

export const trackSearchQueryInFirestore = async (term) => {
  if (!term || !term.trim()) return;
  const cleanTerm = term.trim().toLowerCase();

  // Firestore update
  try {
    const analyticsDocRef = doc(db, "analytics", "searches");
    const docSnap = await getDoc(analyticsDocRef);
    if (docSnap.exists()) {
      const current = docSnap.data().data || {};
      current[cleanTerm] = (current[cleanTerm] || 0) + 1;
      await setDoc(analyticsDocRef, { data: current, updatedAt: new Date().toISOString() });
    } else {
      await setDoc(analyticsDocRef, { data: { [cleanTerm]: 1 }, updatedAt: new Date().toISOString() });
    }
  } catch (error) {
    console.warn("Firestore search analytics tracking warning:", error);
  }
};

export const trackProductViewInFirestore = async (productId) => {
  if (!productId) return;
  const pidStr = String(productId);

  // Firestore update
  try {
    const viewsDocRef = doc(db, "analytics", "product_views");
    const docSnap = await getDoc(viewsDocRef);
    if (docSnap.exists()) {
      const current = docSnap.data().data || {};
      current[pidStr] = (current[pidStr] || 0) + 1;
      await setDoc(viewsDocRef, { data: current, updatedAt: new Date().toISOString() });
    } else {
      await setDoc(viewsDocRef, { data: { [pidStr]: 1 }, updatedAt: new Date().toISOString() });
    }
  } catch (error) {
    console.warn("Firestore views analytics tracking warning:", error);
  }
};

export const getAnalyticsFromFirestore = async () => {
  let searches = {};
  let productViews = {};

  // Direct Firestore fetch
  try {
    const searchSnap = await getDoc(doc(db, "analytics", "searches"));
    if (searchSnap.exists()) {
      searches = searchSnap.data().data || {};
    }

    const viewsSnap = await getDoc(doc(db, "analytics", "product_views"));
    if (viewsSnap.exists()) {
      productViews = viewsSnap.data().data || {};
    }
  } catch (error) {
    console.warn("Error fetching analytics from Firestore:", error);
  }

  return { searches, productViews };
};





