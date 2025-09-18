import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Plus, Trash2, Play, Lightbulb, Video, X } from 'lucide-react'
import {
  saveExerciseData,
  getExerciseData,
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

  // Get exercise metadata
  const exerciseMetadata = (workoutData as any).exerciseMetadata?.[exerciseName]

  useEffect(() => {
    // Load previous data for this exercise
    const previousData = getExerciseData(session.id, exerciseName)
    if (previousData.length > 0) {
      // Use data from current session or last workout of same type
      setExerciseSets(previousData.map(set => ({
        weight: set.weight || '',
        reps: set.reps || ''
      })))
    } else {
      // No previous data found, use default 3 empty sets
      setExerciseSets([{ weight: '', reps: '' }, { weight: '', reps: '' }, { weight: '', reps: '' }])
    }
  }, [session.id, exerciseName])

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
    const setsToSave = exerciseSets
      .filter(set => (set.weight && set.weight !== '') || (set.reps && set.reps !== ''))
      .map(set => ({
        weight: typeof set.weight === 'number' ? set.weight : 0,
        reps: typeof set.reps === 'number' ? set.reps : 0
      }))

    // Save the exercise data
    saveExerciseData(session.id, exerciseName, setsToSave)

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

      {exerciseMetadata && (
        <Card className="mb-4">
          <CardContent className="pt-0">
            <ul className="space-y-1 text-sm text-muted-foreground">
              {exerciseMetadata.tips?.map((tip: string, index: number) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-xs mt-0.5">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
            {exerciseMetadata.videoUrl && (
              <Button
                variant="link"
                className="mt-3 p-0 h-auto text-sm"
                onClick={() => window.open(exerciseMetadata.videoUrl, '_blank')}
              >
                <Video className="h-4 w-4 mr-2" />
                Watch video tutorial
              </Button>
            )}
          </CardContent>
        </Card>
      )}

        <div className="divide-y mb-4">
          {exerciseSets.map((set, index) => (
            <div key={index} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium w-12">Set {index + 1}</span>
                <div className="relative">
                  <input
                    type="number"
                    value={set.weight || ''}
                    onChange={(e) => updateSet(index, 'weight', e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                    className="w-20 pl-2 pr-8 py-1 text-sm border rounded text-left [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="0"
                  />
                  <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                    kg
                  </span>
                </div>
                <X className="h-3 w-3 text-gray-400" />
                <div className="relative">
                  <input
                    type="number"
                    value={set.reps || ''}
                    onChange={(e) => updateSet(index, 'reps', e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                    className="w-20 pl-2 pr-8 py-1 text-sm border rounded text-left [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="0"
                  />
                  <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                    reps
                  </span>
                </div>
              </div>
              <Button
                onClick={() => removeSet(index)}
                variant="outline"
                size="icon"
                className="h-8 w-8"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <Button
          onClick={addSet}
          variant="outline"
          className="w-full mb-4 flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Set
        </Button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t">
        <Button onClick={handleSaveExercise} className="w-full">
          Done
        </Button>
      </div>
    </div>
  )
}