declare module 'dom-to-image-more' {
  export interface DomToImageOptions {
    bgcolor?: string;
    width?: number;
    height?: number;
    quality?: number;
    style?: Record<string, string>;
    filter?: (node: Node) => boolean;
  }

  export function toPng(node: Node, options?: DomToImageOptions): Promise<string>;
  export function toJpeg(node: Node, options?: DomToImageOptions): Promise<string>;
  export function toBlob(node: Node, options?: DomToImageOptions): Promise<Blob>;
  export function toSvg(node: Node, options?: DomToImageOptions): Promise<string>;

  const domtoimage: {
    toPng: typeof toPng;
    toJpeg: typeof toJpeg;
    toBlob: typeof toBlob;
    toSvg: typeof toSvg;
  };

  export default domtoimage;
}
