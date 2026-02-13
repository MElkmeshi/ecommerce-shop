import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCartStore } from '@/store/cartStore';
import { createOrder } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';

// Validation schema
const checkoutSchema = z.object({
  phoneNumber: z.string().min(1, 'Phone number is required'),
  location: z.union([
    z.object({
      latitude: z.number(),
      longitude: z.number(),
    }),
    z.object({
      address: z.string().min(1, 'Address is required'),
    }),
  ]),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export function CheckoutPage() {
  const navigate = useNavigate();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const [submitting, setSubmitting] = useState(false);
  const [locationData, setLocationData] = useState<any>(null);
  const [requestingLocation, setRequestingLocation] = useState(false);

  const user = window.Telegram?.WebApp?.initDataUnsafe?.user;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
  });

  // Redirect if cart is empty
  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  const total = getTotalPrice();

  const handleRequestLocation = async () => {
    setRequestingLocation(true);

    try {
      // Try to use Telegram's location API
      if (window.Telegram?.WebApp?.requestLocation) {
        window.Telegram.WebApp.requestLocation((location) => {
          if (location) {
            setLocationData({
              latitude: location.latitude,
              longitude: location.longitude,
            });
            setValue('location', {
              latitude: location.latitude,
              longitude: location.longitude,
            });
            toast.success('Location captured successfully');
          } else {
            toast.error('Location access denied');
          }
          setRequestingLocation(false);
        });
      } else {
        // Fallback: Use browser geolocation API
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const loc = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              };
              setLocationData(loc);
              setValue('location', loc);
              toast.success('Location captured successfully');
              setRequestingLocation(false);
            },
            (error) => {
              console.error('Geolocation error:', error);
              toast.error('Failed to get location. Please enter address manually.');
              setRequestingLocation(false);
            }
          );
        } else {
          toast.error('Geolocation not supported. Please enter address manually.');
          setRequestingLocation(false);
        }
      }
    } catch (error) {
      console.error('Location request failed:', error);
      toast.error('Failed to request location');
      setRequestingLocation(false);
    }
  };

  const onSubmit = async (data: CheckoutFormData) => {
    setSubmitting(true);

    try {
      // Prepare order items
      const orderItems = items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));

      // Create order
      await createOrder({
        phoneNumber: data.phoneNumber,
        location: locationData || { address: (data as any).address },
        items: orderItems,
      });

      // Clear cart
      clearCart();

      toast.success('Order placed successfully!');

      // Redirect to home
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (error: any) {
      console.error('Order creation failed:', error);
      toast.error(error.response?.data?.error || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/cart')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Checkout</h1>
              <p className="text-sm text-muted-foreground">
                Complete your order
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Delivery Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* User Info */}
                  {user && (
                    <div className="p-4 bg-muted rounded-md">
                      <p className="text-sm font-medium">Ordering as:</p>
                      <p className="text-sm text-muted-foreground">
                        {user.first_name} {user.last_name}
                        {user.username && ` (@${user.username})`}
                      </p>
                    </div>
                  )}

                  {/* Phone Number */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Phone Number <span className="text-destructive">*</span>
                    </label>
                    <Input
                      type="tel"
                      placeholder="+1234567890"
                      {...register('phoneNumber')}
                    />
                    {errors.phoneNumber && (
                      <p className="text-sm text-destructive">
                        {errors.phoneNumber.message}
                      </p>
                    )}
                  </div>

                  {/* Location */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Delivery Location <span className="text-destructive">*</span>
                    </label>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={handleRequestLocation}
                      disabled={requestingLocation || !!locationData}
                    >
                      {requestingLocation ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Requesting Location...
                        </>
                      ) : locationData ? (
                        <>
                          <MapPin className="w-4 h-4 mr-2" />
                          Location Captured ({locationData.latitude.toFixed(4)}, {locationData.longitude.toFixed(4)})
                        </>
                      ) : (
                        <>
                          <MapPin className="w-4 h-4 mr-2" />
                          Share Location
                        </>
                      )}
                    </Button>

                    {!locationData && (
                      <>
                        <p className="text-xs text-muted-foreground text-center">
                          or enter address manually
                        </p>
                        <Input
                          type="text"
                          placeholder="Enter your delivery address"
                          {...register('address' as any)}
                        />
                      </>
                    )}

                    {errors.location && (
                      <p className="text-sm text-destructive">
                        Please provide a location or address
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Placing Order...
                      </>
                    ) : (
                      `Place Order (${formatPrice(total)})`
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.productId} className="flex justify-between text-sm">
                      <span className="text-muted-foreground truncate">
                        {item.name} × {item.quantity}
                      </span>
                      <span className="font-medium">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-2xl font-bold text-primary">
                      {formatPrice(total)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
