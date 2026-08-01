// Prefixo usado para produtos cadastrados sem código de barras.
export const INTERNAL_BARCODE_PREFIX = "SEM-";

export function isInternalBarcode(barcode: string): boolean {
  return barcode.startsWith(INTERNAL_BARCODE_PREFIX);
}
