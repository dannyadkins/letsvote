import { MotionDivWrapper } from "@/components/core/ClientMotion";
import { Input } from "@/components/atoms/Input";
import Image from "next/image";
import { SearchBar } from "./SearchBar";

export default function Home() {
  return (
    <main className="w-full flex flex-col items-center flex-grow p-8">
      <MotionDivWrapper
        initial={{ opacity: 0, y: 100, marginTop: 100 }}
        animate={{ opacity: 0.25, y: 0, marginTop: 0 }}
        transition={{ duration: 1 }}
        className="absolute -z-50"
      >
        <Image
          src="/globe_outline_transparent.png"
          alt="Globe Outline"
          layout="responsive"
          width={800}
          height={600}
        />
      </MotionDivWrapper>
      <div className="w-full flex flex-col items-center justify-center h-[50vh] gap-4">
        <MotionDivWrapper
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          <h1>Hi there.</h1>
          {/* TODO, give an example of a search if they don't do anything with typing animation */}
        </MotionDivWrapper>
        <MotionDivWrapper
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1 }}
        >
          <p>
            Learn about how you can vote and what the candidates are saying.
          </p>
        </MotionDivWrapper>
        <SearchBar />
      </div>
      <div className="bg-beige-50 w-full flex flex-col flex-grow items-center min-h-[800px] p-8 shadow-lg rounded-xl">
        <p className="caption">AGGREGATED FROM</p>

        <div className="flex flex-col w-full items-start">
          <div>
            <h2> Explore races </h2>
            Lalalala
          </div>

          <h2> Learn about candidates </h2>
          <h2> Ask questions </h2>
        </div>
      </div>
    </main>
  );
}
