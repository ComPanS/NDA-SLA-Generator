/**
 * Форматирует дату в удобочитаемый вид
 */
export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
};

/**
 * Форматирует дату в короткий формат
 */
export const formatDateShort = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
};

/**
 * Форматирует цену в рубли
 */
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
  }).format(price);
};
