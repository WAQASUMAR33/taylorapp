-- AlterTable
ALTER TABLE `product` ADD COLUMN `cuttingCost` DECIMAL(10, 2) NULL,
    ADD COLUMN `materialCost` DECIMAL(10, 2) NULL,
    ADD COLUMN `stitchingCost` DECIMAL(10, 2) NULL;
