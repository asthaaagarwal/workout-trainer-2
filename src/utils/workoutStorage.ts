const STORAGE_KEY = 'workout-trainer-sessions'

export interface ExerciseSet {
  weight: number
  reps: number
}

export interface ExerciseData {
  name: string
  sets: ExerciseSet[]
  completed: boolean
}

export interface WorkoutSession {
  id: string // Unique session ID
  workoutId: string // Reference to workout type (full-body, upper-body, etc.)
  date: string // ISO date string (YYYY-MM-DD)
  startTime: number // Unix timestamp
  endTime?: number // Unix timestamp when workout was completed
  exercises: ExerciseData[]
  completed: boolean
  // Timer persistence fields
  timerStartTime?: number // Unix timestamp when timer was started
  isTimerRunning: boolean // Whether timer is currently running
  timerElapsedSeconds: number // Total elapsed seconds when timer was last paused/stopped
}

export interface WorkoutHistory {
  sessions: WorkoutSession[]
}

// Get today's date in YYYY-MM-DD format (in local timezone)
export const getTodayDate = (): string => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Generate a unique session ID
export const generateSessionId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Load all workout history from localStorage
export const loadWorkoutHistory = (): WorkoutHistory => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Error loading workout history:', error)
  }
  return { sessions: [] }
}

// Save workout history to localStorage
export const saveWorkoutHistory = (history: WorkoutHistory): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  } catch (error) {
    console.error('Error saving workout history:', error)
  }
}

// Get or create today's workout session
export const getOrCreateSession = (workoutId: string): WorkoutSession => {
  const history = loadWorkoutHistory()
  const today = getTodayDate()

  // Find existing session for today and this workout
  let session = history.sessions.find(
    s => s.date === today && s.workoutId === workoutId && !s.completed
  )

  if (!session) {
    // Create new session
    session = {
      id: generateSessionId(),
      workoutId,
      date: today,
      startTime: Date.now(),
      exercises: [],
      completed: false,
      isTimerRunning: false,
      timerElapsedSeconds: 0
    }
    history.sessions.push(session)
    saveWorkoutHistory(history)
  }

  return session
}

// Save exercise data for current session
export const saveExerciseData = (
  sessionId: string,
  exerciseName: string,
  sets: ExerciseSet[]
): void => {
  const history = loadWorkoutHistory()
  const session = history.sessions.find(s => s.id === sessionId)

  if (session) {
    // Remove existing exercise data if it exists
    session.exercises = session.exercises.filter(e => e.name !== exerciseName)

    // Add new exercise data
    if (sets.length > 0 && sets.some(set => set.weight > 0 || set.reps > 0)) {
      session.exercises.push({
        name: exerciseName,
        sets: sets.filter(set => set.weight > 0 || set.reps > 0),
        completed: true
      })
    }

    saveWorkoutHistory(history)
  }
}

// Get exercise data from current session or last completed workout
export const getExerciseData = (
  sessionId: string,
  exerciseName: string
): ExerciseSet[] => {
  const history = loadWorkoutHistory()
  const session = history.sessions.find(s => s.id === sessionId)

  if (session) {
    // First check if there's data in the current session
    const exercise = session.exercises.find(e => e.name === exerciseName)
    if (exercise) {
      return exercise.sets
    }

    // If not, try to get data from the last completed workout of the same type
    const lastCompletedSession = history.sessions
      .filter(s => s.id !== sessionId && s.workoutId === session.workoutId && s.completed)
      .sort((a, b) => b.startTime - a.startTime)[0]

    if (lastCompletedSession) {
      const lastExercise = lastCompletedSession.exercises.find(e => e.name === exerciseName)
      if (lastExercise) {
        return lastExercise.sets
      }
    }
  }

  return []
}

// Complete a workout session
export const completeWorkoutSession = (sessionId: string): void => {
  const history = loadWorkoutHistory()
  const session = history.sessions.find(s => s.id === sessionId)

  if (session) {
    session.completed = true
    session.endTime = Date.now()
    saveWorkoutHistory(history)
  }
}

// Get the last workout session for a specific workout type
export const getLastWorkoutSession = (workoutId: string): WorkoutSession | null => {
  const history = loadWorkoutHistory()
  const sessions = history.sessions
    .filter(s => s.workoutId === workoutId && s.completed)
    .sort((a, b) => b.startTime - a.startTime)

  return sessions[0] || null
}

// Get all completed exercises for current session
export const getCompletedExercises = (sessionId: string): string[] => {
  const history = loadWorkoutHistory()
  const session = history.sessions.find(s => s.id === sessionId)

  if (session) {
    return session.exercises.map(e => e.name)
  }

  return []
}

// Get today's completed workout if it exists
export const getTodayCompletedWorkout = (): WorkoutSession | null => {
  const history = loadWorkoutHistory()
  const today = getTodayDate()

  // Find a completed session for today
  const completedSession = history.sessions.find(
    s => s.date === today && s.completed
  )

  return completedSession || null
}

// Start the workout timer
export const startWorkoutTimer = (sessionId: string): void => {
  const history = loadWorkoutHistory()
  const session = history.sessions.find(s => s.id === sessionId)

  if (session) {
    session.isTimerRunning = true
    session.timerStartTime = Date.now()
    saveWorkoutHistory(history)
  }
}

// Stop/pause the workout timer
export const stopWorkoutTimer = (sessionId: string): void => {
  const history = loadWorkoutHistory()
  const session = history.sessions.find(s => s.id === sessionId)

  if (session && session.isTimerRunning && session.timerStartTime) {
    const additionalTime = Math.floor((Date.now() - session.timerStartTime) / 1000)
    session.timerElapsedSeconds += additionalTime
    session.isTimerRunning = false
    session.timerStartTime = undefined
    saveWorkoutHistory(history)
  }
}

// Get current timer state and elapsed time
export const getTimerState = (sessionId: string): { isRunning: boolean; elapsedSeconds: number } => {
  const history = loadWorkoutHistory()
  const session = history.sessions.find(s => s.id === sessionId)

  if (!session) {
    return { isRunning: false, elapsedSeconds: 0 }
  }

  let elapsedSeconds = session.timerElapsedSeconds

  if (session.isTimerRunning && session.timerStartTime) {
    const additionalTime = Math.floor((Date.now() - session.timerStartTime) / 1000)
    elapsedSeconds += additionalTime
  }

  return {
    isRunning: session.isTimerRunning,
    elapsedSeconds
  }
}

// Get active (ongoing) workout session
export const getActiveWorkoutSession = (): WorkoutSession | null => {
  const history = loadWorkoutHistory()
  const today = getTodayDate()

  // Find an active session (started timer but not completed)
  const activeSession = history.sessions.find(
    s => s.date === today && !s.completed && (s.isTimerRunning || s.timerElapsedSeconds > 0)
  )

  return activeSession || null
}

// Update timer elapsed seconds (for real-time display)
export const updateTimerElapsedSeconds = (sessionId: string): void => {
  const history = loadWorkoutHistory()
  const session = history.sessions.find(s => s.id === sessionId)

  if (session && session.isTimerRunning && session.timerStartTime) {
    const additionalTime = Math.floor((Date.now() - session.timerStartTime) / 1000)
    session.timerElapsedSeconds += additionalTime
    session.timerStartTime = Date.now()
    saveWorkoutHistory(history)
  }
}