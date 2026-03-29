import { type FC } from 'react'
import styles from './styles.module.css'
import IllustrateAnimate from '@/components/illustrate-animate'

const WorkspacePanel: FC = () => {
	return (
		<div className={styles.workspace}>
			<IllustrateAnimate delay={1.1} className={styles.headerBar}>
				<div>
					<p className={styles.headerBar__label}>Current venture thesis</p>
					<h3 className={styles.headerBar__title}>
						Antimicrobial coating spinout
					</h3>
				</div>

				<div className={styles.headerStats}>
					<div className={styles.headerStat}>
						<span>TRL</span>
						<strong>5</strong>
					</div>
					<div className={styles.headerStat}>
						<span>IRL</span>
						<strong>6.2</strong>
					</div>
					<div className={styles.headerStatAccent}>
						<span>Readiness</span>
						<strong>82%</strong>
					</div>
				</div>
			</IllustrateAnimate>

			<div className={styles.bodyGrid}>
				<div className={styles.leftColumn}>
					<IllustrateAnimate delay={1.3} className={styles.paperCard}>
						<div className={styles.cardTop}>
							<div>
								<p className={styles.cardLabel}>Paper analysis</p>
								<h4 className={styles.cardTitle}>
									Bioactive surface coating for infection-resistant implants
								</h4>
							</div>
							<div className={styles.primaryBadge}>Domain: biotech / materials</div>
						</div>

						<div className={styles.abstractBox}>
							<p>
								Lemma extracts the technical claim, identifies defensible novelty,
								and maps the likely commercialization pathway from lab result to
								clinical product category.
							</p>
						</div>

						<div className={styles.signalGrid}>
							<div className={styles.signalTile}>
								<span>Novelty signal</span>
								<strong>High</strong>
							</div>
							<div className={styles.signalTile}>
								<span>Patent overlap</span>
								<strong>Low</strong>
							</div>
							<div className={styles.signalTile}>
								<span>Grant fit</span>
								<strong>DST SBIRI</strong>
							</div>
						</div>
					</IllustrateAnimate>

					<IllustrateAnimate delay={1.55} className={styles.evidenceCard}>
						<div className={styles.cardTopCompact}>
							<p className={styles.cardLabel}>Evidence trail</p>
							<span className={styles.secondaryBadge}>37 linked sources</span>
						</div>

						<div className={styles.evidenceRow}>
							<div className={styles.evidenceRow__left}>
								<span className={styles.evidenceDotGold} />
								<p>Comparable coating startups raised follow-on capital</p>
							</div>
							<span className={styles.evidenceValue}>funding</span>
						</div>

						<div className={styles.evidenceRow}>
							<div className={styles.evidenceRow__left}>
								<span className={styles.evidenceDotGreen} />
								<p>Patent density remains concentrated in adjacent applications</p>
							</div>
							<span className={styles.evidenceValue}>patents</span>
						</div>

						<div className={styles.evidenceRow}>
							<div className={styles.evidenceRow__left}>
								<span className={styles.evidenceDotBlue} />
								<p>Clinical procurement trend supports early demand narrative</p>
							</div>
							<span className={styles.evidenceValue}>signals</span>
						</div>
					</IllustrateAnimate>
				</div>

				<div className={styles.rightColumn}>
					<IllustrateAnimate delay={1.8} className={styles.marketCard}>
						<div className={styles.cardTopCompact}>
							<p className={styles.cardLabel}>Market scout</p>
							<span className={styles.secondaryBadge}>live web scan</span>
						</div>

						<div className={styles.chartArea}>
							<div className={styles.chartBars}>
								<div className={styles.chartBarGold} />
								<div className={styles.chartBarGreen} />
								<div className={styles.chartBarBlue} />
							</div>

							<div className={styles.chartSummary}>
								<div>
									<span>TAM</span>
									<strong>$4.2B</strong>
								</div>
								<div>
									<span>Competitors</span>
									<strong>6 tracked</strong>
								</div>
								<div>
									<span>Filings</span>
									<strong>147 recent</strong>
								</div>
							</div>
						</div>
					</IllustrateAnimate>

					<IllustrateAnimate delay={2.02} className={styles.deckCard}>
						<div className={styles.cardTopCompact}>
							<p className={styles.cardLabel}>Deck builder</p>
							<span className={styles.secondaryBadge}>12 slides generated</span>
						</div>

						<div className={styles.slideList}>
							<div className={styles.slideRow}>
								<span>01</span>
								<p>Problem & opportunity</p>
							</div>
							<div className={styles.slideRow}>
								<span>02</span>
								<p>Technology moat and readiness</p>
							</div>
							<div className={styles.slideRow}>
								<span>03</span>
								<p>Market timing and demand proof</p>
							</div>
							<div className={styles.slideRow}>
								<span>04</span>
								<p>Capital ask and venture path</p>
							</div>
						</div>
					</IllustrateAnimate>
				</div>
			</div>

			<IllustrateAnimate delay={2.22} className={styles.footerStrip}>
				<div className={styles.footerChip}>paper reader</div>
				<div className={styles.footerChip}>market scout</div>
				<div className={styles.footerChip}>feasibility matrix</div>
				<div className={styles.footerChip}>pitch-ready exports</div>
			</IllustrateAnimate>
		</div>
	)
}

export default WorkspacePanel
