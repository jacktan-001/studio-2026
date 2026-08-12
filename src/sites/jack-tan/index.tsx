import { SplitHeading } from '../../system/SplitHeading'
import { SiteAvatar } from '../../system/avatars'
import { Reveal } from '../../system/Reveal'
import { PinnedChapter } from '../../system/PinnedChapter'
import { SpatialGallery, type SpatialItem } from '../../system/SpatialGallery'
import { TransitionLink } from '../../system/transition'
import { ContactBar } from '../../system/ContactBar'

const STATS = [
  { num: '9+', label: '年行业经验' },
  { num: '8+', label: '核心系统建设' },
  { num: '2', label: '项国家发明专利' },
  { num: 'IOSA', label: '零不符合项通过' },
]

const EXP = [
  { org: '民航监管信息化机构', period: '2023.10 — 今', role: '应用系统建设 / 安全分析', note: '承接信息中心应用系统分析，推进智慧监管平台机场行政许可模块上线。' },
  { org: '天津航空', period: '2019 — 2023', role: '安全监察主管', note: '覆盖 12 个运行部门的安全监察与审核体系搭建。' },
  { org: '海南航空', period: '2017 — 2019', role: '航空安保质量主管', note: '主导安保质量体系审核，以零不符合项通过。' },
  { org: '东海航空', period: '2016 — 2017', role: '航空安保专员', note: '安保运行一线与合规支持。' },
]

const PROJECTS_TAN = [
  { title: '民航智慧监管数字化建设', period: '进行中', desc: '机场行政许可、安全监察审核的数字化与 AI 辅助。' },
  { title: '民航公安局新版门户网站', period: '2023.12 — 2024.06', desc: '对外服务门户重构与内容标准化。' },
  { title: '数字化安全监督管理系统（企业端）', period: '2020.06 — 2020.12', desc: '面向运输企业的安全管理闭环系统。' },
]

const WORKS: SpatialItem[] = [
  { id: 'sop', title: '民航规章 SOP', subtitle: 'sop.caac.gov.cn', href: 'https://sop.caac.gov.cn' },
  { id: 'caecs', title: '民航安全能力', subtitle: 'caecs.org.cn', href: 'https://caecs.org.cn' },
  { id: 'zbtb', title: '招投标周报', subtitle: 'zbtb.caac.gov.cn', href: 'https://zbtb.caac.gov.cn' },
  { id: 'adeqpt', title: '设备台账', subtitle: 'adeqpt.caac.gov.cn', href: 'https://adeqpt.caac.gov.cn' },
  { id: 'gaa', title: 'GA Audit', subtitle: 'gaa.caac.gov.cn', href: 'https://gaa.caac.gov.cn' },
  { id: 'internal', title: '内部审核系统', subtitle: '企业端 · 私有部署' },
]

const PATENTS = [
  { no: 'ZL202411889392.1', title: '无人机适飞空域', date: '2025.08.29' },
  { no: 'ZL202511493541.7', title: '民航数据中台异构存储', date: '2026.01.27' },
]

const HONORS = [
  { title: 'USOAP 迎审', org: '民航局通报表扬' },
  { title: '行业协作', org: '中国航协感谢信' },
]

const SKILLS_PRO = [
  '安全监管体系 (IOSA / USOAP / SMS / SeMS)', '应用系统分析', '数据标准化', '许可管理',
  '第三方运维合规', '招投标管理', '安全审计', '信息化规划', '需求分析', '原型设计',
  'AI 应用探索', '政务公文',
]
const SKILLS_CERT = ['CET-6', '普通话二级甲等', '中级工程师', 'PMP（备考）', '信息系统项目管理', '数据分析', '技术写作']

/**
 * Jack Tan personal site — Apple-style scroll narrative.
 * Hero stats → pinned manifesto (scrubbed progress) → About → Experience
 * timeline → Projects → Works (spatial gallery) → Patents/Honors → Skills →
 * Contact. All content is real; animation comes from the shared primitives.
 */
export default function JackTan() {
  return (
    <div className="tan">
      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="tan-hero">
        <SiteAvatar siteId="jack-tan" className="site-avatar-hero" />
        <span className="tan-eyebrow">PERSONAL PORTFOLIO · BEIJING</span>
        <SplitHeading as="h1" className="tan-name" text="Jack Tan" splitBy="chars" />
        <p className="tan-statement">
          民航安全信息化工程师。<strong>技术驱动者</strong>——让安全监管可被计算、可被追溯。
        </p>
        <div className="tan-stats">
          {STATS.map((s, i) => (
            <Reveal key={s.label} className="tan-stat" delay={i * 0.06}>
              <span className="tan-stat-num">{s.num}</span>
              <span className="tan-stat-label">{s.label}</span>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Pinned manifesto ────────────────────────────────── */}
      <PinnedChapter distance={70} className="tan-manifesto-chapter">
        <div className="tan-manifesto">
          <span className="tan-manifesto-eyebrow">MANIFESTO</span>
          <h2 className="tan-manifesto-title">
            技术驱动者
            <br />
            让安全监管
            <br />
            可被计算
          </h2>
          <div className="tan-manifesto-progress" aria-hidden="true">
            <i />
          </div>
        </div>
      </PinnedChapter>

      {/* ── About ───────────────────────────────────────────── */}
      <section className="tan-section">
        <SplitHeading as="h2" className="tan-h2" text="About" splitBy="chars" />
        <Reveal as="p" className="tan-prose">
          现任职于民航监管信息化机构，聚焦 IOSA、USOAP、SMS、SeMS 等安全监管体系的信息化落地。
          从一线安保审核到智慧监管平台的系统设计，十年间参与建设 8 套以上核心业务系统，
          并以两项国家发明专利沉淀技术方法。
        </Reveal>
      </section>

      {/* ── Experience ──────────────────────────────────────── */}
      <section className="tan-section">
        <SplitHeading as="h2" className="tan-h2" text="Experience" splitBy="chars" />
        <ul className="tan-timeline">
          {EXP.map((e) => (
            <Reveal as="li" key={e.org + e.period} className="tan-tl-item">
              <span className="tan-tl-period">{e.period}</span>
              <div className="tan-tl-body">
                <span className="tan-tl-org">{e.org}</span>
                <span className="tan-tl-role">{e.role}</span>
                <span className="tan-tl-note">{e.note}</span>
              </div>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* ── Projects ────────────────────────────────────────── */}
      <section className="tan-section">
        <SplitHeading as="h2" className="tan-h2" text="Projects" splitBy="chars" />
        <div className="tan-projects">
          {PROJECTS_TAN.map((p) => (
            <Reveal key={p.title} className="tan-project">
              <span className="tan-project-period">{p.period}</span>
              <span className="tan-project-title">{p.title}</span>
              <span className="tan-project-desc">{p.desc}</span>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Works (spatial gallery) ─────────────────────────── */}
      <section className="tan-section">
        <div className="tan-works-head">
          <SplitHeading as="h2" className="tan-h2" text="Works" splitBy="chars" />
          <span className="tan-works-badge">8 SYSTEMS LIVE</span>
        </div>
        <SpatialGallery items={WORKS} />
      </section>

      {/* ── Patents & Honors ────────────────────────────────── */}
      <section className="tan-section tan-split">
        <div className="tan-split-col">
          <SplitHeading as="h3" className="tan-h3" text="Patents" splitBy="chars" />
          <ul className="tan-patents">
            {PATENTS.map((p) => (
              <Reveal as="li" key={p.no} className="tan-patent">
                <span className="tan-patent-no">{p.no}</span>
                <span className="tan-patent-title">{p.title}</span>
                <span className="tan-patent-date">{p.date}</span>
              </Reveal>
            ))}
          </ul>
        </div>
        <div className="tan-split-col">
          <SplitHeading as="h3" className="tan-h3" text="Honors" splitBy="chars" />
          <ul className="tan-honors">
            {HONORS.map((h) => (
              <Reveal as="li" key={h.title} className="tan-honor">
                <span className="tan-honor-title">{h.title}</span>
                <span className="tan-honor-org">{h.org}</span>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Skills ──────────────────────────────────────────── */}
      <section className="tan-section">
        <SplitHeading as="h2" className="tan-h2" text="Skills" splitBy="chars" />
        <Reveal as="div" className="tan-skills">
          {SKILLS_PRO.map((s) => (
            <span key={s} className="tan-skill">{s}</span>
          ))}
        </Reveal>
        <Reveal as="div" className="tan-skills tan-skills-cert">
          {SKILLS_CERT.map((s) => (
            <span key={s} className="tan-skill tan-skill-cert">{s}</span>
          ))}
        </Reveal>
      </section>

      {/* ── Contact ─────────────────────────────────────────── */}
      <footer className="tan-contact">
        <SplitHeading as="h2" className="tan-contact-title" text="Let’s talk." splitBy="chars" />
        <div className="tan-contact-links">
          <ContactBar />
        </div>
        <TransitionLink to="/" className="tan-back">← 返回工作室</TransitionLink>
      </footer>
    </div>
  )
}
