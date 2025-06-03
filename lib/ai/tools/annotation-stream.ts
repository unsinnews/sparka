import type { DataStreamWriter, } from 'ai';
import type { MessageAnnotation } from './annotations';

export class AnnotationDataStreamWriter implements DataStreamWriter {
  private annotations: MessageAnnotation[] = [];
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
  writeMessageAnnotation(annotation: MessageAnnotation) {
    this.dataStream.writeMessageAnnotation(annotation);
    this.annotations.push(annotation);
  }

  // Getter for annotations
  getAnnotations(): MessageAnnotation[] {
    return this.annotations;
  }
}
