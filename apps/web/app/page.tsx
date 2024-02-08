import { MotionDivWrapper } from "@/components/core/ClientMotion";
import { Input } from "@/components/atoms/Input";
import Image from "next/image";
import { SearchBar } from "../components/organisms/SearchBar";
import { ArrowLink } from "@/components/atoms/ArrowLink";
import { canididates } from "@/libs/const";
import { Card, CardContent } from "@/components/atoms/Card";
import { CandidateCard } from "./candidates/[slug]/CandidateCard";
import Link from "next/link";

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
      <div className="w-full flex flex-col items-center justify-center h-[50vh] gap-8">
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

        <div className="flex flex-col w-full items-start gap-12">
          <div className="flex flex-col gap-6">
            <h2> Ask questions </h2>
            <p className="max-w-[700px]">
              Access to cited sources and personalizable information about
              elections and your candidates.{" "}
            </p>
          </div>
          {/* <div>
            <ArrowLink href="/races">
              <h2> Explore races </h2>
            </ArrowLink>
            {canididates.map()}
          </div> */}
          <div className="flex flex-col gap-6">
            <h2> Learn about candidates </h2>
            <p className="max-w-[700px]">
              {" "}
              Information about candidates from the Presidential election down
              to your own local elections.{" "}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              {canididates.map((candidate) => (
                <MotionDivWrapper
                  whileHover={{
                    scale: 1.05,
                    y: -10,
                    boxShadow: "0px 10px 15px rgba(0,0,0,0.1)",
                  }}
                  whileTap={{ scale: 0.95, y: 0 }}
                  className="cursor-pointer"
                >
                  <Link
                    href={`/candidates/${candidate.slug}`}
                    key={candidate.slug}
                  >
                    <CandidateCard candidate={candidate} />
                  </Link>
                </MotionDivWrapper>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </main>
  );
}
