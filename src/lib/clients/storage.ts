import { FileObject } from '@supabase/storage-js'

/**
 * Storage operations are not supported without Supabase
 * These functions are stubs that throw errors
 */

export async function uploadFile(
  fileBuffer: Buffer,
  destination: string,
  contentType: string
): Promise<string> {
  throw new Error('Storage operations are not supported in read-only mode')
}

export async function getFiles(folderPath: string): Promise<FileObject[]> {
  throw new Error('Storage operations are not supported in read-only mode')
}

export async function deleteFile(filePath: string): Promise<void> {
  throw new Error('Storage operations are not supported in read-only mode')
}

export async function getSignedUrl(
  filePath: string,
  expiresInMinutes = 15
): Promise<string> {
  throw new Error('Storage operations are not supported in read-only mode')
}
