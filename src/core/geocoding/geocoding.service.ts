import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class GeocodingService {
    constructor(private readonly httpService: HttpService) {}
    private readonly logger = new Logger(GeocodingService.name);

    /**
     * Fetches address details from the Nominatim API based on latitude and longitude.
     * It includes a custom User-Agent header as required by Nominatim's usage policy.
     * @param lat - The latitude.
     * @param lon - The longitude.
     * @returns A promise that resolves with the geocoding result from Nominatim.
     */
    async reverseGeocode(lat: number, lon: number): Promise<any> {
        const url = 'https://nominatim.openstreetmap.org/reverse';
        try {
            const { data } = await firstValueFrom(
                this.httpService.get(url, {
                    params: {
                        lat,
                        lon,
                        format: 'json',
                        'accept-language': 'id',
                    },
                    headers: {
                        'User-Agent': 'CdinginApp/1.0 (iniwaksunari@gmail.com)',
                    },
                }),
            );
            console.log(data);
            return data;
        } catch (error) {
            this.logger.error(`Failed to reverse geocode: ${error.message}`);
            throw new Error(
                'Gagal mengambil detail alamat dari server eksternal.',
            );
        }
    }
}
