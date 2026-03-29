import { type FC } from 'react'

type SvgTextBlockProps = {
	x: number
	y: number
	lines: string[]
	fill: string
	fontSize: number
	fontWeight?: number | string
	lineHeight?: number
	textAnchor?: 'start' | 'middle' | 'end'
}

const SvgTextBlock: FC<SvgTextBlockProps> = ({
	x,
	y,
	lines,
	fill,
	fontSize,
	fontWeight,
	lineHeight = fontSize + 6,
	textAnchor = 'start',
}) => (
	<text
		x={x}
		y={y}
		fill={fill}
		fontSize={fontSize}
		fontWeight={fontWeight}
		textAnchor={textAnchor}>
		{lines.map((line, index) => (
			<tspan key={`${x}-${y}-${line}-${index}`} x={x} dy={index === 0 ? 0 : lineHeight}>
				{line}
			</tspan>
		))}
	</text>
)

export const MethodArchitectureSvg: FC = () => (
	<svg
		viewBox='0 0 920 520'
		width='100%'
		height='100%'
		role='img'
		aria-label='Lemma method architecture'>
		<defs>
			<linearGradient id='methodStroke' x1='0' y1='0' x2='1' y2='1'>
				<stop offset='0%' stopColor='rgba(255,255,255,0.24)' />
				<stop offset='100%' stopColor='rgba(255,255,255,0.08)' />
			</linearGradient>
			<linearGradient id='methodAccent' x1='0' y1='0' x2='1' y2='0'>
				<stop offset='0%' stopColor='rgba(94,106,210,0.78)' />
				<stop offset='100%' stopColor='rgba(78,167,252,0.72)' />
			</linearGradient>
		</defs>

		<rect x='24' y='36' width='250' height='180' rx='22' fill='rgba(255,255,255,0.03)' stroke='url(#methodStroke)' />
		<SvgTextBlock
			x={52}
			y={84}
			lines={['Paper Reader']}
			fill='rgba(255,255,255,0.92)'
			fontSize={24}
			fontWeight='600'
		/>
		<SvgTextBlock
			x={52}
			y={120}
			lines={['TRL scoring', 'domain classification']}
			fill='rgba(255,255,255,0.66)'
			fontSize={15}
			lineHeight={22}
		/>
		<rect x='52' y='170' width='158' height='12' rx='6' fill='rgba(255,255,255,0.08)' />
		<rect x='52' y='170' width='112' height='12' rx='6' fill='url(#methodAccent)' />

		<path d='M274 126 L360 126' stroke='rgba(255,255,255,0.32)' strokeWidth='2.5' />
		<path d='M348 118 L360 126 L348 134' fill='none' stroke='rgba(255,255,255,0.32)' strokeWidth='2.5' />

		<rect x='360' y='36' width='250' height='180' rx='22' fill='rgba(255,255,255,0.03)' stroke='url(#methodStroke)' />
		<SvgTextBlock
			x={388}
			y={84}
			lines={['Market Scout']}
			fill='rgba(255,255,255,0.92)'
			fontSize={24}
			fontWeight='600'
		/>
		<SvgTextBlock
			x={388}
			y={120}
			lines={['competition mapping', 'funding and patent signals']}
			fill='rgba(255,255,255,0.66)'
			fontSize={15}
			lineHeight={22}
		/>
		<rect x='388' y='170' width='170' height='12' rx='6' fill='rgba(255,255,255,0.08)' />
		<rect x='388' y='170' width='136' height='12' rx='6' fill='url(#methodAccent)' />

		<path d='M610 126 L696 126' stroke='rgba(255,255,255,0.32)' strokeWidth='2.5' />
		<path d='M684 118 L696 126 L684 134' fill='none' stroke='rgba(255,255,255,0.32)' strokeWidth='2.5' />

		<rect x='696' y='36' width='200' height='180' rx='22' fill='rgba(255,255,255,0.03)' stroke='url(#methodStroke)' />
		<SvgTextBlock
			x={724}
			y={84}
			lines={['Deck Builder']}
			fill='rgba(255,255,255,0.92)'
			fontSize={23}
			fontWeight='600'
		/>
		<SvgTextBlock
			x={724}
			y={120}
			lines={['feasibility matrix', 'investor-ready outputs']}
			fill='rgba(255,255,255,0.66)'
			fontSize={15}
			lineHeight={22}
		/>

		<rect x='24' y='284' width='872' height='192' rx='24' fill='rgba(255,255,255,0.025)' stroke='url(#methodStroke)' />
		<SvgTextBlock
			x={54}
			y={330}
			lines={['Shared confidence layer']}
			fill='rgba(255,255,255,0.9)'
			fontSize={24}
			fontWeight='600'
		/>
		<SvgTextBlock
			x={54}
			y={362}
			lines={[
				'Every stage writes back structured evidence so researchers can inspect',
				'the score, market framing, and final investor narrative before sharing.',
			]}
			fill='rgba(255,255,255,0.64)'
			fontSize={14}
			lineHeight={20}
		/>

		<rect x='54' y='418' width='176' height='44' rx='22' fill='rgba(255,255,255,0.06)' stroke='rgba(255,255,255,0.14)' />
		<SvgTextBlock
			x={142}
			y={446}
			lines={['Traceable evidence']}
			fill='rgba(255,255,255,0.88)'
			fontSize={14}
			fontWeight='600'
			textAnchor='middle'
		/>

		<rect x='248' y='418' width='188' height='44' rx='22' fill='rgba(255,255,255,0.06)' stroke='rgba(255,255,255,0.14)' />
		<SvgTextBlock
			x={342}
			y={446}
			lines={['Editable judgments']}
			fill='rgba(255,255,255,0.88)'
			fontSize={14}
			fontWeight='600'
			textAnchor='middle'
		/>

		<rect x='454' y='418' width='194' height='44' rx='22' fill='rgba(255,255,255,0.06)' stroke='rgba(255,255,255,0.14)' />
		<SvgTextBlock
			x={551}
			y={446}
			lines={['Institution-safe outputs']}
			fill='rgba(255,255,255,0.88)'
			fontSize={13}
			fontWeight='600'
			textAnchor='middle'
		/>

		<rect x='666' y='418' width='176' height='44' rx='22' fill='rgba(255,255,255,0.06)' stroke='rgba(255,255,255,0.14)' />
		<SvgTextBlock
			x={754}
			y={446}
			lines={['Ready for review']}
			fill='rgba(255,255,255,0.88)'
			fontSize={14}
			fontWeight='600'
			textAnchor='middle'
		/>
	</svg>
)

export const InstitutionsConstellationSvg: FC = () => (
	<svg
		viewBox='0 0 920 520'
		width='100%'
		height='100%'
		role='img'
		aria-label='Lemma institutions network'>
		<defs>
			<linearGradient id='institutionStroke' x1='0' y1='0' x2='1' y2='1'>
				<stop offset='0%' stopColor='rgba(255,255,255,0.22)' />
				<stop offset='100%' stopColor='rgba(255,255,255,0.08)' />
			</linearGradient>
		</defs>

		<circle cx='182' cy='132' r='64' fill='rgba(255,255,255,0.03)' stroke='url(#institutionStroke)' />
		<circle cx='458' cy='92' r='58' fill='rgba(255,255,255,0.03)' stroke='url(#institutionStroke)' />
		<circle cx='734' cy='150' r='68' fill='rgba(255,255,255,0.03)' stroke='url(#institutionStroke)' />
		<circle cx='236' cy='378' r='74' fill='rgba(255,255,255,0.03)' stroke='url(#institutionStroke)' />
		<circle cx='530' cy='350' r='88' fill='rgba(255,255,255,0.03)' stroke='url(#institutionStroke)' />
		<circle cx='788' cy='372' r='58' fill='rgba(255,255,255,0.03)' stroke='url(#institutionStroke)' />

		<path d='M246 128 L400 100' stroke='rgba(255,255,255,0.2)' strokeWidth='2.5' />
		<path d='M514 102 L668 140' stroke='rgba(255,255,255,0.2)' strokeWidth='2.5' />
		<path d='M220 184 L256 306' stroke='rgba(255,255,255,0.2)' strokeWidth='2.5' />
		<path d='M300 364 L442 352' stroke='rgba(255,255,255,0.2)' strokeWidth='2.5' />
		<path d='M618 356 L730 370' stroke='rgba(255,255,255,0.2)' strokeWidth='2.5' />
		<path d='M736 214 L758 314' stroke='rgba(255,255,255,0.2)' strokeWidth='2.5' />

		<SvgTextBlock
			x={182}
			y={138}
			lines={['IIT Delhi']}
			fill='rgba(255,255,255,0.92)'
			fontSize={20}
			fontWeight='600'
			textAnchor='middle'
		/>
		<SvgTextBlock
			x={458}
			y={98}
			lines={['IISc']}
			fill='rgba(255,255,255,0.92)'
			fontSize={20}
			fontWeight='600'
			textAnchor='middle'
		/>
		<SvgTextBlock
			x={734}
			y={156}
			lines={['IIT Bombay']}
			fill='rgba(255,255,255,0.92)'
			fontSize={19}
			fontWeight='600'
			textAnchor='middle'
		/>
		<SvgTextBlock
			x={236}
			y={386}
			lines={['IIT Madras']}
			fill='rgba(255,255,255,0.92)'
			fontSize={19}
			fontWeight='600'
			textAnchor='middle'
		/>
		<SvgTextBlock
			x={530}
			y={356}
			lines={['Lemma']}
			fill='rgba(255,255,255,0.92)'
			fontSize={24}
			fontWeight='600'
			textAnchor='middle'
		/>
		<SvgTextBlock
			x={788}
			y={378}
			lines={['Incubators']}
			fill='rgba(255,255,255,0.92)'
			fontSize={17}
			fontWeight='600'
			textAnchor='middle'
		/>

		<rect x='402' y='384' width='256' height='50' rx='25' fill='rgba(255,255,255,0.06)' stroke='rgba(255,255,255,0.14)' />
		<SvgTextBlock
			x={530}
			y={406}
			lines={['PI teams • TTOs', 'research founders']}
			fill='rgba(255,255,255,0.86)'
			fontSize={13}
			fontWeight='600'
			lineHeight={15}
			textAnchor='middle'
		/>
	</svg>
)

export const LegalStackSvg: FC = () => (
	<svg
		viewBox='0 0 920 520'
		width='100%'
		height='100%'
		role='img'
		aria-label='Lemma legal and policy documents'>
		<defs>
			<linearGradient id='legalStroke' x1='0' y1='0' x2='1' y2='1'>
				<stop offset='0%' stopColor='rgba(255,255,255,0.24)' />
				<stop offset='100%' stopColor='rgba(255,255,255,0.08)' />
			</linearGradient>
			<linearGradient id='legalAccent' x1='0' y1='0' x2='1' y2='0'>
				<stop offset='0%' stopColor='rgba(104,204,88,0.65)' />
				<stop offset='100%' stopColor='rgba(78,167,252,0.65)' />
			</linearGradient>
		</defs>

		<rect x='98' y='88' width='270' height='320' rx='22' fill='rgba(255,255,255,0.025)' stroke='url(#legalStroke)' />
		<rect x='132' y='124' width='132' height='10' rx='5' fill='url(#legalAccent)' />
		<rect x='132' y='156' width='202' height='12' rx='6' fill='rgba(255,255,255,0.12)' />
		<rect x='132' y='182' width='180' height='12' rx='6' fill='rgba(255,255,255,0.08)' />
		<rect x='132' y='228' width='202' height='12' rx='6' fill='rgba(255,255,255,0.12)' />
		<rect x='132' y='254' width='180' height='12' rx='6' fill='rgba(255,255,255,0.08)' />
		<rect x='132' y='300' width='202' height='12' rx='6' fill='rgba(255,255,255,0.12)' />
		<rect x='132' y='326' width='160' height='12' rx='6' fill='rgba(255,255,255,0.08)' />
		<text x='132' y='112' fill='rgba(255,255,255,0.9)' fontSize='20' fontWeight='600'>Policy stack</text>

		<rect x='430' y='60' width='328' height='152' rx='24' fill='rgba(255,255,255,0.03)' stroke='url(#legalStroke)' />
		<SvgTextBlock
			x={462}
			y={104}
			lines={['Privacy Notice']}
			fill='rgba(255,255,255,0.92)'
			fontSize={26}
			fontWeight='600'
		/>
		<SvgTextBlock
			x={462}
			y={138}
			lines={['Data handling, retention, access,', 'and researcher trust.']}
			fill='rgba(255,255,255,0.64)'
			fontSize={15}
			lineHeight={22}
		/>

		<rect x='470' y='260' width='294' height='172' rx='24' fill='rgba(255,255,255,0.03)' stroke='url(#legalStroke)' />
		<SvgTextBlock
			x={502}
			y={304}
			lines={['MSA + Terms']}
			fill='rgba(255,255,255,0.92)'
			fontSize={26}
			fontWeight='600'
		/>
		<SvgTextBlock
			x={502}
			y={338}
			lines={['Commercial guardrails that feel', 'as considered as the product itself.']}
			fill='rgba(255,255,255,0.64)'
			fontSize={15}
			lineHeight={22}
		/>

		<path d='M368 246 C408 214, 420 180, 430 150' stroke='rgba(255,255,255,0.22)' strokeWidth='2.5' />
		<path d='M372 266 C422 290, 440 312, 470 346' stroke='rgba(255,255,255,0.22)' strokeWidth='2.5' />
	</svg>
)
