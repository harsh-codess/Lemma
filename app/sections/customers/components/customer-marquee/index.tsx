import { type FC } from 'react'
import styles from './styles.module.css'

const institutions = [
	'IIT Bombay', 'IISER Pune', 'IISc Bangalore', 'IIT Madras', 'TIFR Mumbai', 'IIT Delhi',
	'IIT Kharagpur', 'IISER Kolkata', 'IIT Hyderabad', 'NCL Pune', 'NIMHANS', 'IISER Bhopal',
	'IIT Roorkee', 'CSIR-CDRI', 'IIT Kanpur', 'IISER Mohali', 'IIT Gandhinagar', 'IIT BHU',
]

const CustomerMarquee: FC = () => {
	return (
		<div className={styles.marquee}>
			<div className={styles.marquee__container}>
				{[1, 2].map((key) => (
					<div key={key} className={styles.marquee__inner__container}>
						{institutions.map((name) => (
							<span
								key={name}
								style={{
									fontWeight: 600,
									fontSize: '0.9rem',
									letterSpacing: '0.02em',
									color: 'rgba(255,255,255,0.65)',
									whiteSpace: 'nowrap',
									padding: '0 2rem',
								}}
							>
								{name}
							</span>
						))}
					</div>
				))}
			</div>
		</div>
	)
}

export default CustomerMarquee
