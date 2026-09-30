/**
 * Static product frame of the AI Hub. Decorative — the live Hub is unchanged.
 */
export function HubFrame() {
  return (
    <figure className="surface-2 relative w-full overflow-hidden rounded-xl shadow-lg">
      <figcaption className="sr-only">
        The AI Hub, with the class panel and a reply grounded in the scheme of work.
      </figcaption>
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-foreground/30" />
          <span className="h-2 w-2 rounded-full bg-foreground/20" />
          <span className="h-2 w-2 rounded-full bg-foreground/10" />
        </div>
        <p className="text-caption text-muted-foreground">Grade 5 Science · Term 2</p>
        <span className="w-10" />
      </div>
      <div className="grid min-h-[280px] grid-cols-1 sm:grid-cols-[7.5rem_1fr] sm:min-h-[340px]">
        <div className="hidden border-r border-border p-3 sm:block">
          <p className="text-caption uppercase tracking-wide text-text-tertiary">Class</p>
          <ul className="mt-3 space-y-1 text-caption">
            {["Chats", "Resources", "Students"].map((tab, index) => (
              <li
                key={tab}
                className={
                  index === 0
                    ? "rounded-full bg-foreground px-2.5 py-1.5 text-background"
                    : "rounded-full px-2.5 py-1.5 text-muted-foreground"
                }
              >
                {tab}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-caption text-foreground">5 Science</p>
          <p className="text-caption text-text-tertiary">38 students</p>
        </div>
        <div className="flex flex-col justify-between gap-4 p-4 sm:p-5">
          <div className="space-y-3">
            <div className="ml-auto max-w-[85%] rounded-lg rounded-br-sm bg-foreground px-3 py-2 text-small text-background">
              What does week 4 ask them to do?
            </div>
            <div className="max-w-[92%] rounded-lg rounded-bl-sm border border-border bg-background px-3 py-2 text-small text-foreground">
              Week 4 is a practical on states of matter. Amina is ready for the
              extension. Brian needs the shorter stem on the worksheet.
            </div>
          </div>
          <div className="flex h-11 items-center rounded-full border border-border bg-background px-4 text-small text-text-tertiary">
            Ask about this class
          </div>
        </div>
      </div>
    </figure>
  );
}
