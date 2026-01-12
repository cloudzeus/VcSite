/*
  Warnings:

  - You are about to alter the column `title` on the `FilmTranslation` table. The data in that column could be lost. The data in that column will be cast from `VarChar(200)` to `VarChar(191)`.

*/
-- DropIndex
DROP INDEX `FilmTranslation_lang_idx` ON `FilmTranslation`;

-- AlterTable
ALTER TABLE `Film` ADD COLUMN `order` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `FilmTranslation` MODIFY `title` VARCHAR(191) NOT NULL,
    MODIFY `logline` TEXT NULL,
    MODIFY `synopsis` TEXT NULL;

-- AlterTable
ALTER TABLE `PressItem` ADD COLUMN `order` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `_FilmToMediaAsset` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_FilmToMediaAsset_AB_unique`(`A`, `B`),
    INDEX `_FilmToMediaAsset_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_FilmToMediaAsset` ADD CONSTRAINT `_FilmToMediaAsset_A_fkey` FOREIGN KEY (`A`) REFERENCES `Film`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_FilmToMediaAsset` ADD CONSTRAINT `_FilmToMediaAsset_B_fkey` FOREIGN KEY (`B`) REFERENCES `MediaAsset`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
