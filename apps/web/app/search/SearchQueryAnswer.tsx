"use client";

import { Card, CardContent, CardHeader } from "@/components/atoms/Card";
import { ClientGeneration } from "@/components/atoms/ClientGeneration";
import { GlobeIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import { motion } from "framer-motion";

export const SearchQueryAnswer = ({
  sources,
  searchQuery,
}: {
  sources: any;
  searchQuery: string;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  return (
    <Card>
      <CardHeader size={4}>
        <span className="flex flex-row gap-2 items-end">
          Answer
          <motion.div
            animate={{ rotate: isLoading ? 360 : 0 }}
            transition={{
              duration: 1,
              repeat: isLoading ? Infinity : 0,
              ease: "easeInOut",
            }}
          >
            <GlobeIcon className="h-8" />
          </motion.div>
        </span>
      </CardHeader>
      <CardContent>
        <ClientGeneration
          useMarkdown={true}
          sources={sources}
          messages={[{ role: "user", content: searchQuery }]}
          setIsLoading={setIsLoading}
        />
      </CardContent>
    </Card>
  );
};
