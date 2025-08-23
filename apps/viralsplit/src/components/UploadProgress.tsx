import { motion } from 'framer-motion';
import { UploadProgress as UploadProgressType } from '@/hooks/useVideoUpload';

interface UploadProgressProps {
  progress: UploadProgressType;
  className?: string;
}

export const UploadProgress: React.FC<UploadProgressProps> = ({
  progress,
  className = '',
}) => {
  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'preparing':
        return '⚙️';
      case 'uploading':
        return '📤';
      case 'completing':
        return '✅';
      case 'complete':
        return '🎉';
      default:
        return '📹';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gray-800 rounded-lg p-6 ${className}`}
    >
      <div className="text-center mb-4">
        <motion.div 
          className="text-4xl mb-2"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          {getStageIcon(progress.stage)}
        </motion.div>
        <h3 className="text-lg font-semibold mb-1">
          {progress.stage === 'complete' ? 'Upload Complete!' : 'Uploading...'}
        </h3>
        <p className="text-sm text-gray-400">{progress.message}</p>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
        <motion.div
          className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress.progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* Progress Percentage */}
      <div className="text-center">
        <span className="text-sm text-gray-300">{progress.progress}% Complete</span>
      </div>

      {/* Stage Indicators */}
      <div className="flex justify-between mt-4 text-xs">
        {['preparing', 'uploading', 'completing', 'complete'].map((stage) => (
          <div
            key={stage}
            className={`flex items-center ${
              progress.stage === stage || 
              (['uploading', 'completing', 'complete'].includes(progress.stage) && stage === 'preparing') ||
              (['completing', 'complete'].includes(progress.stage) && stage === 'uploading') ||
              (progress.stage === 'complete' && stage === 'completing')
                ? 'text-purple-400' 
                : 'text-gray-500'
            }`}
          >
            <div className={`w-2 h-2 rounded-full mr-1 ${
              progress.stage === stage || 
              (['uploading', 'completing', 'complete'].includes(progress.stage) && stage === 'preparing') ||
              (['completing', 'complete'].includes(progress.stage) && stage === 'uploading') ||
              (progress.stage === 'complete' && stage === 'completing')
                ? 'bg-purple-400' 
                : 'bg-gray-500'
            }`} />
            <span className="capitalize">{stage}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};