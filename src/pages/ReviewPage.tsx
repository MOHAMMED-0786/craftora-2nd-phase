import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import TextArea from '@/components/ui/TextArea';
import { useAuth } from '@/hooks/useAuth';
import { blink } from '@/lib/blink';
import { OrderWithItems } from '@/types';
import { toast } from 'sonner';

export default function ReviewPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [reviews, setReviews] = useState<Record<string, { rating: number, comment: string }>>({});

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth');
      return;
    }
    loadOrder();
  }, [user, isAuthenticated, isLoading, orderId]);

  const loadOrder = async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      const result = await blink.db.orders.get(orderId);
      if (!result) {
        toast.error('Order not found');
        navigate('/orders');
        return;
      }
      
      const items = await blink.db.orderItems.list({
        where: { order_id: orderId }
      });
      
      setOrder({ ...result, items: items as any } as OrderWithItems);
      
      // Initialize reviews state
      const initialReviews: Record<string, { rating: number, comment: string }> = {};
      items.forEach(item => {
        initialReviews[item.productId] = { rating: 5, comment: '' };
      });
      setReviews(initialReviews);
    } catch (error) {
      console.error('Error loading order for review:', error);
      toast.error('Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = (productId: string, rating: number) => {
    setReviews(prev => ({
      ...prev,
      [productId]: { ...prev[productId], rating }
    }));
  };

  const handleCommentChange = (productId: string, comment: string) => {
    setReviews(prev => ({
      ...prev,
      [productId]: { ...prev[productId], comment }
    }));
  };

  const handleSubmit = async () => {
    if (!order || !user) return;

    try {
      setSubmitting(true);
      
      for (const item of (order.items || [])) {
        const review = reviews[item.productId];
        await blink.db.reviews.create({
          user_id: user.id,
          order_id: order.id,
          product_id: item.productId,
          seller_id: order.sellerId,
          rating: review.rating,
          comment: review.comment,
          created_at: new Date().toISOString()
        });

        // Update product rating (simplified)
        const product = await blink.db.products.get(item.productId);
        if (product) {
          const newTotalReviews = product.totalReviews + 1;
          const newRatingAverage = (product.ratingAverage * product.totalReviews + review.rating) / newTotalReviews;
          await blink.db.products.update(item.productId, {
            rating_average: newRatingAverage,
            total_reviews: newTotalReviews
          });
        }
      }

      // Update seller rating (simplified)
      const seller = await blink.db.sellers.get(order.sellerId);
      if (seller) {
        const newTotalReviews = seller.totalReviews + (order.items?.length || 0);
        // This is a simplified calculation, ideally you'd aggregate all reviews
        await blink.db.sellers.update(order.sellerId, {
          total_reviews: newTotalReviews
        });
      }

      toast.success('Thank you for your feedback!');
      navigate('/orders');
    } catch (error) {
      console.error('Error submitting reviews:', error);
      toast.error('Failed to submit reviews');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse">Loading order details...</div>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Button>
          <h1 className="text-xl font-bold">Rate Your Experience</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-foreground">How was your order?</h2>
          <p className="text-muted-foreground">Your appreciation means the world to our makers</p>
        </div>

        <div className="space-y-6">
          {order.items?.map((item) => (
            <Card key={item.id} variant="bordered" className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-secondary rounded-xl flex items-center justify-center text-3xl">
                  🍯
                </div>
                <div>
                  <h3 className="font-bold">{item.productTitle}</h3>
                  <p className="text-sm text-muted-foreground">Handmade with care</p>
                </div>
              </div>

              {/* Star Rating */}
              <div className="flex justify-center gap-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRatingChange(item.productId, star)}
                    className="transform transition-transform active:scale-90"
                  >
                    <svg
                      className={`w-10 h-10 ${
                        reviews[item.productId]?.rating >= star ? 'text-yellow-500 fill-current' : 'text-border'
                      }`}
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                ))}
              </div>

              <TextArea
                label="Your Appreciation"
                placeholder="Share what you loved about this product..."
                value={reviews[item.productId]?.comment}
                onChange={e => handleCommentChange(item.productId, e.target.value)}
              />
            </Card>
          ))}
        </div>

        <Button
          size="lg"
          className="w-full shadow-warm"
          isLoading={submitting}
          onClick={handleSubmit}
        >
          Submit Appreciation
        </Button>
      </main>
    </div>
  );
}
