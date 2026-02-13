import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, SlidersHorizontal } from 'lucide-react';
import { Product } from '@/types';
import { getProducts } from '@/lib/api';
import { ProductCard } from '@/components/ProductCard';
import { SearchBar } from '@/components/SearchBar';
import { FilterPanel } from '@/components/FilterPanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/store/cartStore';

export function ProductsPage() {
  const navigate = useNavigate();
  const totalItems = useCartStore((state) => state.getTotalItems());

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false); // Collapsed by default

  // Get user info from Telegram
  const user = window.Telegram?.WebApp?.initDataUnsafe?.user;

  useEffect(() => {
    loadProducts();
  }, [search, category, minPrice, maxPrice, sortBy]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await getProducts({
        search: search || undefined,
        category: category || undefined,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        sort: sortBy,
      });
      setProducts(data.products);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSearch('');
    setCategory('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('newest');
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Floating Cart Button (Mobile Only) */}
      <div className="fixed bottom-6 right-6 z-50 lg:hidden">
        <Button
          size="lg"
          onClick={() => navigate('/cart')}
          className="h-14 w-14 rounded-full shadow-lg relative p-0 flex items-center justify-center"
        >
          <ShoppingCart className="w-6 h-6 text-white" />
          {totalItems > 0 && (
            <Badge className="absolute -top-1 -right-1 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs pointer-events-none">
              {totalItems}
            </Badge>
          )}
        </Button>
      </div>

      {/* Header */}
      <div className="sticky top-0 z-40 bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Shop</h1>
              {user && (
                <p className="text-sm text-muted-foreground">
                  Welcome, {user.first_name || 'there'}!
                </p>
              )}
            </div>
            <div className="hidden lg:block relative">
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/cart')}
                className="relative"
              >
                <ShoppingCart className="w-5 h-5" />
                {totalItems > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center pointer-events-none">
                    {totalItems}
                  </Badge>
                )}
              </Button>
            </div>
          </div>

          <div className="mt-4">
            <SearchBar value={search} onChange={setSearch} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Filter Toggle Button (Mobile) */}
        <div className="mb-4 lg:hidden">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-center"
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          {(showFilters || window.innerWidth >= 1024) && (
            <div className="lg:col-span-1">
              <FilterPanel
                selectedCategory={category}
                minPrice={minPrice}
                maxPrice={maxPrice}
                sortBy={sortBy}
                onCategoryChange={setCategory}
                onPriceChange={(min, max) => {
                  setMinPrice(min);
                  setMaxPrice(max);
                }}
                onSortChange={setSortBy}
                onReset={handleReset}
              />
            </div>
          )}

          {/* Products Grid */}
          <div className={showFilters ? 'lg:col-span-3' : 'lg:col-span-4'}>
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading products...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No products found</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  {products.length} product{products.length !== 1 ? 's' : ''} found
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
