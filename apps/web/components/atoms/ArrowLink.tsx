import Link from "next/link";

export function ArrowLink({ href, children, ...props }: any) {
  return (
    <Link
      href={href}
      className="flex flex-row gap-2 hover:gap-3 transition duration-200 ease-in-out items-center"
      {...props}
    >
      {children} →
    </Link>
  );
}
