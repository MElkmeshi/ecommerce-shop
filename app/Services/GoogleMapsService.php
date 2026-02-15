<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GoogleMapsService
{
    public function __construct(
        private readonly string $apiKey
    ) {}

    /**
     * Calculate distance between two points in kilometers
     *
     * @return float|null Distance in kilometers or null on error
     */
    public function calculateDistance(
        float $originLat,
        float $originLng,
        float $destLat,
        float $destLng
    ): ?float {
        $cacheKey = "distance:{$originLat},{$originLng}|{$destLat},{$destLng}";

        return Cache::remember($cacheKey, now()->addDay(), function () use ($originLat, $originLng, $destLat, $destLng): ?float {
            $response = Http::get('https://maps.googleapis.com/maps/api/distancematrix/json', [
                'origins' => "{$originLat},{$originLng}",
                'destinations' => "{$destLat},{$destLng}",
                'mode' => 'driving',
                'key' => $this->apiKey,
            ]);

            if (! $response->ok()) {
                Log::error('Google Maps API request failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return null;
            }

            $json = $response->json();

            if (($json['status'] ?? '') !== 'OK') {
                Log::error('Google Maps API returned non-OK status', [
                    'status' => $json['status'] ?? 'UNKNOWN',
                    'error_message' => $json['error_message'] ?? 'No error message',
                    'response' => $json,
                ]);

                return null;
            }

            $rows = $json['rows'] ?? [];
            if (empty($rows)) {
                Log::error('Google Maps API returned empty rows', ['response' => $json]);

                return null;
            }

            $elements = $rows[0]['elements'] ?? [];
            if (empty($elements)) {
                Log::error('Google Maps API returned empty elements', ['response' => $json]);

                return null;
            }

            $element = $elements[0];
            if (($element['status'] ?? '') !== 'OK') {
                Log::error('Google Maps API element status not OK', [
                    'element_status' => $element['status'] ?? 'UNKNOWN',
                    'element' => $element,
                ]);

                return null;
            }

            // Distance is in meters, convert to kilometers
            $distanceMeters = $element['distance']['value'] ?? null;

            return $distanceMeters ? $distanceMeters / 1000 : null;
        });
    }

    /**
     * Calculate distance from Plus Code to coordinates
     *
     * @return float|null Distance in kilometers or null on error
     */
    public function calculateDistanceFromPlusCode(
        string $plusCode,
        float $destLat,
        float $destLng
    ): ?float {
        // First, geocode the Plus Code to get coordinates
        $coordinates = $this->geocodePlusCode($plusCode);

        if (! $coordinates) {
            return null;
        }

        return $this->calculateDistance(
            $coordinates['lat'],
            $coordinates['lng'],
            $destLat,
            $destLng
        );
    }

    /**
     * Geocode a Plus Code to coordinates
     *
     * @return array{lat: float, lng: float}|null
     */
    public function geocodePlusCode(string $plusCode): ?array
    {
        $cacheKey = "pluscode:{$plusCode}";

        return Cache::remember($cacheKey, now()->addWeek(), function () use ($plusCode): ?array {
            $response = Http::get('https://maps.googleapis.com/maps/api/geocode/json', [
                'address' => $plusCode,
                'key' => $this->apiKey,
            ]);

            if (! $response->ok()) {
                Log::error('Google Maps Geocoding API request failed', [
                    'plus_code' => $plusCode,
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return null;
            }

            $json = $response->json();

            if (($json['status'] ?? '') !== 'OK') {
                Log::error('Google Maps Geocoding API returned non-OK status', [
                    'plus_code' => $plusCode,
                    'status' => $json['status'] ?? 'UNKNOWN',
                    'error_message' => $json['error_message'] ?? 'No error message',
                    'response' => $json,
                ]);

                return null;
            }

            $results = $json['results'] ?? [];
            if (empty($results)) {
                Log::error('Google Maps Geocoding API returned empty results', [
                    'plus_code' => $plusCode,
                    'response' => $json,
                ]);

                return null;
            }

            $location = $results[0]['geometry']['location'] ?? null;
            if (! $location) {
                Log::error('Google Maps Geocoding API missing location', [
                    'plus_code' => $plusCode,
                    'result' => $results[0],
                ]);

                return null;
            }

            return [
                'lat' => $location['lat'],
                'lng' => $location['lng'],
            ];
        });
    }
}
