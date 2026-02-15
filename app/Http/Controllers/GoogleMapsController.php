<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class GoogleMapsController extends Controller
{
    /**
     * Resolve a shortened Google Maps link to extract the Plus Code.
     */
    public function resolveShortenedLink(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'url' => 'required|url',
        ]);

        $url = $validated['url'];

        // Check if it's a Google Maps link
        if (! str_contains($url, 'maps.google.com') && ! str_contains($url, 'goo.gl') && ! str_contains($url, 'maps.app.goo.gl')) {
            return response()->json([
                'success' => false,
                'error' => 'Not a valid Google Maps link',
            ], 400);
        }

        try {
            // Follow redirects to get the final URL
            $response = Http::withOptions([
                'allow_redirects' => [
                    'max' => 10,
                    'track_redirects' => true,
                ],
            ])->get($url);

            $finalUrl = $response->effectiveUri()->__toString();

            // Try to extract Plus Code from the final URL
            // Plus Code format: 8 chars + plus sign + 2-3 chars (e.g., 8G6X+XX or R6H7+F8)
            if (preg_match('/([23456789C][23456789CFGHJMPQRV][23456789CFGHJMPQRVWX]{6}\+[23456789CFGHJMPQRVWX]{2,3})/i', $finalUrl, $matches)) {
                $plusCode = urldecode($matches[1]);

                return response()->json([
                    'success' => true,
                    'plusCode' => $plusCode,
                    'finalUrl' => $finalUrl,
                ]);
            }

            // Decode the URL first to handle encoded parameters
            $decodedUrl = urldecode($finalUrl);

            // Try to extract coordinates from the URL
            // Format: /search/32.828373,+13.213278 or /@32.828373,13.213278
            if (preg_match('/[\/\@](-?\d+\.\d+),\s*[\+%2B]?(-?\d+\.\d+)/', $decodedUrl, $coordMatches)) {
                $latitude = (float) $coordMatches[1];
                $longitude = (float) $coordMatches[2];

                // Use Google Maps Geocoding API to convert coordinates to Plus Code
                $apiKey = config('services.google_maps.api_key');
                if ($apiKey) {
                    $geocodeResponse = \Illuminate\Support\Facades\Http::get('https://maps.googleapis.com/maps/api/geocode/json', [
                        'latlng' => "{$latitude},{$longitude}",
                        'key' => $apiKey,
                    ]);

                    if ($geocodeResponse->successful()) {
                        $data = $geocodeResponse->json();
                        if (isset($data['plus_code']['global_code'])) {
                            return response()->json([
                                'success' => true,
                                'plusCode' => $data['plus_code']['global_code'],
                                'finalUrl' => $finalUrl,
                                'coordinates' => ['lat' => $latitude, 'lng' => $longitude],
                            ]);
                        }
                    }
                }

                // If API call fails or no Plus Code, return coordinates as success
                // The frontend can use coordinates to calculate delivery fee
                return response()->json([
                    'success' => true,
                    'plusCode' => null,
                    'coordinates' => ['lat' => $latitude, 'lng' => $longitude],
                    'finalUrl' => $finalUrl,
                ]);
            }

            return response()->json([
                'success' => false,
                'error' => 'Could not extract Plus Code or coordinates from the URL',
                'finalUrl' => $finalUrl,
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to resolve URL: '.$e->getMessage(),
            ], 500);
        }
    }
}
