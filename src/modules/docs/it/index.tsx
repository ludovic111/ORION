import type { Topic } from "../content";
import { PART1 } from "./part1";
import { PART2 } from "./part2";
import { PART3A, PART3B } from "./part3";
import { PART4 } from "./part4";
import { CONDUCT_TOPICS } from "./conduct";
import {
  CONDUCT_MODULE_TOPICS,
  CONDUCT_TOGETHER_TOPICS,
} from "./content-conduct";
import { EXERCISE_TOPICS } from "./content-exercise";
import { VALISE_TOPIC } from "./content-valise";
import { DICTATION_TOPIC } from "./content-dictation";

// Same topics, same order as TOPICS in ../content.tsx.
export const TOPICS: Topic[] = [
  ...PART1,
  ...CONDUCT_TOPICS.filter((tp) => tp.group === "modules"),
  ...CONDUCT_MODULE_TOPICS,
  ...PART2,
  ...PART3A,
  ...CONDUCT_TOPICS.filter((tp) => tp.group === "together"),
  ...PART3B,
  ...CONDUCT_TOGETHER_TOPICS,
  ...PART4,
  ...EXERCISE_TOPICS,
  VALISE_TOPIC,
  DICTATION_TOPIC,
];
