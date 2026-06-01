import type { Problem } from '@/domain/entities/problem';

export interface ICphMigrationService {
  canMigrate(srcPath: string): Promise<boolean>;
  migrateFromSource(srcPath: string): Promise<Problem | undefined>;
  migrateFolder(folderPath: string): Promise<Problem[]>;
}
