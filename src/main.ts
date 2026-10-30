import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { join } from 'path';
import { AppModule } from './app.module';
import { configuration } from './common/configuration';
import {
    DocumentBuilder,
    SwaggerDocumentOptions,
    SwaggerModule,
} from '@nestjs/swagger';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
        logger: ['log', 'error', 'warn', 'debug', 'verbose'],
    });
    const logger: Logger = new Logger('Info');

    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            forbidNonWhitelisted: true,
            whitelist: true,
        }),
    );

    const frontendUrl =
        configuration().env === 'production'
            ? configuration().frontendUrl
            : 'http://localhost:5173';

    app.use(cookieParser());

    app.enableCors({
        origin: [frontendUrl],
        methods: 'GET, HEAD, PUT, POST, DELETE, OPTIONS, PATCH',
        credentials: true,
        allowedHeaders:
            'Cookie, Set-Cookie, Authorization, Origin, X-Requested-With, Content-Type, Accept, Authentication, Access-control-allow-credentials, Access-control-allow-headers, Access-control-allow-methods, Access-control-allow-origin, User-Agent, Referer, Accept-Encoding, Accept-Language, Access-Control-Request-Headers, Cache-Control, Pragma',
    });

    app.set('trust proxy', 1);
    app.setGlobalPrefix('api');
    logger.log(`CORS allowed origin: ${frontendUrl}`);

    app.useStaticAssets(
        join(__dirname, '..', 'src/core/email/templates/assets'),
    );
    app.setBaseViewsDir(join(__dirname, '..', 'src/core/email/templates'));
    app.setViewEngine('hbs');

    const config = new DocumentBuilder()
        .addBearerAuth()
        .setTitle('Cdingin API Documentation')
        .setDescription('The Cdingin API description')
        .setExternalDoc(
            'Click here to view the source code',
            'https://github.com/FarhanDH/cdingin/blob/main/README.md',
        )
        .setVersion('1.0')
        .addTag('Test')
        .build();

    const documentFactory = () => SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, documentFactory);

    await app
        .listen(configuration().port)
        .then(() =>
            logger.log(`server started 🚀 on port ${configuration().port}`),
        );
}
bootstrap();
