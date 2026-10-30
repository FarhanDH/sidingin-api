import {
    Controller,
    Get,
    HttpException,
    HttpStatus,
    Query,
    UseGuards,
} from '@nestjs/common';
import { GeocodingService } from './geocoding.service';
import { JwtGuard } from '../auth/guards/jwt.guard';

@Controller('geocoding')
export class GeocodingController {
    constructor(private readonly geocodingService: GeocodingService) {}

    /**
     * Performs reverse geocoding to get an address from latitude and longitude coordinates.
     * This acts as a proxy to the Nominatim API.
     * @param lat - The latitude.
     * @param lon - The longitude.
     * @returns A promise that resolves to the address details.
     */
    @UseGuards(JwtGuard)
    @Get('reverse')
    async reverseGeocode(@Query('lat') lat: number, @Query('lon') lon: number) {
        try {
            return await this.geocodingService.reverseGeocode(lat, lon);
        } catch (error) {
            throw new HttpException(
                error.message,
                HttpStatus.SERVICE_UNAVAILABLE,
            );
        }
    }
}
