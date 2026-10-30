import { addDays, format } from 'date-fns';
import { Request } from 'express';
import haversine from 'haversine-distance';
import ShortUniqueId from 'short-unique-id';
import { JwtPayload } from '~/core/auth/dto/auth.response';

/**
 * Extends the Express Request interface to include a `user` property of type `JwtPayload`.
 * This is useful for accessing the authenticated user's information in request handlers.
 */
export interface RequestWithUser extends Request {
    user: JwtPayload;
}

export const generateUniqueId = (length: number) => {
    const uid = new ShortUniqueId({ length });
    return uid.rnd();
};

/**
 * Return date with format YYYY-MM-DD.
 * @param date -  Date Object to be formatted.
 * @returns string - Date in format 'yyyy-MM-dd'.
 */
export const formatDate = (date: Date): string => {
    return format(date, 'yyyy-MM-dd');
};

/**
 * Get date for 'Todary'
 * @returns string - Today date in format 'yyyy-MM-dd'.
 */
export const getToday = (): string => {
    return formatDate(new Date());
};

/**
 * Get date for "tomorrow".
 * @returns string - Tomorrow date in format 'yyyy-MM-dd'.
 */
export const getTomorrow = (): string => {
    return formatDate(addDays(new Date(), 1));
};

/**
 * Get date for "UpComing" (2 hari dari sekarang).
 * @returns string - 2 Days Upcoming in format 'yyyy-MM-dd'.
 */
export const getUpcoming = (): string => {
    return formatDate(addDays(new Date(), 2));
};

/**
 * Calculates the distance in meters between two geographical points.
 * @param pointA - The first point { lat: number, lng: number }.
 * @param pointB - The second point { lat: number, lng: number }.
 * @returns The distance in meters.
 */
export function calculateDistanceInMeters(
    pointA: { lat: number; lng: number },
    pointB: { lat: number; lng: number },
): number {
    return haversine(pointA, pointB);
}
