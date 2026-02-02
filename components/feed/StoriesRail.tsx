"use client";

type StoryUser = {
  id: string;
  name: string;
};

export function StoriesRail({ users }: { users: StoryUser[] }) {
  return (
    <section className="-mx-4 border-b border-border/60 px-4 pb-4">
      <div className="flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {users.map((u) => (
          <div key={u.id} className="w-16 shrink-0 text-center">
            <div className="mx-auto h-14 w-14 rounded-full bg-gradient-to-tr from-primary via-secondary to-accent p-[2px]">
              <div className="h-full w-full rounded-full bg-card" />
            </div>
            <div className="mt-2 truncate text-[11px] text-muted-foreground">
              {u.name}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
