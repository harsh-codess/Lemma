import ProjectPortfolio from '@/components/workspace/project-portfolio'
import { getWorkspaceProjects } from '@/lib/workspace-data'

export default function AppHomePage() {
	return <ProjectPortfolio initialProjects={getWorkspaceProjects()} />
}
