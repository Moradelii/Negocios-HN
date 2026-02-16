import React, { useEffect, useState } from 'react';
import { getReviewsByBusiness, calculateAverageRating } from '../services/reviewService';
import { Review } from '../types/review';

interface ReviewListProps {
  businessId: string;
  refreshTrigger?: number;
}

export default function ReviewList({ businessId, refreshTrigger }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadReviews();
  }, [businessId, refreshTrigger]);

  const loadReviews = async () => {
    setLoading(true);
    setError('');
    
    try {
      const data = await getReviewsByBusiness(businessId);
      setReviews(data);
    } catch (err) {
      setError('Error al cargar las reviews');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-HN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const renderStars = (rating: number) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  if (loading) {
    return <div className="text-center py-8">Cargando reviews...</div>;
  }

  if (error) {
    return <div className="text-red-600 text-center py-8">{error}</div>;
  }

  const averageRating = calculateAverageRating(reviews);

  return (
    <div className="space-y-6">
      {/* Resumen de calificaciones */}
      {reviews.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold text-blue-600">
              {averageRating}
            </div>
            <div>
              <div className="text-2xl">{renderStars(Math.round(averageRating))}</div>
              <div className="text-sm text-gray-600">
                Basado en {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de reviews */}
      {reviews.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Aún no hay reviews. ¡Sé el primero en opinar!
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white p-4 rounded-lg shadow border">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-semibold text-lg">{review.userName}</h4>
                  <div className="text-xl">{renderStars(review.rating)}</div>
                </div>
                <span className="text-sm text-gray-500">
                  {formatDate(review.createdAt)}
                </span>
              </div>
              <p className="text-gray-700 mt-2">{review.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
