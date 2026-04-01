import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({ adapter })

async function main() {
	console.log('🌱 Seeding Lemma database...')

	// Create a default institution
	const institution = await prisma.institution.upsert({
		where: { name: 'Indian Institute of Technology Delhi' },
		update: {},
		create: { name: 'Indian Institute of Technology Delhi' },
	})

	console.log(`✅ Institution: ${institution.name}`)

	// Create a demo user (replace with your actual Clerk user ID after sign-in)
	const user = await prisma.user.upsert({
		where: { id: 'demo-user' },
		update: {},
		create: {
			id: 'demo-user',
			email: 'demo@lemma.app',
			name: 'Demo Researcher',
			role: 'RESEARCHER',
			institutionId: institution.id,
		},
	})

	console.log(`✅ User: ${user.email}`)

	// Seed project 1 — Bioactive surface coating spinout
	const project1 = await prisma.project.upsert({
		where: { id: 'bioactive-coating-spinout' },
		update: {},
		create: {
			id: 'bioactive-coating-spinout',
			title: 'Bioactive surface coating spinout',
			domain: 'Biotech / Materials',
			shortNote: 'Prioritized for TTO review after strong TRL and low patent overlap.',
			status: 'IN_REVIEW',
			currentStage: 'MARKET',
			readinessScore: 82,
			analysisStatus: 'COMPLETE',
			ownerId: user.id,
			institutionId: institution.id,
			stages: {
				create: [
					{ key: 'PAPER', label: 'Paper', description: 'Understand the research and its core claim.', status: 'COMPLETE' },
					{ key: 'TRL_IRL', label: 'TRL / IRL', description: 'Score maturity, readiness, and risk.', status: 'COMPLETE' },
					{ key: 'MARKET', label: 'Market', description: 'Map demand, competitors, patents, and signals.', status: 'CURRENT' },
					{ key: 'FEASIBILITY', label: 'Feasibility', description: 'Estimate team, timeline, capital, and grant fit.', status: 'UPCOMING' },
					{ key: 'DECK', label: 'Deck', description: 'Frame the venture narrative and funding ask.', status: 'UPCOMING' },
					{ key: 'REVIEW', label: 'Review', description: 'Prepare for committee approval and export readiness.', status: 'UPCOMING' },
				],
			},
			paper: {
				create: {
					abstractSummary: 'The paper describes an antimicrobial coating process for implant surfaces that improves resistance to infection while preserving material performance.',
					noveltySummary: 'The research appears differentiated through the coating chemistry and its compatibility with existing implant manufacturing pathways.',
					domainClassification: 'Primary: Biotech / Materials. Secondary: Medtech.',
					keyClaims: [
						'Improves surface resistance to infection in implant-like environments.',
						'Can integrate with existing implant material stacks.',
						'Creates a translational path toward hospital and device partnerships.',
					],
				},
			},
			trlIrl: {
				create: {
					trlScore: 'TRL 5',
					irlScore: 'IRL 6.2 / 10',
					rationale: [
						'Validated beyond purely theoretical work and supported by experimental evidence.',
						'Commercial readiness is constrained more by translation and evidence packaging than by novelty.',
					],
					confidence: '82% confidence based on paper evidence, adjacent market signals, and competitor maturity.',
					riskFlags: [
						'Pilot design needs to demonstrate repeatability outside ideal lab conditions.',
						'Clinical procurement pathway should be clarified before broader investor outreach.',
					],
				},
			},
			market: {
				create: {
					tam: '$4.2B',
					sam: '$1.1B',
					som: '$180M',
					summary: 'The strongest near-term market story sits around infection-sensitive implant categories where prevention can command procurement attention and premium value.',
				},
			},
			feasibility: {
				create: {
					teamRequirements: [
						'Principal investigator or technical founder continuity',
						'Materials engineer with pilot-transfer experience',
						'Commercial operator for hospital and device partnerships',
					],
					timeline: '12 to 18 months to reach an investor-ready pilot package.',
					capitalEstimate: '₹1.2 Cr seed plus grant-supported validation.',
					grantFit: 'DST SBIRI and medtech translational grants.',
					keyRisks: [
						'External validation package needs to be shaped for non-academic reviewers.',
						'Procurement proof may matter as much as technical proof for the next raise.',
					],
				},
			},
			deck: {
				create: {
					fundingAsk: '₹2 Cr to complete pilots, regulatory preparation, and early device partnerships.',
					keyNarrativePoints: [
						'Healthcare systems already spend to prevent device-related infection.',
						'The paper provides a concrete technical wedge, not generic platform science.',
						'The next milestone is a translation package strong enough for grant and seed committees.',
					],
				},
			},
			competitors: {
				create: [
					{ name: 'SurfaceShield Bio', positioning: 'Antimicrobial implant coating platform for premium surgical devices.', stage: 'Series A', signal: 'Raised an extension round tied to hospital pilot traction.' },
					{ name: 'NanoGuard Med', positioning: 'Protective surface chemistry for long-life device coatings.', stage: 'Seed', signal: 'Published new filings around adjacent coating durability claims.' },
				],
			},
			marketSignals: {
				create: [
					{ title: 'Funding activity increased across infection-prevention materials', type: 'FUNDING', impact: 'HIGH', summary: 'Recent financings suggest investor appetite for hospital cost-reduction narratives tied to infection control.' },
					{ title: 'Procurement teams are under pressure to justify infection-reduction spend', type: 'DEMAND', impact: 'HIGH', summary: 'This supports a commercial story focused on economic outcomes rather than pure material novelty.' },
				],
			},
		},
	})

	console.log(`✅ Project: ${project1.title}`)
	console.log('\n🎉 Seed complete! Your database is ready.')
	console.log('\n⚠️  IMPORTANT: After your first sign-in via Clerk, run:')
	console.log('   npx prisma studio')
	console.log('   Then update the demo-user record with your real Clerk user ID.')
}

main()
	.catch((e) => {
		console.error('❌ Seed failed:', e)
		process.exit(1)
	})
	.finally(() => prisma.$disconnect())
