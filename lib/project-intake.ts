export const projectDomainOptions = [
	'Biotech / Materials',
	'Medtech',
	'Diagnostics',
	'Energy / Advanced materials',
	'Climate / Industrial',
	'AI / Software',
	'Other',
] as const

export type ProjectDomainOption = (typeof projectDomainOptions)[number]

export const isProjectDomainOption = (
	value: string,
): value is ProjectDomainOption => projectDomainOptions.includes(value as ProjectDomainOption)

export type ProjectCreationPhase =
	| 'idle'
	| 'creating-project'
	| 'uploading-paper'
	| 'linking-paper'
	| 'starting-analysis'
	| 'done'
	| 'error'

export const projectCreationPhaseLabels: Record<ProjectCreationPhase, string> = {
	idle: '',
	'creating-project': 'Creating project...',
	'uploading-paper': 'Uploading paper to secure storage...',
	'linking-paper': 'Linking paper to project...',
	'starting-analysis': 'Starting AI analysis pipeline...',
	done: 'Redirecting to workspace...',
	error: 'Something went wrong',
}

type RunProjectCreationFlowInput = {
	title: string
	institution: string
	lab: string
	domain: string
	shortNote?: string
	file: File
	onPhaseChange?: (phase: ProjectCreationPhase) => void
	onProjectCreated?: (projectId: string) => void
}

export async function runProjectCreationFlow({
	title,
	institution,
	lab,
	domain,
	shortNote,
	file,
	onPhaseChange,
	onProjectCreated,
}: RunProjectCreationFlowInput) {
	onPhaseChange?.('creating-project')

	const createRes = await fetch('/api/projects', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			title: title.trim(),
			institution: institution.trim(),
			lab: lab.trim(),
			domain,
			shortNote: shortNote?.trim() || undefined,
		}),
	})

	if (!createRes.ok) {
		const err = await createRes.json().catch(() => null)
		throw new Error(
			err?.error?.formErrors?.[0] ?? err?.error ?? 'Failed to create project',
		)
	}

	const project = await createRes.json()
	onProjectCreated?.(project.id as string)

	onPhaseChange?.('uploading-paper')
	// Two-step upload: ask the API for a presigned URL, then PUT the file
	// straight to R2. Routing the bytes through /api/upload breaks on Vercel,
	// which caps request bodies at ~4.5 MB — smaller than most papers.
	const presignRes = await fetch('/api/upload', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			projectId: project.id,
			fileName: file.name,
			fileType: file.type,
			fileSize: file.size,
		}),
	})

	if (!presignRes.ok) {
		const err = await presignRes.json().catch(() => null)
		throw new Error(err?.error ?? 'Failed to upload paper')
	}

	const { uploadUrl, publicUrl } = await presignRes.json()

	const putRes = await fetch(uploadUrl, {
		method: 'PUT',
		headers: { 'Content-Type': file.type },
		body: file,
	})

	if (!putRes.ok) {
		throw new Error('Failed to upload paper to storage')
	}

	onPhaseChange?.('linking-paper')
	const patchRes = await fetch(`/api/projects/${project.id}`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			paperUrl: publicUrl,
			paperFileName: file.name,
		}),
	})

	if (!patchRes.ok) {
		throw new Error('Failed to link paper to project')
	}

	onPhaseChange?.('starting-analysis')
	const analyzeRes = await fetch(`/api/projects/${project.id}/analyze`, {
		method: 'POST',
	})

	if (!analyzeRes.ok) {
		const err = await analyzeRes.json().catch(() => null)
		throw new Error(err?.error ?? 'Failed to start analysis')
	}

	onPhaseChange?.('done')

	return { projectId: project.id as string }
}
