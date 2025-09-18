import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

export default function Stats() {
  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all workout and feeling data? This cannot be undone.')) {
      localStorage.clear()
      window.location.reload()
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Stats</h1>

      <div className="mt-8">
        <Button
          onClick={handleClearData}
          variant="destructive"
          className="w-full flex items-center justify-center gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Clear All Data
        </Button>
      </div>
    </div>
  )
}