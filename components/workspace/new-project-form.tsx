'use client'

import Link from 'next/link'
import {
	ArrowLeft,
	ArrowRight,
	FileText,
	FolderUp,
	Loader2,
} from 'lucide-react'
import { useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import {
	createDraftWorkspaceProject,
	saveDraftWorkspaceProject,
} from '@/lib/workspace-data'

const domainOptions = [
	'Biotech / Materials',
	'Medtech',
	'Diagnostics',
	'Energy / Advanced materials',
	'Climate / Industrial',
	'AI / Software',
	'Other',
]

const inputClassName =
	'h-12 w-full rounded-2xl bg-white/[0.06] px-4 text-sm text-white placeholder:text-white/30 focus:bg-white/[0.09] focus:outline-none focus:ring-0'

const textareaClassName =
	'min-h-[132px] w-full rounded-[24px] bg-white/[0.06] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:bg-white/[0.09] focus:outline-none focus:ring-0'

const NewProjectForm = () => {
	const router = useRouter()
	const inputRef = useRef<HTMLInputElement | null>(null)
	const [isPending, startTransition] = useTransition()
	const [title, setTitle] = useState('')
	const [institution, setInstitution] = useState('')
	const [lab, setLab] = useState('')
	const [domain, setDomain] = useState(domainOptions[0])
	const [shortNote, setShortNote] = useState('')
	const [fileName, setFileName] = useState('')

	const isValid = useMemo(
		() => title.trim() && institution.trim() && lab.trim() && domain.trim(),
		[domain, institution, lab, title],
	)

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()

		if (!isValid) {
			return
		}

		startTransition(() => {
			const project = createDraftWorkspaceProject({
				title,
				institution,
				lab,
				domain,
				shortNote,
				fileName,
			})

			saveDraftWorkspaceProject(project)
			router.push(`/app/projects/${project.id}`)
		})
	}

	return (
		<section className='mx-auto max-w-[1380px]'>
			<div className='grid gap-8 xl:grid-cols-[280px_minmax(0,1fr)] 2xl:grid-cols-[320px_minmax(0,1fr)]'>
				<div className='space-y-6 xl:sticky xl:top-28 xl:self-start'>
					<Button
						asChild
						variant='outline'
						className='h-11 rounded-full bg-white/[0.05] px-4 text-white hover:bg-white/[0.08] hover:text-white'>
						<Link href='/app'>
							<ArrowLeft className='mr-2 h-4 w-4' />
							Back to projects
						</Link>
					</Button>

					<div>
						<p className='text-[0.7rem] uppercase tracking-[0.24em] text-[#e7c35a]'>
							New project
						</p>
						<h1 className='mt-3 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl'>
							Create a workspace from a paper.
						</h1>
						<p className='mt-3 text-sm leading-7 text-white/56'>
							Use the width you have: upload the paper, add the core metadata, and move straight into the workspace.
						</p>
					</div>
				</div>

				<form
					onSubmit={handleSubmit}
					className='overflow-hidden rounded-[34px] bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] px-6 py-7 sm:px-8 sm:py-8'>
					<div className='grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]'>
						<div className='space-y-6'>
							<label className='space-y-2'>
								<span className='text-sm font-medium text-white/82'>Paper title</span>
								<input
									value={title}
									onChange={(event) => setTitle(event.target.value)}
									placeholder='Bioactive coating platform for infection-resistant implants'
									className={inputClassName}
								/>
							</label>

							<label className='space-y-2'>
								<span className='text-sm font-medium text-white/82'>Short note</span>
								<textarea
									value={shortNote}
									onChange={(event) => setShortNote(event.target.value)}
									placeholder='Why is this paper worth a second look?'
									className={textareaClassName}
								/>
							</label>

							<div>
								<p className='text-sm font-semibold text-white'>Paper upload</p>

								<button
									type='button'
									onClick={() => inputRef.current?.click()}
									className='mt-4 flex w-full flex-col items-center justify-center rounded-[28px] bg-white/[0.05] px-6 py-8 text-center transition-colors hover:bg-white/[0.07]'>
									<div className='rounded-2xl bg-white/[0.08] p-4 text-white/75'>
										<FolderUp className='h-6 w-6' />
									</div>
									<p className='mt-4 text-base font-semibold text-white'>
										Choose a paper or manuscript
									</p>
									<p className='mt-2 max-w-md text-sm leading-6 text-white/48'>
										The file name is preserved in the draft for now. Parsing comes later.
									</p>
									{fileName ? (
										<span className='mt-5 inline-flex items-center gap-2 rounded-full bg-[#e7c35a]/12 px-3 py-2 text-xs font-medium uppercase tracking-[0.18em] text-[#f5de94]'>
											<FileText className='h-3.5 w-3.5' />
											{fileName}
										</span>
									) : null}
								</button>
								<input
									ref={inputRef}
									type='file'
									accept='.pdf,.doc,.docx'
									className='sr-only'
									onChange={(event) =>
										setFileName(event.target.files?.[0]?.name ?? '')
									}
								/>
							</div>
						</div>

						<div className='space-y-6'>
							<label className='space-y-2'>
								<span className='text-sm font-medium text-white/82'>Institution</span>
								<input
									value={institution}
									onChange={(event) => setInstitution(event.target.value)}
									placeholder='Indian Institute of Technology Delhi'
									className={inputClassName}
								/>
							</label>

							<label className='space-y-2'>
								<span className='text-sm font-medium text-white/82'>Lab / group</span>
								<input
									value={lab}
									onChange={(event) => setLab(event.target.value)}
									placeholder='Advanced Biomaterials Lab'
									className={inputClassName}
								/>
							</label>

							<label className='space-y-2'>
								<span className='text-sm font-medium text-white/82'>Domain</span>
								<select
									value={domain}
									onChange={(event) => setDomain(event.target.value)}
									className={`${inputClassName} appearance-none`}>
									{domainOptions.map((option) => (
										<option key={option} value={option} className='bg-[#0c0d10]'>
											{option}
										</option>
									))}
								</select>
							</label>

							<div className='rounded-[28px] bg-white/[0.05] p-5'>
								<p className='text-[0.68rem] uppercase tracking-[0.22em] text-white/35'>
									Workspace ready
								</p>
								<p className='mt-3 text-sm leading-7 text-white/58'>
									Required: title, institution, lab, and domain. The paper file is optional for this draft step.
								</p>
								<p className='mt-4 text-sm text-white/72'>
									{fileName ? `Attached file: ${fileName}` : 'No paper attached yet'}
								</p>

								<Button
									type='submit'
									disabled={!isValid || isPending}
									className='mt-6 h-12 w-full rounded-full bg-white px-5 text-sm font-semibold text-black hover:bg-white/92 disabled:bg-white/15 disabled:text-white/40'>
									{isPending ? (
										<>
											<Loader2 className='mr-2 h-4 w-4 animate-spin' />
											Creating workspace
										</>
									) : (
										<>
											Create project
											<ArrowRight className='ml-2 h-4 w-4' />
										</>
									)}
								</Button>
							</div>
						</div>
					</div>
				</form>
			</div>
		</section>
	)
}

export default NewProjectForm
