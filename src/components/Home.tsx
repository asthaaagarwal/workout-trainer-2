import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Smile, Frown, AlertTriangle, Trophy, Clock, Dumbbell, Play, Timer } from 'lucide-react'
import workoutData from '@/data/workouts.json'
import { saveTodayFeeling, getTodayFeeling } from '@/utils/feelingStorage'
import { getTodayCompletedWorkout, getActiveWorkoutSession, getTimerState, type WorkoutSession } from '@/utils/workoutStorage'

type FeelingLevel = 'Good' | 'Sore' | 'Very sore'

interface HomeProps {
  onWorkoutSelect: (workoutId: string) => void
  onCompletedWorkoutSelect: (session: WorkoutSession) => void
}

export default function Home({ onWorkoutSelect, onCompletedWorkoutSelect }: HomeProps) {
  const [selectedFeeling, setSelectedFeeling] = useState<FeelingLevel | null>(null)
  const [feedback, setFeedback] = useState('')
  const [showFeedback, setShowFeedback] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [completedWorkout, setCompletedWorkout] = useState<WorkoutSession | null>(null)
  const [activeWorkout, setActiveWorkout] = useState<WorkoutSession | null>(null)
  const [activeElapsedTime, setActiveElapsedTime] = useState(0)

  useEffect(() => {
    const todayFeeling = getTodayFeeling()
    if (todayFeeling) {
      setSelectedFeeling(todayFeeling.feeling)
      setFeedback(todayFeeling.feedback)
      setShowFeedback(true)
      setIsSaved(true)
    }

    // Check for completed workout
    const todayWorkout = getTodayCompletedWorkout()
    setCompletedWorkout(todayWorkout)

    // Check for active workout
    const activeSession = getActiveWorkoutSession()
    setActiveWorkout(activeSession)
  }, [])

  // Update active workout timer
  useEffect(() => {
    if (activeWorkout) {
      const updateTimer = () => {
        const timerState = getTimerState(activeWorkout.id)
        setActiveElapsedTime(timerState.elapsedSeconds)
      }

      // Update immediately
      updateTimer()

      // Set up interval for live updates
      const interval = setInterval(updateTimer, 1000)
      return () => clearInterval(interval)
    }
  }, [activeWorkout])

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleFeelingSelect = (feeling: FeelingLevel) => {
    setSelectedFeeling(feeling)
    setShowFeedback(true)
  }

  const handleSave = () => {
    if (selectedFeeling) {
      saveTodayFeeling(selectedFeeling, feedback)
      setIsSaved(true)
    }
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-4">How are you feeling today?</h2>

      <Card>
        <CardContent>
          {isSaved ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {selectedFeeling === 'Good' && <Smile className="h-5 w-5 text-green-600" />}
                {selectedFeeling === 'Sore' && <Frown className="h-5 w-5 text-yellow-600" />}
                {selectedFeeling === 'Very sore' && <AlertTriangle className="h-5 w-5 text-red-600" />}
                <span className="font-semibold text-lg">{selectedFeeling}</span>
              </div>
              {feedback && (
                <p className="text-sm text-muted-foreground">{feedback}</p>
              )}
            </div>
          ) : !showFeedback ? (
            <div className="flex flex-col space-y-3">
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => handleFeelingSelect('Good')}
              >
                <Smile className="h-4 w-4" />
                Good
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => handleFeelingSelect('Sore')}
              >
                <Frown className="h-4 w-4" />
                Sore
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => handleFeelingSelect('Very sore')}
              >
                <AlertTriangle className="h-4 w-4" />
                Very sore
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {selectedFeeling === 'Good' && <Smile className="h-4 w-4" />}
                {selectedFeeling === 'Sore' && <Frown className="h-4 w-4" />}
                {selectedFeeling === 'Very sore' && <AlertTriangle className="h-4 w-4" />}
                <span className="font-medium">{selectedFeeling}</span>
              </div>

              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="How are you feeling today? Any notes about your condition..."
                className="w-full px-3 py-2 text-sm border rounded-md resize-none h-20"
              />

              <Button onClick={handleSave} className="w-full">
                Save
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {activeWorkout && (
        <>
          <h2 className="text-2xl font-semibold mt-4 mb-4 text-blue-600 flex items-center gap-2">
            <Timer className="h-6 w-6" />
            Ongoing Workout
          </h2>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow border-blue-200 bg-blue-50"
            onClick={() => onWorkoutSelect(activeWorkout.workoutId)}
          >
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>
                  {workoutData.workouts.find(w => w.id === activeWorkout.workoutId)?.name} Workout
                </span>
                <div className="flex items-center gap-2">
                  <Play className="h-4 w-4 text-blue-600" />
                  <span className="text-blue-600 font-mono text-lg">
                    {formatTime(activeElapsedTime)}
                  </span>
                </div>
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                <span>Tap to continue your workout</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-blue-600 font-medium">
                {activeWorkout.exercises.length} exercises completed
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {completedWorkout && (
        <>
          <h2 className="text-2xl font-semibold mt-4 mb-4 text-green-600 flex items-center gap-2">
            <Trophy className="h-6 w-6" />
            Workout completed for the day!
          </h2>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onCompletedWorkoutSelect(completedWorkout)}
          >
            <CardHeader>
              <CardTitle className="text-lg">
                {workoutData.workouts.find(w => w.id === completedWorkout.workoutId)?.name} Workout
              </CardTitle>
              <div className="text-sm text-muted-foreground flex flex-col gap-1">
                <span className="font-medium">
                  {new Date(completedWorkout.startTime).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(completedWorkout.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    {completedWorkout.endTime && ` - ${new Date(completedWorkout.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`}
                  </span>
                  <span className="flex items-center gap-1">
                    <Dumbbell className="h-3 w-3" />
                    {completedWorkout.exercises.length} exercises
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {completedWorkout.exercises.map((exercise, index) => (
                  <div key={index} className="border-l-2 border-green-500 pl-3">
                    <p className="font-medium text-sm">{exercise.name}</p>
                    <div className="text-xs text-muted-foreground space-x-3">
                      {exercise.sets.map((set, setIndex) => (
                        <span key={setIndex}>
                          Set {setIndex + 1}: {set.weight > 0 ? `${set.weight}kg × ` : ''}{set.reps} reps
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <h2 className="text-2xl font-semibold mt-4 mb-4">
        {(activeWorkout || completedWorkout) ? 'Here\'s a list of other workouts' : 'Which workout do you want to do today?'}
      </h2>

      <div className="grid grid-cols-1 gap-4">
        {workoutData.workouts.map((workout) => (
          <Card
            key={workout.id}
            className="@container/card cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onWorkoutSelect(workout.id)}
          >
            <CardHeader className="gap-1">
              <CardTitle className="text-xl font-semibold">
                {workout.name}
              </CardTitle>
              <div className="text-muted-foreground text-sm">
                {workout.description}
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  )
}