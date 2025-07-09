export interface ImageRawData {
  id?: number;
  url?: string;
  file: ArrayBuffer | Buffer;
  name?: string;
  contentType: string | null;
}
