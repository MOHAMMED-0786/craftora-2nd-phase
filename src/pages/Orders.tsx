import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { blink } from '@/lib/blink';
import { OrderWithItems, OrderStatus } from '@/types';
import { toast } from 'sonner';

export default function Orders() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth');
      return;
    }
    if (user) {
      loadOrders();
    }
  }, [user, isAuthenticated, isLoading]);

  const loadOrders = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const result = await blink.db.orders.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      });
      
      const ordersWithData = await Promise.all(
        result.map(async (order) => {
          const items = await blink.db.orderItems.list({
            where: { orderId: order.id }
          });
          const seller = await blink.db.sellers.list({
            where: { id: order.sellerId }
          });
          return { 
            ...order, 
            items: items as any, 
            seller: seller[0] as any 
          };
        })
      );
      
      setOrders(ordersWithData as OrderWithItems[]);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 'default';
      case 'confirmed': return 'primary';
      case 'preparing': return 'accent';
      case 'ready': return 'accent';
      case 'delivered': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: OrderStatus) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary font-medium text-lg">Loading your orders...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/home')}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Button>
          <h1 className="text-xl font-bold">Your Orders</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {orders.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <div className="text-8xl">📦</div>
            <h2 className="text-2xl font-bold text-foreground">No orders yet</h2>
            <p className="text-muted-foreground">When you order handmade treasures, they'll appear here!</p>
            <Button variant="primary" onClick={() => navigate('/home')}>
              Explore Marketplace
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id} variant="elevated" className="space-y-4 p-5">
                {/* Order Header */}
                <div className="flex items-start justify-between border-b border-border pb-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Order Number</p>
                    <p className="font-mono font-bold text-primary">{order.orderNumber}</p>
                  </div>
                  <Badge variant={getStatusColor(order.status)}>
                    {getStatusLabel(order.status)}
                  </Badge>
                </div>

                {/* Seller Info */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-xl">
                    👩‍🍳
                  </div>
                  <div>
                    <p className="font-bold text-sm">{order.seller?.businessName || 'Local Artisan'}</p>
                    <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>

                {/* Items Summary */}
                <div className="bg-secondary/20 rounded-xl p-4 space-y-2">
                  {order.items?.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-foreground">
                        <span className="font-bold text-primary">{item.quantity}x</span> {item.productTitle}
                      </span>
                      <span className="font-medium text-foreground">₹{item.subtotal}</span>
                    </div>
                  ))}
                  <div className="border-t border-dashed border-border pt-2 flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-primary">₹{order.totalAmount}</span>
                  </div>
                </div>

                {/* Order Timeline (Simple) */}
                <div className="space-y-3 pt-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Tracking Status</p>
                  <div className="relative pl-6 space-y-4">
                    <div className="absolute left-1.5 top-1 bottom-1 w-0.5 bg-border"></div>
                    
                    <div className="relative">
                      <div className={`absolute -left-[22px] top-1.5 w-3 h-3 rounded-full border-2 border-background ${order.status !== 'cancelled' ? 'bg-primary' : 'bg-muted'}`}></div>
                      <p className="text-sm font-bold text-foreground">Order Placed</p>
                      <p className="text-xs text-muted-foreground">We've received your order</p>
                    </div>

                    {(order.status === 'confirmed' || order.status === 'preparing' || order.status === 'ready' || order.status === 'delivered') && (
                      <div className="relative">
                        <div className={`absolute -left-[22px] top-1.5 w-3 h-3 rounded-full border-2 border-background ${['confirmed', 'preparing', 'ready', 'delivered'].includes(order.status) ? 'bg-primary' : 'bg-muted'}`}></div>
                        <p className="text-sm font-bold text-foreground">Confirmed</p>
                        <p className="text-xs text-muted-foreground">Seller has accepted your order</p>
                      </div>
                    )}

                    {order.status === 'delivered' && (
                      <div className="relative">
                        <div className="absolute -left-[22px] top-1.5 w-3 h-3 rounded-full border-2 border-background bg-accent"></div>
                        <p className="text-sm font-bold text-accent">Delivered</p>
                        <p className="text-xs text-muted-foreground">Your order has reached you!</p>
                      </div>
                    )}

                    {order.status === 'cancelled' && (
                      <div className="relative">
                        <div className="absolute -left-[22px] top-1.5 w-3 h-3 rounded-full border-2 border-background bg-destructive"></div>
                        <p className="text-sm font-bold text-destructive">Cancelled</p>
                        <p className="text-xs text-muted-foreground">This order was cancelled</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 flex gap-3">
                  {order.status === 'delivered' && (
                    <Button variant="primary" size="sm" className="flex-1" onClick={() => navigate(`/review/${order.id}`)}>
                      Rate Order
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate(`/home`)}>
                    Order Again
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
