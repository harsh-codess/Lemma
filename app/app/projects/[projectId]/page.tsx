import ProjectWorkspace from '@/components/workspace/project-workspace'

export default function ProjectWorkspacePage({
	params,
}: {
	params: {
		projectId: string
	}
}) {
	return <ProjectWorkspace projectId={params.projectId} />
}
