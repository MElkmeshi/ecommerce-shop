import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import axios from 'axios';
import { Save, Settings as SettingsIcon } from 'lucide-react';
import AdminLayout from '@/layouts/admin-layout';
import { Head } from '@inertiajs/react';

interface Settings {
    base_delivery_fee: number;
    delivery_distance_threshold_km: number;
    extra_fee_per_km: number;
    max_delivery_distance_km: number;
    credit_card_enabled: boolean;
    credit_card_charge_percentage: number;
    store_latitude: number;
    store_longitude: number;
    google_maps_api_key: string | null;
}

function AdminSettingsPage() {
    const [settings, setSettings] = useState<Settings>({
        base_delivery_fee: 0,
        delivery_distance_threshold_km: 0,
        extra_fee_per_km: 0,
        max_delivery_distance_km: 0,
        credit_card_enabled: false,
        credit_card_charge_percentage: 0,
        store_latitude: 0,
        store_longitude: 0,
        google_maps_api_key: null,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await axios.get('/admin/api/settings');
            setSettings(response.data.settings);
        } catch (error) {
            toast.error('Failed to fetch settings');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: keyof Settings, value: string | boolean) => {
        setSettings((prev) => ({
            ...prev,
            [field]:
                typeof value === 'boolean'
                    ? value
                    : field === 'google_maps_api_key'
                    ? value
                    : parseFloat(value as string) || 0,
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await axios.put('/admin/api/settings', settings);
            toast.success('Settings updated successfully');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <Head title="Settings" />
                <div className="flex items-center justify-center h-96">
                    <div className="text-muted-foreground">Loading settings...</div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <Head title="Settings" />
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                        <p className="text-muted-foreground">Manage delivery fees, payment methods, and store configuration</p>
                    </div>
                    <Button onClick={handleSave} disabled={saving}>
                        <Save className="mr-2 h-4 w-4" />
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>

                <div className="grid gap-6">
                    {/* Delivery Fee Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Delivery Fee Settings</CardTitle>
                            <CardDescription>Configure delivery fee calculation based on distance</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="base_delivery_fee">Base Delivery Fee (LYD)</Label>
                                    <Input
                                        id="base_delivery_fee"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={settings.base_delivery_fee}
                                        onChange={(e) => handleChange('base_delivery_fee', e.target.value)}
                                        placeholder="5.00"
                                    />
                                    <p className="text-sm text-muted-foreground">Base fee applied to all deliveries</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="delivery_distance_threshold_km">Distance Threshold (km)</Label>
                                    <Input
                                        id="delivery_distance_threshold_km"
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        value={settings.delivery_distance_threshold_km}
                                        onChange={(e) => handleChange('delivery_distance_threshold_km', e.target.value)}
                                        placeholder="5.0"
                                    />
                                    <p className="text-sm text-muted-foreground">Distance included in base fee</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="extra_fee_per_km">Extra Fee Per km (LYD)</Label>
                                    <Input
                                        id="extra_fee_per_km"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={settings.extra_fee_per_km}
                                        onChange={(e) => handleChange('extra_fee_per_km', e.target.value)}
                                        placeholder="1.00"
                                    />
                                    <p className="text-sm text-muted-foreground">Additional fee per km beyond threshold</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="max_delivery_distance_km">Max Delivery Distance (km)</Label>
                                    <Input
                                        id="max_delivery_distance_km"
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        value={settings.max_delivery_distance_km}
                                        onChange={(e) => handleChange('max_delivery_distance_km', e.target.value)}
                                        placeholder="20.0"
                                    />
                                    <p className="text-sm text-muted-foreground">Maximum distance for deliveries</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Payment Settings</CardTitle>
                            <CardDescription>Configure payment method fees</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="credit_card_enabled"
                                    checked={settings.credit_card_enabled}
                                    onCheckedChange={(checked) =>
                                        handleChange('credit_card_enabled', checked === true)
                                    }
                                />
                                <div className="grid gap-1.5 leading-none">
                                    <Label
                                        htmlFor="credit_card_enabled"
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                    >
                                        Enable Credit Card Payments
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Allow customers to pay with credit cards via Moamalat
                                    </p>
                                </div>
                            </div>

                            {settings.credit_card_enabled && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="credit_card_charge_percentage">Credit Card Fee (%)</Label>
                                        <Input
                                            id="credit_card_charge_percentage"
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            max="100"
                                            value={settings.credit_card_charge_percentage}
                                            onChange={(e) => handleChange('credit_card_charge_percentage', e.target.value)}
                                            placeholder="2.5"
                                        />
                                        <p className="text-sm text-muted-foreground">Additional charge for credit card payments</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Store Location */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Store Location</CardTitle>
                            <CardDescription>Configure your store's coordinates for distance calculations</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="store_latitude">Latitude</Label>
                                    <Input
                                        id="store_latitude"
                                        type="number"
                                        step="0.0001"
                                        min="-90"
                                        max="90"
                                        value={settings.store_latitude}
                                        onChange={(e) => handleChange('store_latitude', e.target.value)}
                                        placeholder="32.8872"
                                    />
                                    <p className="text-sm text-muted-foreground">Store latitude coordinate</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="store_longitude">Longitude</Label>
                                    <Input
                                        id="store_longitude"
                                        type="number"
                                        step="0.0001"
                                        min="-180"
                                        max="180"
                                        value={settings.store_longitude}
                                        onChange={(e) => handleChange('store_longitude', e.target.value)}
                                        placeholder="13.1913"
                                    />
                                    <p className="text-sm text-muted-foreground">Store longitude coordinate</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Google Maps API */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Google Maps API</CardTitle>
                            <CardDescription>Configure Google Maps API for distance calculations and geocoding</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="google_maps_api_key">API Key</Label>
                                <Input
                                    id="google_maps_api_key"
                                    type="text"
                                    value={settings.google_maps_api_key || ''}
                                    onChange={(e) => handleChange('google_maps_api_key', e.target.value)}
                                    placeholder="Your Google Maps API Key"
                                />
                                <p className="text-sm text-muted-foreground">
                                    Required for distance calculations and Plus Code support
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}

export default AdminSettingsPage;
