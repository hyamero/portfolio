import { Fragment } from "react";

/** A headline split into words for the blur-in (motion.tsx), on the server so nothing shifts. */
export function Words({ text }: { text: string }) {
  return text.split(" ").map((word, i) => (
    <Fragment key={i}>
      {i > 0 && " "}
      <span data-head-word className="inline-block">
        {word}
      </span>
    </Fragment>
  ));
}
