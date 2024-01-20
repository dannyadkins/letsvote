import { MotionDivWrapper } from "@/components/animations/ClientMotion";
import Image from "next/image";

export default function Home() {
  return (
    <main className="w-full flex flex-col items-center">
      <MotionDivWrapper
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 0.1, y: 0 }}
        transition={{ duration: 1 }}
      >
        <Image
          src="/globe_outline_transparent.png"
          alt="Globe Outline"
          layout="responsive"
          width={800}
          height={600}
          className="w-[60%]"
        />
      </MotionDivWrapper>
    </main>
  );
}
