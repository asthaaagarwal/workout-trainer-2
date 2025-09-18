import { useState } from 'react'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getFeelingByDate } from '@/utils/feelingStorage'
import { loadWorkoutHistory } from '@/utils/workoutStorage'
import workoutData from '@/data/workouts.json'

export default function Calendar() {
  const [date, setDate] = useState<Date | undefined>(new Date())

  // Format date to YYYY-MM-DD
  const formatDate = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Get feeling and workout data for selected date
  const getDataForDate = (selectedDate: Date) => {
    const dateStr = formatDate(selectedDate)

    // Get feeling for this date
    const feeling = getFeelingByDate(dateStr)

    // Get workout sessions for this date
    const history = loadWorkoutHistory()
    const sessions = history.sessions.filter(s => s.date === dateStr && s.completed)

    return { feeling, sessions }
  }

  const { feeling, sessions } = date ? getDataForDate(date) : { feeling: null, sessions: [] }

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

  return (
    <div className="p-4 space-y-4">
      <CalendarComponent
        mode="single"
        selected={date}
        onSelect={setDate}
        className="rounded-md border w-full"
      />

      {date && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Feeling Section */}
            <div>
              <h3 className="text-sm font-medium mb-2">Feeling</h3>
              {feeling ? (
                <div className="space-y-1">
                  <p className="text-sm">
                    <span className="font-medium">{feeling.feeling}</span>
                  </p>
                  {feeling.feedback && (
                    <p className="text-sm text-muted-foreground">{feeling.feedback}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No feeling recorded</p>
              )}
            </div>

            {/* Workout Section */}
            <div>
              <h3 className="text-sm font-medium mb-2">Workout</h3>
              {sessions.length > 0 ? (
                <div className="space-y-2">
                  {sessions.map(session => (
                    <div key={session.id} className="space-y-1">
                      <p className="text-sm font-medium">{getWorkoutName(session.workoutId)}</p>
                      {session.endTime && (
                        <p className="text-sm text-muted-foreground">
                          Duration: {formatDuration(session.startTime, session.endTime)}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {session.exercises.length} exercises completed
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No workout completed</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}