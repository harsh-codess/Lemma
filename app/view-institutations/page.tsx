import { type FC } from 'react'
import LayoutWrapper from '@/components/layout-wrapper'

const institutions = [
	'Indian Institute of Technology Delhi',
	'Indian Institute of Science Bengaluru',
	'Indian Institute of Technology Bombay',
	'Indian Institute of Technology Madras',
	'Indian Institute of Technology Kanpur',
	'Indian Institute of Technology Kharagpur',
]

const ViewInstitutationsPage: FC = () => {
	return (
		<main className='min-h-screen pt-[calc(var(--header-top)+var(--header-height))] pb-16'>
			<LayoutWrapper>
				<section className='mx-auto max-w-3xl pt-12'>
					<h1 className='text-4xl font-semibold tracking-tight text-white sm:text-5xl'>
						View Institutations
					</h1>
					<p className='mt-4 text-base text-gray-300 sm:text-lg'>
						Institutions where researchers are exploring startup-ready ideas with Lemma.
					</p>

					<ul className='mt-8 space-y-3'>
						{institutions.map((institution) => (
							<li
								key={institution}
								className='rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-100 sm:text-base'>
								{institution}
							</li>
						))}
					</ul>
				</section>
			</LayoutWrapper>
		</main>
	)
}

export default ViewInstitutationsPage
