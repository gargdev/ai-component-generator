import fs from 'fs/promises';
import path from 'path';
import { createWriteStream, createReadStream } from 'fs';
import sharp from 'sharp';
import logger from '../utils/logger';
import config from '../config';
import { AppError } from '../utils/errors';

interface SaveFileOptions {
  filename: string;
  data: Buffer | string;
  directory?: string;
}

interface FileInfo {
  filename: string;
  path: string;
  size: number;
  mimeType?: string;
}

class StorageService {
  private baseStoragePath: string;

  constructor() {
    this.baseStoragePath = config.storage.path;
    this.initializeStorage();
  }

  /**
   * Initialize storage directories
   */
  private async initializeStorage(): Promise<void> {
    try {
      // Create base storage directory
      await fs.mkdir(this.baseStoragePath, { recursive: true });

      // Create subdirectories
      const subdirs = ['screenshots', 'exports', 'temp', 'uploads'];
      
      for (const subdir of subdirs) {
        await fs.mkdir(path.join(this.baseStoragePath, subdir), { recursive: true });
      }

      logger.info('Storage initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize storage:', error);
      throw new AppError('Storage initialization failed');
    }
  }

  /**
   * Save file to storage
   */
  public async saveFile(options: SaveFileOptions): Promise<FileInfo> {
    try {
      const { filename, data, directory = 'temp' } = options;

      // Sanitize filename
      const sanitizedFilename = this.sanitizeFilename(filename);
      
      // Build full path
      const dirPath = path.join(this.baseStoragePath, directory);
      const filePath = path.join(dirPath, sanitizedFilename);

      // Ensure directory exists
      await fs.mkdir(dirPath, { recursive: true });

      // Write file
      if (Buffer.isBuffer(data)) {
        await fs.writeFile(filePath, data);
      } else {
        await fs.writeFile(filePath, data, 'utf-8');
      }

      // Get file stats
      const stats = await fs.stat(filePath);

      logger.info(`File saved: ${sanitizedFilename} (${stats.size} bytes)`);

      return {
        filename: sanitizedFilename,
        path: filePath,
        size: stats.size,
      };
    } catch (error) {
      logger.error('Failed to save file:', error);
      throw new AppError('Failed to save file');
    }
  }

  /**
   * Save screenshot with optimization
   */
  public async saveScreenshot(
    imageBuffer: Buffer,
    filename: string
  ): Promise<FileInfo> {
    try {
      // Optimize image with sharp
      const optimizedBuffer = await sharp(imageBuffer)
        .resize(1920, 1080, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 85 })
        .toBuffer();

      const sanitizedFilename = this.sanitizeFilename(filename);
      const finalFilename = sanitizedFilename.endsWith('.jpg')
        ? sanitizedFilename
        : `${sanitizedFilename}.jpg`;

      return await this.saveFile({
        filename: finalFilename,
        data: optimizedBuffer,
        directory: 'screenshots',
      });
    } catch (error) {
      logger.error('Failed to save screenshot:', error);
      throw new AppError('Failed to save screenshot');
    }
  }

  /**
   * Save component code export
   */
  public async saveComponentExport(
    code: string,
    componentName: string
  ): Promise<FileInfo> {
    try {
      const filename = `${componentName}.tsx`;

      return await this.saveFile({
        filename,
        data: code,
        directory: 'exports',
      });
    } catch (error) {
      logger.error('Failed to save component export:', error);
      throw new AppError('Failed to save component export');
    }
  }

  /**
   * Read file from storage
   */
  public async readFile(filepath: string): Promise<Buffer> {
    try {
      return await fs.readFile(filepath);
    } catch (error) {
      logger.error('Failed to read file:', error);
      throw new AppError('Failed to read file');
    }
  }

  /**
   * Delete file from storage
   */
  public async deleteFile(filepath: string): Promise<void> {
    try {
      await fs.unlink(filepath);
      logger.info(`File deleted: ${filepath}`);
    } catch (error) {
      logger.error('Failed to delete file:', error);
      throw new AppError('Failed to delete file');
    }
  }

  /**
   * Delete old temporary files (cleanup)
   */
  public async cleanupTempFiles(maxAgeMs: number = 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const tempDir = path.join(this.baseStoragePath, 'temp');
      const files = await fs.readdir(tempDir);

      const now = Date.now();
      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stats = await fs.stat(filePath);

        if (now - stats.mtimeMs > maxAgeMs) {
          await fs.unlink(filePath);
          deletedCount++;
        }
      }

      logger.info(`Cleanup: deleted ${deletedCount} temp files`);
    } catch (error) {
      logger.error('Failed to cleanup temp files:', error);
    }
  }

  /**
   * Get file info
   */
  public async getFileInfo(filepath: string): Promise<FileInfo | null> {
    try {
      const stats = await fs.stat(filepath);
      
      return {
        filename: path.basename(filepath),
        path: filepath,
        size: stats.size,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Sanitize filename to prevent directory traversal
   */
  private sanitizeFilename(filename: string): string {
    // Remove path separators and dangerous characters
    let sanitized = filename.replace(/[/\\?%*:|"<>]/g, '-');
    
    // Remove leading dots
    sanitized = sanitized.replace(/^\.+/, '');
    
    // Limit length
    if (sanitized.length > 200) {
      const ext = path.extname(sanitized);
      const name = path.basename(sanitized, ext);
      sanitized = name.substring(0, 200 - ext.length) + ext;
    }

    return sanitized || 'unnamed-file';
  }

  /**
   * Create zip archive of multiple files (for future use)
   */
  public async createArchive(files: FileInfo[], archiveName: string): Promise<FileInfo> {
    // Placeholder for future implementation with archiver or similar
    logger.info('Archive creation not yet implemented');
    throw new AppError('Archive creation not yet implemented');
  }
}

export default new StorageService();