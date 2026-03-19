'use client'

import { useEffect, useState, type FC } from 'react'
import GridCell from './grid-cell'
import styles from './styles.module.css'

const institutions = [
	['IIT Bombay', 'IIT Kharagpur', 'IIT Kanpur'],
	['IISER Pune', 'IISER Kolkata', 'IISER Mohali'],
	['IISc Bangalore', 'IIT Hyderabad', 'IIT Gandhinagar'],
	['IIT Madras', 'NCL Pune', 'IIT BHU'],
	['TIFR Mumbai', 'NIMHANS', 'CSIR-CDRI'],
	['IIT Delhi', 'IISER Bhopal', 'IIT Roorkee'],
]

// Render institution name as a styled span — passed as ReactNode to GridCell
const Name: FC<{ text: string }> = ({ text }) => (
	<span style={{
		fontWeight: 600,
		fontSize: '0.85rem',
		letterSpacing: '0.015em',
		color: 'rgba(255,255,255,0.82)',
		whiteSpace: 'nowrap',
	}}>
		{text}
	</span>
)

const CustomerList: FC = () => {
	const [layer, setLayer] = useState<number>(1)

	useEffect(() => {
		const changeLayer = () => setLayer((prev) => (prev % 3) + 1)
		const interval = setInterval(changeLayer, 3000)

		return () => clearInterval(interval)
	}, [])

	return (
		<div className={styles.customer__grid}>
			<div className={styles.logo__grid}>
				{institutions.map((group, i) => (
					<GridCell
						key={i}
						layer={layer}
						icon1={<Name text={group[0]} />}
						icon2={<Name text={group[1]} />}
						icon3={<Name text={group[2]} />}
					/>
				))}
			</div>
		</div>
	)
}

export default CustomerList
