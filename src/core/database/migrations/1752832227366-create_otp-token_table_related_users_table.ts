import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateOtpTokenTableRelatedUsersTable1752832227366 implements MigrationInterface {
    name = 'CreateOtpTokenTableRelatedUsersTable1752832227366'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "otp_token" (
                "id" SERIAL NOT NULL,
                "otpCode" character varying(4) NOT NULL,
                "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "is_used" boolean NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "userId" uuid,
                CONSTRAINT "PK_0bfad9301f69fffbea0dcbb4eff" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."users_role_enum" AS ENUM('customer', 'technician')
        `);
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "email" character varying NOT NULL,
                "phone_number" character varying,
                "full_name" character varying,
                "avatar_url" character varying NOT NULL,
                "role" "public"."users_role_enum" NOT NULL DEFAULT 'customer',
                "is_verified" boolean NOT NULL DEFAULT false,
                "is_profile_completed" boolean NOT NULL DEFAULT false,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
                CONSTRAINT "UQ_17d1817f241f10a3dbafb169fd2" UNIQUE ("phone_number"),
                CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
            )
        `);
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
        await queryRunner.query(`
            ALTER TABLE "otp_token"
            ADD CONSTRAINT "FK_24678d152f8409d4d266ea45510" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "otp_token" DROP CONSTRAINT "FK_24678d152f8409d4d266ea45510"
        `);
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
        await queryRunner.query(`
            DROP TABLE "users"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."users_role_enum"
        `);
        await queryRunner.query(`
            DROP TABLE "otp_token"
        `);
    }

}
