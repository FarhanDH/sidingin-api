import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateInvoiceAndPaymentTables1757151308464 implements MigrationInterface {
    name = 'CreateInvoiceAndPaymentTables1757151308464'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "invoice_items" (
                "id" SERIAL NOT NULL,
                "description" character varying NOT NULL,
                "quantity" integer NOT NULL DEFAULT '1',
                "unit_price" numeric(10, 2) NOT NULL,
                "total_price" numeric(10, 2) NOT NULL,
                "invoiceId" uuid,
                CONSTRAINT "PK_53b99f9e0e2945e69de1a12b75a" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."payments_status_enum" AS ENUM(
                'pending',
                'settlement',
                'success',
                'expire',
                'cancel',
                'deny'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."payments_payment_gateway_enum" AS ENUM('midtrans')
        `);
        await queryRunner.query(`
            CREATE TABLE "payments" (
                "id" character varying NOT NULL,
                "status" "public"."payments_status_enum" NOT NULL DEFAULT 'pending',
                "amount" numeric(10, 2) NOT NULL,
                "payment_gateway" "public"."payments_payment_gateway_enum" NOT NULL DEFAULT 'midtrans',
                "gateway_response" jsonb,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "invoiceId" uuid,
                CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."invoices_status_enum" AS ENUM('draft', 'unpaid', 'paid', 'void')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."invoices_payment_method_enum" AS ENUM('cash', 'midtrans')
        `);
        await queryRunner.query(`
            CREATE TABLE "invoices" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "invoice_number" character varying NOT NULL,
                "status" "public"."invoices_status_enum" NOT NULL DEFAULT 'unpaid',
                "total_amount" numeric(10, 2) NOT NULL,
                "issued_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "paid_at" TIMESTAMP WITH TIME ZONE,
                "payment_method" "public"."invoices_payment_method_enum",
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_d8f8d3788694e1b3f96c42c36fb" UNIQUE ("invoice_number"),
                CONSTRAINT "PK_668cef7c22a427fd822cc1be3ce" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "invoice_items"
            ADD CONSTRAINT "FK_7fb6895fc8fad9f5200e91abb59" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "payments"
            ADD CONSTRAINT "FK_43d19956aeab008b49e0804c145" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "payments" DROP CONSTRAINT "FK_43d19956aeab008b49e0804c145"
        `);
        await queryRunner.query(`
            ALTER TABLE "invoice_items" DROP CONSTRAINT "FK_7fb6895fc8fad9f5200e91abb59"
        `);
        await queryRunner.query(`
            DROP TABLE "invoices"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."invoices_payment_method_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."invoices_status_enum"
        `);
        await queryRunner.query(`
            DROP TABLE "payments"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."payments_payment_gateway_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."payments_status_enum"
        `);
        await queryRunner.query(`
            DROP TABLE "invoice_items"
        `);
    }

}
