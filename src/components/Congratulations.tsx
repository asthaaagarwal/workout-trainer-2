import { Button } from '@/components/ui/button'
import { Trophy, Home } from 'lucide-react'

interface CongratulationsProps {
  onHome: () => void
  workoutDuration: string
  exercisesCompleted: number
}

export default function Congratulations({ onHome, workoutDuration, exercisesCompleted }: CongratulationsProps) {
  return (
    <div className="p-4 flex flex-col items-center justify-center min-h-[80vh]">
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="bg-yellow-100 p-6 rounded-full">
            <Trophy className="h-16 w-16 text-yellow-600" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-green-600">Congratulations!</h1>
        <p className="text-lg text-gray-600">You've completed your workout!</p>

        <div className="space-y-2 py-4">
          <div className="text-sm text-gray-500">Workout Duration</div>
          <div className="text-2xl font-mono font-semibold">{workoutDuration}</div>

          <div className="text-sm text-gray-500 mt-4">Exercises Completed</div>
          <div className="text-2xl font-semibold">{exercisesCompleted}</div>
        </div>

        <Button
          onClick={onHome}
          className="w-full flex items-center justify-center gap-2"
          size="lg"
        >
          <Home className="h-5 w-5" />
          Return to Home
        </Button>
      </div>
    </div>
  )
}