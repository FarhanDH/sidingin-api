import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateOneToOneRelationInvoiceToPayment1764039717298 implements MigrationInterface {
    name = 'UpdateOneToOneRelationInvoiceToPayment1764039717298'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "payments" DROP CONSTRAINT "FK_43d19956aeab008b49e0804c145"
        `);
        await queryRunner.query(`
            ALTER TABLE "payments" DROP COLUMN "invoiceId"
        `);
        await queryRunner.query(`
            ALTER TABLE "payments"
            ADD "invoiceId" uuid
        `);
        await queryRunner.query(`
            ALTER TABLE "invoices"
            ADD "paymentId" character varying
        `);
        await queryRunner.query(`
            ALTER TABLE "invoices"
            ADD CONSTRAINT "UQ_64923f3a8d3f3247dd5fe9f43c5" UNIQUE ("paymentId")
        `);
        await queryRunner.query(`
            ALTER TABLE "payments"
            ADD CONSTRAINT "FK_43d19956aeab008b49e0804c145" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "invoices"
            ADD CONSTRAINT "FK_64923f3a8d3f3247dd5fe9f43c5" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "invoices" DROP CONSTRAINT "FK_64923f3a8d3f3247dd5fe9f43c5"
        `);
        await queryRunner.query(`
            ALTER TABLE "payments" DROP CONSTRAINT "FK_43d19956aeab008b49e0804c145"
        `);
        await queryRunner.query(`
            ALTER TABLE "invoices" DROP CONSTRAINT "UQ_64923f3a8d3f3247dd5fe9f43c5"
        `);
        await queryRunner.query(`
            ALTER TABLE "invoices" DROP COLUMN "paymentId"
        `);
        await queryRunner.query(`
            ALTER TABLE "payments" DROP COLUMN "invoiceId"
        `);
        await queryRunner.query(`
            ALTER TABLE "payments"
            ADD "invoiceId" uuid
        `);
        await queryRunner.query(`
            ALTER TABLE "payments"
            ADD CONSTRAINT "FK_43d19956aeab008b49e0804c145" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

}
