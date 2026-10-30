import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatePaymentStatus1757483998335 implements MigrationInterface {
    name = 'UpdatePaymentStatus1757483998335'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "payments"
            ALTER COLUMN "status" DROP DEFAULT
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
                'completed_order'
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
            ALTER TABLE "payments"
            ALTER COLUMN "status" DROP DEFAULT
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
                'completed_order'
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
                'invoice_void'
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
            ALTER TABLE "payments"
            ALTER COLUMN "status"
            SET DEFAULT 'pending'
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
                'invoice_void'
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
            ALTER TABLE "payments"
            ALTER COLUMN "status"
            SET DEFAULT 'pending'
        `);
    }

}
