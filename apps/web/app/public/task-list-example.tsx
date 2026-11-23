import { Button, TaskList, type Task } from '@rtzll/reflow'
import { on, ref, type Handle } from 'remix/component'

const steps = [
  'Outline the story',
  'Draft the opening',
  'Choose the photographs',
  'Proof the captions',
]

/** The TaskList example: a plan that works through its steps and can start over. */
export function TaskListExample(handle: Handle) {
  let done = 0
  let timer: ReturnType<typeof setTimeout> | undefined
  handle.signal.addEventListener('abort', () => clearTimeout(timer), { once: true })

  function run() {
    clearTimeout(timer)
    done = 0
    const advance = () => {
      done++
      if (done < steps.length) timer = setTimeout(advance, 1300)
      handle.update()
    }
    timer = setTimeout(advance, 1300)
    handle.update()
  }
  const start = ref(() => run())

  return () => {
    const tasks: Task[] = steps.map((label, index) => ({
      id: String(index),
      label,
      status: index < done ? 'done' : index === done ? 'active' : 'pending',
    }))
    return (
      <div
        class="example-stack"
        style={{ width: 'min(100%, 320px)', alignItems: 'start' }}
        mix={start}
      >
        <TaskList label="Plan" tasks={tasks} progress />
        <Button
          size="compact"
          variant="secondary"
          disabled={done < steps.length}
          mix={on('click', run)}
        >
          Start over
        </Button>
      </div>
    )
  }
}
