import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function errorToMessage(error: unknown, fallback = "Ocorreu um erro") {
  if (!error) return fallback;
  if (typeof error === "string") return error;

  if (error instanceof Error) {
    return error.message || fallback;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message || fallback;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}
