import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ArrowLeft, Check, Timer, Circle } from 'lucide-react'
import workoutData from '@/data/workouts.json'
import {
  getOrCreateSession,
  completeWorkoutSession,
  getCompletedExercises,
  getExercisesWithData,
  startWorkoutTimer,
  stopWorkoutTimer,
  getTimerState,
  getTodayCompletedWorkout,
  getActiveWorkoutSession,
  getWorkoutSessionById,
  type WorkoutSession,
  type ExerciseData
} from '@/utils/workoutStorage'

interface WorkoutProps {
  workoutId: string
  editingSession?: WorkoutSession | null
  onBack: () => void
  onCongratulations: (duration: string, exerciseCount: number) => void
  onExerciseSelect: (exerciseName: string, session: WorkoutSession) => void
}

export default function Workout({ workoutId, editingSession, onBack, onCongratulations, onExerciseSelect }: WorkoutProps) {
  const workout = workoutData.workouts.find(w => w.id === workoutId)
  const [currentSession, setCurrentSession] = useState<WorkoutSession | null>(null)
  const [completedExercises, setCompletedExercises] = useState<string[]>([])
  const [exercisesWithData, setExercisesWithData] = useState<string[]>([])
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [showEndDialog, setShowEndDialog] = useState(false)
  const [canStartWorkout, setCanStartWorkout] = useState(true)
  const [isEditingCompleted, setIsEditingCompleted] = useState(false)
  const [completedSessionData, setCompletedSessionData] = useState<ExerciseData[]>([])
  const timerInterval = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (editingSession) {
      // We're editing a completed workout
      setCurrentSession(editingSession)
      setIsEditingCompleted(true)
      setCompletedSessionData(editingSession.exercises)
      setCompletedExercises(editingSession.exercises.filter(e => e.completed).map(e => e.name))
      setExercisesWithData(editingSession.exercises.filter(e => !e.completed && e.sets.length > 0).map(e => e.name))
      setIsTimerRunning(false)
      setCanStartWorkout(false)
    } else {
      // Normal workout mode
      const session = getOrCreateSession(workoutId)
      setCurrentSession(session)
      setIsEditingCompleted(false)
      setCompletedSessionData([])
      setCompletedExercises(getCompletedExercises(session.id))
      setExercisesWithData(getExercisesWithData(session.id))

      // Load timer state
      const timerState = getTimerState(session.id)
      setIsTimerRunning(timerState.isRunning)
      setElapsedTime(timerState.elapsedSeconds)

      // Check if user can start this workout (no other active/completed workouts)
      const completedWorkout = getTodayCompletedWorkout()
      const activeWorkout = getActiveWorkoutSession()

      // User can start if: no completed workout AND (no active workout OR active workout is this same workout)
      const canStart = !completedWorkout && (!activeWorkout || activeWorkout.workoutId === workoutId)
      setCanStartWorkout(canStart)
    }
  }, [workoutId, editingSession])

  // Refresh completed exercises and exercises with data when returning from exercise screen
  useEffect(() => {
    if (currentSession) {
      const interval = setInterval(() => {
        if (isEditingCompleted) {
          // For completed workouts, refresh the exercise data from localStorage
          const updatedSession = getWorkoutSessionById(currentSession.id)
          if (updatedSession) {
            setCompletedSessionData(updatedSession.exercises)
          }
        } else {
          // For active workouts, use the existing logic
          setCompletedExercises(getCompletedExercises(currentSession.id))
          setExercisesWithData(getExercisesWithData(currentSession.id))
        }
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [currentSession, isEditingCompleted])

  useEffect(() => {
    if (isTimerRunning && currentSession) {
      timerInterval.current = setInterval(() => {
        const timerState = getTimerState(currentSession.id)
        setElapsedTime(timerState.elapsedSeconds)
      }, 1000)
    } else {
      if (timerInterval.current) {
        clearInterval(timerInterval.current)
      }
    }

    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current)
      }
    }
  }, [isTimerRunning, currentSession])

  const handleExerciseClick = (exercise: string) => {
    if (currentSession) {
      onExerciseSelect(exercise, currentSession)
    }
  }


  const handleCompleteWorkout = () => {
    if (currentSession) {
      stopWorkoutTimer(currentSession.id)
      completeWorkoutSession(currentSession.id)
      onBack()
    }
  }

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleStartWorkout = () => {
    if (currentSession) {
      startWorkoutTimer(currentSession.id)
      setIsTimerRunning(true)
    }
  }

  const handleEndWorkout = () => {
    if (currentSession) {
      stopWorkoutTimer(currentSession.id)
      completeWorkoutSession(currentSession.id)
    }
    setIsTimerRunning(false)
    setShowEndDialog(false)
    // Navigate to congratulations screen
    onCongratulations(formatTime(elapsedTime), completedExercises.length)
  }

  if (!workout) {
    return (
      <div className="p-4">
        <Button variant="ghost" onClick={onBack} className="mb-4 px-0">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Workout not found</h1>
      </div>
    )
  }

  return (
    <div className="p-4">
      <Button variant="ghost" onClick={onBack} className="mb-4 px-0">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>
      <h1 className="text-2xl font-bold mb-6">{workout.name} Workout</h1>

      {isEditingCompleted && currentSession && (
        <div className="mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-green-800 mb-2">Completed Workout</h3>
            <div className="text-sm text-green-700 space-y-1">
              <div>
                <strong>Date:</strong> {new Date(currentSession.startTime).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
              <div>
                <strong>Time:</strong> {new Date(currentSession.startTime).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
                {currentSession.endTime && ` - ${new Date(currentSession.endTime).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}`}
              </div>
              {currentSession.endTime && (
                <div>
                  <strong>Duration:</strong> {Math.floor((currentSession.endTime - currentSession.startTime) / 1000 / 60)} minutes
                </div>
              )}
            </div>
            <p className="text-xs text-green-600 mt-2">Click any exercise below to edit your data</p>
          </div>
        </div>
      )}

      {!isEditingCompleted && !isTimerRunning && (
        <div className="mb-6">
          <Button
            onClick={canStartWorkout ? handleStartWorkout : undefined}
            className="w-full flex items-center justify-center gap-2"
            size="lg"
            disabled={!canStartWorkout}
          >
            <Timer className="h-5 w-5" />
            Start Workout
          </Button>
          {!canStartWorkout && (
            <p className="text-sm text-muted-foreground mt-2 text-center">
              You already have a workout in progress or completed today
            </p>
          )}
        </div>
      )}

      {!isEditingCompleted && isTimerRunning && (
        <div className="mb-6">
          <div className="text-center mb-4">
            <p className="text-4xl font-mono font-bold text-blue-600">
              {formatTime(elapsedTime)}
            </p>
          </div>
          <Button
            onClick={() => setShowEndDialog(true)}
            variant="destructive"
            className="w-full"
          >
            End Workout
          </Button>
        </div>
      )}

      <div className="space-y-6">
        <Card className="gap-0">
          <CardHeader className="pb-0">
            <CardTitle className="text-lg">Warm-up</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1">
              {workout.warmup.map((exercise, index) => (
                <div key={index} className="text-sm">
                  {exercise}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {workout.mainExercises.map((exercise, index) => (
            <Card
              key={index}
              className={`cursor-pointer hover:shadow-md transition-shadow ${
                isEditingCompleted
                  ? 'border-blue-200 hover:border-blue-400'
                  : completedExercises.includes(exercise)
                  ? 'border-green-500'
                  : exercisesWithData.includes(exercise)
                  ? 'border-yellow-500'
                  : ''
              }`}
              onClick={() => handleExerciseClick(exercise)}
            >
              <CardContent className="px-3 py-0.5 flex items-center justify-between">
                <p className="text-sm">{exercise}</p>
                {isEditingCompleted ? (
                  // Show different icons for editing mode based on completion status
                  (() => {
                    const exerciseData = completedSessionData.find(e => e.name === exercise)
                    if (exerciseData?.completed) {
                      return <Check className="h-4 w-4 text-green-500" />
                    } else if (exerciseData) {
                      return <Circle className="h-4 w-4 text-blue-500 fill-current" />
                    } else {
                      return <Circle className="h-4 w-4 text-gray-400" />
                    }
                  })()
                ) : (
                  // Normal workout mode icons
                  completedExercises.includes(exercise) ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : exercisesWithData.includes(exercise) ? (
                    <Circle className="h-4 w-4 text-yellow-500 fill-current" />
                  ) : null
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="gap-0">
          <CardHeader className="pb-0">
            <CardTitle className="text-lg">Cool Down</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1">
              {workout.cooldown.map((exercise, index) => (
                <div key={index} className="text-sm">
                  {exercise}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {completedExercises.length > 0 && (
          <div className="mt-6">
            <Button
              onClick={handleCompleteWorkout}
              className="w-full"
              variant="default"
            >
              Complete Workout
            </Button>
          </div>
        )}
      </div>


      <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End Workout?</DialogTitle>
            <DialogDescription>
              Are you sure you want to end the workout? Your progress will be saved.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEndDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleEndWorkout}>
              End Workout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}