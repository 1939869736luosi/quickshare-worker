export function generateSharePassword(length = 5): string {
  const digits = '0123456789';
  let result = '';
  for (let i = 0; i < length; i += 1) {
    const idx = Math.floor(Math.random() * digits.length);
    result += digits[idx];
  }
  return result;
}
