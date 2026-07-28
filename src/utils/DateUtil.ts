import { DayOfWeek } from "../types/DayOfWeek";

const dayMap: Record<number, DayOfWeek> = {
  0: DayOfWeek.SUNDAY,
  1: DayOfWeek.MONDAY,
  2: DayOfWeek.TUESDAY,
  3: DayOfWeek.WEDNESDAY,
  4: DayOfWeek.THURSDAY,
  5: DayOfWeek.FRIDAY,
  6: DayOfWeek.SATURDAY
};

/**
 * Convierte un objeto Date a DayOfWeek
 */
export function getDayOfWeek(date: Date): DayOfWeek {
  return dayMap[date.getDay()];
}

/**
 * Convierte una hora en formato "HH:MM" a minutos
 */
export function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Convierte un objeto Date a minutos del día
 */
export function dateToMinutes(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

/**
 * Compara si una fecha está dentro de un rango horario
 */
export function isTimeInRange(
  date: Date,
  startTime: string,
  endTime: string
): boolean {
  const timeMinutes = dateToMinutes(date);
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);

  return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
}


/**
 * Obtiene todos los días de la semana como array
 */
export function getAllDaysOfWeek(): DayOfWeek[] {
  return Object.values(DayOfWeek);
}

/**
 * Verifica si un día específico está en un array de días permitidos
 */
export function isDayAllowed(
  date: Date,
  allowedDays: DayOfWeek[]
): boolean {
  const dayOfWeek = getDayOfWeek(date);
  return allowedDays.includes(dayOfWeek);
}