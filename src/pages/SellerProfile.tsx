import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { blink } from '@/lib/blink';
import { Seller, Product, User } from '@/types';
import { toast } from 'sonner';

export default function SellerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [sellerUser, setSellerUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSeller();
  }, [id]);

  const loadSeller = async () => {
    if (!id) return;
    try {
      setLoading(true);
      
      const sellerResult = await blink.db.sellers.get(id);
      if (!sellerResult) {
        toast.error('Seller not found');
        navigate('/home');
        return;
      }
      
      const sellerData = sellerResult as unknown as Seller;
      setSeller(sellerData);

      // Fetch user info for the seller
      const userResult = await blink.db.users.list({
        where: { user_id: sellerData.userId }
      });
      if (userResult.length > 0) {
        setSellerUser(userResult[0] as unknown as User);
      }

      // Load seller's products
      const productsData = await blink.db.products.list({
        where: { seller_id: id, isAvailable: '1' }
      });
      setProducts(productsData as Product[]);
    } catch (error) {
      console.error('Error loading seller profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse">Loading artisan profile...</div>
      </div>
    );
  }

  if (!seller) return null;

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Header */}
      <div className="bg-primary text-primary-foreground pt-12 pb-24 px-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/20" onClick={() => navigate(-1)}>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </Button>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 -mt-16 space-y-8">
        {/* Profile Info */}
        <Card variant="elevated" className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-6 p-8">
          <div className="w-32 h-32 rounded-full border-4 border-background bg-secondary shadow-warm overflow-hidden flex-shrink-0">
            {sellerUser?.avatar ? (
              <img src={sellerUser.avatar} alt={seller.businessName || ''} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl">👩‍🍳</div>
            )}
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <h1 className="text-3xl font-bold">{seller.businessName || 'Local Artisan'}</h1>
              <Badge variant={seller.verificationStatus === 'approved' ? 'success' : 'default'}>
                {seller.verificationStatus === 'approved' ? 'Verified Maker' : 'Verification Pending'}
              </Badge>
            </div>
            <p className="text-muted-foreground">{sellerUser?.locationArea}, {sellerUser?.locationCity}</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
              <div className="text-center">
                <p className="font-bold text-xl">{seller.ratingAverage.toFixed(1)} ⭐</p>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Rating</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-xl">{seller.totalReviews}</p>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Reviews</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-xl">{seller.totalOrders}</p>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Orders</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Hygiene Declaration */}
        {seller.hygieneDeclaration && (
          <Card variant="bordered" className="bg-accent/5 border-accent/20">
            <h2 className="text-lg font-bold text-accent mb-2 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Maker's Safety Promise
            </h2>
            <p className="text-muted-foreground italic leading-relaxed">"{seller.hygieneDeclaration}"</p>
          </Card>
        )}

        {/* Products Grid */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">Artisan's Creations</h2>
          {products.length === 0 ? (
            <div className="text-center py-12 bg-secondary/20 rounded-3xl">
              <p className="text-muted-foreground italic">This artisan hasn't listed any products yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {products.map((product) => (
                <Card 
                  key={product.id} 
                  variant="bordered" 
                  className="flex gap-4 p-4 cursor-pointer hover:shadow-warm transition-all group"
                  onClick={() => navigate(`/product/${product.id}`)}
                >
                  <div className="w-24 h-24 bg-secondary rounded-2xl overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform">
                    {product.images ? (
                      <img src={JSON.parse(product.images)[0]} alt={product.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">🎨</div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <h3 className="font-bold group-hover:text-primary transition-colors">{product.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-1">{product.description}</p>
                    <div className="flex items-center justify-between pt-2">
                      <span className="font-bold text-primary text-lg">₹{product.price}</span>
                      <div className="flex items-center gap-1 text-xs">
                        <svg className="w-3 h-3 text-yellow-500 fill-current" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-muted-foreground">{product.ratingAverage.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
