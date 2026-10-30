import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateNotificationsAndNotificationReadsTablesRelatedToUsersAndOrdersTables1756901767711 implements MigrationInterface {
    name = 'CreateNotificationsAndNotificationReadsTablesRelatedToUsersAndOrdersTables1756901767711'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "public"."notifications_type_enum" AS ENUM(
                'order_status_update',
                'new_order',
                'service_reminder',
                'promo'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "notifications" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "type" "public"."notifications_type_enum" NOT NULL,
                "title" character varying(255) NOT NULL,
                "message" text NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "recipientId" uuid,
                "orderId" character varying,
                CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "notification_reads" (
                "id" SERIAL NOT NULL,
                "read_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "notificationId" uuid,
                "userId" uuid,
                CONSTRAINT "PK_c49ec541db45925cfb4e5c8dfbd" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "notifications"
            ADD CONSTRAINT "FK_db873ba9a123711a4bff527ccd5" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "notifications"
            ADD CONSTRAINT "FK_fe1b8ba550e73f84ff228401aab" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "notification_reads"
            ADD CONSTRAINT "FK_38d077b9c1f597ae662c5ae4119" FOREIGN KEY ("notificationId") REFERENCES "notifications"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "notification_reads"
            ADD CONSTRAINT "FK_bddd24aed9c7f0beee6e8d8339f" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "notification_reads" DROP CONSTRAINT "FK_bddd24aed9c7f0beee6e8d8339f"
        `);
        await queryRunner.query(`
            ALTER TABLE "notification_reads" DROP CONSTRAINT "FK_38d077b9c1f597ae662c5ae4119"
        `);
        await queryRunner.query(`
            ALTER TABLE "notifications" DROP CONSTRAINT "FK_fe1b8ba550e73f84ff228401aab"
        `);
        await queryRunner.query(`
            ALTER TABLE "notifications" DROP CONSTRAINT "FK_db873ba9a123711a4bff527ccd5"
        `);
        await queryRunner.query(`
            DROP TABLE "notification_reads"
        `);
        await queryRunner.query(`
            DROP TABLE "notifications"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."notifications_type_enum"
        `);
    }

}
