import { useCallback, useEffect, useRef, useState } from 'react'
import { getTasks, addTask, updateTask, toggleTask, deleteTask } from '../api/backend.js'
import { useToast } from '../context/ToastContext.jsx'
import { taskFormError } from '../utils/tasks.js'

const UNDO_MS = 5000

// Task list state shared by the Tasks and Dashboard pages.
export function useTasks(userId) {
  const toast = useToast()
  const [tasks, setTasks] = useState(null)
  const [loadError, setLoadError] = useState('')
  // Tasks deleted on screen but still waiting out the Undo window.
  const pendingDeletes = useRef(new Set())

  const visible = useCallback(
    (list) => list.filter((t) => !pendingDeletes.current.has(t.id)),
    []
  )

  const reload = useCallback(() => {
    setLoadError('')
    getTasks(userId).then((res) => {
      if (res.ok) setTasks(visible(res.tasks))
      else setLoadError(res.error || 'Failed to load tasks.')
    })
  }, [userId, visible])

  useEffect(() => {
    reload()
  }, [reload])

  async function add(form) {
    const error = taskFormError(form)
    if (error) return { ok: false, error }
    const res = await addTask(userId, form)
    if (!res.ok) return { ok: false, error: res.error || 'Failed to add task.' }
    setTasks((list) => [res.task, ...(list || [])])
    toast(`Added "${res.task.title}"`)
    return res
  }

  async function update(task, form) {
    const error = taskFormError(form, task.due_date || null)
    if (error) return { ok: false, error }
    const res = await updateTask(userId, task.id, form)
    if (!res.ok) return { ok: false, error: res.error || 'Failed to save task.' }
    setTasks((list) => list.map((t) => (t.id === task.id ? res.task : t)))
    toast('Changes saved')
    return res
  }

  async function toggle(task) {
    const res = await toggleTask(userId, task.id)
    if (!res.ok) {
      toast(res.error || 'Failed to update task.', { tone: 'error' })
      return
    }
    setTasks(visible(res.tasks))
    if (!task.completed) toast(`Nice work! "${task.title}" is done 🎉`)
  }

  function remove(task) {
    pendingDeletes.current.add(task.id)
    setTasks((list) => list.filter((t) => t.id !== task.id))
    toast(`Deleted "${task.title}"`, {
      tone: 'neutral',
      duration: UNDO_MS,
      action: {
        label: 'Undo',
        onClick: () => {
          pendingDeletes.current.delete(task.id)
          setTasks((list) => (list && !list.some((t) => t.id === task.id) ? [...list, task] : list))
        },
      },
      onExpire: async () => {
        const res = await deleteTask(userId, task.id)
        pendingDeletes.current.delete(task.id)
        if (!res.ok) {
          setTasks((list) => (list ? [...list, task] : list))
          toast(res.error || `Could not delete "${task.title}".`, { tone: 'error' })
        }
      },
    })
  }

  return { tasks, loadError, reload, add, update, toggle, remove }
}
