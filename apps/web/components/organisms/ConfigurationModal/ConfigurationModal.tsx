"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/atoms/AlertDialog";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/atoms/Select";
import { GearIcon } from "@radix-ui/react-icons";
import { useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { States } from "@/libs/const";

export const ConfigurationModal = () => {
  const [cookies, setCookie] = useCookies([
    "customInstructions",
    "selectedState",
  ]);
  const [customInstructions, setCustomInstructions] = useState("");
  const [tempInstructions, setTempInstructions] = useState("");
  const [selectedState, setSelectedState] = useState("");

  useEffect(() => {
    if (cookies.customInstructions) {
      setCustomInstructions(cookies.customInstructions);
      setTempInstructions(cookies.customInstructions);
    }
    if (cookies.selectedState) {
      setSelectedState(cookies.selectedState);
    }
  }, [cookies.customInstructions, cookies.selectedState]);

  const handleInputChange = (event: any) => {
    setTempInstructions(event.target.value);
  };

  const handleSelectChange = (event: any) => {
    setSelectedState(event.target.value);
  };

  const handleSave = () => {
    setCustomInstructions(tempInstructions);
    setCookie("customInstructions", tempInstructions, { path: "/" });
    setCookie("selectedState", selectedState, { path: "/" });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost">
          <GearIcon />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Customize your experience</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogDescription>
          We want to make sure you have the best experience possible. Please
          take a moment to customize your settings.
        </AlertDialogDescription>
        <Input
          value={tempInstructions}
          onChange={handleInputChange}
          placeholder="Enter custom instructions, e.g. 'I only care about the environment'"
        />
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleSave}>Save</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
