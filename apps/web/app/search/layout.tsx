export default function SearchLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex justify-center items-center p-8">
      <div className="max-w-[700px] w-full">{children}</div>
    </div>
  );
}
