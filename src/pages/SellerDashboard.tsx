import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { blink } from '@/lib/blink';
import { Seller, Product, OrderWithItems, OrderStatus } from '@/types';
import { toast } from 'sonner';

export default function SellerDashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth');
      return;
    }
    if (user) {
      if (user.profile?.role !== 'seller') {
        navigate('/home');
        return;
      }
      loadSellerData();
    }
  }, [user, isAuthenticated, isLoading]);

  const loadSellerData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      
      // Load seller profile
      const sellers = await blink.db.sellers.list({
        where: { userId: user.id }
      });
      
      if (sellers.length === 0) {
        toast.error('Seller profile not found');
        navigate('/home');
        return;
      }
      
      const sellerData = sellers[0] as unknown as Seller;
      setSeller(sellerData);

      // Load products
      const productsData = await blink.db.products.list({
        where: { sellerId: sellerData.id },
        orderBy: { createdAt: 'desc' }
      });
      setProducts(productsData as Product[]);

      // Load orders
      const ordersData = await blink.db.orders.list({
        where: { sellerId: sellerData.id },
        orderBy: { createdAt: 'desc' },
        limit: 10
      });
      
      const ordersWithItems = await Promise.all(
        ordersData.map(async (order) => {
          const items = await blink.db.orderItems.list({
            where: { orderId: order.id }
          });
          return { ...order, items: items as any };
        })
      );
      
      setOrders(ordersWithItems as OrderWithItems[]);
    } catch (error) {
      console.error('Error loading seller data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await blink.db.orders.update(orderId, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
      toast.success(`Order marked as ${newStatus}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const toggleAvailability = async (productId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === '1' ? '0' : '1';
      await blink.db.products.update(productId, {
        isAvailable: newStatus,
        updatedAt: new Date().toISOString()
      });
      setProducts(prev => prev.map(product => 
        product.id === productId ? { ...product, isAvailable: newStatus } : product
      ));
      toast.success(`Product ${newStatus === '1' ? 'is now available' : 'is now hidden'}`);
    } catch (error) {
      console.error('Error toggling availability:', error);
      toast.error('Failed to update product availability');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4"></div>
          <p className="text-muted-foreground font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xl">
              👩‍🍳
            </div>
            <div>
              <h1 className="text-xl font-bold">{seller?.businessName || 'Your Shop'}</h1>
              <Badge variant={seller?.verificationStatus === 'approved' ? 'success' : 'default'}>
                {seller?.verificationStatus === 'approved' ? 'Verified Seller' : 'Verification Pending'}
              </Badge>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/home')}>
            Buyer View
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 space-y-1 bg-primary text-primary-foreground shadow-warm border-none">
            <p className="text-xs uppercase tracking-wider font-bold opacity-80">Total Earnings</p>
            <p className="text-2xl font-black">₹{seller?.totalEarnings || 0}</p>
          </Card>
          <Card className="p-4 space-y-1 bg-accent text-accent-foreground shadow-warm border-none">
            <p className="text-xs uppercase tracking-wider font-bold opacity-80">Active Orders</p>
            <p className="text-2xl font-black">{orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length}</p>
          </Card>
          <Card className="p-4 space-y-1 shadow-soft border-border">
            <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Products</p>
            <p className="text-2xl font-black text-foreground">{products.length}</p>
          </Card>
          <Card className="p-4 space-y-1 shadow-soft border-border">
            <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Rating</p>
            <p className="text-2xl font-black text-foreground">
              {seller?.ratingAverage || 0} <span className="text-sm font-normal opacity-60">({seller?.totalReviews || 0})</span>
            </p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Orders */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Today's Orders
              </h2>
              <Button variant="ghost" size="sm">View All</Button>
            </div>
            
            <div className="space-y-4">
              {orders.length === 0 ? (
                <Card className="text-center py-12 bg-secondary/20">
                  <p className="text-muted-foreground italic">No orders yet. They'll appear here when customers buy your creations!</p>
                </Card>
              ) : (
                orders.map((order) => (
                  <Card key={order.id} variant="bordered" className="p-4 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-mono font-bold text-primary">{order.orderNumber}</p>
                        <p className="text-sm font-bold">{order.buyerName}</p>
                        <p className="text-xs text-muted-foreground">{order.buyerPhone}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">₹{order.totalAmount}</p>
                        <Badge variant={
                          order.status === 'delivered' ? 'success' :
                          order.status === 'pending' ? 'default' :
                          order.status === 'cancelled' ? 'error' : 'primary'
                        }>
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="text-sm border-t border-border pt-3">
                      <p className="font-medium mb-1">Items:</p>
                      {order.items?.map((item, i) => (
                        <div key={i} className="flex justify-between text-muted-foreground">
                          <span>{item.quantity}x {item.productTitle}</span>
                          <span>₹{item.subtotal}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-2">
                      {order.status === 'pending' && (
                        <Button size="sm" className="flex-1" onClick={() => updateOrderStatus(order.id, 'confirmed')}>
                          Accept Order
                        </Button>
                      )}
                      {order.status === 'confirmed' && (
                        <Button size="sm" className="flex-1" onClick={() => updateOrderStatus(order.id, 'preparing')}>
                          Start Preparing
                        </Button>
                      )}
                      {order.status === 'preparing' && (
                        <Button size="sm" className="flex-1" onClick={() => updateOrderStatus(order.id, 'ready')}>
                          Ready for Delivery
                        </Button>
                      )}
                      {order.status === 'ready' && (
                        <Button variant="accent" size="sm" className="flex-1" onClick={() => updateOrderStatus(order.id, 'delivered')}>
                          Mark Delivered
                        </Button>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Product Management */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Your Products
              </h2>
              <Button size="sm" onClick={() => navigate('/add-product')}>
                + Add New
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {products.length === 0 ? (
                <Card className="text-center py-12 bg-secondary/20">
                  <p className="text-muted-foreground italic mb-4">You haven't added any products yet.</p>
                  <Button variant="outline" size="sm" onClick={() => navigate('/add-product')}>
                    Add Your First Product
                  </Button>
                </Card>
              ) : (
                products.map((product) => (
                  <Card key={product.id} variant="bordered" className="flex gap-4 p-3 items-center">
                    <div className="w-16 h-16 bg-secondary rounded-lg overflow-hidden flex-shrink-0">
                      {product.images ? (
                        <img 
                          src={JSON.parse(product.images)[0]} 
                          alt={product.title} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">🍯</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-sm leading-tight">{product.title}</h3>
                      <p className="text-primary font-bold">₹{product.price}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button 
                        variant={Number(product.isAvailable) > 0 ? 'accent' : 'outline'} 
                        size="sm"
                        className="h-8 px-3 text-xs"
                        onClick={() => toggleAvailability(product.id, product.isAvailable)}
                      >
                        {Number(product.isAvailable) > 0 ? 'Visible' : 'Hidden'}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 px-3 text-xs"
                        onClick={() => navigate(`/edit-product/${product.id}`)}
                      >
                        Edit
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
