"use client";

import { Input } from "@/components/atoms/Input";

import { InputProps } from "@/components/atoms/Input";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface TypingAnimationProps extends InputProps {
  startAfter: number;
  typingSpeed: number;
  animations: { text: string; duration: number }[];
}

const InputWithTypingAnimation: React.FC<TypingAnimationProps> = (props) => {
  const [text, setText] = useState(props.placeholder || "");
  const [isBackspacing, setIsBackspacing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(
      () => {
        if (isBackspacing) {
          setText(text.slice(0, text.length - 1));
          if (text === "") {
            setIsBackspacing(false);
          }
        } else {
          setText(props.animations[0].text.slice(0, text.length + 1));
          if (text === props.animations[0].text) {
            setIsBackspacing(true);
          }
        }
      },
      isBackspacing ? props.typingSpeed / 2 : props.typingSpeed
    );
    return () => clearTimeout(timer);
  }, [text, isBackspacing]);

  return <Input {...props} placeholder={text} />;
};

export default InputWithTypingAnimation;
