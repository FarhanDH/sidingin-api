import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePushSubscriptionsTableRelatedToUsersTable1756383410423 implements MigrationInterface {
    name = 'CreatePushSubscriptionsTableRelatedToUsersTable1756383410423'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "push_subscriptions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "endpoint" text NOT NULL,
                "p256dh" text NOT NULL,
                "auth" text NOT NULL,
                "expirationTime" TIMESTAMP WITH TIME ZONE,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "userId" uuid,
                CONSTRAINT "UQ_0008bdfd174e533a3f98bf9af16" UNIQUE ("endpoint"),
                CONSTRAINT "PK_757fc8f00c34f66832668dc2e53" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "push_subscriptions"
            ADD CONSTRAINT "FK_4cc061875e9eecc311a94b3e431" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "push_subscriptions" DROP CONSTRAINT "FK_4cc061875e9eecc311a94b3e431"
        `);
        await queryRunner.query(`
            DROP TABLE "push_subscriptions"
        `);
    }

}
