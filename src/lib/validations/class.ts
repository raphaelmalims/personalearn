import { z } from "zod";
import { STUDENT_INTERESTS_MAX_LENGTH } from "@/lib/students/interests";

export const classSchema = z.object({
  name: z.string().min(2, "Class name is required"),
  grade_level: z.coerce.number().int().min(1).max(9),
  subject: z.string().min(2, "Subject is required"),
  term: z.coerce.number().int().min(1).max(3),
  academic_year: z.string().min(4, "Academic year is required"),
  section: z.string().optional(),
});

export type ClassFormValues = z.infer<typeof classSchema>;

export const studentSchema = z.object({
  full_name: z.string().min(2, "Student name is required"),
  admission_number: z.string().optional(),
  gender: z.enum(["Male", "Female"]).optional(),
  interests: z
    .string()
    .max(
      STUDENT_INTERESTS_MAX_LENGTH,
      `Keep interests under ${STUDENT_INTERESTS_MAX_LENGTH} characters`
    )
    .optional(),
});

export type StudentFormValues = z.infer<typeof studentSchema>;
