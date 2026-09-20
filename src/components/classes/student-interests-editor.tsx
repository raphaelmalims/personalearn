"use client";

import { useEffect, useState } from "react";
import type { Student } from "@/types/database";
import { useUpdateStudent } from "@/lib/hooks/use-classes";
import { STUDENT_INTERESTS_MAX_LENGTH } from "@/lib/students/interests";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type StudentInterestsEditorProps = {
  classId: string;
  student: Student;
};

export function StudentInterestsEditor({
  classId,
  student,
}: StudentInterestsEditorProps) {
  const updateStudent = useUpdateStudent(classId);
  const [value, setValue] = useState(student.interests ?? "");

  useEffect(() => {
    setValue(student.interests ?? "");
  }, [student.id, student.interests]);

  const saved = student.interests ?? "";
  const dirty = value.trim() !== saved.trim();

  async function onSave() {
    await updateStudent.mutateAsync({ id: student.id, interests: value });
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={`student-interests-${student.id}`}>Interests / passions</Label>
      <textarea
        id={`student-interests-${student.id}`}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        maxLength={STUDENT_INTERESTS_MAX_LENGTH}
        rows={2}
        placeholder="e.g. football, choir, drawing"
        className={cn(
          "flex min-h-[4.5rem] w-full rounded-xl border border-input bg-card px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50"
        )}
      />
      <p className="text-xs text-muted-foreground">
        Short notes or comma-separated tags. Used to personalize evening feedback.
      </p>
      {updateStudent.error ? (
        <p className="text-xs text-destructive">{updateStudent.error.message}</p>
      ) : null}
      <div className="flex justify-end">
        <Button
          type="button"
          size="sm"
          disabled={!dirty || updateStudent.isPending}
          onClick={() => {
            void onSave();
          }}
        >
          {updateStudent.isPending ? "Saving…" : "Save interests"}
        </Button>
      </div>
    </div>
  );
}
