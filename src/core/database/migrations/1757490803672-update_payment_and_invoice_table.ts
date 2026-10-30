import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatePaymentAndInvoiceTable1757490803672 implements MigrationInterface {
    name = 'UpdatePaymentAndInvoiceTable1757490803672'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "payments"
                RENAME COLUMN "payment_gateway" TO "method"
        `);
        await queryRunner.query(`
            ALTER TYPE "public"."payments_payment_gateway_enum"
            RENAME TO "payments_method_enum"
        `);
        await queryRunner.query(`
            ALTER TABLE "invoices" DROP COLUMN "payment_method"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."invoices_payment_method_enum"
        `);
        await queryRunner.query(`
            ALTER TYPE "public"."payments_method_enum"
            RENAME TO "payments_method_enum_old"
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."payments_method_enum" AS ENUM('cash', 'midtrans')
        `);
        await queryRunner.query(`
            ALTER TABLE "payments"
            ALTER COLUMN "method" DROP DEFAULT
        `);
        await queryRunner.query(`
            ALTER TABLE "payments"
            ALTER COLUMN "method" TYPE "public"."payments_method_enum" USING "method"::"text"::"public"."payments_method_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."payments_method_enum_old"
        `);
        await queryRunner.query(`
            ALTER TABLE "payments"
            ALTER COLUMN "method" DROP NOT NULL
        `);
        await queryRunner.query(`
            ALTER TYPE "public"."payments_method_enum"
            RENAME TO "payments_method_enum_old"
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."payments_method_enum" AS ENUM('cash', 'midtrans')
        `);
        await queryRunner.query(`
            ALTER TABLE "payments"
            ALTER COLUMN "method" DROP DEFAULT
        `);
        await queryRunner.query(`
            ALTER TABLE "payments"
            ALTER COLUMN "method" TYPE "public"."payments_method_enum" USING "method"::"text"::"public"."payments_method_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."payments_method_enum_old"
        `);
        await queryRunner.query(`
            ALTER TABLE "payments"
            ALTER COLUMN "method" DROP NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "payments"
            ALTER COLUMN "method"
            SET NOT NULL
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."payments_method_enum_old" AS ENUM('midtrans')
        `);
        await queryRunner.query(`
            ALTER TABLE "payments"
            ALTER COLUMN "method" TYPE "public"."payments_method_enum_old" USING "method"::"text"::"public"."payments_method_enum_old"
        `);
        await queryRunner.query(`
            ALTER TABLE "payments"
            ALTER COLUMN "method"
            SET DEFAULT 'midtrans'
        `);
        await queryRunner.query(`
            DROP TYPE "public"."payments_method_enum"
        `);
        await queryRunner.query(`
            ALTER TYPE "public"."payments_method_enum_old"
            RENAME TO "payments_method_enum"
        `);
        await queryRunner.query(`
            ALTER TABLE "payments"
            ALTER COLUMN "method"
            SET NOT NULL
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."payments_method_enum_old" AS ENUM('midtrans')
        `);
        await queryRunner.query(`
            ALTER TABLE "payments"
            ALTER COLUMN "method" TYPE "public"."payments_method_enum_old" USING "method"::"text"::"public"."payments_method_enum_old"
        `);
        await queryRunner.query(`
            ALTER TABLE "payments"
            ALTER COLUMN "method"
            SET DEFAULT 'midtrans'
        `);
        await queryRunner.query(`
            DROP TYPE "public"."payments_method_enum"
        `);
        await queryRunner.query(`
            ALTER TYPE "public"."payments_method_enum_old"
            RENAME TO "payments_method_enum"
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."invoices_payment_method_enum" AS ENUM('cash', 'midtrans')
        `);
        await queryRunner.query(`
            ALTER TABLE "invoices"
            ADD "payment_method" "public"."invoices_payment_method_enum"
        `);
        await queryRunner.query(`
            ALTER TYPE "public"."payments_method_enum"
            RENAME TO "payments_payment_gateway_enum"
        `);
        await queryRunner.query(`
            ALTER TABLE "payments"
                RENAME COLUMN "method" TO "payment_gateway"
        `);
    }

}
