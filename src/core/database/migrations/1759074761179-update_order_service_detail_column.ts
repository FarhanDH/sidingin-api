import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateOrderServiceDetailColumn1759074761179 implements MigrationInterface {
    name = 'UpdateOrderServiceDetailColumn1759074761179'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "orders"
                RENAME COLUMN "service_location_address" TO "service_location_detail"
        `);
        await queryRunner.query(`
            ALTER TABLE "orders" DROP COLUMN "service_location_detail"
        `);
        await queryRunner.query(`
            ALTER TABLE "orders"
            ADD "service_location_detail" jsonb
        `);
        await queryRunner.query(`
            ALTER TYPE "public"."notifications_type_enum"
            RENAME TO "notifications_type_enum_old"
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."notifications_type_enum" AS ENUM(
                'order_status_update',
                'new_order',
                'service_reminder',
                'promo',
                'cancelled_order',
                'invoice_created',
                'invoice_paid',
                'invoice_void',
                'completed_order',
                'payment_success',
                'invoice_downloaded'
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "notifications"
            ALTER COLUMN "type" TYPE "public"."notifications_type_enum" USING "type"::"text"::"public"."notifications_type_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."notifications_type_enum_old"
        `);
        await queryRunner.query(`
            ALTER TYPE "public"."notifications_type_enum"
            RENAME TO "notifications_type_enum_old"
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."notifications_type_enum" AS ENUM(
                'order_status_update',
                'new_order',
                'service_reminder',
                'promo',
                'cancelled_order',
                'invoice_created',
                'invoice_paid',
                'invoice_void',
                'completed_order',
                'payment_success',
                'invoice_downloaded'
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "notifications"
            ALTER COLUMN "type" TYPE "public"."notifications_type_enum" USING "type"::"text"::"public"."notifications_type_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."notifications_type_enum_old"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "public"."notifications_type_enum_old" AS ENUM(
                'order_status_update',
                'new_order',
                'service_reminder',
                'promo',
                'cancelled_order',
                'invoice_created',
                'invoice_paid',
                'invoice_void',
                'completed_order',
                'payment_success'
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "notifications"
            ALTER COLUMN "type" TYPE "public"."notifications_type_enum_old" USING "type"::"text"::"public"."notifications_type_enum_old"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."notifications_type_enum"
        `);
        await queryRunner.query(`
            ALTER TYPE "public"."notifications_type_enum_old"
            RENAME TO "notifications_type_enum"
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."notifications_type_enum_old" AS ENUM(
                'order_status_update',
                'new_order',
                'service_reminder',
                'promo',
                'cancelled_order',
                'invoice_created',
                'invoice_paid',
                'invoice_void',
                'completed_order',
                'payment_success'
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "notifications"
            ALTER COLUMN "type" TYPE "public"."notifications_type_enum_old" USING "type"::"text"::"public"."notifications_type_enum_old"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."notifications_type_enum"
        `);
        await queryRunner.query(`
            ALTER TYPE "public"."notifications_type_enum_old"
            RENAME TO "notifications_type_enum"
        `);
        await queryRunner.query(`
            ALTER TABLE "orders" DROP COLUMN "service_location_detail"
        `);
        await queryRunner.query(`
            ALTER TABLE "orders"
            ADD "service_location_detail" character varying(255)
        `);
        await queryRunner.query(`
            ALTER TABLE "orders"
                RENAME COLUMN "service_location_detail" TO "service_location_address"
        `);
    }

}
