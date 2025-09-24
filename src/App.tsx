import { useState } from 'react'
import { Home as HomeIcon, Calendar as CalendarIcon, BarChart3 } from 'lucide-react'
import Home from '@/components/Home'
import Calendar from '@/components/Calendar'
import Workout from '@/components/Workout'
import Stats from '@/components/Stats'
import Congratulations from '@/components/Congratulations'
import ExerciseScreen from '@/components/ExerciseScreen'
import { type WorkoutSession } from '@/utils/workoutStorage'

function App() {
  const [currentPage, setCurrentPage] = useState('home')
  const [selectedWorkout, setSelectedWorkout] = useState('')
  const [selectedExercise, setSelectedExercise] = useState('')
  const [currentSession, setCurrentSession] = useState<WorkoutSession | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [congratsData, setCongratsData] = useState({ duration: '00:00:00', exercises: 0 })
  const [editingCompletedSession, setEditingCompletedSession] = useState<WorkoutSession | null>(null)

  const handleWorkoutSelect = (workoutId: string) => {
    setSelectedWorkout(workoutId)
    setEditingCompletedSession(null)
    setCurrentPage('workout')
  }

  const handleCompletedWorkoutSelect = (session: WorkoutSession) => {
    setSelectedWorkout(session.workoutId)
    setEditingCompletedSession(session)
    setCurrentPage('workout')
  }

  const handleBack = () => {
    setCurrentPage('home')
    setEditingCompletedSession(null)
    setRefreshKey(prev => prev + 1) // Force refresh to check for completed workout
  }

  const handleCongratulations = (duration: string, exerciseCount: number) => {
    setCongratsData({ duration, exercises: exerciseCount })
    setCurrentPage('congratulations')
  }

  const handleHomeFromCongrats = () => {
    setCurrentPage('home')
    setRefreshKey(prev => prev + 1) // Force refresh to check for completed workout
  }

  const handleExerciseSelect = (exerciseName: string, session: WorkoutSession) => {
    setSelectedExercise(exerciseName)
    setCurrentSession(session)
    setCurrentPage('exercise')
  }

  const handleExerciseSave = () => {
    setCurrentPage('workout')
  }

  const handleExerciseBack = () => {
    setCurrentPage('workout')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className={`flex-1 ${currentPage !== 'exercise' ? 'pb-16' : ''}`}>
        {currentPage === 'home' && <Home key={refreshKey} onWorkoutSelect={handleWorkoutSelect} onCompletedWorkoutSelect={handleCompletedWorkoutSelect} />}
        {currentPage === 'calendar' && <Calendar onCompletedWorkoutSelect={handleCompletedWorkoutSelect} />}
        {currentPage === 'stats' && <Stats />}
        {currentPage === 'workout' && (
          <Workout
            workoutId={selectedWorkout}
            editingSession={editingCompletedSession}
            onBack={handleBack}
            onCongratulations={handleCongratulations}
            onExerciseSelect={handleExerciseSelect}
          />
        )}
        {currentPage === 'exercise' && currentSession && (
          <ExerciseScreen
            exerciseName={selectedExercise}
            session={currentSession}
            onBack={handleExerciseBack}
            onSave={handleExerciseSave}
          />
        )}
        {currentPage === 'congratulations' && (
          <Congratulations
            onHome={handleHomeFromCongrats}
            workoutDuration={congratsData.duration}
            exercisesCompleted={congratsData.exercises}
          />
        )}
      </main>

      {currentPage !== 'exercise' && (
        <nav className="fixed bottom-0 left-0 right-0 border-t bg-white shadow-lg">
          <div className="flex justify-center">
            <div className="flex space-x-8 px-4 py-2">
              <button
                onClick={() => setCurrentPage('home')}
                className={`flex flex-col items-center space-y-1 px-6 py-2 rounded-md text-xs font-medium ${
                  currentPage === 'home'
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <HomeIcon className="h-6 w-6" />
                <span>Home</span>
              </button>
              <button
                onClick={() => setCurrentPage('calendar')}
                className={`flex flex-col items-center space-y-1 px-6 py-2 rounded-md text-xs font-medium ${
                  currentPage === 'calendar'
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <CalendarIcon className="h-6 w-6" />
                <span>Calendar</span>
              </button>
              <button
                onClick={() => setCurrentPage('stats')}
                className={`flex flex-col items-center space-y-1 px-6 py-2 rounded-md text-xs font-medium ${
                  currentPage === 'stats'
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <BarChart3 className="h-6 w-6" />
                <span>Stats</span>
              </button>
            </div>
          </div>
        </nav>
      )}
    </div>
  )
}

export default App
