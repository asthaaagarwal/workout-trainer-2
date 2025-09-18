const STORAGE_KEY = 'workout-trainer-feelings'

type FeelingLevel = 'Good' | 'Sore' | 'Very sore'

interface DailyFeeling {
  date: string // ISO date string (YYYY-MM-DD)
  feeling: FeelingLevel
  feedback: string
  timestamp: number // Unix timestamp for when it was recorded
}

type StorageData = {
  entries: DailyFeeling[]
}

// Get today's date in YYYY-MM-DD format
export const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0]
}

// Load feeling data from localStorage
export const loadFeelingData = (): StorageData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Error loading feeling data:', error)
  }
  return { entries: [] }
}

// Save feeling data to localStorage
export const saveFeelingData = (data: StorageData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('Error saving feeling data:', error)
  }
}

// Add or update today's feeling
export const saveTodayFeeling = (feeling: FeelingLevel, feedback: string = ''): void => {
  const data = loadFeelingData()
  const today = getTodayDate()

  // Remove existing entry for today if it exists
  data.entries = data.entries.filter(entry => entry.date !== today)

  // Add new entry for today
  const newEntry: DailyFeeling = {
    date: today,
    feeling,
    feedback,
    timestamp: Date.now()
  }

  data.entries.push(newEntry)
  saveFeelingData(data)
}

// Get today's feeling if it exists
export const getTodayFeeling = (): DailyFeeling | null => {
  const data = loadFeelingData()
  const today = getTodayDate()
  return data.entries.find(entry => entry.date === today) || null
}

// Get feeling for a specific date
export const getFeelingByDate = (date: string): DailyFeeling | null => {
  const data = loadFeelingData()
  return data.entries.find(entry => entry.date === date) || null
}

// Get all feelings
export const getAllFeelings = (): DailyFeeling[] => {
  const data = loadFeelingData()
  return data.entries.sort((a, b) => b.timestamp - a.timestamp) // Most recent first
}