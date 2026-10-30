import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveIsVerifiedColumnUser1752938230915 implements MigrationInterface {
    name = 'RemoveIsVerifiedColumnUser1752938230915'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "is_verified"
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_085782a04ce4774ea7b1650a82" ON "otp_token" ("otpCode")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "public"."IDX_085782a04ce4774ea7b1650a82"
        `);
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD "is_verified" boolean NOT NULL DEFAULT false
        `);
    }

}
