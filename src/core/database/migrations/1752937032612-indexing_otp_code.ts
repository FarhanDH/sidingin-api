import { MigrationInterface, QueryRunner } from "typeorm";

export class IndexingOtpCode1752937032612 implements MigrationInterface {
    name = 'IndexingOtpCode1752937032612'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE INDEX "IDX_085782a04ce4774ea7b1650a82" ON "otp_token" ("otpCode")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "public"."IDX_085782a04ce4774ea7b1650a82"
        `);
    }

}
