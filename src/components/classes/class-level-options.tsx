import { CLASS_LEVELS } from "@/lib/classes/level";

export function ClassLevelOptions() {
  return CLASS_LEVELS.map((level) => (
    <option key={level.code} value={level.code}>
      {level.label}
    </option>
  ));
}
