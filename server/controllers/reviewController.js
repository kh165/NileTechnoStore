import fs from "fs";
import path from "path";
import { getDbAdmin } from "../config/firebaseAdmin.js";

const REVIEWS_FILE = path.join(process.cwd(), "reviews.json");

function getLocalReviews() {
  try {
    if (fs.existsSync(REVIEWS_FILE)) {
      const data = fs.readFileSync(REVIEWS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error reading reviews.json:", error);
  }
  const defaultReviews = [];
  try {
    fs.writeFileSync(REVIEWS_FILE, JSON.stringify(defaultReviews, null, 2), "utf-8");
  } catch (err) {
    console.error("Error seeding reviews:", err);
  }
  return defaultReviews;
}

function saveLocalReviews(reviews) {
  try {
    fs.writeFileSync(REVIEWS_FILE, JSON.stringify(reviews, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing reviews.json:", error);
  }
}

export async function getReviewsFromDb() {
  const db = getDbAdmin();
  if (db) {
    try {
      const snapshot = await db.collection("reviews").get();
      const reviewsList = [];
      snapshot.forEach(docSnap => {
        reviewsList.push({ id: docSnap.id, ...docSnap.data() });
      });
      return reviewsList;
    } catch (err) {
      console.error("Firebase Admin: Error fetching reviews from Firestore:", err);
    }
  }
  return getLocalReviews();
}

export async function saveReviewToDb(review) {
  const db = getDbAdmin();
  if (db) {
    try {
      await db.collection("reviews").doc(review.id).set(review);
    } catch (err) {
      console.error("Firebase Admin: Error saving review to Firestore:", err);
    }
  }
  const reviews = getLocalReviews();
  const existingIndex = reviews.findIndex(r => r.id === review.id);
  if (existingIndex !== -1) {
    reviews[existingIndex] = review;
  } else {
    reviews.push(review);
  }
  saveLocalReviews(reviews);
}

export async function approveReviewInDb(id) {
  const db = getDbAdmin();
  if (db) {
    try {
      await db.collection("reviews").doc(id).update({ approved: true });
      return true;
    } catch (err) {
      console.error("Firebase Admin: Error approving review in Firestore:", err);
    }
  }
  const reviews = getLocalReviews();
  const index = reviews.findIndex(r => String(r.id) === String(id));
  if (index !== -1) {
    reviews[index].approved = true;
    saveLocalReviews(reviews);
    return true;
  }
  return false;
}

export async function deleteReviewFromDb(id) {
  const db = getDbAdmin();
  if (db) {
    try {
      await db.collection("reviews").doc(id).delete();
      return true;
    } catch (err) {
      console.error("Firebase Admin: Error deleting review from Firestore:", err);
    }
  }
  const reviews = getLocalReviews();
  const filtered = reviews.filter(r => String(r.id) !== String(id));
  if (reviews.length === filtered.length) {
    return false;
  }
  saveLocalReviews(filtered);
  return true;
}

export async function getCustomReviews(req, res) {
  try {
    const { productId, all } = req.query;
    const reviews = await getReviewsFromDb();

    if (all === "true") {
      if (productId) {
        return res.json(reviews.filter(r => String(r.productId) === String(productId)));
      }
      return res.json(reviews);
    }

    const approvedReviews = reviews.filter(r => r.approved !== false);
    if (productId) {
      return res.json(approvedReviews.filter(r => String(r.productId) === String(productId)));
    }
    res.json(approvedReviews);
  } catch (err) {
    console.error("Error in getCustomReviews:", err);
    res.status(500).json({ error: "خطأ في جلب التقييمات" });
  }
}

export async function createCustomReview(req, res) {
  try {
    const { productId, orderId, rating, comment, customerName } = req.body;
    if (!productId || !rating) {
      return res.status(400).json({ error: "productId و rating مطلوبان" });
    }

    const reviews = await getReviewsFromDb();
    const key = `${orderId || "gen"}-${productId}`;
    const existingIndex = reviews.findIndex(r => r.id === key || (orderId && r.orderId === orderId && r.productId === productId));
    const newId = existingIndex !== -1 ? reviews[existingIndex].id : `${key}-${Date.now()}`;

    const newReview = {
      id: newId,
      productId: String(productId),
      orderId: orderId || null,
      rating: Number(rating),
      comment: comment || "",
      customerName: customerName || "عميل مميز",
      date: new Date().toISOString().split("T")[0],
      approved: false
    };

    await saveReviewToDb(newReview);
    res.json({ success: true, review: newReview });
  } catch (err) {
    console.error("Error in createCustomReview:", err);
    res.status(500).json({ error: "خطأ في حفظ التقييم" });
  }
}

export async function approveCustomReview(req, res) {
  try {
    const { id } = req.params;
    const success = await approveReviewInDb(id);
    if (!success) {
      return res.status(404).json({ error: "التقييم المطلوب غير موجود" });
    }
    res.json({ success: true });
  } catch (err) {
    console.error("Error in approveCustomReview:", err);
    res.status(500).json({ error: "خطأ في اعتماد التقييم" });
  }
}

export async function deleteCustomReview(req, res) {
  try {
    const { id } = req.params;
    const success = await deleteReviewFromDb(id);
    if (!success) {
      return res.status(404).json({ error: "التقييم المطلوب غير موجود" });
    }
    res.json({ success: true });
  } catch (err) {
    console.error("Error in deleteCustomReview:", err);
    res.status(500).json({ error: "خطأ في حذف التقييم" });
  }
}
