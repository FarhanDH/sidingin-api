import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { RatingService } from './rating.service';
import { RATING_GRPC_CLIENT } from './rating.constans';
import { ChannelCredentials } from '@grpc/grpc-js';

@Module({
    imports: [
        ClientsModule.register([
            {
                name: RATING_GRPC_CLIENT,
                transport: Transport.GRPC,
                options: {
                    package: 'rating',
                    protoPath: join(__dirname, '../../../proto/rating.proto'),
                    url: process.env.RATING_GRPC_URL ?? 'localhost:50051',
                    loader: {
                        keepCase: true,
                    },
                    credentials:
                        process.env.NODE_ENV === 'production'
                            ? ChannelCredentials.createSsl()
                            : ChannelCredentials.createInsecure(),
                },
            },
        ]),
    ],
    providers: [RatingService],
    exports: [RatingService],
})
export class RatingModule {}
