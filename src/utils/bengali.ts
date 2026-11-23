const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

/**
 * Converts Western digits in a number or string to crisp Bengali numerals.
 */
export function toBengaliDigits(value: number | string): string {
  return String(value).replace(/\d/g, (digit) => BENGALI_DIGITS[Number(digit)] ?? digit);
}

/**
 * Formats an INR currency amount in Bengali digits (e.g., ₹১৩০).
 */
export function formatRupees(amount: number): string {
  const rounded = Math.max(0, Math.round(amount));
  return `₹${toBengaliDigits(rounded)}`;
}

/**
 * Returns local calendar date in YYYY-MM-DD format for daily spin lock.
 */
export function getTodayKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Compresses an uploaded File (from mobile camera or gallery) to a compact JPEG DataURL
 * so it fits comfortably inside localStorage without hitting quota errors.
 */
export function compressImageFile(file: File, maxWidth = 960, quality = 0.78): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('ফাইল পড়া যায়নি'));
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('অবৈধ ছবির ফরম্যাট'));
        return;
      }

      const img = new Image();
      img.onerror = () => resolve(result);
      img.onload = () => {
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const targetW = Math.round(img.width * scale);
        const targetH = Math.round(img.height * scale);

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(result);
          return;
        }
        ctx.drawImage(img, 0, 0, targetW, targetH);
        try {
          resolve(canvas.toDataURL('image/jpeg', quality));
        } catch {
          resolve(result);
        }
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Normalizes a phone string into digits only (converts Bengali digits too).
 */
export function normalizePhoneDigits(input: string): string {
  const western = input.replace(/[০-৯]/g, (ch) => {
    const idx = BENGALI_DIGITS.indexOf(ch);
    return idx >= 0 ? String(idx) : ch;
  });
  return western.replace(/\D/g, '');
}
