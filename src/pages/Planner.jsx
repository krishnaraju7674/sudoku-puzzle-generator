import { useMemo, useState } from 'react'
import AppShell from '../components/AppShell'
import { Field, Panel, StatusBadge, inputClass, primaryButtonClass, secondaryButtonClass } from '../components/ui'
import { useAuth } from '../context/useAuth'
import { addDaysISO, createId, readUserData, todayISO, writeUserData } from '../services/localUserData'

const categories = ['Technical', 'Project', 'Resume', 'Aptitude', 'Communication', 'Application']
const priorities = ['High', 'Medium', 'Low']

const emptyTask = {
  title: '',
  category: 'Technical',
  priority: 'Medium',
  dueDate: todayISO(),
}

const priorityTone = {
  High: 'red',
  Medium: 'yellow',
  Low: 'gray',
}

function starterTasks() {
  return [
    {
      id: createId('task'),
      title: 'Practice 3 DSA problems and write notes for mistakes',
      category: 'Aptitude',
      priority: 'High',
      dueDate: todayISO(),
      completed: false,
      createdAt: todayISO(),
    },
    {
      id: createId('task'),
      title: 'Improve one project README with features, screenshots, and setup steps',
      category: 'Project',
      priority: 'High',
      dueDate: addDaysISO(1),
      completed: false,
      createdAt: todayISO(),
    },
    {
      id: createId('task'),
      title: 'Apply to 3 internships and update the application tracker',
      category: 'Application',
      priority: 'Medium',
      dueDate: addDaysISO(2),
      completed: false,
      createdAt: todayISO(),
    },
    {
      id: createId('task'),
      title: 'Record a 2 minute self-introduction and improve weak points',
      category: 'Communication',
      priority: 'Medium',
      dueDate: addDaysISO(3),
      completed: false,
      createdAt: todayISO(),
    },
  ]
}

export default function Planner() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState(() => readUserData(user.id, 'plannerTasks', null) || starterTasks())
  const [form, setForm] = useState(emptyTask)
  const [filter, setFilter] = useState('All')

  const saveTasks = (nextTasks) => {
    setTasks(nextTasks)
    writeUserData(user.id, 'plannerTasks', nextTasks)
  }

  const filteredTasks = useMemo(() => {
    if (filter === 'All') return tasks
    if (filter === 'Completed') return tasks.filter(task => task.completed)
    if (filter === 'Open') return tasks.filter(task => !task.completed)
    return tasks.filter(task => task.category === filter)
  }, [filter, tasks])

  const completion = tasks.length === 0
    ? 0
    : Math.round((tasks.filter(task => task.completed).length / tasks.length) * 100)

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!form.title.trim()) return

    saveTasks([
      {
        ...form,
        id: createId('task'),
        completed: false,
        createdAt: todayISO(),
      },
      ...tasks,
    ])
    setForm(emptyTask)
  }

  const toggleTask = (id) => {
    saveTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ))
  }

  const deleteTask = (id) => {
    saveTasks(tasks.filter(task => task.id !== id))
  }

  const addSmartPlan = () => {
    const plan = [
      {
        id: createId('task'),
        title: 'Choose one target role and list 10 required skills from job descriptions',
        category: 'Technical',
        priority: 'High',
        dueDate: todayISO(),
        completed: false,
        createdAt: todayISO(),
      },
      {
        id: createId('task'),
        title: 'Build one small feature and push it to GitHub',
        category: 'Project',
        priority: 'High',
        dueDate: addDaysISO(2),
        completed: false,
        createdAt: todayISO(),
      },
      {
        id: createId('task'),
        title: 'Update resume with measurable project impact and keywords',
        category: 'Resume',
        priority: 'Medium',
        dueDate: addDaysISO(3),
        completed: false,
        createdAt: todayISO(),
      },
      {
        id: createId('task'),
        title: 'Practice 5 HR questions in mock interview mode',
        category: 'Communication',
        priority: 'Medium',
        dueDate: addDaysISO(4),
        completed: false,
        createdAt: todayISO(),
      },
    ]

    saveTasks([...plan, ...tasks])
  }

  return (
    <AppShell
      title="Career Planner"
      subtitle="Turn your readiness gaps into small daily actions."
      actions={
        <button onClick={addSmartPlan} className={secondaryButtonClass}>
          Add 4-Step Smart Plan
        </button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="space-y-6">
          <Panel>
            <h2 className="mb-4 text-xl font-bold">Add Task</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="Task">
                <input name="title" value={form.title} onChange={handleChange} className={inputClass} placeholder="What should you finish?" />
              </Field>
              <Field label="Category">
                <select name="category" value={form.category} onChange={handleChange} className={inputClass}>
                  {categories.map(category => <option key={category}>{category}</option>)}
                </select>
              </Field>
              <Field label="Priority">
                <select name="priority" value={form.priority} onChange={handleChange} className={inputClass}>
                  {priorities.map(priority => <option key={priority}>{priority}</option>)}
                </select>
              </Field>
              <Field label="Due Date">
                <input name="dueDate" type="date" value={form.dueDate} onChange={handleChange} className={inputClass} />
              </Field>
              <button className={`${primaryButtonClass} w-full`} type="submit">Add Task</button>
            </form>
          </Panel>

          <Panel>
            <h2 className="mb-4 text-xl font-bold">Progress</h2>
            <p className="text-5xl font-black text-blue-400">{completion}%</p>
            <p className="mt-2 text-sm text-gray-400">{tasks.filter(task => task.completed).length} of {tasks.length} tasks completed</p>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-gray-800">
              <div className="h-full rounded-full bg-blue-500" style={{ width: `${completion}%` }} />
            </div>
          </Panel>
        </div>

        <Panel>
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-bold">Today and This Week</h2>
            <select value={filter} onChange={event => setFilter(event.target.value)} className="rounded-lg bg-gray-800 px-3 py-2 text-sm outline-none">
              {['All', 'Open', 'Completed', ...categories].map(item => <option key={item}>{item}</option>)}
            </select>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-700 p-8 text-center">
              <p className="text-lg font-semibold">No tasks in this view</p>
              <p className="mt-2 text-sm text-gray-400">Change the filter or add a task from the left panel.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map(task => (
                <article key={task.id} className={`rounded-xl border p-4 transition ${task.completed ? 'border-green-900 bg-green-950/20' : 'border-gray-800 bg-gray-950'}`}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex gap-3">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTask(task.id)}
                        className="mt-1 h-5 w-5 accent-blue-600"
                      />
                      <div>
                        <h3 className={`font-semibold ${task.completed ? 'text-gray-500 line-through' : 'text-white'}`}>{task.title}</h3>
                        <p className="mt-1 text-sm text-gray-500">Due {task.dueDate}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge tone="blue">{task.category}</StatusBadge>
                      <StatusBadge tone={priorityTone[task.priority]}>{task.priority}</StatusBadge>
                    </div>
                  </div>
                  <button onClick={() => deleteTask(task.id)} className="mt-4 text-sm text-red-300 hover:underline">
                    Delete
                  </button>
                </article>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </AppShell>
  )
}
