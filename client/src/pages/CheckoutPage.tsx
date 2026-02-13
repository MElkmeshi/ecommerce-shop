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

    // Debug info
    const telegramAvailable = !!window.Telegram?.WebApp;
    const locationAPIAvailable = !!window.Telegram?.WebApp?.requestLocation;
    const browserGeoAvailable = !!navigator.geolocation;

    try {
      // Try to use Telegram's location API
      if (window.Telegram?.WebApp?.requestLocation) {
        console.log('📍 Requesting location via Telegram WebApp...');
        toast.info('📍 Using Telegram location API...', { duration: 2000 });

        window.Telegram.WebApp.requestLocation((location) => {
          if (location) {
            console.log('✅ Location received:', location);
            setLocationData({
              latitude: location.latitude,
              longitude: location.longitude,
            });
            setValue('location', {
              latitude: location.latitude,
              longitude: location.longitude,
            });
            toast.success(`✅ Location: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`);
          } else {
            console.warn('⚠️ Location access denied by user');
            toast.error('❌ Telegram: Location access denied. Please enter address manually.', { duration: 6000 });
          }
          setRequestingLocation(false);
        });
      } else {
        // Show debug info
        toast.warning(
          `⚠️ Telegram location API not available.\n` +
          `Telegram: ${telegramAvailable ? 'Yes' : 'No'}\n` +
          `Location API: ${locationAPIAvailable ? 'Yes' : 'No'}\n` +
          `Browser Geo: ${browserGeoAvailable ? 'Yes' : 'No'}`,
          { duration: 5000 }
        );

        // Fallback: Use browser geolocation API
        console.log('📍 Telegram location API not available, using browser geolocation...');
        if (navigator.geolocation) {
          toast.info('📍 Using browser geolocation...', { duration: 2000 });

          navigator.geolocation.getCurrentPosition(
            (position) => {
              console.log('✅ Browser location received:', position.coords);
              const loc = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              };
              setLocationData(loc);
              setValue('location', loc);
              toast.success(`✅ Location: ${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`);
              setRequestingLocation(false);
            },
            (error) => {
              console.error('❌ Geolocation error:', error);
              let errorMsg = '❌ Geolocation failed:\n';

              switch (error.code) {
                case error.PERMISSION_DENIED:
                  errorMsg += 'Code 1: Permission denied\n';
                  console.error('Error code: PERMISSION_DENIED (1)');
                  break;
                case error.POSITION_UNAVAILABLE:
                  errorMsg += 'Code 2: Position unavailable\n';
                  console.error('Error code: POSITION_UNAVAILABLE (2)');
                  break;
                case error.TIMEOUT:
                  errorMsg += 'Code 3: Request timeout\n';
                  console.error('Error code: TIMEOUT (3)');
                  break;
                default:
                  errorMsg += `Code ${error.code}: Unknown error\n`;
                  console.error('Error code:', error.code);
              }

              errorMsg += `Message: ${error.message}\n`;
              errorMsg += 'Please enter address manually.';
              console.error('Error message:', error.message);
              toast.error(errorMsg, { duration: 8000 });
              setRequestingLocation(false);
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0,
            }
          );
        } else {
          console.error('❌ Geolocation not supported by browser');
          toast.error(
            '❌ Geolocation not supported\n' +
            'Your browser/app does not support location.\n' +
            'Please enter address manually.',
            { duration: 6000 }
          );
          setRequestingLocation(false);
        }
      }
    } catch (error: any) {
      console.error('❌ Location request exception:', error);
      toast.error(
        `❌ Exception occurred:\n` +
        `Type: ${error.name || 'Unknown'}\n` +
        `Message: ${error.message || 'No message'}\n` +
        `Stack: ${error.stack?.substring(0, 100) || 'N/A'}\n` +
        'Please enter address manually.',
        { duration: 8000 }
      );
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
