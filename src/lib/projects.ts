export type Project = {
  /** Section id: the row's anchor, and where /project/<id> redirects. */
  id: string;
  name: string;
  year: number;
  url: string;
  /** `*…*` marks emphasized runs; see parseStatement. */
  statement: string;
};

export const projects: Project[] = [
  {
    id: "umamin",
    name: "Umamin",
    year: 2022,
    url: "https://umamin.link",
    statement:
      "A social platform for sending and receiving encrypted anonymous messages. Reached almost *3 million users* with more than *17.5 million page visits.*",
  },
  {
    id: "omsimos",
    name: "Omsimos",
    year: 2023,
    url: "https://omsimos.com",
    statement:
      "A community-driven, open-source developer collective building *enterprise-level open-source initiatives,* where I do *design and product engineering.*",
  },
  {
    id: "stackmap",
    name: "StackMap",
    year: 2026,
    url: "https://stackmap.omsimos.com",
    statement:
      "An *agent-first* tool that maps systems into an *interactive diagram,* for architecture, dataflow, workflow, lifecycle and sequence.",
  },
];
