const BAR_WIDTH = 22

export interface ProgressBar {
  tick: () => void
  done: (summary: string) => void
}

export function createProgressBar(label: string, total: number): ProgressBar {
  if (!process.stdout.isTTY || total === 0) {
    return {
      tick: () => {},
      done: (summary) => console.log(`  ${summary}`),
    }
  }

  let current = 0

  function render() {
    const pct = current / total
    const filled = Math.round(pct * BAR_WIDTH)
    const bar = '█'.repeat(filled) + '░'.repeat(BAR_WIDTH - filled)
    process.stdout.write(`\r  ${label} [${bar}] ${current}/${total}`)
  }

  render()

  return {
    tick() {
      current++
      render()
    },
    done(summary) {
      process.stdout.clearLine(0)
      process.stdout.cursorTo(0)
      console.log(`  ${summary}`)
    },
  }
}
