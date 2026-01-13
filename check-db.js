import { prisma } from './lib/db.ts'

const sessions = await prisma.researchSession.findMany({
  orderBy: { createdAt: 'desc' },
  take: 5
})

console.log('Recent sessions:')
sessions.forEach(s => {
  console.log(`- ${s.id.substring(0, 8)}: ${s.query.substring(0, 30)}... [${s.status}]`)
})

process.exit(0)
