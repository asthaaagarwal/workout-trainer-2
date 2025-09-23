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
import { ArrowLeft, Check, Timer } from 'lucide-react'
import workoutData from '@/data/workouts.json'
import {
  getOrCreateSession,
  completeWorkoutSession,
  getCompletedExercises,
  startWorkoutTimer,
  stopWorkoutTimer,
  getTimerState,
  type WorkoutSession
} from '@/utils/workoutStorage'

interface WorkoutProps {
  workoutId: string
  onBack: () => void
  onCongratulations: (duration: string, exerciseCount: number) => void
  onExerciseSelect: (exerciseName: string, session: WorkoutSession) => void
}

export default function Workout({ workoutId, onBack, onCongratulations, onExerciseSelect }: WorkoutProps) {
  const workout = workoutData.workouts.find(w => w.id === workoutId)
  const [currentSession, setCurrentSession] = useState<WorkoutSession | null>(null)
  const [completedExercises, setCompletedExercises] = useState<string[]>([])
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [showEndDialog, setShowEndDialog] = useState(false)
  const timerInterval = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Get or create a session for this workout
    const session = getOrCreateSession(workoutId)
    setCurrentSession(session)
    setCompletedExercises(getCompletedExercises(session.id))

    // Load timer state
    const timerState = getTimerState(session.id)
    setIsTimerRunning(timerState.isRunning)
    setElapsedTime(timerState.elapsedSeconds)
  }, [workoutId])

  // Refresh completed exercises when returning from exercise screen
  useEffect(() => {
    if (currentSession) {
      const interval = setInterval(() => {
        setCompletedExercises(getCompletedExercises(currentSession.id))
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [currentSession])

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

      {!isTimerRunning && (
        <Button
          onClick={handleStartWorkout}
          className="w-full mb-6 flex items-center justify-center gap-2"
          size="lg"
        >
          <Timer className="h-5 w-5" />
          Start Workout
        </Button>
      )}

      {isTimerRunning && (
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
                completedExercises.includes(exercise) ? 'border-green-500' : ''
              }`}
              onClick={() => handleExerciseClick(exercise)}
            >
              <CardContent className="px-3 py-0.5 flex items-center justify-between">
                <p className="text-sm">{exercise}</p>
                {completedExercises.includes(exercise) && (
                  <Check className="h-4 w-4 text-green-500" />
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