import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  HubClassPanel,
  readClassPanelCollapsedPreference,
  writeClassPanelCollapsedPreference,
} from "./hub-class-panel";

vi.mock("@/components/classes/class-selector", () => ({
  ClassSelector: () => <div data-testid="class-selector" />,
}));

vi.mock("@/components/classes/class-resources-section", () => ({
  ClassResourcesSection: ({ searchQuery }: { searchQuery?: string }) => (
    <div data-testid="resources-section">{searchQuery}</div>
  ),
}));

vi.mock("@/components/classes/student-roster-table", () => ({
  StudentRosterTable: () => <div data-testid="roster-table" />,
}));

vi.mock("@/components/classes/add-student-dialog", () => ({
  AddStudentDialog: () => <button type="button">Add student</button>,
}));

vi.mock("@/components/classes/csv-import-dialog", () => ({
  CsvImportDialog: () => <button type="button">Import CSV</button>,
}));

vi.mock("@/lib/hooks/use-classes", () => ({
  useStudents: () => ({ data: [], isLoading: false }),
}));

vi.mock("@/lib/store/active-class", () => ({
  useActiveClassStore: (
    selector: (state: { activeClass: unknown }) => unknown
  ) =>
    selector({
      activeClass: {
        id: "class-1",
        name: "Grade 5 Maths",
        grade_level: 5,
        subject: "Mathematics",
        section: "A",
        term: 2,
      },
    }),
}));

afterEach(() => cleanup());

function renderPanel(overrides: Partial<React.ComponentProps<typeof HubClassPanel>> = {}) {
  const props = {
    classId: "class-1",
    collapsed: false,
    onCollapsedChange: vi.fn(),
    activeTab: "resources" as const,
    onTabChange: vi.fn(),
    searchQuery: "",
    onSearchQueryChange: vi.fn(),
    ...overrides,
  };
  return { ...render(<HubClassPanel {...props} />), props };
}

describe("class panel collapse preference", () => {
  beforeEach(() => localStorage.clear());

  it("returns null when the teacher has no stored preference", () => {
    expect(readClassPanelCollapsedPreference()).toBeNull();
  });

  it("round-trips the collapsed state under its own key", () => {
    writeClassPanelCollapsedPreference(true);
    expect(localStorage.getItem("ai-hub-class-panel-collapsed")).toBe("true");
    expect(readClassPanelCollapsedPreference()).toBe(true);

    writeClassPanelCollapsedPreference(false);
    expect(readClassPanelCollapsedPreference()).toBe(false);
  });

  it("does not disturb the conversation sidebar preference", () => {
    localStorage.setItem("ai-hub-conversations-collapsed", "true");
    writeClassPanelCollapsedPreference(false);

    expect(localStorage.getItem("ai-hub-conversations-collapsed")).toBe("true");
  });
});

describe("HubClassPanel", () => {
  it("collapses to a rail that can be expanded again", async () => {
    const user = userEvent.setup();
    const onCollapsedChange = vi.fn();
    renderPanel({ collapsed: true, onCollapsedChange });

    expect(screen.queryByRole("tab", { name: "Resources" })).toBeNull();

    await user.click(
      screen.getByRole("button", { name: "Expand class panel" })
    );

    expect(onCollapsedChange).toHaveBeenCalledWith(false);
  });

  it("collapses from the expanded header", async () => {
    const user = userEvent.setup();
    const onCollapsedChange = vi.fn();
    renderPanel({ onCollapsedChange });

    await user.click(
      screen.getByRole("button", { name: "Collapse class panel" })
    );

    expect(onCollapsedChange).toHaveBeenCalledWith(true);
  });

  it("marks the active tab and shows the resources surface", () => {
    renderPanel();

    expect(screen.getByRole("tab", { name: "Conversations" })).toHaveAttribute(
      "aria-selected",
      "false"
    );
    expect(screen.getByRole("tab", { name: "Resources" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(screen.getByRole("tab", { name: "Students" })).toHaveAttribute(
      "aria-selected",
      "false"
    );
    expect(screen.getByTestId("resources-section")).toBeInTheDocument();
  });

  it("switches to the students tab", async () => {
    const user = userEvent.setup();
    const onTabChange = vi.fn();
    renderPanel({ onTabChange });

    await user.click(screen.getByRole("tab", { name: "Students" }));

    expect(onTabChange).toHaveBeenCalledWith("students");
  });

  it("moves between tabs with the arrow keys", async () => {
    const user = userEvent.setup();
    const onTabChange = vi.fn();
    renderPanel({ onTabChange });

    screen.getByRole("tab", { name: "Resources" }).focus();
    await user.keyboard("{ArrowRight}");

    expect(onTabChange).toHaveBeenCalledWith("students");
  });

  it("renders conversation threads on the chats tab", () => {
    renderPanel({
      activeTab: "conversations",
      conversations: [
        {
          id: "c1",
          title: "Fractions recap",
          class_id: "class-1",
          teacher_id: "teacher-1",
          updated_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
      ],
    });

    expect(screen.getByRole("button", { name: "New conversation" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Fractions recap less/ })
    ).toBeInTheDocument();
  });

  it("renders the roster and its import entry points on the students tab", () => {
    renderPanel({ activeTab: "students" });

    expect(screen.getByTestId("roster-table")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add student" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Import CSV" })).toBeInTheDocument();
  });

  it("passes the header search down to the resources surface", () => {
    renderPanel({ searchQuery: "fractions" });

    expect(screen.getByTestId("resources-section")).toHaveTextContent(
      "fractions"
    );
  });

  it("clears the search when the panel collapses", () => {
    const onSearchQueryChange = vi.fn();
    const { rerender, props } = renderPanel({
      searchQuery: "fractions",
      onSearchQueryChange,
    });

    onSearchQueryChange.mockClear();
    rerender(<HubClassPanel {...props} collapsed searchQuery="fractions" />);

    expect(onSearchQueryChange).toHaveBeenCalledWith("");
  });

  it("carries the class switcher and hover metadata in its header", () => {
    renderPanel();

    expect(screen.getByTestId("class-selector")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Grade 5 Maths" })
    ).toHaveAttribute("aria-expanded", "false");
  });
});
