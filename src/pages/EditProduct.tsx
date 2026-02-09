import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import TextArea from '@/components/ui/TextArea';
import { useAuth } from '@/hooks/useAuth';
import { blink } from '@/lib/blink';
import { Category, Product, ProductType } from '@/types';
import { toast } from 'sonner';

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    price: '',
    stockQuantity: '10',
    ingredients: '',
    handmadeProcess: '',
    isAvailable: '1'
  });

  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth');
      return;
    }
    loadData();
  }, [isAuthenticated, isLoading, id]);

  const loadData = async () => {
    if (!id) return;
    try {
      setFetching(true);
      const [productResult, categoriesResult] = await Promise.all([
        blink.db.products.get(id),
        blink.db.categories.list()
      ]);

      if (!productResult) {
        toast.error('Product not found');
        navigate('/seller-dashboard');
        return;
      }

      const product = productResult as unknown as Product;
      setFormData({
        title: product.title,
        description: product.description || '',
        categoryId: product.categoryId || '',
        price: product.price.toString(),
        stockQuantity: product.stockQuantity.toString(),
        ingredients: product.ingredients || '',
        handmadeProcess: product.handmadeProcess || '',
        isAvailable: product.isAvailable
      });

      const images = product.images ? JSON.parse(product.images) : [];
      setExistingImages(images);
      setImagePreviews(images);
      setCategories(categoriesResult as Category[]);
    } catch (error) {
      console.error('Error loading product data:', error);
      toast.error('Failed to load product details');
    } finally {
      setFetching(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setNewImageFiles(prev => [...prev, ...files]);
      
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    // If it's an existing image
    const imageUrl = imagePreviews[index];
    if (existingImages.includes(imageUrl)) {
      setExistingImages(prev => prev.filter(img => img !== imageUrl));
    } else {
      // If it's a newly added image
      const newIndex = index - existingImages.length;
      setNewImageFiles(prev => prev.filter((_, i) => i !== newIndex));
    }
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;

    if (!formData.title || !formData.price || !formData.categoryId) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      // Upload new images if any
      const newImageUrls: string[] = [];
      for (const file of newImageFiles) {
        const { publicUrl } = await blink.storage.upload(
          file, 
          `products/${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
        );
        newImageUrls.push(publicUrl);
      }

      const finalImages = [...existingImages, ...newImageUrls];

      await blink.db.products.update(id, {
        title: formData.title,
        description: formData.description,
        categoryId: formData.categoryId,
        price: parseFloat(formData.price),
        stockQuantity: parseInt(formData.stockQuantity),
        ingredients: formData.ingredients,
        handmadeProcess: formData.handmadeProcess,
        images: JSON.stringify(finalImages),
        isAvailable: formData.isAvailable,
        updatedAt: new Date().toISOString()
      });

      toast.success('Product updated successfully!');
      navigate('/seller-dashboard');
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse">Loading product data...</div>
      </div>
    );
  }

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
          <h1 className="text-xl font-bold">Edit Product</h1>
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
                placeholder="Describe your product..."
                rows={4}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </Card>

          {/* Details */}
          <Card variant="bordered" className="space-y-6">
            <h2 className="text-lg font-bold text-foreground">Availability</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-foreground">In Stock & Visible</label>
                <select
                  className="rounded-xl border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={formData.isAvailable}
                  onChange={e => setFormData({ ...formData, isAvailable: e.target.value })}
                >
                  <option value="1">Yes, Available</option>
                  <option value="0">No, Hidden</option>
                </select>
              </div>
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
              Save Changes
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
