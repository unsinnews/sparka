import type { DataStreamWriter, JSONValue } from 'ai';

export class AnnotationStream implements DataStreamWriter {
  private annotations: JSONValue[] = [];
  private readonly dataStream!: DataStreamWriter;

  constructor(dataStream: DataStreamWriter) {
    if (!dataStream) {
      throw new Error('dataStream is required');
    }
    this.dataStream = dataStream;
  }

  // Forward all DataStreamWriter methods to the underlying dataStream
  write(data: any): void {
    this.dataStream.write(data);
  }

  writeData(data: any): void {
    this.dataStream.writeData(data);
  }

  writeSource(source: any): void {
    this.dataStream.writeSource(source);
  }

  merge(data: any): void {
    this.dataStream.merge(data);
  }

  onError(error: unknown): string {
    return this.dataStream.onError?.(error) ?? '';
  }

  // Custom method to handle both dataStream and annotations
  writeMessageAnnotation(annotation: { type: string; data: any }) {
    this.dataStream.writeMessageAnnotation(annotation);
    this.annotations.push(annotation);
  }

  // Getter for annotations
  getAnnotations(): JSONValue[] {
    return this.annotations;
  }
}
