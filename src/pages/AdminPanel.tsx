import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { blink } from '@/lib/blink';
import { Seller, Order, User } from '@/types';
import { toast } from 'sonner';

export default function AdminPanel() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [sellers, setSellers] = useState<any[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sellers' | 'orders' | 'analytics'>('sellers');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth');
      return;
    }
    if (user && user.profile?.role !== 'admin') {
      navigate('/home');
      return;
    }
    loadAdminData();
  }, [user, isAuthenticated, isLoading]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [sellersList, ordersList] = await Promise.all([
        blink.db.sellers.list({ orderBy: { createdAt: 'desc' } }),
        blink.db.orders.list({ orderBy: { createdAt: 'desc' }, limit: 50 })
      ]);

      const sellersWithUsers = await Promise.all(
        sellersList.map(async (seller) => {
          const sellerUser = await blink.db.users.list({
            where: { user_id: seller.userId }
          });
          return { ...seller, user: sellerUser[0] };
        })
      );

      setSellers(sellersWithUsers);
      setOrders(ordersList as Order[]);
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const approveSeller = async (id: string) => {
    try {
      await blink.db.sellers.update(id, {
        verification_status: 'approved',
        updated_at: new Date().toISOString()
      });
      setSellers(prev => prev.map(s => s.id === id ? { ...s, verificationStatus: 'approved' } : s));
      toast.success('Seller approved');
    } catch (error) {
      console.error('Error approving seller:', error);
      toast.error('Failed to approve seller');
    }
  };

  const rejectSeller = async (id: string) => {
    try {
      await blink.db.sellers.update(id, {
        verification_status: 'rejected',
        updated_at: new Date().toISOString()
      });
      setSellers(prev => prev.map(s => s.id === id ? { ...s, verificationStatus: 'rejected' } : s));
      toast.success('Seller rejected');
    } catch (error) {
      console.error('Error rejecting seller:', error);
      toast.error('Failed to reject seller');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse font-bold text-primary">Accessing Admin Control...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center text-xl">
              🛡️
            </div>
            <h1 className="text-xl font-bold">Craftora Admin</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/home')}>
            Back to App
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('sellers')}
            className={`px-6 py-3 font-bold transition-all border-b-2 ${
              activeTab === 'sellers' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
            }`}
          >
            Seller Approvals
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-6 py-3 font-bold transition-all border-b-2 ${
              activeTab === 'orders' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
            }`}
          >
            All Orders
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-6 py-3 font-bold transition-all border-b-2 ${
              activeTab === 'analytics' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
            }`}
          >
            Analytics
          </button>
        </div>

        {activeTab === 'sellers' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Seller Management</h2>
            <div className="grid grid-cols-1 gap-4">
              {sellers.length === 0 ? (
                <p className="text-muted-foreground">No sellers registered yet.</p>
              ) : (
                sellers.map((seller) => (
                  <Card key={seller.id} variant="bordered" className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-2xl">
                        🏪
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{seller.businessName || 'Unnamed Business'}</h3>
                        <p className="text-sm text-muted-foreground">Owner: {seller.user?.display_name} ({seller.user?.email})</p>
                        <Badge variant={seller.verificationStatus === 'approved' ? 'success' : seller.verificationStatus === 'rejected' ? 'error' : 'default'}>
                          {seller.verificationStatus}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {seller.verificationStatus !== 'approved' && (
                        <Button size="sm" variant="primary" onClick={() => approveSeller(seller.id)}>Approve</Button>
                      )}
                      {seller.verificationStatus !== 'rejected' && (
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => rejectSeller(seller.id)}>Reject</Button>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Recent Orders</h2>
            <Card variant="bordered" className="p-0 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-secondary/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">Order #</th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-secondary/20">
                      <td className="px-6 py-4 font-mono text-sm">{order.orderNumber}</td>
                      <td className="px-6 py-4 text-sm">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-sm font-bold">₹{order.totalAmount}</td>
                      <td className="px-6 py-4 text-sm uppercase font-bold">{order.status}</td>
                      <td className="px-6 py-4">
                        <Badge variant={order.paymentStatus === 'paid' ? 'success' : 'default'}>{order.paymentStatus}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-6 bg-primary text-primary-foreground">
              <p className="text-sm font-bold opacity-80 uppercase tracking-widest">Total Sales</p>
              <p className="text-4xl font-black mt-2">₹{orders.reduce((acc, o) => acc + o.totalAmount, 0)}</p>
            </Card>
            <Card className="p-6 bg-accent text-accent-foreground">
              <p className="text-sm font-bold opacity-80 uppercase tracking-widest">Total Orders</p>
              <p className="text-4xl font-black mt-2">{orders.length}</p>
            </Card>
            <Card className="p-6 bg-secondary text-secondary-foreground">
              <p className="text-sm font-bold opacity-80 uppercase tracking-widest">Total Sellers</p>
              <p className="text-4xl font-black mt-2">{sellers.length}</p>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
