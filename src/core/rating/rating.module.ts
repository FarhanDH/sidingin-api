import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ChannelCredentials } from '@grpc/grpc-js';
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { configDotenv } from 'dotenv';
import { join } from 'path';
import { configuration } from '~/common/configuration';
import { RATING_GRPC_CLIENT } from './rating.constans';
import { RatingService } from './rating.service';
configDotenv({ path: '.env' });

@Module({
    imports: [
        ClientsModule.register([
            // GRPC client
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
        RabbitMQModule.forRoot({
            uri: configuration().messages.rabbitMqUrl,
            connectionInitOptions: { wait: false },
        }),
    ],
    providers: [RatingService],
    exports: [RatingService],
})
export class RatingModule {}
