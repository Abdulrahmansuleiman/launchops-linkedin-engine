const LOG_LEVELS = ["debug", "info", "warn", "error"] as const
type LogLevel = (typeof LOG_LEVELS)[number]

const currentLevel: LogLevel = "info"

function log(level: LogLevel, ...args: unknown[]) {
  const levelIndex = LOG_LEVELS.indexOf(level)
  const currentIndex = LOG_LEVELS.indexOf(currentLevel)
  if (levelIndex < currentIndex) return

  const prefix = `[AdIntel]`
  const timestamp = new Date().toISOString().slice(11, 19)

  switch (level) {
    case "error":
      console.error(timestamp, prefix, ...args)
      break
    case "warn":
      console.warn(timestamp, prefix, ...args)
      break
    default:
      console.log(timestamp, prefix, ...args)
  }
}

export const logger = {
  debug: (...args: unknown[]) => log("debug", ...args),
  info: (...args: unknown[]) => log("info", ...args),
  warn: (...args: unknown[]) => log("warn", ...args),
  error: (...args: unknown[]) => log("error", ...args),
}
