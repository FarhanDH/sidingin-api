import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EmailController } from './email.controller';
import { EmailService } from './email.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { EjsAdapter } from '@nestjs-modules/mailer/dist/adapters/ejs.adapter';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { configuration } from '~/common/configuration';
import { configDotenv } from 'dotenv';

configDotenv({ path: '.env' });

@Module({
    imports: [
        MailerModule.forRoot({
            transport: {
                host: configuration().email.host,
                port: configuration().email.port,
                auth: {
                    user: configuration().email.username,
                    pass: configuration().email.password,
                },
                secure: configuration().email.secure,
            },
            defaults: {
                from: `"Cdingin" <${configuration().email.username}>`,
            },
            template: {
                dir: __dirname + '/templates',
                adapter: new HandlebarsAdapter(),
                options: {
                    strict: true,
                },
            },
        }),
        AuthModule,
    ],
    controllers: [EmailController],
    providers: [EmailService],
    exports: [EmailService],
})
export class EmailModule {}
