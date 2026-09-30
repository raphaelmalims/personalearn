"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { studentSchema, type StudentFormValues } from "@/lib/validations/class";
import { useCreateStudent } from "@/lib/hooks/use-classes";
import { STUDENT_INTERESTS_MAX_LENGTH } from "@/lib/students/interests";
import { cn } from "@/lib/utils";

type StudentFormProps = {
  classId: string;
  onSuccess?: () => void;
  submitLabel?: string;
};

export function StudentForm({
  classId,
  onSuccess,
  submitLabel = "Add student",
}: StudentFormProps) {
  const createStudent = useCreateStudent(classId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      full_name: "",
      admission_number: "",
      gender: undefined,
      interests: "",
    },
  });

  async function onSubmit(values: StudentFormValues) {
    await createStudent.mutateAsync(values);
    reset();
    onSuccess?.();
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-1.5">
        <Label htmlFor="full_name">Full name</Label>
        <Input id="full_name" {...register("full_name")} />
        {errors.full_name ? (
          <p className="text-xs text-destructive">{errors.full_name.message}</p>
        ) : null}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="admission_number">Admission no. (optional)</Label>
          <Input id="admission_number" {...register("admission_number")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="gender">Gender (optional)</Label>
          <Select id="gender" defaultValue="" {...register("gender")}>
            <option value="">—</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="interests">Interests / passions (optional)</Label>
        <textarea
          id="interests"
          {...register("interests")}
          maxLength={STUDENT_INTERESTS_MAX_LENGTH}
          rows={2}
          placeholder="e.g. football, choir, drawing"
          className={cn(
            "flex min-h-[4.5rem] w-full rounded-xl border border-input bg-card px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50"
          )}
        />
        <p className="text-xs text-muted-foreground">
          Short notes or comma-separated tags. Used to personalize evening
          feedback.
        </p>
        {errors.interests ? (
          <p className="text-xs text-destructive">{errors.interests.message}</p>
        ) : null}
      </div>
      {createStudent.error ? (
        <p className="text-sm text-destructive">{createStudent.error.message}</p>
      ) : null}
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={createStudent.isPending}>
          {createStudent.isPending ? "Adding…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
