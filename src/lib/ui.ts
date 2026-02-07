import * as readline from 'node:readline'
import chalk from 'chalk'
import {createSpinner} from 'nanospinner'

/** Whether to show fancy UI (spinner, colors). Disable when --json or not TTY. */
export function useFancyUi(flags?: {json?: boolean}): boolean {
  if (flags?.json) return false
  return Boolean(process.stdout.isTTY)
}

/** Chalk styles for consistent CLI output. */
export const style = {
  dim: chalk.dim,
  error: chalk.red,
  info: chalk.cyan,
  label: chalk.blue,
  success: chalk.green,
  txHash: chalk.cyan.underline,
  value: chalk.white,
  warning: chalk.yellow,
}

/** Render ASCII banner (e.g. "one-wallet") using figlet. */
export async function renderBanner(text: string): Promise<string> {
  const {default: figlet} = await import('figlet')
  return figlet.text(text, {font: 'Slant', horizontalLayout: 'default'})
}

/** Run an async task with optional spinner. When useFancy is false, no spinner. */
export async function withSpinner<T>(
  message: string,
  task: () => Promise<T>,
  options: {fancy?: boolean} = {}
): Promise<T> {
  const fancy = options.fancy !== false && process.stdout.isTTY
  if (!fancy) {
    return task()
  }

  const spinner = createSpinner(message).start()
  try {
    const result = await task()
    spinner.success()
    return result
  } catch (error) {
    spinner.error({text: (error as Error).message})
    throw error
  }
}

/** Prompt for confirmation. Returns true only when user answers yes. Use only when TTY. */
export async function confirm(message: string, defaultYes = false): Promise<boolean> {
  if (!process.stdin.isTTY) return defaultYes
  const {default: inquirer} = await import('inquirer')
  const {ok} = await inquirer.prompt<{ok: boolean}>([
    {
      default: defaultYes,
      message,
      name: 'ok',
      type: 'confirm',
    },
  ])
  return ok
}

/** Prompt for password (hidden input). Use when TTY; otherwise returns empty or use env. */
export async function promptPassword(message: string): Promise<string> {
  if (!process.stdin.isTTY) return ''
  const {default: inquirer} = await import('inquirer')
  const {password} = await inquirer.prompt<{password: string}>([
    {
      mask: '*',
      message,
      name: 'password',
      type: 'password',
    },
  ])
  return password ?? ''
}

/**
 * Read N lines from stdin (one password per line). Use with --password-stdin when non-TTY.
 */
export function readPasswordFromStdin(lineCount: number): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const lines: string[] = []
    const rl = readline.createInterface({input: process.stdin})
    const onLine = (line: string) => {
      lines.push(line.trim())
      if (lines.length >= lineCount) {
        rl.removeListener('line', onLine)
        rl.close()
        resolve(lines)
      }
    }
    rl.on('line', onLine)
    rl.on('close', () => {
      if (lines.length < lineCount) resolve(lines)
    })
    rl.on('error', reject)
  })
}
