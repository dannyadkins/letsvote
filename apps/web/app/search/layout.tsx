export default function SearchLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex justify-center items-center ">
      <div className="max-w-[700px] w-full">{children}</div>
    </div>
  );
}
