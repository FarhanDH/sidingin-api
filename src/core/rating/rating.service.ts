import { Metadata, status } from '@grpc/grpc-js';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { firstValueFrom, Observable, timeout, TimeoutError } from 'rxjs';
import { ClientGrpc } from '@nestjs/microservices';
import { RATING_GRPC_CLIENT } from './rating.constans';

interface GetBatchRatingStatusResponse {
    statuses: Record<string, string>;
}

interface RatingGrpcContract {
    getBatchRatingStatus(
        data: { orderIds: string[] },
        metadata?: Metadata,
    ): Observable<GetBatchRatingStatusResponse>;
}

@Injectable()
export class RatingService implements OnModuleInit {
    private readonly logger = new Logger(RatingService.name);

    private ratingService!: RatingGrpcContract;

    constructor(
        @Inject(RATING_GRPC_CLIENT) private readonly grpcClient: ClientGrpc,
    ) {}

    onModuleInit() {
        this.ratingService =
            this.grpcClient.getService<RatingGrpcContract>('RatingService');
    }

    async getBatchStatus(
        orderIds: string[],
        accessToken: string,
    ): Promise<Record<string, string>> {
        this.logger.debug(
            `RatingService.getBatchStatus(): Fetching rating status for ${orderIds.length} orders`,
        );
        if (orderIds.length === 0) {
            return {};
        }

        const metadata = new Metadata();

        // Forward verified user access token
        metadata.set('authorization', `Bearer ${accessToken}`);

        try {
            const response = await firstValueFrom(
                this.ratingService
                    .getBatchRatingStatus({ orderIds }, metadata)
                    .pipe(timeout(2000)),
            );

            return response.statuses ?? {};
        } catch (error: unknown) {
            if (this.isDependencyUnavailable(error)) {
                this.logger.warn(
                    'Rating-service is unavailable. ' +
                        'Returning orders without rating status.',
                );

                return {};
            }
            this.logger.error(
                'Failed to retrieve rating statuses',
                error instanceof Error ? error.stack : String(error),
            );

            throw error;
        }
    }

    private isDependencyUnavailable(error: unknown): boolean {
        if (error instanceof TimeoutError) {
            return true;
        }

        if (typeof error === 'object' && error !== null && 'code' in error) {
            const code = (error as { code?: unknown }).code;

            return (
                code === status.UNAVAILABLE || code === status.DEADLINE_EXCEEDED
            );
        }

        return false;
    }
}
