'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';

export function ChatTypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="flex items-end gap-2.5"
    >
      {/* Bot Mini Avatar */}
      <div className="relative size-8 shrink-0 rounded-full border border-primary/20 bg-primary/10 overflow-hidden shadow-xs flex items-center justify-center">
        <Image
          src="/images/chatbot.png"
          alt="AI"
          width={32}
          height={32}
          className="size-full object-cover"
          onError={(e) => {
            // Fallback if image fails
            e.currentTarget.style.display = 'none';
          }}
        />
        <Bot className="size-4 text-primary absolute" />
      </div>

      {/* Typing Bubble with [ . . . ] bouncing dots */}
      <div className="bg-card/90 dark:bg-card/80 border border-border/70 rounded-2xl rounded-tl-xs px-4 py-3 shadow-xs flex items-center gap-1.5 backdrop-blur-xs">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="size-2 rounded-full bg-primary/80"
            animate={{
              y: ['0px', '-5px', '0px'],
              opacity: [0.4, 1, 0.4],
              scale: [0.85, 1.15, 0.85],
            }}
            transition={{
              duration: 1.1,
              repeat: Infinity,
              delay: i * 0.18,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}
