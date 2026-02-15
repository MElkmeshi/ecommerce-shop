import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCartStore } from '@/store/cartStore';
import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import axios from 'axios';
import { MapPin, Calculator, Home, Package } from 'lucide-react';
import { locationManager } from '@tma.js/sdk';

export default function CheckoutPage() {
    const items = useCartStore((state) => state.items);
    const getTotalPrice = useCartStore((state) => state.getTotalPrice);
    const clearCart = useCartStore((state) => state.clearCart);

    const [phoneNumber, setPhoneNumber] = useState('');
    const [address, setAddress] = useState('');
    const [plusCode, setPlusCode] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit_card'>(
        'cash',
    );
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
    const [hasLocationCoordinates, setHasLocationCoordinates] = useState(false);
    const [showPlusCodeField, setShowPlusCodeField] = useState(false);

    // Format price helper
    const formatPrice = (price: number | null | undefined): string => {
        if (price === null || price === undefined || isNaN(price)) {
            return '0';
        }
        return price % 1 === 0 ? price.toString() : price.toFixed(2);
    };

    // Extract Plus Code from Google Maps link or resolve shortened URL
    const extractPlusCodeFromLink = async (
        input: string,
    ): Promise<string | null> => {
        // Check if input looks like a Google Maps link
        if (
            input.includes('maps.google.com') ||
            input.includes('maps.app.goo.gl') ||
            input.includes('goo.gl')
        ) {
            // First, try to extract Plus Code directly from URL
            const plusCodeMatch = input.match(
                /([23456789C][23456789CFGHJMPQRV][23456789CFGHJMPQRVWX]{6}\+[23456789CFGHJMPQRVWX]{2,3})/i,
            );
            if (plusCodeMatch) {
                return decodeURIComponent(plusCodeMatch[1]);
            }

            // If it's a shortened link, resolve it using the backend API
            if (input.includes('goo.gl') || input.includes('maps.app.goo.gl')) {
                try {
                    const response = await axios.post(
                        '/api/resolve-maps-link',
                        { url: input },
                    );

                    if (response.data.success) {
                        // If we got a Plus Code, return it
                        if (response.data.plusCode) {
                            return response.data.plusCode;
                        }
                        // If we got coordinates instead, use them directly
                        if (response.data.coordinates) {
                            const { lat, lng } = response.data.coordinates;
                            setLatitude(lat);
                            setLongitude(lng);
                            setHasLocationCoordinates(true);
                            await calculateDeliveryFee(lat, lng);
                            return null; // Don't set Plus Code, we're using coordinates
                        }
                    }
                    toast.error(
                        response.data.error ||
                            'Could not extract location from the link',
                    );
                    return null;
                } catch (error: any) {
                    console.error('Failed to resolve shortened URL:', error);
                    toast.error(
                        error.response?.data?.error ||
                            'Could not resolve shortened link.',
                    );
                    return null;
                }
            }
        }
        return null;
    };

    const handlePlusCodeChange = async (value: string) => {
        setPlusCode(value);

        // Check if it's a Google Maps link
        if (value.includes('maps.google.com') || value.includes('goo.gl')) {
            const extracted = await extractPlusCodeFromLink(value);
            if (extracted) {
                setPlusCode(extracted);
                toast.success(`Plus Code extracted: ${extracted}`);
            }
        }
    };

    // Check if Telegram location manager is supported
    useEffect(() => {
        // Only mount if supported
        if (locationManager.isSupported()) {
            locationManager
                .mount()
                .then(() => {
                    setLocationSupported(true);
                })
                .catch((error) => {
                    console.log(
                        'Failed to mount location manager, will use browser fallback',
                        error,
                    );
                    setLocationSupported(false);
                });
        } else {
            // Not supported, will use browser fallback
            console.log(
                'Telegram location manager not supported, will use browser fallback',
            );
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
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
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

            // Check if response contains an error
            if (data.error) {
                toast.error(data.error);
                setDeliveryFee(0);
                setDistance(null);
                setDeliveryMessage(null);
                return;
            }

            setDeliveryFee(data.fee ?? 0);
            setDistance(data.distance ?? null);
            setDeliveryMessage(data.message ?? null);

            if (!data.withinRange) {
                toast.error(data.message);
            } else {
                toast.success(
                    `Delivery fee calculated: ${formatPrice(data.fee)} LYD`,
                );
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
            const response = await axios.post(
                '/api/calculate-delivery-fee-pluscode',
                {
                    plus_code: plusCode,
                },
            );

            const data = response.data;

            // Check if response contains an error
            if (data.error) {
                toast.error(data.error);
                setDeliveryFee(0);
                setDistance(null);
                setDeliveryMessage(null);
                return;
            }

            setDeliveryFee(data.fee ?? 0);
            setDistance(data.distance ?? null);
            setDeliveryMessage(data.message ?? null);

            if (!data.withinRange) {
                toast.error(data.message);
            } else {
                toast.success(
                    `Delivery fee calculated: ${formatPrice(data.fee)} LYD`,
                );
            }
        } catch (error: any) {
            toast.error(
                error.response?.data?.error ||
                    'Failed to calculate delivery fee from Plus Code',
            );
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
                    if (location) {
                        const addressText = await reverseGeocode(
                            location.latitude,
                            location.longitude,
                        );
                        setAddress(addressText);
                        setLatitude(location.latitude);
                        setLongitude(location.longitude);
                        setHasLocationCoordinates(true);
                        toast.success('Location retrieved!');
                        setLocationLoading(false);
                        // Calculate delivery fee
                        await calculateDeliveryFee(
                            location.latitude,
                            location.longitude,
                        );
                        return;
                    }
                } catch (telegramError) {
                    console.log(
                        'Telegram location failed, falling back to browser',
                        telegramError,
                    );
                }
            }

            // Fallback to browser geolocation
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const { latitude, longitude } = position.coords;
                        const addressText = await reverseGeocode(
                            latitude,
                            longitude,
                        );
                        setAddress(addressText);
                        setLatitude(latitude);
                        setLongitude(longitude);
                        setHasLocationCoordinates(true);
                        toast.success('Location retrieved!');
                        setLocationLoading(false);
                        // Calculate delivery fee
                        await calculateDeliveryFee(latitude, longitude);
                    },
                    (_error) => {
                        toast.error(
                            'Failed to get location. Please use Plus Code below.',
                        );
                        setShowPlusCodeField(true);
                        setLocationLoading(false);
                    },
                );
            } else {
                toast.error(
                    'Location not supported. Please use Plus Code below.',
                );
                setShowPlusCodeField(true);
                setLocationLoading(false);
            }
        } catch (error) {
            toast.error('Failed to get location. Please use Plus Code below.');
            setShowPlusCodeField(true);
            setLocationLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Validate delivery fee was calculated
        if (deliveryFee === 0 && !latitude && !plusCode) {
            toast.error(
                'Please use location or Plus Code to calculate delivery fee',
            );
            return;
        }

        setLoading(true);

        try {
            // Axios interceptor will automatically add x-telegram-init-data header
            const response = await axios.post('/orders', {
                phoneNumber,
                location: {
                    address: address || null,
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
            });

            if (response.data.success) {
                toast.success('Order placed successfully!');
                clearCart();

                // If credit card payment, redirect to payment page
                if (
                    response.data.payment &&
                    response.data.payment.redirect_url
                ) {
                    window.location.href = response.data.payment.redirect_url;
                } else {
                    // Cash on delivery, go to orders page
                    router.visit('/orders');
                }
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
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Checkout</h1>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => (window.location.href = '/')}
                        >
                            <Home className="mr-2 h-4 w-4" />
                            Products
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => (window.location.href = '/orders')}
                        >
                            <Package className="mr-2 h-4 w-4" />
                            Orders
                        </Button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Delivery Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="phoneNumber">
                                    Phone Number
                                </Label>
                                <Input
                                    id="phoneNumber"
                                    type="tel"
                                    placeholder="0123456789"
                                    value={phoneNumber}
                                    onChange={(e) =>
                                        setPhoneNumber(e.target.value)
                                    }
                                    required
                                    pattern="^0\d{9,10}$"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Must start with 0 and be 10-11 digits
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="location">
                                    Delivery Location
                                </Label>
                                {!showPlusCodeField ? (
                                    <>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={requestLocation}
                                            disabled={locationLoading}
                                            className="w-full"
                                        >
                                            <MapPin className="mr-2 h-4 w-4" />
                                            {locationLoading
                                                ? 'Getting location...'
                                                : hasLocationCoordinates
                                                  ? 'Location retrieved ✓'
                                                  : 'Use my current location'}
                                        </Button>
                                        <p className="text-xs text-muted-foreground">
                                            Click to share your location and
                                            calculate delivery fee
                                        </p>
                                    </>
                                ) : (
                                    <p className="text-xs text-muted-foreground">
                                        Using Plus Code for delivery location
                                    </p>
                                )}
                            </div>

                            {showPlusCodeField && (
                                <div className="space-y-2">
                                    <Label htmlFor="plusCode">
                                        Plus Code or Google Maps Link
                                    </Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="plusCode"
                                            type="text"
                                            placeholder="8G6X+XX Tripoli or paste Google Maps link"
                                            value={plusCode}
                                            onChange={(e) =>
                                                handlePlusCodeChange(
                                                    e.target.value,
                                                )
                                            }
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
                                        Enter Plus Code (e.g., 8G6X+XX Tripoli)
                                        or paste a Google Maps link. Click
                                        calculator to get delivery fee.
                                    </p>
                                </div>
                            )}

                            {distance !== null && (
                                <div className="space-y-1 rounded-lg bg-muted p-3">
                                    <p className="text-sm font-medium">
                                        Distance: {formatPrice(distance)} km
                                    </p>
                                    <p className="text-sm font-medium">
                                        Delivery Fee: {formatPrice(deliveryFee)}{' '}
                                        LYD
                                    </p>
                                    {deliveryMessage && (
                                        <p className="text-sm text-muted-foreground">
                                            {deliveryMessage}
                                        </p>
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
                            <RadioGroup
                                value={paymentMethod}
                                onValueChange={(
                                    value: 'cash' | 'credit_card',
                                ) => setPaymentMethod(value)}
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="cash" id="cash" />
                                    <Label
                                        htmlFor="cash"
                                        className="cursor-pointer"
                                    >
                                        Cash on Delivery
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem
                                        value="credit_card"
                                        id="credit_card"
                                    />
                                    <Label
                                        htmlFor="credit_card"
                                        className="cursor-pointer"
                                    >
                                        Credit Card (+2.5% fee)
                                    </Label>
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
                                <div
                                    key={`${item.productId}-${item.productVariantId || index}`}
                                    className="flex justify-between text-sm"
                                >
                                    <span>
                                        {item.name}
                                        {item.variantDisplay
                                            ? ` - ${item.variantDisplay}`
                                            : ''}{' '}
                                        × {item.quantity}
                                    </span>
                                    <span>
                                        {formatPrice(
                                            item.price * item.quantity,
                                        )}{' '}
                                        LYD
                                    </span>
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
                            {paymentMethod === 'credit_card' &&
                                creditCardFee > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span>Credit Card Fee (2.5%)</span>
                                        <span>
                                            {formatPrice(creditCardFee)} LYD
                                        </span>
                                    </div>
                                )}
                            <div className="flex justify-between border-t pt-2 font-bold">
                                <span>Total</span>
                                <span>
                                    {formatPrice(
                                        getTotalPrice() +
                                            deliveryFee +
                                            creditCardFee,
                                    )}{' '}
                                    LYD
                                </span>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button
                                type="submit"
                                className="w-full"
                                size="lg"
                                disabled={loading}
                            >
                                {loading ? 'Placing Order...' : 'Place Order'}
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </div>
        </div>
    );
}
