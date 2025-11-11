import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Plus, Trash2, Play, X, Square } from 'lucide-react'
import {
  saveExerciseData,
  markExerciseComplete,
  getTodayCompletedWorkout,
  getActiveWorkoutSession,
  getCurrentSessionExerciseData,
  getPreviousWorkoutExerciseData,
  updateExerciseDataInSession,
  type WorkoutSession,
  type ExerciseSet as StoredExerciseSet
} from '@/utils/workoutStorage'
import workoutData from '@/data/workouts.json'

interface ExerciseSetForm {
  weight: number | ''
  reps: number | ''
  seconds: number | ''
}

const createEmptySet = (): ExerciseSetForm => ({
  weight: '',
  reps: '',
  seconds: ''
})

const toFormSet = (set: StoredExerciseSet): ExerciseSetForm => ({
  weight: set.weight > 0 ? set.weight : '',
  reps: set.reps > 0 ? set.reps : '',
  seconds: (set.seconds ?? 0) > 0 ? (set.seconds as number) : ''
})

interface ExerciseScreenProps {
  exerciseName: string
  session: WorkoutSession
  onBack: () => void
  onSave: () => void
}

export default function ExerciseScreen({ exerciseName, session, onBack, onSave }: ExerciseScreenProps) {
  const [exerciseSets, setExerciseSets] = useState<ExerciseSetForm[]>([
    createEmptySet(),
    createEmptySet(),
    createEmptySet()
  ])
  const [previousExerciseData, setPreviousExerciseData] = useState<StoredExerciseSet[]>([])
  const [isEditable, setIsEditable] = useState(false)
  const [isEditingCompleted, setIsEditingCompleted] = useState(false)
  const [activeTimerIndex, setActiveTimerIndex] = useState<number | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Get exercise metadata
  const exerciseMetadata = (workoutData as { exerciseMetadata?: Record<string, { type?: string; tips?: string[]; videoUrl?: string }> }).exerciseMetadata?.[exerciseName]
  const exerciseType = (exerciseMetadata?.type ?? 'weighted') as 'weighted' | 'bodyweight' | 'timed'
  const isBodyweightType = exerciseType === 'bodyweight'
  const isTimedType = exerciseType === 'timed'

  const hasValidData = useCallback((set: ExerciseSetForm): boolean => {
    if (isTimedType) {
      return set.seconds !== '' && set.seconds !== 0
    }

    if (isBodyweightType) {
      return set.reps !== '' && set.reps !== 0
    }

    return (set.weight !== '' && set.weight !== 0) || (set.reps !== '' && set.reps !== 0)
  }, [isBodyweightType, isTimedType])

  const convertSetForStorage = useCallback((set: ExerciseSetForm): StoredExerciseSet => {
    const repsValue = typeof set.reps === 'number' ? set.reps : 0
    const weightValue = typeof set.weight === 'number' ? set.weight : 0
    const secondsValue = typeof set.seconds === 'number' ? set.seconds : 0

    if (isTimedType) {
      const timedSet: StoredExerciseSet = {
        weight: 0,
        reps: 0
      }

      if (secondsValue > 0) {
        timedSet.seconds = secondsValue
      }

      return timedSet
    }

    if (isBodyweightType) {
      return {
        weight: 0,
        reps: repsValue
      }
    }

    return {
      weight: weightValue,
      reps: repsValue
    }
  }, [isBodyweightType, isTimedType])

  useEffect(() => {
    // Check if this is a completed workout
    const isCompleted = session.completed
    setIsEditingCompleted(isCompleted)
    setActiveTimerIndex(null)

    // Load current session data - for completed workouts, get existing exercise data
    const currentSessionData = isCompleted
      ? session.exercises.find(e => e.name === exerciseName)?.sets || []
      : getCurrentSessionExerciseData(session.id, exerciseName)

    // Load previous workout data for placeholder hints
    const previousData = getPreviousWorkoutExerciseData(session.workoutId, exerciseName, session.id)
    setPreviousExerciseData(previousData)

    if (currentSessionData.length > 0) {
      // Use current session data if it exists
      setExerciseSets(currentSessionData.map(toFormSet))
    } else {
      // Start with empty sets (previous data will show as placeholders only)
      const numberOfSets = previousData.length > 0 ? previousData.length : 3
      setExerciseSets(Array.from({ length: numberOfSets }, () => createEmptySet()))
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

  // Ensure timer is stopped when exercise isn't timed or editable
  useEffect(() => {
    if ((!isTimedType || !isEditable) && activeTimerIndex !== null) {
      setActiveTimerIndex(null)
    }
  }, [isTimedType, isEditable, activeTimerIndex])

  // Timer effect for timed exercises
  useEffect(() => {
    if (!isTimedType || activeTimerIndex === null) {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      return
    }

    timerRef.current = setInterval(() => {
      setExerciseSets(prev =>
        prev.map((set, idx) => {
          if (idx !== activeTimerIndex) return set
          const currentSeconds = typeof set.seconds === 'number' ? set.seconds : 0
          return { ...set, seconds: currentSeconds + 1 }
        })
      )
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [activeTimerIndex, isTimedType])

  // Auto-save exercise data whenever sets change
  useEffect(() => {
    const setsToSave = exerciseSets
      .filter(hasValidData)
      .map(convertSetForStorage)

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
  }, [exerciseSets, session.id, exerciseName, isEditable, isEditingCompleted, hasValidData, convertSetForStorage])

  const addSet = () => {
    setExerciseSets(prev => [...prev, createEmptySet()])
  }

  const removeSet = (index: number) => {
    if (exerciseSets.length > 1) {
      setExerciseSets(prev => prev.filter((_, i) => i !== index))
      setActiveTimerIndex(prev => {
        if (prev === null) return prev
        if (prev === index) return null
        if (prev > index) return prev - 1
        return prev
      })
    }
  }

  const updateSet = (index: number, field: 'weight' | 'reps' | 'seconds', value: number | '') => {
    setExerciseSets(prev =>
      prev.map((set, i) => (i === index ? { ...set, [field]: value } : set))
    )
  }

  const handleTimerToggle = (index: number) => {
    if (!isEditable || !isTimedType) return

    if (activeTimerIndex === index) {
      setActiveTimerIndex(null)
      return
    }

    setExerciseSets(prev =>
      prev.map((set, i) => (i === index ? { ...set, seconds: 0 } : set))
    )
    setActiveTimerIndex(index)
  }

  const handleSaveExercise = () => {
    // Convert exercise sets to the correct format for storage
    const setsToSave = exerciseSets
      .filter(hasValidData)
      .map(convertSetForStorage)

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
                {isTimedType ? (
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <input
                        type="number"
                        step={1}
                        value={set.seconds === '' ? '' : set.seconds}
                        onChange={isEditable ? (e) => {
                          const rawValue = e.target.value
                          if (rawValue === '') {
                            updateSet(index, 'seconds', '')
                            return
                          }
                          updateSet(index, 'seconds', parseInt(rawValue, 10) || 0)
                        } : undefined}
                        disabled={!isEditable}
                        className={`w-28 pl-2 pr-10 py-1 text-sm border rounded text-left [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                          !isEditable ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''
                        }`}
                        placeholder={
                          previousExerciseData[index]?.seconds
                            ? `${previousExerciseData[index].seconds}`
                            : "0"
                        }
                      />
                      <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                        sec
                      </span>
                    </div>
                    <Button
                      type="button"
                      onClick={() => handleTimerToggle(index)}
                      disabled={!isEditable}
                      variant={activeTimerIndex === index ? 'destructive' : 'outline'}
                      size="icon"
                      className="h-8 w-8"
                      aria-label={activeTimerIndex === index ? 'Stop timer' : 'Start timer'}
                    >
                      {activeTimerIndex === index ? (
                        <Square className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ) : (
                  <>
                    {!isBodyweightType && (
                      <>
                        <div className="relative">
                          <input
                            type="number"
                            step={0.1}
                            value={set.weight === '' ? '' : set.weight}
                            onChange={isEditable ? (e) => {
                              const rawValue = e.target.value
                              if (rawValue === '') {
                                updateSet(index, 'weight', '')
                                return
                              }
                              updateSet(index, 'weight', parseFloat(rawValue) || 0)
                            } : undefined}
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
                        value={set.reps === '' ? '' : set.reps}
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
                  </>
                )}
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
