export function extractJson(output: string): unknown {
  const match = output.match(/\{[\s\S]*\}/)
  if (!match) {
    throw new Error('Nenhum JSON encontrado na resposta.\n\nPreview:\n' + output.slice(0, 600))
  }
  try {
    return JSON.parse(match[0])
  } catch (e) {
    throw new Error(`JSON inválido: ${e}\n\nPreview do JSON:\n${match[0].slice(0, 400)}`)
  }
}
