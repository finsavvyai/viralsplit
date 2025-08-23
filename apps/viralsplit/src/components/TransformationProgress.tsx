import { motion } from 'framer-motion';
import { ProjectStatus } from '@/lib/api';

interface TransformationProgressProps {
  status: ProjectStatus;
  className?: string;
}

export const TransformationProgress: React.FC<TransformationProgressProps> = ({
  status,
  className = '',
}) => {
  const { project, transformations } = status;
  const progress = project.progress || 0;

  const getStatusIcon = () => {
    switch (project.status) {
      case 'processing':
        return '⚡';
      case 'completed':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '📹';
    }
  };

  const getStatusMessage = () => {
    switch (project.status) {
      case 'processing':
        return 'Creating optimized videos for each platform...';
      case 'completed':
        return `Successfully created ${Object.keys(transformations).length} optimized videos!`;
      case 'error':
        return project.error || 'An error occurred during processing';
      default:
        return 'Processing...';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${className}`}
    >
      <div className="text-center mb-8">
        <motion.div 
          className="text-6xl mb-4"
          animate={project.status === 'processing' ? { 
            rotate: [0, 360],
            scale: [1, 1.1, 1]
          } : {}}
          transition={{ 
            rotate: { duration: 2, repeat: Infinity, ease: "linear" },
            scale: { duration: 1, repeat: Infinity }
          }}
        >
          {getStatusIcon()}
        </motion.div>
        
        <h2 className="text-3xl font-bold mb-4">
          {project.status === 'completed' ? 'Transformation Complete!' : 'Creating Magic...'}
        </h2>
        
        <p className="text-gray-400 mb-6">
          {getStatusMessage()}
        </p>

        {project.status === 'processing' && (
          <>
            {/* Progress Bar */}
            <div className="w-full bg-gray-700 rounded-full h-3 mb-4 max-w-md mx-auto">
              <motion.div
                className="bg-gradient-to-r from-purple-600 to-pink-600 h-3 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
            
            <p className="text-sm text-gray-300 mb-6">
              {progress}% Complete
            </p>
          </>
        )}

        {/* Platform Status */}
        {project.platforms && project.platforms.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
            {project.platforms.map((platform) => {
              const platformData = transformations[platform];
              const isCompleted = platformData?.status === 'completed';
              const isProcessing = project.status === 'processing' && !isCompleted;

              return (
                <motion.div
                  key={platform}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    isCompleted 
                      ? 'border-green-500 bg-green-500/10' 
                      : isProcessing
                      ? 'border-purple-500 bg-purple-500/10 animate-pulse'
                      : 'border-gray-700 bg-gray-800'
                  }`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: (project.platforms?.indexOf(platform) || 0) * 0.1 }}
                >
                  <div className="text-2xl mb-2">
                    {platform === 'tiktok' && '🎵'}
                    {platform === 'instagram_reels' && '📱'}
                    {platform === 'youtube_shorts' && '📺'}
                  </div>
                  <div className="font-semibold text-sm">
                    {platform.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {isCompleted ? '✅ Ready' : isProcessing ? '⚡ Processing...' : '⏳ Pending'}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Download Links */}
        {project.status === 'completed' && Object.keys(transformations).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 space-y-3"
          >
            <h3 className="text-xl font-semibold mb-4">Download Your Videos</h3>
            {Object.entries(transformations).map(([platform, data]) => (
              <motion.a
                key={platform}
                href={data.url}
                download
                className="block p-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Download {platform.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Version
              </motion.a>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};