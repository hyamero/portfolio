"use client";

import { useEffect } from "react";

export function GridHighlight() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const blockContainer = document.getElementById("blocks");
    const blockSize = 50;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const numCols = Math.ceil(screenWidth / blockSize);
    const numRows = Math.ceil(screenHeight / blockSize);
    const numBlocks = numCols * numRows;

    function createBlocks() {
      for (let i = 0; i < numBlocks; i++) {
        const block = document.createElement("div");
        block.classList.add("block-item");
        block.dataset.index = i.toString();
        block.addEventListener("mousemove", highlightRandomNeighbors);
        blockContainer?.appendChild(block);
      }
    }

    function highlightRandomNeighbors(this: HTMLElement) {
      const index = parseInt(this.dataset.index as string);
      const neighbors = [
        index - 1,
        index + 1,
        index - numCols,
        index + numCols,
        index - numCols - 1,
        index - numCols + 1,
        index + numCols - 1,
        index + numCols + 1,
      ].filter(
        (i) =>
          i >= 0 &&
          i < numBlocks &&
          Math.abs((i % numCols) - (index % numCols)) <= 1,
      );
      this.classList.add("highlight");
      setTimeout(() => {
        this.classList.remove("highlight");
      }, 500),
        shuffleArray(neighbors)
          .slice(0, 1)
          .forEach((i) => {
            const neighbor = blockContainer?.children[i];
            if (neighbor) {
              neighbor.classList.add("highlight");
              setTimeout(() => {
                neighbor?.classList.remove("highlight");
              }, 500);
            }
          });

      function shuffleArray(array: number[]) {
        for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
      }
    }

    createBlocks();
  }, []);

  return (
    <div className="gradient-to-b blocks-container point fixed left-0 top-0 h-screen w-screen overflow-hidden border-y ">
      {/* Vignette Effect */}
      <div className="pointer-events-none absolute  h-full w-screen shadow-[0_60px_300px_150px_rgba(0,0,0,0.9)_inset]" />

      {/* White BG to config Vignette */}
      {/* <div className="pointer-events-none absolute -z-10 h-full w-screen bg-white" /> */}

      <div
        id="blocks"
        className="flex h-screen w-[105vw] flex-wrap content-center justify-start overflow-hidden"
      ></div>
    </div>
  );
}
