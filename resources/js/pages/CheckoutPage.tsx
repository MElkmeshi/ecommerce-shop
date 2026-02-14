import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCartStore } from '@/store/cartStore';
import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import axios from 'axios';
import { MapPin, Calculator } from 'lucide-react';
import { locationManager } from '@tma.js/sdk';

export default function CheckoutPage() {
  const items = useCartStore((state) => state.items);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);
  const clearCart = useCartStore((state) => state.clearCart);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [plusCode, setPlusCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit_card'>('cash');
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationSupported, setLocationSupported] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [distance, setDistance] = useState<number | null>(null);
  const [creditCardFee, setCreditCardFee] = useState<number>(0);
  const [deliveryMessage, setDeliveryMessage] = useState<string | null>(null);
  const [calculatingFee, setCalculatingFee] = useState(false);

  // Format price helper
  const formatPrice = (price: number): string => {
    return price % 1 === 0 ? price.toString() : price.toFixed(2);
  };

  // Check if Telegram location manager is supported
  useEffect(() => {
    // Only mount if supported
    if (locationManager.isSupported()) {
      locationManager.mount()
        .then(() => {
          setLocationSupported(true);
        })
        .catch((error) => {
          console.log('Failed to mount location manager, will use browser fallback', error);
          setLocationSupported(false);
        });
    } else {
      // Not supported, will use browser fallback
      console.log('Telegram location manager not supported, will use browser fallback');
      setLocationSupported(false);
    }

    return () => {
      if (locationManager.isMounted()) {
        locationManager.unmount();
      }
    };
  }, []);

  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
      );
      const data = await response.json();
      return data.display_name || `${latitude}, ${longitude}`;
    } catch {
      return `${latitude}, ${longitude}`;
    }
  };

  const calculateDeliveryFee = async (lat: number, lng: number) => {
    setCalculatingFee(true);
    try {
      const response = await axios.post('/api/calculate-delivery-fee', {
        latitude: lat,
        longitude: lng,
      });

      const data = response.data;
      setDeliveryFee(data.fee);
      setDistance(data.distance);
      setDeliveryMessage(data.message);

      if (!data.withinRange) {
        toast.error(data.message);
      } else {
        toast.success(`Delivery fee calculated: ${formatPrice(data.fee)} LYD`);
      }
    } catch (error) {
      toast.error('Failed to calculate delivery fee');
      setDeliveryFee(0);
      setDistance(null);
      setDeliveryMessage(null);
    } finally {
      setCalculatingFee(false);
    }
  };

  const calculateFromPlusCode = async () => {
    if (!plusCode.trim()) {
      toast.error('Please enter a Plus Code');
      return;
    }

    setCalculatingFee(true);
    try {
      const response = await axios.post('/api/calculate-delivery-fee-pluscode', {
        plus_code: plusCode,
      });

      const data = response.data;
      setDeliveryFee(data.fee);
      setDistance(data.distance);
      setDeliveryMessage(data.message);

      if (!data.withinRange) {
        toast.error(data.message);
      } else {
        toast.success(`Delivery fee calculated: ${formatPrice(data.fee)} LYD`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to calculate delivery fee from Plus Code');
      setDeliveryFee(0);
      setDistance(null);
      setDeliveryMessage(null);
    } finally {
      setCalculatingFee(false);
    }
  };

  // Calculate credit card fee whenever subtotal or delivery fee or payment method changes
  useEffect(() => {
    if (paymentMethod === 'credit_card') {
      const subtotal = getTotalPrice();
      const total = subtotal + deliveryFee;
      // The credit card fee is a percentage of (subtotal + delivery fee)
      const fee = total * 0.025; // This should come from settings, but hardcoded for now
      setCreditCardFee(fee);
    } else {
      setCreditCardFee(0);
    }
  }, [paymentMethod, deliveryFee, getTotalPrice]);

  const requestLocation = async () => {
    setLocationLoading(true);
    try {
      // Try Telegram Mini App location manager first
      if (locationSupported && locationManager.isMounted()) {
        try {
          const location = await locationManager.requestLocation();
          const addressText = await reverseGeocode(location.latitude, location.longitude);
          setAddress(addressText);
          setLatitude(location.latitude);
          setLongitude(location.longitude);
          toast.success('Location retrieved!');
          setLocationLoading(false);
          // Calculate delivery fee
          await calculateDeliveryFee(location.latitude, location.longitude);
          return;
        } catch (telegramError) {
          console.log('Telegram location failed, falling back to browser', telegramError);
        }
      }

      // Fallback to browser geolocation
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            const addressText = await reverseGeocode(latitude, longitude);
            setAddress(addressText);
            setLatitude(latitude);
            setLongitude(longitude);
            toast.success('Location retrieved!');
            setLocationLoading(false);
            // Calculate delivery fee
            await calculateDeliveryFee(latitude, longitude);
          },
          (error) => {
            toast.error('Failed to get location. Please enter manually.');
            setLocationLoading(false);
          }
        );
      } else {
        toast.error('Location not supported on this device');
        setLocationLoading(false);
      }
    } catch (error) {
      toast.error('Failed to get location');
      setLocationLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate delivery fee was calculated
    if (deliveryFee === 0 && !latitude && !plusCode) {
      toast.error('Please use location or Plus Code to calculate delivery fee');
      return;
    }

    setLoading(true);

    try {
      // Get Telegram WebApp initData
      const initData = (window as any).Telegram?.WebApp?.initData || '';

      const response = await axios.post('/orders', {
        phoneNumber,
        location: {
          address,
          latitude,
          longitude,
          plusCode: plusCode || null,
        },
        paymentMethod,
        items: items.map((item) => ({
          productId: item.productId,
          productVariantId: item.productVariantId,
          quantity: item.quantity,
        })),
      }, {
        headers: {
          'x-telegram-init-data': initData,
        },
      });

      if (response.data.success) {
        toast.success('Order placed successfully!');
        clearCart();
        router.visit('/orders');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    router.visit('/cart');
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold">Checkout</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="0123456789"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  pattern="^0\d{9,10}$"
                />
                <p className="text-xs text-muted-foreground">
                  Must start with 0 and be 10-11 digits
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Delivery Address</Label>
                <div className="flex gap-2">
                  <Input
                    id="address"
                    type="text"
                    placeholder="Enter your full address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={requestLocation}
                    disabled={locationLoading}
                  >
                    <MapPin className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Click the location icon to auto-fill your address and calculate delivery fee
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="plusCode">Plus Code (Optional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="plusCode"
                    type="text"
                    placeholder="8G6X+XX Tripoli"
                    value={plusCode}
                    onChange={(e) => setPlusCode(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={calculateFromPlusCode}
                    disabled={calculatingFee}
                  >
                    <Calculator className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter Plus Code and click calculator to calculate delivery fee
                </p>
              </div>

              {distance !== null && (
                <div className="rounded-lg bg-muted p-3 space-y-1">
                  <p className="text-sm font-medium">Distance: {formatPrice(distance)} km</p>
                  <p className="text-sm font-medium">Delivery Fee: {formatPrice(deliveryFee)} LYD</p>
                  {deliveryMessage && (
                    <p className="text-sm text-muted-foreground">{deliveryMessage}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={paymentMethod} onValueChange={(value: 'cash' | 'credit_card') => setPaymentMethod(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cash" id="cash" />
                  <Label htmlFor="cash" className="cursor-pointer">Cash on Delivery</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="credit_card" id="credit_card" />
                  <Label htmlFor="credit_card" className="cursor-pointer">Credit Card (+2.5% fee)</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {items.map((item, index) => (
                <div key={`${item.productId}-${item.productVariantId || index}`} className="flex justify-between text-sm">
                  <span>
                    {item.name}{item.variantDisplay ? ` - ${item.variantDisplay}` : ''} × {item.quantity}
                  </span>
                  <span>{formatPrice(item.price * item.quantity)} LYD</span>
                </div>
              ))}
              <div className="flex justify-between border-t pt-2 text-sm">
                <span>Subtotal</span>
                <span>{formatPrice(getTotalPrice())} LYD</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Delivery Fee</span>
                <span>{formatPrice(deliveryFee)} LYD</span>
              </div>
              {paymentMethod === 'credit_card' && creditCardFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Credit Card Fee (2.5%)</span>
                  <span>{formatPrice(creditCardFee)} LYD</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2 font-bold">
                <span>Total</span>
                <span>{formatPrice(getTotalPrice() + deliveryFee + creditCardFee)} LYD</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? 'Placing Order...' : 'Place Order'}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  );
}
