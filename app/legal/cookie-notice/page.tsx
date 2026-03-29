import LegalPageTemplate from '@/components/legal-page-template'

const facts = [
	{ label: 'Applies to', value: 'The website, app sessions, and auth flows' },
	{ label: 'Focus', value: 'Cookies, browser storage, and session-level persistence' },
	{ label: 'Draft status', value: 'Product-ready page to review with counsel before launch' },
]

const sections = [
	{
		title: 'Why cookies are used',
		body: [
			'Lemma may use cookies and similar browser storage technologies to keep users signed in, protect accounts, remember essential preferences, and support product reliability.',
			'Some of these technologies are necessary for core functionality, especially where authentication and secure workspace access are involved.',
		],
	},
	{
		title: 'Types of cookies',
		body: [
			'Essential cookies support sign-in, session continuity, security protections, and routing across protected areas of the application. Preference cookies may remember product settings or UI choices that improve the experience.',
			'Analytics-related technologies may be used to understand stability and product performance, provided they align with the organization’s privacy commitments and implementation choices.',
		],
		bullets: [
			'Essential cookies: authentication, security, and session continuity.',
			'Preference storage: remembering product or interface settings.',
			'Operational analytics: performance and reliability diagnostics.',
		],
	},
	{
		title: 'Managing cookie settings',
		body: [
			'Users can typically control cookies through their browser settings. Blocking all cookies may affect sign-in behavior, protected routes, and other features that depend on persistent session state.',
			'Where institutional requirements apply, cookie and consent handling should be aligned with the customer’s deployment decisions and legal review process.',
		],
	},
]

export default function CookieNoticePage() {
	return (
		<LegalPageTemplate
			badgeText='Cookie notice'
			heading='The browser-level technologies used to keep Lemma secure and usable.'
			description='This page covers the categories of cookies and related storage mechanisms that may be used across the marketing site, auth surfaces, and application sessions.'
			facts={facts}
			sections={sections}
		/>
	)
}
