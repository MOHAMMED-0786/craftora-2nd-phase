import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import { blink } from '@/lib/blink';
import { CartItemWithProduct } from '@/types';
import { toast } from 'sonner';

export default function Cart() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth');
      return;
    }
    if (user) {
      loadCart();
    }
  }, [user, isAuthenticated, isLoading]);

  const loadCart = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const items = await blink.db.cart.list({
        where: { user_id: user.id },
        orderBy: { createdAt: 'desc' }
      });
      
      const itemsWithProducts = await Promise.all(
        items.map(async (item) => {
          const product = await blink.db.products.get(item.productId);
          return { ...item, product: product as any };
        })
      );
      
      setCartItems(itemsWithProducts as CartItemWithProduct[]);
    } catch (error) {
      console.error('Error loading cart:', error);
      toast.error('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    try {
      await blink.db.cart.update(id, {
        quantity: newQuantity,
        updated_at: new Date().toISOString()
      });
      setCartItems(items => items.map(item => 
        item.id === id ? { ...item, quantity: newQuantity } : item
      ));
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('Failed to update quantity');
    }
  };

  const removeItem = async (id: string) => {
    try {
      await blink.db.cart.delete(id);
      setCartItems(items => items.filter(item => item.id !== id));
      toast.success('Item removed');
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error('Failed to remove item');
    }
  };

  const total = cartItems.reduce((acc, item) => {
    return acc + (item.product?.price || 0) * item.quantity;
  }, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse">Loading cart...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Button>
          <h1 className="text-xl font-bold">Your Cart ({cartItems.length})</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {cartItems.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <div className="text-8xl">🛒</div>
            <h2 className="text-2xl font-bold">Your cart is empty</h2>
            <p className="text-muted-foreground">Discover unique handmade items to fill it up!</p>
            <Button variant="primary" onClick={() => navigate('/home')}>
              Start Shopping
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {cartItems.map((item) => (
                <Card key={item.id} variant="bordered" className="flex gap-4 p-4">
                  <div className="w-24 h-24 bg-secondary rounded-xl overflow-hidden flex-shrink-0">
                    {item.product?.images ? (
                      <img 
                        src={JSON.parse(item.product.images)[0]} 
                        alt={item.product.title} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">🎨</div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <h3 className="font-bold text-foreground">{item.product?.title}</h3>
                    <p className="text-primary font-bold">₹{item.product?.price}</p>
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center bg-secondary rounded-lg p-1">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-background"
                        >
                          -
                        </button>
                        <span className="w-10 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-background"
                        >
                          +
                        </button>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => removeItem(item.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Bill Summary */}
            <Card variant="bordered" className="space-y-4">
              <h2 className="font-bold text-lg">Order Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">₹{total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery Fee</span>
                  <span className="text-green-600 font-medium">FREE</span>
                </div>
                <div className="border-t border-dashed pt-2 flex justify-between text-lg font-bold">
                  <span>Total Amount</span>
                  <span className="text-primary">₹{total}</span>
                </div>
              </div>
            </Card>
          </>
        )}
      </main>

      {cartItems.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 bg-background/80 backdrop-blur-lg border-t border-border p-4 z-50">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-6">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total Amount</p>
              <p className="text-2xl font-black text-primary">₹{total}</p>
            </div>
            <Button 
              size="lg" 
              className="flex-1"
              onClick={() => navigate('/checkout')}
            >
              Checkout Now
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
