import qrcode from "qrcode-generator";

/** Dark modules of a QR code (error correction M), row by row. */
export function qrMatrix(text: string): boolean[][] {
  const code = qrcode(0, "M");
  code.addData(text);
  code.make();
  const size = code.getModuleCount();
  return Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, (_, c) => code.isDark(r, c)),
  );
}

/** SVG path drawing the dark modules, one unit per module. */
export const qrPath = (matrix: boolean[][]) =>
  matrix
    .flatMap((row, r) =>
      row.map((dark, c) => (dark ? `M${c} ${r}h1v1h-1z` : "")),
    )
    .join("");
