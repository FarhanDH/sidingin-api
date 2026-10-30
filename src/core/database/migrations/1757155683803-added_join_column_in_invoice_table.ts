import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedJoinColumnInInvoiceTable1757155683803 implements MigrationInterface {
    name = 'AddedJoinColumnInInvoiceTable1757155683803'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "invoices"
            ADD "orderId" character varying
        `);
        await queryRunner.query(`
            ALTER TABLE "invoices"
            ADD CONSTRAINT "UQ_a58a78a0e0031dd93a2f56f1e8e" UNIQUE ("orderId")
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
                'invoice_void'
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
                'invoice_void'
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
            ALTER TABLE "invoices"
            ADD CONSTRAINT "FK_a58a78a0e0031dd93a2f56f1e8e" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "invoices" DROP CONSTRAINT "FK_a58a78a0e0031dd93a2f56f1e8e"
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."notifications_type_enum_old" AS ENUM(
                'order_status_update',
                'new_order',
                'service_reminder',
                'promo',
                'cancelled_order'
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
                'cancelled_order'
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
            ALTER TABLE "invoices" DROP CONSTRAINT "UQ_a58a78a0e0031dd93a2f56f1e8e"
        `);
        await queryRunner.query(`
            ALTER TABLE "invoices" DROP COLUMN "orderId"
        `);
    }

}
