declare module 'qrcode' {
  interface QRCodeToStringOptions {
    type?: 'svg' | 'utf8' | 'terminal';
    margin?: number;
  }

  export function toString(
    text: string,
    options?: QRCodeToStringOptions
  ): Promise<string>;

  const QRCode: {
    toString: typeof toString;
  };

  export default QRCode;
}
