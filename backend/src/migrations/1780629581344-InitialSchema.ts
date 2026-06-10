import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1780629581344 implements MigrationInterface {
    name = 'InitialSchema1780629581344'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "pharmacy" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "quartier" varchar NOT NULL, "address" varchar NOT NULL, "phone" varchar NOT NULL, "hours" varchar NOT NULL, "lat" real NOT NULL, "lng" real NOT NULL)`);
        await queryRunner.query(`CREATE TABLE "medication" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "dci" varchar NOT NULL, "form" varchar NOT NULL, "category" varchar NOT NULL)`);
        await queryRunner.query(`CREATE TABLE "stock_entry" ("medicationId" varchar NOT NULL, "pharmacyId" varchar NOT NULL, "status" varchar CHECK( "status" IN ('available','low','on_order','out') ) NOT NULL DEFAULT ('out'), "price" real, "updatedAt" datetime NOT NULL, PRIMARY KEY ("medicationId", "pharmacyId"))`);
        await queryRunner.query(`CREATE TABLE "temporary_stock_entry" ("medicationId" varchar NOT NULL, "pharmacyId" varchar NOT NULL, "status" varchar CHECK( "status" IN ('available','low','on_order','out') ) NOT NULL DEFAULT ('out'), "price" real, "updatedAt" datetime NOT NULL, CONSTRAINT "FK_1b412d1386d0cf149088d560246" FOREIGN KEY ("medicationId") REFERENCES "medication" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_d11d7ce13189720d5bd31dda6af" FOREIGN KEY ("pharmacyId") REFERENCES "pharmacy" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, PRIMARY KEY ("medicationId", "pharmacyId"))`);
        await queryRunner.query(`INSERT INTO "temporary_stock_entry"("medicationId", "pharmacyId", "status", "price", "updatedAt") SELECT "medicationId", "pharmacyId", "status", "price", "updatedAt" FROM "stock_entry"`);
        await queryRunner.query(`DROP TABLE "stock_entry"`);
        await queryRunner.query(`ALTER TABLE "temporary_stock_entry" RENAME TO "stock_entry"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stock_entry" RENAME TO "temporary_stock_entry"`);
        await queryRunner.query(`CREATE TABLE "stock_entry" ("medicationId" varchar NOT NULL, "pharmacyId" varchar NOT NULL, "status" varchar CHECK( "status" IN ('available','low','on_order','out') ) NOT NULL DEFAULT ('out'), "price" real, "updatedAt" datetime NOT NULL, PRIMARY KEY ("medicationId", "pharmacyId"))`);
        await queryRunner.query(`INSERT INTO "stock_entry"("medicationId", "pharmacyId", "status", "price", "updatedAt") SELECT "medicationId", "pharmacyId", "status", "price", "updatedAt" FROM "temporary_stock_entry"`);
        await queryRunner.query(`DROP TABLE "temporary_stock_entry"`);
        await queryRunner.query(`DROP TABLE "stock_entry"`);
        await queryRunner.query(`DROP TABLE "medication"`);
        await queryRunner.query(`DROP TABLE "pharmacy"`);
    }

}
