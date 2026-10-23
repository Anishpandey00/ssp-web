import { dueInfo } from '../utils/tasks.js'

// One task in a list. variant "dash" uses the Dashboard's compact styles.
export default function TaskRow({ task: t, onToggle, onDelete, onEdit, variant }) {
  const due = t.completed ? null : dueInfo(t.due_date)
  const dash = variant === 'dash'
  return (
    <div className={`${dash ? 'dash-task-item' : 'task-item'} ${t.completed ? 'done' : ''}`}>
      <button
        type="button"
        className={`task-check ${t.completed ? 'on' : ''}`}
        onClick={() => onToggle(t)}
        aria-pressed={!!t.completed}
        aria-label={t.completed ? `Mark "${t.title}" as not done` : `Mark "${t.title}" as done`}
      >
        {t.completed ? '✓' : ''}
      </button>
      <div className={dash ? 'dash-task-body' : 'task-body'}>
        <div className="task-title">{t.title}</div>
        {(t.subject || due) && (
          <div className="task-meta">
            {t.subject}
            {due && (
              <>
                {t.subject ? ' · ' : ''}
                <span className={`due ${due.tone}`}>{due.text}</span>
              </>
            )}
          </div>
        )}
      </div>
      <span className={`pill ${t.priority}`}>{t.priority}</span>
      {onEdit && (
        <button className="icon-btn" onClick={() => onEdit(t)} aria-label={`Edit "${t.title}"`}>
          ✎
        </button>
      )}
      <button className="icon-btn" onClick={() => onDelete(t)} aria-label={`Delete "${t.title}"`}>
        ✕
      </button>
    </div>
  )
}
