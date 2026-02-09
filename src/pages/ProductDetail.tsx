import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { blink } from '@/lib/blink';
import { ProductWithSeller } from '@/types';
import { toast } from 'sonner';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [product, setProduct] = useState<ProductWithSeller | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const result = await blink.db.products.get(id);
      if (!result) {
        toast.error('Product not found');
        navigate('/home');
        return;
      }
      
      const productData = result as unknown as ProductWithSeller;
      
      // Fetch seller info
      const sellerResult = await blink.db.sellers.list({
        where: { id: productData.sellerId }
      });
      
      if (sellerResult.length > 0) {
        productData.seller = sellerResult[0] as any;
      }

      setProduct(productData);
    } catch (error) {
      console.error('Error loading product:', error);
      toast.error('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      navigate('/auth');
      return;
    }

    if (!product) return;

    try {
      setAddingToCart(true);
      const me = await blink.auth.me();
      const userId = me?.id;
      if (!userId) {
        toast.error('Please login first');
        navigate('/auth');
        return;
      }
      
      // Check if item already in cart
      const existing = await blink.db.cart.list({
        where: { 
          userId: userId,
          productId: product.id
        }
      });

      if (existing.length > 0) {
        await blink.db.cart.update(existing[0].id, {
          quantity: existing[0].quantity + quantity,
          updatedAt: new Date().toISOString()
        });
      } else {
        await blink.db.cart.create({
          userId: userId,
          productId: product.id,
          quantity: quantity,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      toast.success('Added to cart!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4"></div>
          <p className="text-muted-foreground">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const images = product.images ? JSON.parse(product.images) : [];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </Button>
          <h1 className="text-lg font-semibold truncate max-w-[200px]">{product.title}</h1>
          <Button variant="ghost" size="sm" onClick={() => navigate('/cart')}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-square bg-secondary rounded-3xl overflow-hidden shadow-warm">
            {images.length > 0 ? (
              <img src={images[0]} alt={product.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-8xl">🎨</div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {images.map((img: string, i: number) => (
                <div key={i} className="w-24 h-24 flex-shrink-0 bg-secondary rounded-xl overflow-hidden cursor-pointer border-2 border-transparent hover:border-primary">
                  <img src={img} alt={`${product.title} ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-3xl font-bold text-foreground">{product.title}</h1>
              <div className="flex items-center gap-1 bg-secondary px-3 py-1 rounded-full">
                <svg className="w-4 h-4 text-yellow-500 fill-current" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="font-bold">{product.ratingAverage.toFixed(1)}</span>
                <span className="text-muted-foreground">({product.totalReviews})</span>
              </div>
            </div>
            <p className="text-2xl font-bold text-primary">₹{product.price}</p>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold border-b pb-2">Description</h2>
            <p className="text-muted-foreground leading-relaxed">{product.description}</p>
          </div>

          {product.ingredients && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2">Ingredients / Materials</h2>
              <p className="text-muted-foreground leading-relaxed">{product.ingredients}</p>
            </div>
          )}

          {product.handmadeProcess && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2">Handmade Process</h2>
              <p className="text-muted-foreground leading-relaxed">{product.handmadeProcess}</p>
            </div>
          )}

          {/* Seller Card */}
          <Card variant="bordered" className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-3xl">
              👩‍🍳
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg">{product.seller?.businessName || 'Local Artisan'}</h3>
                <Badge variant="success">Verified</Badge>
              </div>
              <p className="text-sm text-muted-foreground">Trusted seller since {new Date(product.seller?.createdAt || '').getFullYear()}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate(`/seller/${product.sellerId}`)}>
              View Profile
            </Button>
          </Card>
        </div>
      </main>

      {/* Floating Action Bar */}
      <div className="fixed bottom-0 inset-x-0 bg-background/80 backdrop-blur-lg border-t border-border p-4 z-50">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <div className="flex items-center bg-secondary rounded-xl p-1">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-background transition-colors"
            >
              -
            </button>
            <span className="w-12 text-center font-bold">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-background transition-colors"
            >
              +
            </button>
          </div>
          <Button
            className="flex-1"
            size="lg"
            isLoading={addingToCart}
            onClick={handleAddToCart}
            disabled={Number(product.isAvailable) === 0}
          >
            {Number(product.isAvailable) === 0 ? 'Out of Stock' : 'Add to Cart'}
          </Button>
        </div>
      </div>
    </div>
  );
}
