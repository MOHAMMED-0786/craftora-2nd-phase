import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import TextArea from '@/components/ui/TextArea';
import { useAuth } from '@/hooks/useAuth';
import { blink } from '@/lib/blink';
import { Category, ProductType } from '@/types';
import { toast } from 'sonner';

export default function AddProduct() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    price: '',
    stockQuantity: '10',
    ingredients: '',
    handmadeProcess: '',
    type: 'food' as ProductType
  });

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth');
      return;
    }
    loadCategories();
  }, [isAuthenticated, isLoading]);

  const loadCategories = async () => {
    try {
      const result = await blink.db.categories.list();
      setCategories(result as Category[]);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setImageFiles(prev => [...prev, ...files]);
      
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.title || !formData.price || !formData.categoryId) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      // Upload images
      const imageUrls: string[] = [];
      for (const file of imageFiles) {
        const { publicUrl } = await blink.storage.upload(
          file, 
          `products/${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
        );
        imageUrls.push(publicUrl);
      }

      // Get seller record
      const sellers = await blink.db.sellers.list({
        where: { userId: user.id }
      });
      
      if (sellers.length === 0) {
        toast.error('Seller profile not found');
        return;
      }

      await blink.db.products.create({
        userId: user.id,
        sellerId: sellers[0].id,
        title: formData.title,
        description: formData.description,
        categoryId: formData.categoryId,
        price: parseFloat(formData.price),
        stockQuantity: parseInt(formData.stockQuantity),
        ingredients: formData.ingredients,
        handmadeProcess: formData.handmadeProcess,
        images: JSON.stringify(imageUrls),
        isAvailable: '1',
        ratingAverage: 0,
        totalReviews: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      toast.success('Product added successfully!');
      navigate('/seller-dashboard');
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Button>
          <h1 className="text-xl font-bold">Add New Product</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Images Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground">Product Images</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-border shadow-soft">
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-destructive text-white rounded-full p-1 shadow-lg"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              <label className="aspect-square rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 flex flex-col items-center justify-center cursor-pointer hover:bg-primary/10 transition-colors">
                <svg className="w-8 h-8 text-primary mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Add Photo</span>
                <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            </div>
            <p className="text-xs text-muted-foreground">Upload clear photos of your handmade product. First image will be the cover.</p>
          </div>

          {/* Basic Info */}
          <Card variant="bordered" className="space-y-6">
            <h2 className="text-lg font-bold text-foreground">Basic Information</h2>
            <div className="space-y-4">
              <Input
                label="Product Title *"
                placeholder="e.g. Traditional Homemade Mango Pickle"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">Category *</label>
                  <select
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring"
                    value={formData.categoryId}
                    onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Price (₹) *"
                  type="number"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={e => setFormData({ ...formData, price: e.target.value })}
                />
              </div>

              <TextArea
                label="Description"
                placeholder="Describe your product, its uniqueness, and how it's made..."
                rows={4}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </Card>

          {/* Details */}
          <Card variant="bordered" className="space-y-6">
            <h2 className="text-lg font-bold text-foreground">Handmade Details</h2>
            <div className="space-y-4">
              <TextArea
                label="Ingredients / Materials"
                placeholder="List ingredients for food or materials for crafts..."
                value={formData.ingredients}
                onChange={e => setFormData({ ...formData, ingredients: e.target.value })}
              />
              <TextArea
                label="Handmade Process"
                placeholder="Share your crafting story or preparation method..."
                value={formData.handmadeProcess}
                onChange={e => setFormData({ ...formData, handmadeProcess: e.target.value })}
              />
              <Input
                label="Stock Quantity"
                type="number"
                value={formData.stockQuantity}
                onChange={e => setFormData({ ...formData, stockQuantity: e.target.value })}
              />
            </div>
          </Card>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1 shadow-warm"
              isLoading={loading}
            >
              Publish Product
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
