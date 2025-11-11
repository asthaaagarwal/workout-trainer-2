import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { loadWorkoutHistory, type WorkoutSession } from '@/utils/workoutStorage'
import { getAllFeelings } from '@/utils/feelingStorage'
import workoutData from '@/data/workouts.json'
import { Calendar as CalendarIcon, Clock, Dumbbell, Smile, Frown, AlertTriangle } from 'lucide-react'
import { formatExerciseSet } from '@/utils/exerciseFormat'

interface CalendarProps {
  onCompletedWorkoutSelect: (session: WorkoutSession) => void
}

export default function Calendar({ onCompletedWorkoutSelect }: CalendarProps) {
  const [dailyData, setDailyData] = useState<Record<string, {
    workouts: WorkoutSession[],
    feeling?: { feeling: string, feedback: string }
  }>>({})

  useEffect(() => {
    // Load all workout history
    const history = loadWorkoutHistory()
    const completedWorkouts = history.sessions.filter(s => s.completed)

    // Load all feelings
    const allFeelings = getAllFeelings()

    // Combine data by date
    const dataByDate: Record<string, {
      workouts: WorkoutSession[],
      feeling?: { feeling: string, feedback: string }
    }> = {}

    // Add workouts
    completedWorkouts.forEach(workout => {
      if (!dataByDate[workout.date]) {
        dataByDate[workout.date] = { workouts: [] }
      }
      dataByDate[workout.date].workouts.push(workout)
    })

    // Add feelings
    allFeelings.forEach(feeling => {
      if (!dataByDate[feeling.date]) {
        dataByDate[feeling.date] = { workouts: [] }
      }
      dataByDate[feeling.date].feeling = {
        feeling: feeling.feeling,
        feedback: feeling.feedback
      }
    })

    setDailyData(dataByDate)
  }, [])

  // Get workout name from ID
  const getWorkoutName = (workoutId: string): string => {
    const workout = workoutData.workouts.find(w => w.id === workoutId)
    return workout?.name || workoutId
  }

  // Format duration
  const formatDuration = (startTime: number, endTime?: number): string => {
    if (!endTime) return ''
    const duration = Math.floor((endTime - startTime) / 1000 / 60)
    return `${duration} min`
  }

  // Format date
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Format time
  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Get feeling icon
  const getFeelingIcon = (feeling: string) => {
    switch(feeling) {
      case 'Good':
        return <Smile className="h-4 w-4 text-green-600" />
      case 'Sore':
        return <Frown className="h-4 w-4 text-yellow-600" />
      case 'Very sore':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return null
    }
  }

  // Sort dates in descending order (most recent first)
  const sortedDates = Object.keys(dailyData).sort((a, b) => b.localeCompare(a))

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold mb-4">Daily Log</h1>

      {sortedDates.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-center text-muted-foreground">No data recorded yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedDates.map(date => {
            const dayData = dailyData[date]
            return (
              <Card key={date}>
                <CardHeader className="pb-0">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    {formatDate(date)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Feeling Section */}
                  {dayData.feeling && (
                    <div className="flex items-start gap-2">
                      {getFeelingIcon(dayData.feeling.feeling)}
                      <div className="flex-1">
                        <p className="text-sm font-medium">Feeling: {dayData.feeling.feeling}</p>
                        {dayData.feeling.feedback && (
                          <p className="text-sm text-muted-foreground mt-1">{dayData.feeling.feedback}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Workouts Section */}
                  {dayData.workouts.length > 0 && (
                    <div className="space-y-2">
                      {dayData.workouts.map(session => (
                        <div
                          key={session.id}
                          className="border-l-2 border-primary pl-3 space-y-1 cursor-pointer hover:bg-gray-50 p-2 rounded-r-md transition-colors"
                          onClick={() => onCompletedWorkoutSelect(session)}
                        >
                          <p className="font-medium">{getWorkoutName(session.workoutId)} Workout</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTime(session.startTime)}
                              {session.endTime && ` - ${formatTime(session.endTime)}`}
                            </span>
                            {session.endTime && (
                              <span>{formatDuration(session.startTime, session.endTime)}</span>
                            )}
                            <span className="flex items-center gap-1">
                              <Dumbbell className="h-3 w-3" />
                              {session.exercises.length} exercises
                            </span>
                          </div>

                          {/* Exercise details */}
                          <div className="mt-2 space-y-1">
                            {session.exercises.map((exercise, idx) => (
                              <div key={idx} className="text-sm text-muted-foreground">
                                <span className="font-medium">{exercise.name}:</span>{' '}
                                {exercise.sets.map((set, setIdx) => (
                                  <span key={setIdx}>
                                    {setIdx > 0 && ', '}
                                    {formatExerciseSet(set, setIdx)}
                                  </span>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Show message if no data for this day */}
                  {!dayData.feeling && dayData.workouts.length === 0 && (
                    <p className="text-sm text-muted-foreground">No data for this day</p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
