import { collection, addDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Review } from '../types/review';

// Agregar una nueva review
export async function addReview(reviewData: Omit<Review, 'id' | 'createdAt' | 'helpful'>) {
  try {
    const newReview = {
      ...reviewData,
      createdAt: new Date().toISOString(),
      helpful: 0
    };
    
    const docRef = await addDoc(collection(db, 'reviews'), newReview);
    return { id: docRef.id, ...newReview };
  } catch (error) {
    console.error("Error agregando review:", error);
    throw error;
  }
}

// Obtener reviews de un negocio específico
export async function getReviewsByBusiness(businessId: string): Promise<Review[]> {
  try {
    const q = query(
      collection(db, 'reviews'),
      where('businessId', '==', businessId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Review));
  } catch (error) {
    console.error("Error obteniendo reviews:", error);
    throw error;
  }
}

// Calcular promedio de rating
export function calculateAverageRating(reviews: Review[]): number {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}
