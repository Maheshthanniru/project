import { jsonDB } from '../lib/jsonDatabase';
import { format } from 'date-fns';

export interface BackupData {
  version: string;
  timestamp: string;
  description: string;
  data: {
    companies: any[];
    accounts: any[];
    subAccounts: any[];
    cashBookEntries: any[];
    editHistory: any[];
    users: any[];
  };
  metadata: {
    totalRecords: number;
    totalCompanies: number;
    totalAccounts: number;
    totalEntries: number;
    backupSize: number;
  };
}

export interface BackupInfo {
  id: string;
  filename: string;
  timestamp: string;
  size: number;
  description: string;
  version: string;
  isAuto: boolean;
}

class BackupManager {
  private readonly BACKUP_PREFIX = 'thirumala_backup_';
  private readonly VERSION = '1.0.0';
  private readonly MAX_BACKUPS = 10;

  // Create a new backup
  async createBackup(
    description: string = 'Manual backup'
  ): Promise<{ success: boolean; backup?: BackupData; error?: string }> {
    try {
      // Get all data from database
      const data = {
        companies: jsonDB.getCompanies(),
        accounts: jsonDB.getAccounts(),
        subAccounts: jsonDB.getSubAccounts(),
        cashBookEntries: jsonDB.getCashBookEntries(),
        editHistory: jsonDB.getAllActivityHistory(),
        users: jsonDB.getUsers(),
      };

      // Calculate metadata
      const totalRecords = Object.values(data).reduce(
        (sum, arr) => sum + arr.length,
        0
      );
      const backupData: BackupData = {
        version: this.VERSION,
        timestamp: new Date().toISOString(),
        description,
        data,
        metadata: {
          totalRecords,
          totalCompanies: data.companies.length,
          totalAccounts: data.accounts.length,
          totalEntries: data.cashBookEntries.length,
          backupSize: JSON.stringify(data).length,
        },
      };

      // Save backup to localStorage
      const backupId = `backup_${Date.now()}`;
      const backupKey = `${this.BACKUP_PREFIX}${backupId}`;
      localStorage.setItem(backupKey, JSON.stringify(backupData));

      // Clean up old backups
      this.cleanupOldBackups();

      return { success: true, backup: backupData };
    } catch (error) {
      console.error('Backup creation failed:', error);
      return { success: false, error: 'Failed to create backup' };
    }
  }

  // Create automatic backup
  async createAutoBackup(): Promise<void> {
    const lastBackup = this.getLastBackup();
    const now = new Date();

    // Create auto backup if no backup exists or last backup is older than 24 hours
    if (
      !lastBackup ||
      now.getTime() - new Date(lastBackup.timestamp).getTime() >
        24 * 60 * 60 * 1000
    ) {
      await this.createBackup('Automatic daily backup');
    }
  }

  // Get all backups
  getAllBackups(): BackupInfo[] {
    const backups: BackupInfo[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.BACKUP_PREFIX)) {
        try {
          const backupData = JSON.parse(localStorage.getItem(key) || '');
          const backupId = key.replace(this.BACKUP_PREFIX, '');

          backups.push({
            id: backupId,
            filename: `backup_${format(new Date(backupData.timestamp), 'yyyy-MM-dd_HH-mm')}.json`,
            timestamp: backupData.timestamp,
            size: backupData.metadata.backupSize,
            description: backupData.description,
            version: backupData.version,
            isAuto: backupData.description.includes('Automatic'),
          });
        } catch (error) {
          console.error('Error parsing backup:', key, error);
        }
      }
    }

    return backups.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  // Get specific backup
  getBackup(backupId: string): BackupData | null {
    try {
      const backupKey = `${this.BACKUP_PREFIX}${backupId}`;
      const backupData = localStorage.getItem(backupKey);
      return backupData ? JSON.parse(backupData) : null;
    } catch (error) {
      console.error('Error retrieving backup:', error);
      return null;
    }
  }

  // Get last backup
  getLastBackup(): BackupData | null {
    const backups = this.getAllBackups();
    if (backups.length === 0) return null;

    return this.getBackup(backups[0].id);
  }

  // Restore from backup
  async restoreFromBackup(
    backupId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const backup = this.getBackup(backupId);
      if (!backup) {
        return { success: false, error: 'Backup not found' };
      }

      // Validate backup data
      const validation = this.validateBackup(backup);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Invalid backup: ${validation.errors.join(', ')}`,
        };
      }

      // Create a backup before restoration
      await this.createBackup('Pre-restoration backup');

      // Restore data
      this.restoreData(backup.data);

      return { success: true };
    } catch (error) {
      console.error('Restore failed:', error);
      return { success: false, error: 'Failed to restore backup' };
    }
  }

  // Export backup to file
  exportBackup(backupId: string): { success: boolean; error?: string } {
    try {
      const backup = this.getBackup(backupId);
      if (!backup) {
        return { success: false, error: 'Backup not found' };
      }

      const filename = `thirumala_backup_${format(new Date(backup.timestamp), 'yyyy-MM-dd_HH-mm')}.json`;
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      console.error('Export failed:', error);
      return { success: false, error: 'Failed to export backup' };
    }
  }

  // Import backup from file
  async importBackup(
    file: File
  ): Promise<{ success: boolean; backup?: BackupData; error?: string }> {
    return new Promise(resolve => {
      const reader = new FileReader();

      reader.onload = e => {
        try {
          const content = e.target?.result as string;
          const backup: BackupData = JSON.parse(content);

          // Validate imported backup
          const validation = this.validateBackup(backup);
          if (!validation.isValid) {
            resolve({
              success: false,
              error: `Invalid backup file: ${validation.errors.join(', ')}`,
            });
            return;
          }

          // Save imported backup
          const backupId = `imported_${Date.now()}`;
          const backupKey = `${this.BACKUP_PREFIX}${backupId}`;
          localStorage.setItem(backupKey, JSON.stringify(backup));

          resolve({ success: true, backup });
        } catch (error) {
          console.error('Import failed:', error);
          resolve({ success: false, error: 'Failed to import backup file' });
        }
      };

      reader.onerror = () => {
        resolve({ success: false, error: 'Failed to read backup file' });
      };

      reader.readAsText(file);
    });
  }

  // Delete backup
  deleteBackup(backupId: string): { success: boolean; error?: string } {
    try {
      const backupKey = `${this.BACKUP_PREFIX}${backupId}`;
      localStorage.removeItem(backupKey);
      return { success: true };
    } catch (error) {
      console.error('Delete failed:', error);
      return { success: false, error: 'Failed to delete backup' };
    }
  }

  // Clean up old backups
  private cleanupOldBackups(): void {
    const backups = this.getAllBackups();

    if (backups.length > this.MAX_BACKUPS) {
      const backupsToDelete = backups.slice(this.MAX_BACKUPS);
      backupsToDelete.forEach(backup => {
        this.deleteBackup(backup.id);
      });
    }
  }

  // Validate backup data
  private validateBackup(backup: BackupData): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check required fields
    if (!backup.version) errors.push('Missing version');
    if (!backup.timestamp) errors.push('Missing timestamp');
    if (!backup.data) errors.push('Missing data');
    if (!backup.metadata) errors.push('Missing metadata');

    // Check data structure
    if (backup.data) {
      const requiredTables = [
        'companies',
        'accounts',
        'subAccounts',
        'cashBookEntries',
        'editHistory',
        'users',
      ];
      requiredTables.forEach(table => {
        if (!Array.isArray(backup.data[table as keyof typeof backup.data])) {
          errors.push(`Invalid ${table} data`);
        }
      });
    }

    // Check metadata consistency
    if (backup.metadata && backup.data) {
      const actualTotalRecords = Object.values(backup.data).reduce(
        (sum, arr) => sum + arr.length,
        0
      );
      if (backup.metadata.totalRecords !== actualTotalRecords) {
        errors.push('Metadata inconsistency: total records mismatch');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Restore data to database
  private restoreData(data: BackupData['data']): void {
    // Clear current data
    localStorage.removeItem('thirumala_database');

    // Set new data
    const newData = {
      companies: data.companies,
      accounts: data.accounts,
      subAccounts: data.subAccounts,
      cashBookEntries: data.cashBookEntries,
      editHistory: data.editHistory,
      users: data.users,
    };

    localStorage.setItem('thirumala_database', JSON.stringify(newData));

    // Reload database
    window.location.reload();
  }

  // Get backup statistics
  getBackupStats(): {
    totalBackups: number;
    totalSize: number;
    lastBackup: string | null;
    oldestBackup: string | null;
    autoBackups: number;
    manualBackups: number;
  } {
    const backups = this.getAllBackups();

    if (backups.length === 0) {
      return {
        totalBackups: 0,
        totalSize: 0,
        lastBackup: null,
        oldestBackup: null,
        autoBackups: 0,
        manualBackups: 0,
      };
    }

    const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);
    const autoBackups = backups.filter(b => b.isAuto).length;
    const manualBackups = backups.length - autoBackups;

    return {
      totalBackups: backups.length,
      totalSize,
      lastBackup: backups[0].timestamp,
      oldestBackup: backups[backups.length - 1].timestamp,
      autoBackups,
      manualBackups,
    };
  }

  // Check if backup is needed
  shouldCreateBackup(): boolean {
    const lastBackup = this.getLastBackup();
    if (!lastBackup) return true;

    const now = new Date();
    const lastBackupTime = new Date(lastBackup.timestamp);
    const hoursSinceLastBackup =
      (now.getTime() - lastBackupTime.getTime()) / (1000 * 60 * 60);

    return hoursSinceLastBackup >= 24;
  }
}

// Export singleton instance
export const backupManager = new BackupManager();

// Export utility functions
export const createBackup = (description?: string) => {
  return backupManager.createBackup(description);
};

export const restoreBackup = (backupId: string) => {
  return backupManager.restoreFromBackup(backupId);
};

export const exportBackup = (backupId: string) => {
  return backupManager.exportBackup(backupId);
};

export const importBackup = (file: File) => {
  return backupManager.importBackup(file);
};
