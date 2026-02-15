import { Head } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import axios from 'axios';
import { Eye } from 'lucide-react';
import AdminLayout from '@/layouts/admin-layout';

interface OrderItem {
  product_name: { en: string; ar: string };
  product_image: string | null;
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  customer: string;
  phone_number: string;
  location: any;
  total_amount: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  created_at: string;
  items: OrderItem[];
}

function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isImageOpen, setIsImageOpen] = useState(false);

  // Format price helper
  const formatPrice = (price: number | string | null | undefined): string => {
    if (price === null || price === undefined) {
      return '0.00';
    }
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) {
      return '0.00';
    }
    return numPrice.toFixed(2);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('/admin/api/orders');
      setOrders(response.data);
    } catch (error) {
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      await axios.patch(`/admin/api/orders/${orderId}/status`, {
        status: newStatus,
      });
      toast.success('Order status updated successfully');
      fetchOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update order status');
    }
  };

  const openDetailDialog = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const openImageDialog = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setIsImageOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20';
      case 'processing':
        return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20';
      case 'completed':
        return 'bg-green-500/10 text-green-500 hover:bg-green-500/20';
      case 'cancelled':
        return 'bg-red-500/10 text-red-500 hover:bg-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <Head title="Order Management" />

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Order Management</h1>
          <p className="text-muted-foreground">
            View and manage customer orders
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Orders</CardTitle>
            <CardDescription>{orders.length} orders total</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center">Loading...</div>
            ) : orders.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No orders yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 font-semibold">Order ID</th>
                      <th className="pb-3 font-semibold">Customer</th>
                      <th className="pb-3 font-semibold">Phone</th>
                      <th className="pb-3 font-semibold">Total</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold">Date</th>
                      <th className="pb-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-b">
                        <td className="py-3">#{order.id}</td>
                        <td className="py-3">{order.customer}</td>
                        <td className="py-3">{order.phone_number}</td>
                        <td className="py-3">{formatPrice(order.total_amount)} LYD</td>
                        <td className="py-3">
                          <Select
                            value={order.status}
                            onValueChange={(value) => handleStatusChange(order.id, value)}
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue>
                                <Badge className={getStatusColor(order.status)}>
                                  {order.status}
                                </Badge>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="processing">Processing</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-3 text-sm text-muted-foreground">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="py-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openDetailDialog(order)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Image Fullscreen Dialog */}
        <Dialog open={isImageOpen} onOpenChange={setIsImageOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Product Image</DialogTitle>
            </DialogHeader>
            {selectedImage && (
              <div className="flex items-center justify-center">
                <img
                  src={selectedImage}
                  alt="Product"
                  className="max-h-[80vh] w-auto object-contain rounded-lg"
                />
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Order Detail Dialog */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Order #{selectedOrder?.id}</DialogTitle>
              <DialogDescription>Order details and items</DialogDescription>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Customer</p>
                    <p className="text-sm text-muted-foreground">{selectedOrder.customer}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">{selectedOrder.phone_number}</p>
                    <a
                      href={`http://api.whatsapp.com/send?phone=218${selectedOrder.phone_number.startsWith('0') ? selectedOrder.phone_number.substring(1) : selectedOrder.phone_number}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-green-600 hover:underline"
                    >
                      WhatsApp
                    </a>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <Badge className={getStatusColor(selectedOrder.status)}>
                      {selectedOrder.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Total Amount</p>
                    <p className="text-sm text-muted-foreground">
                      {formatPrice(selectedOrder.total_amount)} LYD
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedOrder.location?.latitude && selectedOrder.location?.longitude ? (
                        <>
                          <a
                            href={`https://www.google.com/maps?q=${selectedOrder.location.latitude},${selectedOrder.location.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            View on Google Maps
                          </a>
                          <span className="ml-2 text-xs">
                            ({selectedOrder.location.latitude.toFixed(6)}, {selectedOrder.location.longitude.toFixed(6)})
                          </span>
                        </>
                      ) : selectedOrder.location?.plusCode ? (
                        <span>{selectedOrder.location.plusCode}</span>
                      ) : selectedOrder.location?.address ? (
                        <span>{selectedOrder.location.address}</span>
                      ) : (
                        'No location provided'
                      )}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm font-medium">Order Date</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(selectedOrder.created_at)}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 font-semibold">Order Items</h3>
                  <div className="overflow-hidden rounded-lg border">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="p-3 text-left text-sm font-medium">Image</th>
                          <th className="p-3 text-left text-sm font-medium">Product</th>
                          <th className="p-3 text-left text-sm font-medium">Quantity</th>
                          <th className="p-3 text-left text-sm font-medium">Price</th>
                          <th className="p-3 text-left text-sm font-medium">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.items.map((item, index) => (
                          <tr key={index} className="border-t">
                            <td className="p-3">
                              {item.product_image ? (
                                <img
                                  src={item.product_image}
                                  alt={item.product_name?.en || 'Product'}
                                  className="h-12 w-12 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => openImageDialog(item.product_image!)}
                                />
                              ) : (
                                <div className="h-12 w-12 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                                  No image
                                </div>
                              )}
                            </td>
                            <td className="p-3 text-sm">
                              {item.product_name?.en || 'Unknown Product'}
                            </td>
                            <td className="p-3 text-sm">{item.quantity}</td>
                            <td className="p-3 text-sm">{formatPrice(item.price)} LYD</td>
                            <td className="p-3 text-sm">
                              {formatPrice(item.quantity * item.price)} LYD
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

OrdersPage.layout = (page: React.ReactNode) => (
  <AdminLayout breadcrumbs={[{ title: 'Admin', href: '/admin' }, { title: 'Orders' }]}>
    {page}
  </AdminLayout>
);

export default OrdersPage;
