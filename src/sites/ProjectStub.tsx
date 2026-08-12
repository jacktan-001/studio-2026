import { useParams } from 'react-router-dom'
import { PROJECTS, getProjectByPath } from '../registry/projects'
import { useTheme } from '../core/ThemeProvider'

/**
 * Graceful landing page for sub-sites not yet built in this phase
 * (jack-pose / jack-wave / jack-talk / jack-craft). It is fully themed by the
 * active project's accent (ThemeProvider already re-skinned <html> from the
 * route), so the nav never leads to a broken/blank page. Replaced by the real
 * site when that phase lands — adding a real site = 2 edits (registry + site).
 */
export function ProjectStub() {
  const { projectId } = useParams()
  const { theme } = useTheme()
  const project = getProjectByPath(`/${projectId}`) ??
    PROJECTS.find((p) => p.id === projectId) ?? {
      name: projectId ?? 'Unknown',
      shortName: (projectId ?? '?').toUpperCase(),
      tagline: '',
      role: '',
      status: 'coming-soon' as const,
    }

  return (
    <section className="stub">
      <div className="stub-inner">
        <span className="stub-eyebrow" style={{ color: theme.accent }}>
          {project.status === 'coming-soon' ? 'COMING SOON' : 'IN PRODUCTION'}
        </span>
        <h1 className="stub-title">{project.name}</h1>
        <p className="stub-tagline">{project.tagline || project.role}</p>
        <div className="stub-ring" style={{ borderColor: theme.accent }} />
        <p className="stub-note">
          该站点将在后续阶段上线。当前全局音乐与主题系统已接入，导航不会中断。
        </p>
      </div>
    </section>
  )
}
