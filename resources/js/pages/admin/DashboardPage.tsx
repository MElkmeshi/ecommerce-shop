import { Head } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, FolderTree, ShoppingCart, DollarSign } from 'lucide-react';
import AdminLayout from '@/layouts/admin-layout';

interface Stats {
  totalProducts: number;
  totalCategories: number;
  totalOrders: number;
  totalRevenue: number;
}

interface DashboardPageProps {
  stats: Stats;
}

function DashboardPage({ stats }: DashboardPageProps) {
  return (
    <>
      <Head title="Admin Dashboard" />

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to your e-commerce admin panel
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Products
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
              <p className="text-xs text-muted-foreground">
                Active products in store
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Categories
              </CardTitle>
              <FolderTree className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCategories}</div>
              <p className="text-xs text-muted-foreground">
                Product categories
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Orders
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <p className="text-xs text-muted-foreground">
                Customer orders
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRevenue.toFixed(2)} LYD</div>
              <p className="text-xs text-muted-foreground">
                From all orders
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common admin tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <a
                href="/admin/products"
                className="block rounded-lg border p-3 hover:bg-accent transition-colors"
              >
                <div className="flex items-center">
                  <Package className="mr-3 h-5 w-5" />
                  <div>
                    <p className="font-medium">Manage Products</p>
                    <p className="text-sm text-muted-foreground">Add, edit, or remove products</p>
                  </div>
                </div>
              </a>
              <a
                href="/admin/categories"
                className="block rounded-lg border p-3 hover:bg-accent transition-colors"
              >
                <div className="flex items-center">
                  <FolderTree className="mr-3 h-5 w-5" />
                  <div>
                    <p className="font-medium">Manage Categories</p>
                    <p className="text-sm text-muted-foreground">Organize product categories</p>
                  </div>
                </div>
              </a>
              <a
                href="/admin/orders"
                className="block rounded-lg border p-3 hover:bg-accent transition-colors"
              >
                <div className="flex items-center">
                  <ShoppingCart className="mr-3 h-5 w-5" />
                  <div>
                    <p className="font-medium">View Orders</p>
                    <p className="text-sm text-muted-foreground">Check customer orders</p>
                  </div>
                </div>
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Info</CardTitle>
              <CardDescription>Application details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Laravel Version</span>
                <span className="font-medium">12.x</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">PHP Version</span>
                <span className="font-medium">8.4</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Inertia.js</span>
                <span className="font-medium">v2.x</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Database</span>
                <span className="font-medium">SQLite</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

DashboardPage.layout = (page: React.ReactNode) => (
  <AdminLayout breadcrumbs={[{ title: 'Dashboard' }]}>
    {page}
  </AdminLayout>
);

export default DashboardPage;
