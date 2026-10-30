export const configuration = () => {
    return {
        env: process.env.NODE_ENV,
        frontendUrl: process.env.FRONTEND_URL,
        domain: process.env.DOMAIN,
        port: process.env.PORT || 3002,
        database: {
            type: process.env.DATABASE_TYPE,
            host: process.env.DATABASE_HOST,
            port: process.env.DATABASE_PORT as unknown as number,
            name: process.env.DATABASE_NAME,
            username: process.env.DATABASE_USERNAME,
            password: process.env.DATABASE_PASSWORD,
            url: process.env.DATABASE_URL,
        },
        jwtConstants: {
            secretAccessToken: process.env.JWT_SECRET_ACCESS_TOKEN,
            secretRefreshToken: process.env.JWT_SECRET_REFRESH_TOKEN,
            accessTokenExpiresIn: Number(
                process.env.JWT_ACCESS_TOKEN_EXPIRATION_TIME,
            ),
            refreshTokenExpiresIn: Number(
                process.env.JWT_REFRESH_TOKEN_EXPIRATION_TIME,
            ),
            issuer: process.env.JWT_ISSUER,
        },
        email: {
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT as unknown as number,
            secure: process.env.EMAIL_SECURE,
            username: process.env.EMAIL_USERNAME,
            password: process.env.EMAIL_PASSWORD,
        },
        webPush: {
            vapidPublicKey: process.env.VAPID_PUBLIC_KEY,
            vapidPrivateKey: process.env.VAPID_PRIVATE_KEY,
            vapidSubject: process.env.VAPID_SUBJECT,
        },
        cron: {
            secret: process.env.CRON_SECRET,
        },
        midtrans: {
            isProduction: process.env
                .MIDTRANS_IS_PRODUCTION as unknown as boolean,
            serverKey: process.env.MIDTRANS_SERVER_KEY,
            clientKey: process.env.MIDTRANS_CLIENT_KEY,
            snapUrl: process.env.MIDTRANS_SANDBOX_SNAP_URL,
            coreUrl: process.env.MIDTRANS_SANDBOX_CORE_URL,
            username: process.env.MIDTRANS_USERNAME,
            password: process.env.MIDTRANS_PASSWORD,
        },
        browserless: {
            apiKey: process.env.BROWSERLESS_API_KEY,
        },
        pusher: {
            appId: process.env.PUSHER_APP_ID,
            key: process.env.PUSHER_KEY,
            secret: process.env.PUSHER_SECRET,
            cluster: process.env.PUSHER_CLUSTER,
            useTLS: process.env.USE_TLS as unknown as boolean,
        },
    };
};
