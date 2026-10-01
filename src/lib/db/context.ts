import { AsyncLocalStorage } from "node:async_hooks";
import type { MemoryGameState } from "./index";

export const gameStateContext = new AsyncLocalStorage<MemoryGameState>();
