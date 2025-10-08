import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Plus, Trash2, Play, X } from 'lucide-react'
import {
  saveExerciseData,
  markExerciseComplete,
  getTodayCompletedWorkout,
  getActiveWorkoutSession,
  getCurrentSessionExerciseData,
  getPreviousWorkoutExerciseData,
  updateExerciseDataInSession,
  type WorkoutSession
} from '@/utils/workoutStorage'
import workoutData from '@/data/workouts.json'

interface ExerciseSet {
  weight: number | ''
  reps: number | ''
}

interface ExerciseScreenProps {
  exerciseName: string
  session: WorkoutSession
  onBack: () => void
  onSave: () => void
}

export default function ExerciseScreen({ exerciseName, session, onBack, onSave }: ExerciseScreenProps) {
  const [exerciseSets, setExerciseSets] = useState<ExerciseSet[]>([
    { weight: '', reps: '' },
    { weight: '', reps: '' },
    { weight: '', reps: '' }
  ])
  const [previousExerciseData, setPreviousExerciseData] = useState<ExerciseSet[]>([])
  const [isEditable, setIsEditable] = useState(false)
  const [isEditingCompleted, setIsEditingCompleted] = useState(false)

  // Get exercise metadata
  const exerciseMetadata = (workoutData as { exerciseMetadata?: Record<string, { type?: string; tips?: string[]; videoUrl?: string }> }).exerciseMetadata?.[exerciseName]

  useEffect(() => {
    // Check if this is a completed workout
    const isCompleted = session.completed
    setIsEditingCompleted(isCompleted)

    // Load current session data - for completed workouts, get existing exercise data
    const currentSessionData = isCompleted
      ? session.exercises.find(e => e.name === exerciseName)?.sets || []
      : getCurrentSessionExerciseData(session.id, exerciseName)

    // Load previous workout data for placeholder hints
    const previousData = getPreviousWorkoutExerciseData(session.workoutId, exerciseName, session.id)
    setPreviousExerciseData(previousData)

    if (currentSessionData.length > 0) {
      // Use current session data if it exists
      setExerciseSets(currentSessionData.map(set => ({
        weight: set.weight || '',
        reps: set.reps || ''
      })))
    } else {
      // Start with empty sets (previous data will show as placeholders only)
      const numberOfSets = previousData.length > 0 ? previousData.length : 3
      setExerciseSets(Array(numberOfSets).fill({ weight: '', reps: '' }))
    }
  }, [session.id, session.workoutId, exerciseName, session.completed, session.exercises])

  // Determine if this workout is editable
  useEffect(() => {
    const completedWorkout = getTodayCompletedWorkout()
    const activeWorkout = getActiveWorkoutSession()

    // Editable if this is the active workout OR if it's a completed workout (for editing completed data)
    const editable = (activeWorkout?.id === session.id) ||
                     (session.completed) ||
                     (completedWorkout?.id === session.id)
    setIsEditable(editable)
  }, [session.id, session.completed])

  // Auto-save exercise data whenever sets change
  useEffect(() => {
    const isBodyweight = exerciseMetadata?.type === 'bodyweight'

    const setsToSave = exerciseSets
      .filter(set => {
        if (isBodyweight) {
          // For bodyweight, only check reps
          return set.reps !== '' && set.reps !== 0
        } else {
          // For weighted, check both weight and reps
          return (set.weight !== '' && set.weight !== 0) || (set.reps !== '' && set.reps !== 0)
        }
      })
      .map(set => ({
        weight: isBodyweight ? 0 : (typeof set.weight === 'number' ? set.weight : 0),
        reps: typeof set.reps === 'number' ? set.reps : 0
      }))

    // Only save if there are valid sets and the workout is editable
    if (setsToSave.length > 0 && isEditable) {
      if (isEditingCompleted) {
        // Use the new function for completed workouts
        updateExerciseDataInSession(session.id, exerciseName, setsToSave)
      } else {
        // Use the original function for active workouts
        saveExerciseData(session.id, exerciseName, setsToSave)
      }
    }
  }, [exerciseSets, session.id, exerciseName, exerciseMetadata, isEditable, isEditingCompleted])

  const addSet = () => {
    setExerciseSets([...exerciseSets, { weight: '', reps: '' }])
  }

  const removeSet = (index: number) => {
    if (exerciseSets.length > 1) {
      setExerciseSets(exerciseSets.filter((_, i) => i !== index))
    }
  }

  const updateSet = (index: number, field: 'weight' | 'reps', value: number | '') => {
    const updatedSets = exerciseSets.map((set, i) =>
      i === index ? { ...set, [field]: value } : set
    )
    setExerciseSets(updatedSets)
  }

  const handleSaveExercise = () => {
    // Convert exercise sets to the correct format for storage
    const isBodyweight = exerciseMetadata?.type === 'bodyweight'

    const setsToSave = exerciseSets
      .filter(set => {
        if (isBodyweight) {
          // For bodyweight, only check reps
          return set.reps !== '' && set.reps !== 0
        } else {
          // For weighted, check both weight and reps
          return (set.weight !== '' && set.weight !== 0) || (set.reps !== '' && set.reps !== 0)
        }
      })
      .map(set => ({
        weight: isBodyweight ? 0 : (typeof set.weight === 'number' ? set.weight : 0),
        reps: typeof set.reps === 'number' ? set.reps : 0
      }))

    if (isEditingCompleted) {
      // For completed workouts, just save the data (auto-save already handles it)
      updateExerciseDataInSession(session.id, exerciseName, setsToSave)
    } else {
      // For active workouts, save and mark as completed
      saveExerciseData(session.id, exerciseName, setsToSave)
      markExerciseComplete(session.id, exerciseName)
    }

    // Navigate back and update the completed exercises
    onSave()
  }

  return (
    <div className="h-screen flex flex-col relative">
      <div className="p-4 pb-20 overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" onClick={onBack} className="px-0">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          {exerciseMetadata?.videoUrl && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => window.open(exerciseMetadata.videoUrl, '_blank')}
            >
              <Play className="h-4 w-4" />
            </Button>
          )}
        </div>

        <h1 className="text-2xl font-bold text-center mb-4">{exerciseName}</h1>

      {exerciseMetadata?.tips && (
        <Card className="mb-4">
          <CardContent className="pt-0">
            <ul className="space-y-1 text-sm text-muted-foreground">
              {exerciseMetadata.tips.map((tip: string, index: number) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-xs mt-0.5">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}


        <div className="divide-y mb-4">
          {exerciseSets.map((set, index) => (
            <div key={index} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium w-12">Set {index + 1}</span>
                {exerciseMetadata?.type !== 'bodyweight' && (
                  <>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={set.weight || ''}
                        onChange={isEditable ? (e) => updateSet(index, 'weight', e.target.value === '' ? '' : parseFloat(e.target.value) || 0) : undefined}
                        disabled={!isEditable}
                        className={`w-20 pl-2 pr-8 py-1 text-sm border rounded text-left [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                          !isEditable ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''
                        }`}
                        placeholder={
                          previousExerciseData[index]?.weight
                            ? `${previousExerciseData[index].weight}`
                            : "0"
                        }
                      />
                      <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                        kg
                      </span>
                    </div>
                    <X className="h-3 w-3 text-gray-400" />
                  </>
                )}
                <div className="relative">
                  <input
                    type="number"
                    value={set.reps || ''}
                    onChange={isEditable ? (e) => updateSet(index, 'reps', e.target.value === '' ? '' : parseInt(e.target.value) || 0) : undefined}
                    disabled={!isEditable}
                    className={`w-20 pl-2 pr-8 py-1 text-sm border rounded text-left [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                      !isEditable ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''
                    }`}
                    placeholder={
                      previousExerciseData[index]?.reps
                        ? `${previousExerciseData[index].reps}`
                        : "0"
                    }
                  />
                  <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                    reps
                  </span>
                </div>
              </div>
              <Button
                onClick={isEditable ? () => removeSet(index) : undefined}
                disabled={!isEditable}
                variant="outline"
                size="icon"
                className={`h-8 w-8 ${!isEditable ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <Button
          onClick={isEditable ? addSet : undefined}
          disabled={!isEditable}
          variant="outline"
          className={`w-full mb-4 flex items-center justify-center gap-2 ${
            !isEditable ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <Plus className="h-4 w-4" />
          Add Set
        </Button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t">
        <Button
          onClick={isEditable ? handleSaveExercise : undefined}
          disabled={!isEditable}
          className={`w-full ${!isEditable ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isEditingCompleted ? 'Save Changes' : 'Done'}
        </Button>
        {!isEditable && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            This workout is not currently active - you can only edit ongoing workouts
          </p>
        )}
        {isEditingCompleted && isEditable && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Changes are saved automatically as you type
          </p>
        )}
      </div>
    </div>
  )
}