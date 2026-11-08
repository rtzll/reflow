import { Button, reveal, revealPresets, Tabs } from '@rtzll/reflow'
import { on, ref, type Handle } from 'remix/component'

type Preset = keyof typeof revealPresets
const inbox = [
  ['Maya Chen', 'Invoice 2041 is missing the VAT line', '9:41'],
  ['Rafael Ortiz', 'Can we move the onboarding call?', '9:12'],
  ['Lena Park', 'Card ending 4242 expires in May', '8:55'],
  ['Ines Duarte', 'Love the new export, one question', 'Mon'],
  ['Tom Becker', 'SSO for the second workspace?', 'Mon'],
]
const features = [
  ['One inbox', 'Support, sales, and billing share one list of threads.'],
  ['Claim, then type', 'Give each thread an owner before writing the reply.'],
  ['Quiet nudges', 'Remind the owner when a thread has waited four hours.'],
]
const sidebar = ['Inbox', 'Assigned to me', 'Snoozed', 'Done', 'Support', 'Billing', 'Sales']

function InboxIllustration(handle: Handle<{ preset?: Preset }>) {
  let loaded = !handle.props.preset
  const load = ref<HTMLDivElement>((_, signal) => {
    if (!handle.props.preset) return
    const timer = setTimeout(() => {
      loaded = true
      handle.update()
    }, 560)
    signal.addEventListener('abort', () => clearTimeout(timer), { once: true })
  })
  return () => (
    <div class="system-reveal-inbox" mix={load}>
      <aside aria-label="Inbox navigation">
        <strong>
          <span>T</span> Tidepool
        </strong>
        {sidebar.map((label, index) => (
          <span key={label} data-selected={index === 0 || undefined}>
            {label}
          </span>
        ))}
        <small>Ana Lima</small>
      </aside>
      <div class="system-reveal-inbox-main">
        <div class="system-reveal-inbox-heading">
          <div>
            <strong>Inbox</strong>
            <small>38 open, 5 waiting on you</small>
          </div>
          <span>New thread</span>
        </div>
        <div
          class="system-reveal-stats"
          mix={handle.props.preset && reveal({ preset: handle.props.preset, index: 1 })}
        >
          {[
            ['Open', '38'],
            ['First reply', '42m'],
            ['Waiting', '5'],
          ].map(([label, count]) => (
            <div key={label}>
              <small>{label}</small>
              <strong>{count}</strong>
            </div>
          ))}
        </div>
        <ul aria-busy={!loaded}>
          {inbox.map(([name, subject, time], index) => (
            <li
              key={`${name}-${loaded}`}
              mix={loaded && handle.props.preset && reveal({ preset: handle.props.preset, index })}
            >
              {loaded ? (
                <>
                  <span class="system-reveal-avatar">
                    {name
                      .split(' ')
                      .map((word) => word[0])
                      .join('')}
                  </span>
                  <div>
                    <strong>{name}</strong>
                    <small>{subject}</small>
                  </div>
                  <small>{time}</small>
                </>
              ) : (
                <span class="system-reveal-placeholder" aria-hidden="true" />
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function LandingIllustration(handle: Handle<{ preset: Preset }>) {
  return () => (
    <div class="system-reveal-site">
      <header>
        <strong>Tidepool</strong>
        <span>Product</span>
        <span>Pricing</span>
        <span>Sign in</span>
      </header>
      <div class="system-reveal-site-content">
        <section class="system-reveal-hero" mix={reveal({ preset: handle.props.preset })}>
          <small>The shared inbox for support teams</small>
          <h3>Every email, answered once.</h3>
          <p>Claim a thread, reply together, and see who is waiting on you.</p>
          <div class="system-reveal-cta" aria-hidden="true">
            <span>Start free</span>
            <span>Book a demo</span>
          </div>
          <div class="system-reveal-app-shot">
            <InboxIllustration />
          </div>
        </section>
        <section
          class="system-reveal-features"
          mix={reveal({ preset: handle.props.preset, scroll: true })}
        >
          {features.map(([title, text]) => (
            <div key={title}>
              <strong>{title}</strong>
              <p>{text}</p>
            </div>
          ))}
        </section>
        <section
          class="system-reveal-features system-reveal-figures"
          mix={reveal({ preset: handle.props.preset, scroll: true })}
        >
          {[
            ['40m', 'First reply'],
            ['3×', 'Threads per agent'],
            ['0', 'Double replies'],
          ].map(([value, label]) => (
            <div key={label}>
              <strong>{value}</strong>
              <p>{label}</p>
            </div>
          ))}
        </section>
        <section
          class="system-reveal-quote"
          mix={reveal({ preset: handle.props.preset, scroll: true })}
        >
          <blockquote>
            “Our first reply now takes 40 minutes. Every customer gets one answer.”
          </blockquote>
          <small>Ana Lima, Head of Support, Northwind</small>
        </section>
      </div>
    </div>
  )
}

export function RevealPresetDemo(handle: Handle<{ product?: boolean }>) {
  let intensity = 'default'
  let revision = 0
  let viewport: HTMLDivElement | undefined
  const capture = ref<HTMLDivElement>((element) => {
    viewport = element
  })
  function replay() {
    viewport?.scrollTo({ top: 0, behavior: 'instant' })
    revision++
    handle.update()
  }
  return () => {
    const kind = handle.props.product ? 'product' : 'landing'
    const preset: Preset = intensity === 'default' ? kind : `${kind}-subtle`
    const { distance, scale, step } = revealPresets[preset]
    return (
      <div class="site-preview-card system-reveal-frame" data-reveal-kind={kind}>
        <div class="system-reveal-toolbar">
          <Tabs
            label={`${kind} intensity`}
            value={intensity}
            onValueChange={(value) => {
              intensity = value
              replay()
            }}
            items={[
              { value: 'default', label: 'Default' },
              { value: 'subtle', label: 'Subtle' },
            ]}
          />
          <Button mix={on('click', replay)}>
            <span aria-hidden="true">↻</span> Replay
          </Button>
        </div>
        <div
          class="system-reveal-viewport rf-scroll-area"
          aria-label={`${kind} preset example`}
          role="region"
          tabIndex={0}
          mix={capture}
        >
          {handle.props.product ? (
            <InboxIllustration key={revision} preset={preset} />
          ) : (
            <LandingIllustration key={revision} preset={preset} />
          )}
        </div>
        <dl class="system-reveal-spec">
          {[
            ['Preset', preset],
            ['Travel', `${distance}px`],
            ['Scale', String(scale)],
            ['Stagger', `${step}ms`],
          ].map(([name, value]) => (
            <div key={name}>
              <dt>{name}</dt>
              <dd>
                <code>{value}</code>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    )
  }
}
