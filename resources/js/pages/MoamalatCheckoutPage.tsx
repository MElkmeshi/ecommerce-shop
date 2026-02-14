import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useScript } from '@/hooks/use-script';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { AlertCircle, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface PaymentSession {
    id: number;
    order_id: number;
    amount: number;
    amount_with_commission: number;
    provider_session_id: string;
}

interface MoamalatCheckoutPageProps {
    session: PaymentSession;
    amount: number; // in millimes
    referenceId: string;
    mid: string;
    tid: string;
    isProduction: boolean;
}

declare global {
    interface Window {
        Lightbox?: {
            Checkout: {
                configure: any;
                showLightbox: () => void;
            };
        };
    }

    interface WindowEventMap {
        moamalatCompleted: CustomEvent<{ transactionId: string }>;
        moamalatError: CustomEvent<{ error: string }>;
        moamalatCancel: CustomEvent;
    }
}

export default function MoamalatCheckoutPage({
    session,
    amount,
    referenceId,
    mid,
    tid,
    isProduction,
}: MoamalatCheckoutPageProps) {
    const [paymentStatus, setPaymentStatus] = useState<
        'ready' | 'processing' | 'success' | 'failed' | 'cancelled'
    >('ready');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Script URLs based on environment
    const lightboxUrl = isProduction
        ? 'https://npg.moamalat.net:6006/js/lightbox.js'
        : 'https://tnpg.moamalat.net:6006/js/lightbox.js';

    const cryptoJsUrl =
        'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/3.1.9-1/crypto-js.min.js';
    const hmacSha256Url =
        'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/3.1.9-1/hmac-sha256.min.js';

    // Load scripts
    const cryptoScript = useScript(cryptoJsUrl);
    const hmacScript = useScript(hmacSha256Url);
    const lightboxScript = useScript(lightboxUrl);

    const allScriptsLoaded =
        cryptoScript.status === 'ready' &&
        hmacScript.status === 'ready' &&
        lightboxScript.status === 'ready';

    const hasScriptError =
        cryptoScript.status === 'error' ||
        hmacScript.status === 'error' ||
        lightboxScript.status === 'error';

    // Initialize payment when scripts are loaded
    useEffect(() => {
        if (!allScriptsLoaded) return;
        if (!window.Lightbox) {
            setPaymentStatus('failed');
            setErrorMessage('Payment gateway not loaded');
            toast.error('Payment gateway not loaded');
            return;
        }

        // Fetch secure hash and initialize payment
        const initPayment = async () => {
            try {
                // Fetch secure hash from backend
                const url = new URL('/api/moamalat-pay/securekey', window.location.origin);
                url.searchParams.set('MID', mid);
                url.searchParams.set('TID', tid);
                url.searchParams.set('amount', amount.toString());
                url.searchParams.set('merchantReference', referenceId);

                const response = await fetch(url.toString());
                if (!response.ok) {
                    throw new Error(`Failed to fetch secure hash: ${response.status}`);
                }

                const secureHashData = await response.json();

                // Configure Lightbox
                window.Lightbox!.Checkout.configure = {
                    MID: mid,
                    TID: tid,
                    AmountTrxn: amount,
                    MerchantReference: referenceId,
                    TrxDateTime: secureHashData.DateTimeLocalTrxn,
                    SecureHash: secureHashData.secureHash,
                    completeCallback: function (data: any) {
                        window.dispatchEvent(
                            new CustomEvent('moamalatCompleted', {
                                detail: data,
                            })
                        );
                    },
                    errorCallback: function (error: any) {
                        window.dispatchEvent(
                            new CustomEvent('moamalatError', {
                                detail: error,
                            })
                        );
                    },
                    cancelCallback: function () {
                        window.dispatchEvent(new CustomEvent('moamalatCancel'));
                    },
                };

                // Show Lightbox
                window.Lightbox!.Checkout.showLightbox();
            } catch (error) {
                console.error('Failed to initialize Moamalat payment:', error);
                setPaymentStatus('failed');
                setErrorMessage('Failed to initialize payment gateway');
                toast.error('Failed to initialize payment gateway');
            }
        };

        initPayment();
    }, [allScriptsLoaded, mid, tid, amount, referenceId]);

    // Listen for payment events
    useEffect(() => {
        const handleCompleted = async (event: CustomEvent<{ transactionId: string }>) => {
            const transactionId = event.detail.transactionId;
            setPaymentStatus('processing');

            try {
                const response = await axios.post(
                    `/payments/moamalat/client-notify/${session.id}`,
                    {
                        provider_transaction_id: transactionId,
                    },
                    {
                        headers: {
                            'X-CSRF-TOKEN': document
                                .querySelector('meta[name="csrf-token"]')
                                ?.getAttribute('content') || '',
                        },
                    }
                );

                if (response.data.success) {
                    setPaymentStatus('success');
                    toast.success('Payment successful!');

                    // Redirect to orders page after 2 seconds
                    setTimeout(() => {
                        router.visit('/orders');
                    }, 2000);
                } else {
                    setPaymentStatus('failed');
                    setErrorMessage(response.data.message || 'Payment verification failed');
                    toast.error(response.data.message || 'Payment verification failed');
                }
            } catch (error: any) {
                setPaymentStatus('failed');
                const message =
                    error.response?.data?.message ||
                    'Error processing payment verification';
                setErrorMessage(message);
                toast.error(message);
            }
        };

        const handleError = (event: CustomEvent<{ error: string }>) => {
            setPaymentStatus('failed');
            const message = event.detail?.error || 'Payment failed';
            setErrorMessage(message);
            toast.error(message);
        };

        const handleCancel = () => {
            setPaymentStatus('cancelled');
            toast.info('Payment cancelled');
        };

        window.addEventListener('moamalatCompleted', handleCompleted);
        window.addEventListener('moamalatError', handleError);
        window.addEventListener('moamalatCancel', handleCancel);

        return () => {
            window.removeEventListener('moamalatCompleted', handleCompleted);
            window.removeEventListener('moamalatError', handleError);
            window.removeEventListener('moamalatCancel', handleCancel);
        };
    }, [session.id]);

    // Format price helper
    const formatPrice = (price: number): string => {
        return price % 1 === 0 ? price.toString() : price.toFixed(2);
    };

    return (
        <div className="min-h-screen bg-background p-4">
            <div className="mx-auto max-w-2xl">
                <Card>
                    <CardHeader>
                        <CardTitle>Moamalat Payment</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Order Details */}
                        <div className="space-y-2 rounded-lg border p-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Order #</span>
                                <span className="font-medium">{session.order_id}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Amount</span>
                                <span className="font-medium">
                                    {formatPrice(session.amount_with_commission)} LYD
                                </span>
                            </div>
                        </div>

                        {/* Loading State */}
                        {!allScriptsLoaded && !hasScriptError && (
                            <div className="flex flex-col items-center justify-center space-y-4 py-8">
                                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                                <p className="text-sm text-muted-foreground">
                                    Loading payment gateway...
                                </p>
                            </div>
                        )}

                        {/* Script Error */}
                        {hasScriptError && (
                            <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border border-destructive/50 bg-destructive/10 p-6">
                                <AlertCircle className="h-12 w-12 text-destructive" />
                                <div className="text-center">
                                    <p className="font-medium text-destructive">
                                        Failed to load payment gateway
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Please check your internet connection and try again
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Payment Processing */}
                        {paymentStatus === 'processing' && (
                            <div className="flex flex-col items-center justify-center space-y-4 py-8">
                                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                                <p className="text-sm text-muted-foreground">
                                    Verifying payment...
                                </p>
                            </div>
                        )}

                        {/* Payment Success */}
                        {paymentStatus === 'success' && (
                            <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border border-green-500/50 bg-green-500/10 p-6">
                                <CheckCircle2 className="h-12 w-12 text-green-600" />
                                <div className="text-center">
                                    <p className="font-medium text-green-600">
                                        Payment successful!
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Redirecting to your orders...
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Payment Failed */}
                        {paymentStatus === 'failed' && (
                            <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border border-destructive/50 bg-destructive/10 p-6">
                                <XCircle className="h-12 w-12 text-destructive" />
                                <div className="text-center">
                                    <p className="font-medium text-destructive">Payment failed</p>
                                    <p className="text-sm text-muted-foreground">
                                        {errorMessage || 'An error occurred during payment'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                                >
                                    Try Again
                                </button>
                            </div>
                        )}

                        {/* Payment Cancelled */}
                        {paymentStatus === 'cancelled' && (
                            <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border p-6">
                                <AlertCircle className="h-12 w-12 text-muted-foreground" />
                                <div className="text-center">
                                    <p className="font-medium">Payment cancelled</p>
                                    <p className="text-sm text-muted-foreground">
                                        You cancelled the payment process
                                    </p>
                                </div>
                                <button
                                    onClick={() => router.visit('/orders')}
                                    className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                                >
                                    Return to Orders
                                </button>
                            </div>
                        )}

                        {/* Instructions (only show when ready and scripts loaded) */}
                        {allScriptsLoaded &&
                            paymentStatus === 'ready' && (
                                <div className="rounded-lg bg-muted p-4">
                                    <p className="text-sm text-muted-foreground">
                                        The payment window should open automatically. If it doesn't,
                                        please refresh the page.
                                    </p>
                                </div>
                            )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
