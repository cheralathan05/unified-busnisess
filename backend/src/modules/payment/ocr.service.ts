import Tesseract from "tesseract.js";

export async function extractTextFromImage(file?: {
  buffer?: Buffer;
  path?: string;
}): Promise<string> {
  if (!file) return "";

  try {
    const worker = await Tesseract.createWorker("eng");
    
    let result;
    if (file.buffer && file.buffer.length > 0) {
      result = await worker.recognize(file.buffer);
    } else if (file.path) {
      result = await worker.recognize(file.path);
    } else {
      await worker.terminate();
      return "";
    }

    await worker.terminate();
    return String(result?.data?.text || "").trim();
  } catch (error) {
    console.warn("OCR extraction failed:", (error as Error).message);
    return "";
  }
}
