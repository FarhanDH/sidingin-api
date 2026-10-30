import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateAvatarUrlUsersTable1752838445659 implements MigrationInterface {
    name = 'UpdateAvatarUrlUsersTable1752838445659'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users" DROP CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3"
        `);
        await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "email"
        `);
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD "email" character varying(255) NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email")
        `);
        await queryRunner.query(`
            ALTER TABLE "users" DROP CONSTRAINT "UQ_17d1817f241f10a3dbafb169fd2"
        `);
        await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "phone_number"
        `);
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD "phone_number" character varying(15)
        `);
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD CONSTRAINT "UQ_17d1817f241f10a3dbafb169fd2" UNIQUE ("phone_number")
        `);
        await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "full_name"
        `);
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD "full_name" character varying(255)
        `);
        await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "avatar_url"
        `);
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD "avatar_url" character varying(255)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "avatar_url"
        `);
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD "avatar_url" character varying NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "full_name"
        `);
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD "full_name" character varying
        `);
        await queryRunner.query(`
            ALTER TABLE "users" DROP CONSTRAINT "UQ_17d1817f241f10a3dbafb169fd2"
        `);
        await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "phone_number"
        `);
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD "phone_number" character varying
        `);
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD CONSTRAINT "UQ_17d1817f241f10a3dbafb169fd2" UNIQUE ("phone_number")
        `);
        await queryRunner.query(`
            ALTER TABLE "users" DROP CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3"
        `);
        await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "email"
        `);
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD "email" character varying NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email")
        `);
    }

}
