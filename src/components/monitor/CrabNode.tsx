import { Handle, Position } from '@xyflow/react'
import { motion } from 'framer-motion'

interface CrabNodeProps {
  data: { active: boolean }
}

// Crab silhouette SVG
function CrabSilhouette({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 60" className={className} fill="currentColor">
      <ellipse cx="50" cy="35" rx="25" ry="18" />
      <path d="M15 30 Q5 25 8 18 Q12 12 20 15 Q25 18 25 25 Q22 30 15 30Z" />
      <circle cx="8" cy="15" r="5" />
      <path d="M85 30 Q95 25 92 18 Q88 12 80 15 Q75 18 75 25 Q78 30 85 30Z" />
      <circle cx="92" cy="15" r="5" />
      <path d="M28 40 Q15 45 10 52" strokeWidth="3" stroke="currentColor" fill="none" />
      <path d="M26 45 Q12 52 8 58" strokeWidth="3" stroke="currentColor" fill="none" />
      <path d="M72 40 Q85 45 90 52" strokeWidth="3" stroke="currentColor" fill="none" />
      <path d="M74 45 Q88 52 92 58" strokeWidth="3" stroke="currentColor" fill="none" />
      <circle cx="42" cy="25" r="4" fill="#0a0a0f" />
      <circle cx="58" cy="25" r="4" fill="#0a0a0f" />
    </svg>
  )
}

export function CrabNode({ data }: CrabNodeProps) {
  return (
    <motion.div
      className="relative flex items-center justify-center"
      animate={data.active ? { scale: [1, 1.08, 1] } : {}}
      transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
    >
      {/* Glow effect behind crab */}
      <motion.div
        className="absolute w-24 h-24 rounded-full bg-crab-500/30 blur-xl"
        animate={data.active ? { scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] } : {}}
        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
      />

      {/* Outer ring */}
      <div
        className={`absolute w-28 h-28 rounded-full border-2 ${
          data.active ? 'border-crab-500/40' : 'border-shell-700'
        }`}
        style={{
          boxShadow: data.active ? '0 0 20px rgba(239, 68, 68, 0.3)' : 'none',
        }}
      />

      {/* Crab icon */}
      <CrabSilhouette className="w-20 h-20 text-crab-500 relative z-10 crab-icon-glow" />

      <Handle
        type="source"
        position={Position.Bottom}
        className="bg-crab-500! w-4! h-4! border-2! border-shell-900!"
        style={{
          boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)',
        }}
      />
    </motion.div>
  )
}
