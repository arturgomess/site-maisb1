/** @vitest-environment jsdom */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PostEditor } from './post-editor';

const quillState = vi.hoisted(() => ({ modules: null as unknown, editor: null as unknown }));

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));
vi.mock('next/link', () => ({ default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a> }));
vi.mock('next/dynamic', async () => {
  const React = await import('react');
  return {
    default: () => React.forwardRef(function MockQuill({ modules }: { modules: unknown }, ref) {
      quillState.modules = modules;
      React.useImperativeHandle(ref, () => ({ getEditor: () => quillState.editor }));
      return <div data-testid="quill-editor" />;
    }),
  };
});

const fetchMock = vi.fn();

function inputUnder(label: string) {
  const wrapper = screen.getByText(label).closest('label');
  const input = wrapper?.querySelector('input[type="file"]');
  if (!(input instanceof HTMLInputElement)) throw new Error(`Missing file input for ${label}`);
  return input;
}

beforeEach(() => {
  quillState.modules = null;
  quillState.editor = null;
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('PostEditor automatic image optimization', () => {
  it('shows the optimization status and uploads a banner for the cover destination', async () => {
    let resolveUpload!: (response: Response) => void;
    fetchMock.mockReturnValue(new Promise<Response>((resolve) => { resolveUpload = resolve; }));
    render(<PostEditor />);
    fireEvent.change(inputUnder('Enviar imagem'), {
      target: { files: [new File(['image bytes'], 'cover.png', { type: 'image/png' })] },
    });

    expect(screen.getByRole('status').textContent).toBe('Otimizando imagem...');
    const form = fetchMock.mock.calls[0][1].body as FormData;
    expect(form.get('destination')).toBe('cover');
    await act(async () => resolveUpload(new Response(JSON.stringify({ asset: {
      url: '/uploads/cover.webp', thumbnailUrl: '/uploads/cover-card.webp', width: 1920, height: 1080,
    } }), { status: 201, headers: { 'Content-Type': 'application/json' } })));
    expect((await screen.findByAltText('Prévia do banner')).getAttribute('src')).toBe('/uploads/cover.webp');
  });

  it('rejects a banner over 2 MiB in the browser without sending it', async () => {
    render(<PostEditor />);
    const oversized = new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' });
    fireEvent.change(inputUnder('Enviar imagem'), { target: { files: [oversized] } });

    expect(await screen.findByText('A imagem ultrapassa o limite de 2 MB. Selecione um arquivo menor.')).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('uploads gallery files for the gallery destination and keeps returned dimensions', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ asset: {
      url: '/uploads/gallery.webp', width: 900, height: 600,
    } }), { status: 201, headers: { 'Content-Type': 'application/json' } }));
    render(<PostEditor />);
    fireEvent.change(inputUnder('Adicionar fotos'), {
      target: { files: [new File(['bytes'], 'gallery.png', { type: 'image/png' })] },
    });

    const image = await screen.findByAltText('gallery');
    const form = fetchMock.mock.calls[0][1].body as FormData;
    expect(form.get('destination')).toBe('gallery');
    expect(image.getAttribute('src')).toBe('/uploads/gallery.webp');
    expect(image.getAttribute('width')).toBe('900');
    expect(image.getAttribute('height')).toBe('600');
  });

  it('uploads images inserted in the article body as optimized content assets', async () => {
    let resolveUpload!: (response: Response) => void;
    fetchMock.mockReturnValue(new Promise<Response>((resolve) => { resolveUpload = resolve; }));
    render(<PostEditor />);
    const modules = quillState.modules as { toolbar: { handlers: { image: (this: { quill: unknown }) => void } } };
    const quill = {
      getSelection: () => ({ index: 4 }),
      getLength: () => 8,
      insertEmbed: vi.fn(),
      formatText: vi.fn(),
    };
    let picker: HTMLInputElement | undefined;
    const click = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(function (this: HTMLInputElement) { picker = this; });
    act(() => modules.toolbar.handlers.image.call({ quill }));
    if (!(picker instanceof HTMLInputElement)) throw new Error('Missing inline image file input');
    fireEvent.change(picker, { target: { files: [new File(['bytes'], 'inline.png', { type: 'image/png' })] } });

    expect(screen.getByRole('status').textContent).toBe('Otimizando imagem...');
    const form = fetchMock.mock.calls[0][1].body as FormData;
    expect(form.get('destination')).toBe('content');
    await act(async () => resolveUpload(new Response(JSON.stringify({ asset: {
      url: '/uploads/body.webp', width: 900, height: 600,
    } }), { status: 201, headers: { 'Content-Type': 'application/json' } })));
    expect(quill.insertEmbed).toHaveBeenCalledWith(4, 'image', '/uploads/body.webp', 'user');
    expect(quill.formatText).toHaveBeenCalledWith(4, 1, { width: '900', height: '600' }, 'user');
    click.mockRestore();
  });

  it('routes pasted image files through the content optimizer instead of embedding their original bytes', async () => {
    const editor = {
      getSelection: () => ({ index: 1 }),
      getLength: () => 2,
      insertEmbed: vi.fn(),
      formatText: vi.fn(),
    };
    quillState.editor = editor;
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ asset: {
      url: '/uploads/pasted.webp', width: 640, height: 480,
    } }), { status: 201, headers: { 'Content-Type': 'application/json' } }));
    render(<PostEditor />);
    fireEvent.paste(screen.getByTestId('quill-editor'), {
      clipboardData: { files: [new File(['bytes'], 'pasted.png', { type: 'image/png' })] },
    });

    await screen.findByRole('status');
    const form = fetchMock.mock.calls[0][1].body as FormData;
    expect(form.get('destination')).toBe('content');
    expect(editor.insertEmbed).toHaveBeenCalledWith(1, 'image', '/uploads/pasted.webp', 'user');
    expect(editor.formatText).toHaveBeenCalledWith(1, 1, { width: '640', height: '480' }, 'user');
  });
});
