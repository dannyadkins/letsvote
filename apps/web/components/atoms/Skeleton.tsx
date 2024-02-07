import classNames from "classnames";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  count?: number;
  className?: string;
}

function Skeleton({ className, count = 1, ...props }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className={classNames(
            "animate-pulse rounded-md bg-neutral-50",
            className
          )}
          {...props}
        />
      ))}
    </>
  );
}

export { Skeleton };
