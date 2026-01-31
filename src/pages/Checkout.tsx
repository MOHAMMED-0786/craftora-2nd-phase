import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { blink } from '@/lib/blink';
import { CartItemWithProduct, PaymentMethod } from '@/types';
import { toast } from 'sonner';

export default function Checkout() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('online');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth');
      return;
    }
    if (user) {
      loadCart();
      setPhone(user.profile?.phone || '');
      setAddress(user.profile?.locationAddress || '');
    }
  }, [user, isAuthenticated, isLoading]);

  const loadCart = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const items = await blink.db.cart.list({
        where: { user_id: user.id }
      });
      
      if (items.length === 0) {
        navigate('/home');
        return;
      }

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

  const total = cartItems.reduce((acc, item) => {
    return acc + (item.product?.price || 0) * item.quantity;
  }, 0);

  const handlePlaceOrder = async () => {
    if (!address || !phone) {
      toast.error('Please fill in all delivery details');
      return;
    }

    try {
      setPlacingOrder(true);
      
      // Group items by seller
      const itemsBySeller: Record<string, CartItemWithProduct[]> = {};
      cartItems.forEach(item => {
        const sellerId = item.product?.sellerId;
        if (sellerId) {
          if (!itemsBySeller[sellerId]) itemsBySeller[sellerId] = [];
          itemsBySeller[sellerId].push(item);
        }
      });

      // Create an order for each seller
      for (const [sellerId, items] of Object.entries(itemsBySeller)) {
        const orderTotal = items.reduce((acc, item) => acc + (item.product?.price || 0) * item.quantity, 0);
        const orderNumber = `CRFT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        const order = await blink.db.orders.create({
          user_id: user?.id || '',
          order_number: orderNumber,
          seller_id: sellerId,
          buyer_name: user?.profile?.displayName || user?.displayName || 'Customer',
          buyer_phone: phone,
          delivery_address: address,
          total_amount: orderTotal,
          status: 'pending',
          payment_method: paymentMethod,
          payment_status: paymentMethod === 'online' ? 'paid' : 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

        // Create order items
        await blink.db.orderItems.createMany(items.map(item => ({
          user_id: user?.id || '',
          order_id: order.id,
          product_id: item.productId,
          product_title: item.product?.title || '',
          product_price: item.product?.price || 0,
          quantity: item.quantity,
          subtotal: (item.product?.price || 0) * item.quantity,
          created_at: new Date().toISOString()
        })));
      }

      // Clear cart
      await blink.db.cart.deleteMany({
        where: { user_id: user?.id }
      });

      toast.success('Order placed successfully!');
      navigate('/orders');
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order');
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary font-bold">Preparing your order...</div>
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
          <h1 className="text-xl font-bold">Checkout</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Delivery Details */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            Delivery Details
          </h2>
          <Card variant="bordered" className="space-y-4">
            <Input
              label="Phone Number"
              placeholder="Enter your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Delivery Address</label>
              <textarea
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring"
                rows={3}
                placeholder="Enter your complete address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
          </Card>
        </div>

        {/* Payment Method */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Payment Method
          </h2>
          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => setPaymentMethod('online')}
              className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                paymentMethod === 'online' 
                  ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                  : 'border-border bg-card'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${paymentMethod === 'online' ? 'bg-primary text-white' : 'bg-secondary'}`}>
                  💳
                </div>
                <div className="text-left">
                  <p className="font-bold">Online Payment</p>
                  <p className="text-xs text-muted-foreground">UPI, Cards, Wallets</p>
                </div>
              </div>
              {paymentMethod === 'online' && <div className="text-primary">●</div>}
            </button>
            <button
              onClick={() => setPaymentMethod('cash_on_delivery')}
              className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                paymentMethod === 'cash_on_delivery' 
                  ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                  : 'border-border bg-card'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${paymentMethod === 'cash_on_delivery' ? 'bg-primary text-white' : 'bg-secondary'}`}>
                  💵
                </div>
                <div className="text-left">
                  <p className="font-bold">Cash on Delivery</p>
                  <p className="text-xs text-muted-foreground">Pay when you receive</p>
                </div>
              </div>
              {paymentMethod === 'cash_on_delivery' && <div className="text-primary">●</div>}
            </button>
          </div>
        </div>

        {/* Order Items */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-foreground">Order Items</h2>
          <Card variant="bordered" className="p-0 overflow-hidden">
            {cartItems.map((item, i) => (
              <div key={item.id} className={`p-4 flex justify-between items-center ${i !== 0 ? 'border-t border-border' : ''}`}>
                <div>
                  <p className="font-medium">{item.product?.title}</p>
                  <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                </div>
                <p className="font-bold">₹{(item.product?.price || 0) * item.quantity}</p>
              </div>
            ))}
            <div className="bg-secondary/30 p-4 flex justify-between items-center text-lg font-bold">
              <span>Total to Pay</span>
              <span className="text-primary">₹{total}</span>
            </div>
          </Card>
        </div>
      </main>

      <div className="fixed bottom-0 inset-x-0 bg-background/80 backdrop-blur-lg border-t border-border p-4 z-50">
        <div className="max-w-3xl mx-auto">
          <Button 
            size="lg" 
            className="w-full"
            isLoading={placingOrder}
            onClick={handlePlaceOrder}
          >
            Confirm Order - ₹{total}
          </Button>
        </div>
      </div>
    </div>
  );
}
