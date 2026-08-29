"use client";

import { motion } from "motion/react";
import {
  Heart,
  MessageCircle,
  Repeat2,
  Share,
  MoreHorizontal,
} from "lucide-react";

export function Blog4() {
  return (
    <article
      className="w-full py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-neutral-950"
      aria-label="Article"
    >
      <div className="max-w-[720px] mx-auto w-full">
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-neutral-900 dark:text-white mb-4 leading-tight">
            The future of AI-powered development tools
          </h1>
          <p className="text-lg sm:text-xl text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Exploring how artificial intelligence is transforming the way
            developers write, debug, and ship code faster than ever before.
          </p>
        </motion.header>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center gap-3 mb-6"
        >
          <img
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face"
            alt="Author"
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-neutral-900 dark:text-white">
              Sarah Mitchell
            </span>
            <span className="text-xs text-neutral-500 dark:text-neutral-500">
              Dec 20, 2024
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="flex items-center justify-between py-3 border-y border-neutral-200 dark:border-neutral-800 mb-8"
        >
          <div className="flex items-center gap-1">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer">
              <Heart className="w-4 h-4" />
              <span>110</span>
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer">
              <MessageCircle className="w-4 h-4" />
              <span>19</span>
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer">
              <Repeat2 className="w-4 h-4" />
              <span>16</span>
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer">
              <Share className="w-4 h-4" />
              <span className="hidden sm:inline">Share</span>
            </button>
            <button className="p-1.5 rounded-full text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        <motion.figure
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-10"
        >
          <div className="aspect-[16/10] rounded-lg overflow-hidden bg-neutral-200 dark:bg-neutral-800 mb-3">
            <img
              src="https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1400&h=875&fit=crop"
              alt="AI visualization showing neural networks and code"
              className="w-full h-full object-cover"
            />
          </div>
          <figcaption className="text-sm text-neutral-500 dark:text-neutral-400 text-center italic">
            An artistic representation of AI-powered code generation. The
            technology is rapidly evolving to understand context and developer
            intent. Source:{" "}
            <a
              href="#"
              className="underline hover:text-neutral-900 dark:hover:text-white"
            >
              Unsplash
            </a>
          </figcaption>
        </motion.figure>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="prose prose-neutral dark:prose-invert max-w-none"
        >
          <p className="text-base sm:text-lg text-neutral-700 dark:text-neutral-300 leading-relaxed mb-6">
            The landscape of software development is undergoing a dramatic
            transformation. With the advent of large language models and
            sophisticated AI assistants, developers are finding new ways to
            accelerate their workflows and tackle complex problems with
            unprecedented efficiency.
          </p>

          <h2 className="text-xl sm:text-2xl font-medium tracking-tight text-neutral-900 dark:text-white mt-10 mb-4">
            The rise of AI pair programming
          </h2>
          <p className="text-base sm:text-lg text-neutral-700 dark:text-neutral-300 leading-relaxed mb-6">
            Gone are the days when developers worked in isolation, manually
            writing every line of code. Today's AI-powered tools act as
            intelligent collaborators, understanding context, suggesting
            completions, and even explaining complex codebases in natural
            language.
          </p>

          <h2 className="text-xl sm:text-2xl font-medium tracking-tight text-neutral-900 dark:text-white mt-10 mb-4">
            What this means for the future
          </h2>
          <p className="text-base sm:text-lg text-neutral-700 dark:text-neutral-300 leading-relaxed mb-6">
            As these tools continue to evolve, we can expect to see even more
            sophisticated capabilities emerge. From automated code review to
            intelligent refactoring suggestions, the possibilities are endless.
            The key is to embrace these tools while maintaining the critical
            thinking and problem-solving skills that define great engineers.
          </p>
        </motion.div>
      </div>
    </article>
  );
}

export default Blog4;
