import Link from "next/link";

type Student = {
  name: string;
  detail: string;
  num: string;
  slug: string;
};

export default function StudentGrid({ students }: { students: Student[] }) {
  return (
    <section className="mt-0 border-b border-border">
      <div className="flex flex-wrap border-l border-t border-border">
        {students.map((student) => (
          <Link
            key={student.slug}
            href={`/students/${student.slug}`}
            className="group relative min-h-[200px] w-full border-b border-r border-border bg-background-card p-8 transition-colors duration-150 hover:bg-background-muted md:w-1/2 md:p-10 lg:w-1/4"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute right-6 top-6 text-[6rem] font-bold leading-none text-foreground-muted opacity-10 md:text-[8rem]"
            >
              {student.num}
            </span>
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
              {student.detail}
            </p>
            <h2 className="mt-4 text-lg font-semibold text-foreground md:text-xl">
              {student.name}
            </h2>
          </Link>
        ))}
      </div>
    </section>
  );
}
