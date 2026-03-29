import LegalPageTemplate from '@/components/legal-page-template'

const facts = [
	{ label: 'Applies to', value: 'All users accessing Lemma product surfaces' },
	{ label: 'Focus', value: 'Acceptable use, outputs, and product-specific responsibilities' },
	{ label: 'Draft status', value: 'Product-ready page to review with counsel before launch' },
]

const sections = [
	{
		title: 'Using the product',
		body: [
			'Lemma is designed to help researchers and institutions evaluate commercialization pathways for technical work. Access to the product should be used in line with the account permissions granted by the workspace owner.',
			'Users should not attempt to disrupt the service, access workspaces they are not authorized to view, or use the platform to generate fraudulent or deceptive material.',
		],
	},
	{
		title: 'Research materials and outputs',
		body: [
			'Users may upload papers, drafts, technical summaries, and related materials for analysis where they have the right to do so. Generated outputs may include scoring, market signals, feasibility summaries, and investor-facing narrative suggestions.',
			'These outputs are intended to accelerate internal review and draft preparation. Users remain responsible for checking factual accuracy, confidentiality requirements, and suitability for any external distribution.',
		],
		bullets: [
			'Do not treat generated output as legal, regulatory, or investment advice.',
			'Review decks, narratives, and summaries before sending them outside your team.',
			'Respect institutional review processes and IP ownership constraints.',
		],
	},
	{
		title: 'Beta features and model behavior',
		body: [
			'Certain capabilities may be released as preview or beta features. These features may change quickly, carry tighter usage limits, or be withdrawn as the product evolves.',
			'Because Lemma relies on model-driven analysis, some responses may be incomplete or require correction. The product is built to support review, not bypass it.',
		],
	},
	{
		title: 'Security and account responsibility',
		body: [
			'Each user is responsible for keeping their credentials secure and for the activity that occurs through their account. Administrators should promptly remove access when a user no longer needs to participate in a workspace.',
			'If you believe an account or workspace has been compromised, you should stop using the affected session and notify the workspace owner immediately.',
		],
	},
]

export default function ProductTermsPage() {
	return (
		<LegalPageTemplate
			badgeText='Product terms'
			heading='The rules that apply when people actually use Lemma.'
			description='These terms focus on how the product is used day to day: what can be uploaded, how outputs should be treated, and where responsibility still sits with the user.'
			facts={facts}
			sections={sections}
		/>
	)
}
