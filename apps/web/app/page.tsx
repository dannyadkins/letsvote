import { MotionDivWrapper } from "@/components/core/ClientMotion";
import { Input } from "@/components/atoms/Input";
import Image from "next/image";
import { SearchBar } from "../components/organisms/SearchBar";
import { ArrowLink } from "@/components/atoms/ArrowLink";
import { canididates } from "@/libs/const";
import { Card, CardContent } from "@/components/atoms/Card";

export default function Home() {
  return (
    <main className="w-full flex flex-col items-center flex-grow p-8">
      {/* TODO: Fix up this styling, in here temporarily to prevent layout shift with SSR+anim */}
      <div className="h-[100vh] absolute -z-50">
        <MotionDivWrapper
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 0.25, y: 0 }}
          transition={{ duration: 1 }}
          className=" h-[600px] select-none"
        >
          <Image
            src="/globe_outline_transparent.png"
            alt="Globe Outline"
            layout="responsive"
            width={800}
            height={600}
          />
        </MotionDivWrapper>
      </div>
      <div className="w-full flex flex-col items-center justify-center h-[50vh] gap-4">
        <MotionDivWrapper
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="h-[80px]"
        >
          <h1>Let's Vote.</h1>
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
      <Card className="w-full p-8 flex flex-col items-center min-h-[800px] ">
        <p className="caption">AGGREGATED FROM</p>

        <div className="flex flex-col w-full items-start">
          <div>
            <ArrowLink href="/races">
              <h2> Explore races </h2>
            </ArrowLink>
            Lalalala
          </div>
          <div>
            <h2> Learn about candidates </h2>
            {canididates.map((candidate) => (
              <ArrowLink
                key={candidate.name}
                href={`/candidates/${candidate.slug}`}
              >
                {candidate.name}
              </ArrowLink>
            ))}
          </div>
          <h2> Ask questions </h2>
        </div>
      </Card>
    </main>
  );
}
