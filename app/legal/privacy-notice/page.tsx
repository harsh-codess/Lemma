import LegalPageTemplate from '@/components/legal-page-template'

const facts = [
	{ label: 'Applies to', value: 'Visitors, signed-in users, and workspace administrators' },
	{ label: 'Focus', value: 'Account data, uploaded content, analytics, and retention' },
	{ label: 'Draft status', value: 'Product-ready page to review with counsel before launch' },
]

const sections = [
	{
		title: 'What we collect',
		body: [
			'Lemma may collect account details such as name, email address, organization or institution information, sign-in metadata, device and browser information, and the research materials that users choose to upload into the service.',
			'We may also collect product telemetry needed to keep the service functioning well, including page interactions, error traces, feature usage, and security events.',
		],
	},
	{
		title: 'How we use information',
		body: [
			'We use collected information to operate the platform, authenticate users, generate requested analysis, monitor reliability, prevent abuse, and improve product performance.',
			'Where customers use Lemma inside institutional workflows, uploaded material may be processed to produce scores, summaries, market intelligence, feasibility outputs, and presentation drafts tied to that workspace.',
		],
		bullets: [
			'To provide the product and requested outputs.',
			'To secure accounts and investigate suspicious activity.',
			'To maintain, troubleshoot, and improve the service.',
		],
	},
	{
		title: 'Sharing and retention',
		body: [
			'Information may be shared with subprocessors or service providers that help us host, secure, or operate the service. We do not share customer content with third parties for unrelated marketing purposes.',
			'Retention periods should be aligned with the customer relationship, workspace configuration, and legitimate operational needs such as security, auditability, and dispute handling.',
		],
	},
	{
		title: 'User choices and requests',
		body: [
			'Users may contact their workspace administrator for account access questions and may request correction or deletion where applicable. Administrators can manage seats and workspace-level access using the tools provided in the service.',
			'If a customer requires a stronger retention or deletion posture, those operational details should be confirmed in the commercial agreement or implementation plan.',
		],
	},
]

export default function PrivacyNoticePage() {
	return (
		<LegalPageTemplate
			badgeText='Privacy notice'
			heading='How Lemma handles account data and research material in the product.'
			description='This page explains the core categories of information Lemma may process, why that processing happens, and how the product approaches retention and customer control.'
			facts={facts}
			sections={sections}
		/>
	)
}
