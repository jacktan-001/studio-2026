import { Routes, Route } from 'react-router-dom'
import { AudioProvider } from './core/AudioProvider'
import { MotionPrefsProvider } from './core/MotionPrefsProvider'
import { ThemeProvider } from './core/ThemeProvider'
import { SmoothScroll } from './system/SmoothScroll'
import { Cursor } from './system/Cursor'
import { GlassNav } from './system/GlassNav'
import { BackgroundField } from './system/BackgroundField'
import { AmbientCanvas } from './system/ambient/AmbientCanvas'
import { WavePlayerProvider } from './sites/jack-wave/WavePlayerProvider'
import { WavePlayerOrb } from './sites/jack-wave/WavePlayerOrb'
import Portal from './sites/portal'
import JackTan from './sites/jack-tan'
import JackPose from './sites/jack-pose'
import { PoseStudio } from './sites/jack-pose/PoseStudio'
import { PoseEditor } from './sites/jack-pose/PoseEditor'
import JackWave from './sites/jack-wave'
import JackTalk from './sites/jack-talk'
import JackCraft from './sites/jack-craft'
import Admin from './sites/admin'
import Notes, { NoteArticle } from './sites/notes'
import { ProjectIntro } from './sites/ProjectIntro'
import { ProjectStub } from './sites/ProjectStub'

/**
 * Root shell = the persistent layer.
 *
 * The providers + BackgroundField + Cursor + GlassNav are ALL siblings of
 * <Routes>. Navigation only swaps the outlet (`<main>`), so the global player
 * state (WavePlayerProvider) and its single circular UI (WavePlayerOrb) are
 * never unmounted → the song, its progress and the queue survive every page
 * change. Theme re-skins via CSS vars on <html> (ThemeProvider), wrapped in the
 * View Transition.
 *
 * There is exactly ONE docked player. The old ambient `AudioShell` pill used to
 * render alongside it, which is what made Jack Wave look like it had two
 * players stacked at the bottom.
 */
export default function App() {
  return (
    <AudioProvider>
      <MotionPrefsProvider>
        <SmoothScroll>
          <ThemeProvider>
            <AmbientCanvas />
            <BackgroundField />
            <Cursor />
            <GlassNav />
            <WavePlayerProvider>
              <main className="site-root">
                <Routes>
                  <Route path="/" element={<Portal />} />
                  <Route path="/jack-tan" element={<JackTan />} />
                  <Route path="/jack-pose" element={<JackPose />} />
                  <Route path="/jack-pose/studio" element={<PoseStudio />} />
                  <Route path="/jack-pose/studio/:id" element={<PoseEditor />} />
                  <Route path="/jack-wave" element={<JackWave />} />
                  <Route path="/jack-talk" element={<JackTalk />} />
                  <Route path="/jack-craft" element={<JackCraft />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/notes" element={<Notes />} />
                  <Route path="/notes/:slug" element={<NoteArticle />} />
                  <Route path="/:projectId/intro" element={<ProjectIntro />} />
                  <Route path="/:projectId" element={<ProjectStub />} />
                  <Route path="*" element={<Portal />} />
                </Routes>
              </main>
              <WavePlayerOrb />
            </WavePlayerProvider>
          </ThemeProvider>
        </SmoothScroll>
      </MotionPrefsProvider>
    </AudioProvider>
  )
}
