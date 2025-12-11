export type MitreTag = { id: string; name: string }

const patterns: Array<{ rx: RegExp; tag: MitreTag }> = [
  { rx: /port scan|nmap|masscan/i, tag: { id: 'T1046', name: 'Network Service Scanning' } },
  { rx: /bruteforce|authentication failed|login failed/i, tag: { id: 'T1110', name: 'Brute Force' } },
  { rx: /dns|exfiltration|beacon/i, tag: { id: 'T1041', name: 'Exfiltration Over C2 Channel' } },
  { rx: /powershell|wscript|cmd\.exe/i, tag: { id: 'T1059', name: 'Command and Scripting Interpreter' } },
  { rx: /credential|hash dump|lsass/i, tag: { id: 'T1003', name: 'OS Credential Dumping' } }
]

export function mitreFromText(text: string): MitreTag[] {
  const found: Record<string, MitreTag> = {}
  for (const p of patterns) {
    if (p.rx.test(text)) found[p.tag.id] = p.tag
  }
  return Object.values(found)
}

export function mitreFromPorts(ports: number[]): MitreTag[] {
  const tags: MitreTag[] = []
  if (ports && ports.length > 0) tags.push({ id: 'T1046', name: 'Network Service Scanning' })
  if (ports.includes(22)) tags.push({ id: 'T1021', name: 'Remote Services (SSH)' })
  if (ports.includes(445)) tags.push({ id: 'T1021', name: 'Remote Services (SMB)' })
  return tags
}
