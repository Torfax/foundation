import { DayOfWeek } from "@src/core/types/DayOfWeek";

export class DateUtilService {
  
  private readonly dayMap: Record<number, DayOfWeek> = {
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
  getDayOfWeek(date: Date): DayOfWeek {
    return this.dayMap[date.getDay()];
  }

  /**
   * Convierte una hora en formato "HH:MM" a minutos
   */
  parseTimeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Convierte un objeto Date a minutos del día
   */
  dateToMinutes(date: Date): number {
    return date.getHours() * 60 + date.getMinutes();
  }

  /**
   * Compara si una fecha está dentro de un rango horario
   */
  isTimeInRange(date: Date, startTime: string, endTime: string): boolean {
    const timeMinutes = this.dateToMinutes(date);
    const startMinutes = this.parseTimeToMinutes(startTime);
    const endMinutes = this.parseTimeToMinutes(endTime);
    
    return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
  }

  /**
   * Compara si un rango de fechas está dentro de un rango horario permitido
   */
  isDateTimeRangeInSchedule(
    start: Date, 
    end: Date, 
    allowedStart: string, 
    allowedEnd: string
  ): boolean {
    const startMinutes = this.dateToMinutes(start);
    const endMinutes = this.dateToMinutes(end);
    const allowedStartMinutes = this.parseTimeToMinutes(allowedStart);
    const allowedEndMinutes = this.parseTimeToMinutes(allowedEnd);

    return startMinutes >= allowedStartMinutes && endMinutes <= allowedEndMinutes;
  }

  /**
   * Obtiene todos los días de la semana como array
   */
  getAllDaysOfWeek(): DayOfWeek[] {
    return Object.values(DayOfWeek);
  }

  /**
   * Verifica si un día específico está en un array de días permitidos
   */
  isDayAllowed(date: Date, allowedDays: DayOfWeek[]): boolean {
    const dayOfWeek = this.getDayOfWeek(date);
    return allowedDays.includes(dayOfWeek);
  }
}