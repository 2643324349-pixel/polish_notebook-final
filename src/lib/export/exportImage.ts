import domtoimage from 'dom-to-image-more';
import { APP_SITE_URL } from '@/lib/constants';
import {
  buildExportFilename,
  dataUrlToBlob,
  EXPORT_FONT_FAMILY,
  shareOrDownloadFile,
} from '@/lib/export/exportUtils';

const CAPTURE_SCALE = () => Math.min(window.devicePixelRatio, 2);
const WATERMARK_HEADER_HEIGHT = 40;
const WATERMARK_TEXT_COLOR = '#6b7280';

function sanitizeClone(root: HTMLElement): void {
  root.querySelectorAll('button').forEach((node) => node.remove());
  root.querySelectorAll('[role="checkbox"]').forEach((node) => {
    node.closest('div')?.remove();
  });

  root.querySelectorAll('td, th').forEach((node) => {
    const el = node as HTMLElement;
    el.style.position = 'static';
    el.style.top = '';
    el.style.left = '';
    el.style.zIndex = '';
  });
}

function createWatermarkHeader(): HTMLDivElement {
  const header = document.createElement('div');
  header.style.cssText = [
    'box-sizing: border-box',
    'width: 100%',
    `height: ${WATERMARK_HEADER_HEIGHT}px`,
    'padding: 0 16px',
    'display: flex',
    'align-items: center',
    'background: #ffffff',
    `color: ${WATERMARK_TEXT_COLOR}`,
    'font-size: 14px',
    `font-family: ${EXPORT_FONT_FAMILY}`,
    'line-height: 1',
    'flex-shrink: 0',
  ].join(';');
  header.textContent = APP_SITE_URL;
  return header;
}

function createViewport(
  width: number,
  height: number,
  content: HTMLElement,
): HTMLDivElement {
  const viewport = document.createElement('div');
  viewport.style.cssText = [
    `width: ${width}px`,
    `height: ${height}px`,
    'overflow: hidden',
    'background: #ffffff',
  ].join(';');
  viewport.appendChild(content);
  return viewport;
}

async function captureNode(
  node: HTMLElement,
  width: number,
  height: number,
): Promise<Blob> {
  await document.fonts.ready;

  const scale = CAPTURE_SCALE();
  const dataUrl = await domtoimage.toPng(node, {
    width: width * scale,
    height: height * scale,
    bgcolor: '#ffffff',
    style: {
      width: `${width}px`,
      height: `${height}px`,
      transform: `scale(${scale})`,
      transformOrigin: 'top left',
      fontFamily: EXPORT_FONT_FAMILY,
      backgroundColor: '#ffffff',
    },
  });

  return dataUrlToBlob(dataUrl);
}

function getTableElement(container: HTMLElement): HTMLTableElement {
  const table = container.querySelector('table');
  if (!table) {
    throw new Error('Table element not found');
  }
  return table;
}

function createCaptureWrapper(
  width: number,
  height: number,
): HTMLDivElement {
  const wrapper = document.createElement('div');
  wrapper.style.cssText = [
    'position: fixed',
    'left: -100000px',
    'top: 0',
    `width: ${width}px`,
    `height: ${height}px`,
    'overflow: hidden',
    'background: #ffffff',
    `font-family: ${EXPORT_FONT_FAMILY}`,
    'display: flex',
    'flex-direction: column',
  ].join(';');
  return wrapper;
}

function buildCaptureWrapper(
  width: number,
  viewportHeight: number,
  tableClone: HTMLTableElement,
): HTMLDivElement {
  const captureHeight = viewportHeight + WATERMARK_HEADER_HEIGHT;
  const wrapper = createCaptureWrapper(width, captureHeight);
  wrapper.appendChild(createWatermarkHeader());
  wrapper.appendChild(createViewport(width, viewportHeight, tableClone));
  return wrapper;
}

export async function exportVisibleTableImage(
  container: HTMLElement,
): Promise<{ filename: string; method: 'shared' | 'downloaded' }> {
  const width = container.clientWidth;
  const viewportHeight = container.clientHeight;

  const table = getTableElement(container);
  const clone = table.cloneNode(true) as HTMLTableElement;
  clone.style.transform = `translate(${-container.scrollLeft}px, ${-container.scrollTop}px)`;
  clone.style.fontFamily = EXPORT_FONT_FAMILY;
  sanitizeClone(clone);

  const wrapper = buildCaptureWrapper(width, viewportHeight, clone);
  document.body.appendChild(wrapper);

  try {
    const blob = await captureNode(
      wrapper,
      width,
      viewportHeight + WATERMARK_HEADER_HEIGHT,
    );
    const filename = buildExportFilename('png');
    const method = await shareOrDownloadFile(blob, filename, 'image/png');
    return { filename, method };
  } finally {
    document.body.removeChild(wrapper);
  }
}

export async function exportFullTableImages(
  container: HTMLElement,
  onPageDownload?: (page: number, total: number) => void,
): Promise<{ pageCount: number }> {
  const width = container.clientWidth;
  const pageHeight = container.clientHeight;
  const table = getTableElement(container);

  const measureWrapper = createCaptureWrapper(width, pageHeight);
  const measureClone = table.cloneNode(true) as HTMLTableElement;
  measureClone.style.fontFamily = EXPORT_FONT_FAMILY;
  sanitizeClone(measureClone);
  measureWrapper.style.height = 'auto';
  measureWrapper.style.overflow = 'visible';
  measureWrapper.style.display = 'block';
  measureWrapper.appendChild(measureClone);
  document.body.appendChild(measureWrapper);
  const totalHeight = measureClone.offsetHeight;
  document.body.removeChild(measureWrapper);

  const pageCount = Math.max(1, Math.ceil(totalHeight / pageHeight));

  for (let page = 0; page < pageCount; page++) {
    const clone = table.cloneNode(true) as HTMLTableElement;
    clone.style.transform = `translateY(${-page * pageHeight}px)`;
    clone.style.fontFamily = EXPORT_FONT_FAMILY;
    sanitizeClone(clone);

    const wrapper = buildCaptureWrapper(width, pageHeight, clone);
    document.body.appendChild(wrapper);

    try {
      const blob = await captureNode(
        wrapper,
        width,
        pageHeight + WATERMARK_HEADER_HEIGHT,
      );
      const filename = buildExportFilename('png', page + 1);
      await shareOrDownloadFile(blob, filename, 'image/png');
      onPageDownload?.(page + 1, pageCount);
    } finally {
      document.body.removeChild(wrapper);
    }
  }

  return { pageCount };
}
