import { prisma } from './lib/db.ts'

console.log('Testing database connection...')
try {
  const count = await prisma.researchSession.count()
  console.log('Database connection successful. Sessions:', count)
  process.exit(0)
} catch (error) {
  console.error('Database error:', error.message)
  process.exit(1)
}
