import { Badge } from "@/components/atoms/Badge";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/atoms/Card";
import Image from "next/image";

export const CandidateCard = ({ candidate }: { candidate: any }) => {
  return (
    <Card className="w-auto pt-4">
      <CardContent className="flex flex-col gap-4 justify-between">
        <h4>{candidate.name}</h4>
        <Image
          src={candidate.image}
          alt={candidate.name}
          height={300}
          width={300}
          className="rounded-lg"
        />
        <span className="flex flex-row gap-2 flex-wrap">
          {candidate.party && (
            <Badge variant="outline">Party: {candidate.party}</Badge>
          )}
          {candidate.race && (
            <Badge variant="outline">Race: {candidate.race.name}</Badge>
          )}
        </span>
      </CardContent>
    </Card>
  );
};
