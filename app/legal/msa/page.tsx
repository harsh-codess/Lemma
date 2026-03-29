import LegalPageTemplate from '@/components/legal-page-template'

const facts = [
	{ label: 'Applies to', value: 'Institutional and managed Lemma subscriptions' },
	{ label: 'Focus', value: 'Commercial terms, service scope, and shared responsibilities' },
	{ label: 'Draft status', value: 'Product-ready page to review with counsel before launch' },
]

const sections = [
	{
		title: 'Scope of service',
		body: [
			'This Master Subscription Agreement describes the commercial framework for organizations using Lemma to analyze research materials and generate commercialization outputs.',
			'The agreement is intended to sit above the product-specific policies and order documents that define access levels, subscription terms, and rollout details.',
		],
	},
	{
		title: 'Accounts and access',
		body: [
			'Customer administrators are responsible for approving who receives access to institutional workspaces, which documents are uploaded, and which downstream outputs may be shared externally.',
			'Lemma may suspend or limit access where it reasonably detects security issues, misuse, or activity that could compromise the platform or other customers.',
		],
		bullets: [
			'Workspace access should be limited to authorized users.',
			'Customers remain responsible for the legality of materials they upload.',
			'Shared outputs should be reviewed before distribution outside the institution.',
		],
	},
	{
		title: 'Data and intellectual property',
		body: [
			'Customer content remains the property of the customer or its licensors. Lemma processes uploaded content solely to provide and improve the service in line with applicable product terms and privacy commitments.',
			'Outputs generated through the service should be treated as working material. Customers remain responsible for validating commercialization claims, financial assumptions, and legal assertions before external use.',
		],
	},
	{
		title: 'Fees, renewal, and termination',
		body: [
			'Subscription fees, billing cadence, and renewal mechanics are expected to be set in an order form or commercial quote. Unless otherwise stated there, access continues through the purchased subscription term.',
			'Either party may terminate for material breach if the breach is not cured within a commercially reasonable period after notice. Customers may export eligible materials during the subscription term, subject to product capability and security controls.',
		],
	},
	{
		title: 'Warranty boundaries and liability',
		body: [
			'Lemma is provided as a software service that helps structure commercialization analysis. It does not replace scientific review, regulatory advice, investor diligence, or legal counsel.',
			'Except as required by law or expressly agreed in writing, product outputs are provided without guarantees of market success, grant eligibility, funding outcomes, or patentability.',
		],
	},
]

export default function MsaPage() {
	return (
		<LegalPageTemplate
			badgeText='Master subscription agreement'
			heading='A commercial foundation for teams using Lemma in institutional workflows.'
			description='This page acts as the top-level commercial frame for workspace access, customer responsibilities, service scope, and subscription handling.'
			facts={facts}
			sections={sections}
		/>
	)
}
