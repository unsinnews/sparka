import { auth } from '@/app/(auth)/auth';
import type { ArtifactKind } from '@/components/artifact';
import {
  getDocumentById,
  getDocumentsById,
  saveDocument,
} from '@/lib/db/queries';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Missing id', { status: 400 });
  }

  const session = await auth();

  // Get documents with visibility filtering
  const documents = await getDocumentsById({
    id,
    userId: session?.user?.id,
  });

  if (documents.length === 0) {
    return new Response('Not Found', { status: 404 });
  }

  return Response.json(documents, { status: 200 });
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Missing id', { status: 400 });
  }

  const session = await auth();

  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  const {
    content,
    title,
    kind,
  }: {
    content: string;
    title: string;
    kind: ArtifactKind;
  } = await request.json();

  if (session.user?.id) {
    const lastDocument = await getDocumentById({ id });

    if (!lastDocument) {
      return new Response('Document not found', { status: 404 });
    }

    const document = await saveDocument({
      id,
      content,
      title,
      kind,
      userId: session.user.id,
      messageId: lastDocument.messageId,
    });

    return Response.json(document, { status: 200 });
  }

  return new Response('Unauthorized', { status: 401 });
}
