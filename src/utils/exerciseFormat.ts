import { type ExerciseSet } from './workoutStorage'

export const formatExerciseSet = (set: ExerciseSet, setIndex?: number): string => {
  const seconds = set.seconds ?? 0
  const prefix = typeof setIndex === 'number' ? `Set ${setIndex + 1}: ` : ''

  if (seconds > 0) {
    return `${prefix}${seconds}s`
  }

  const parts: string[] = []

  if (set.weight > 0) {
    parts.push(`${set.weight}kg`)
  }

  if (set.reps > 0) {
    parts.push(`${set.reps} reps`)
  }

  const detail = parts.length > 0 ? parts.join(' × ') : 'Completed'

  return `${prefix}${detail}`
}
