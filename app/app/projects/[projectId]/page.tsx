import ProjectWorkspace from '@/components/workspace/project-workspace'
import { getWorkspaceProjectById } from '@/lib/workspace-data'

export default function ProjectWorkspacePage({
	params,
}: {
	params: {
		projectId: string
	}
}) {
	return (
		<ProjectWorkspace
			projectId={params.projectId}
			initialProject={getWorkspaceProjectById(params.projectId)}
		/>
	)
}
