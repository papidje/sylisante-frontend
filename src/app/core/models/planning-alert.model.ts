export interface PlanningAlertDto {
  id: number;
  practitionerId: number;
  practitionerName: string;
  appointmentId: number | null;
  patientName: string | null;
  appointmentDateTime: string | null;
  message: string;
  resolved: boolean;
  createdAt: string;
}
