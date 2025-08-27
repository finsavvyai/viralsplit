/**
 * Unique Color Theme for ViralSplit
 * Vibrant, modern, and trendy color palette inspired by social media aesthetics
 */

export const theme = {
  colors: {
    // Primary gradient - Electric Purple to Cyber Pink
    primary: {
      gradient: 'bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500',
      from: '#7c3aed', // violet-600
      via: '#d946ef',  // fuchsia-500
      to: '#ec4899',   // pink-500
      hover: 'hover:from-violet-700 hover:via-fuchsia-600 hover:to-pink-600',
    },
    // Secondary gradient - Neon Blue to Electric Teal
    secondary: {
      gradient: 'bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600',
      from: '#06b6d4', // cyan-500
      via: '#3b82f6',  // blue-500
      to: '#4f46e5',   // indigo-600
      hover: 'hover:from-cyan-600 hover:via-blue-600 hover:to-indigo-700',
    },
    // Accent gradient - Sunset Orange to Hot Pink
    accent: {
      gradient: 'bg-gradient-to-r from-orange-500 via-rose-500 to-pink-600',
      from: '#f97316', // orange-500
      via: '#f43f5e',  // rose-500
      to: '#db2777',   // pink-600
      hover: 'hover:from-orange-600 hover:via-rose-600 hover:to-pink-700',
    },
    // Dark background with purple tint
    background: {
      primary: '#0a0014',    // Deep purple-black
      secondary: '#1a0f2e',  // Dark purple
      tertiary: '#2d1b4e',   // Medium purple
      card: 'rgba(45, 27, 78, 0.5)', // Semi-transparent purple
    },
    // Glass morphism effects
    glass: {
      light: 'bg-white/5 backdrop-blur-xl border border-white/10',
      medium: 'bg-white/10 backdrop-blur-xl border border-white/20',
      heavy: 'bg-white/20 backdrop-blur-xl border border-white/30',
      colored: 'bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl border border-white/20',
    },
    // Text colors
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.8)',
      tertiary: 'rgba(255, 255, 255, 0.6)',
      muted: 'rgba(255, 255, 255, 0.4)',
    },
    // Status colors with vibrancy
    status: {
      success: {
        bg: 'bg-gradient-to-r from-green-400 to-emerald-500',
        text: 'text-green-400',
        light: 'bg-green-400/10',
      },
      error: {
        bg: 'bg-gradient-to-r from-red-500 to-rose-600',
        text: 'text-red-400',
        light: 'bg-red-400/10',
      },
      warning: {
        bg: 'bg-gradient-to-r from-yellow-400 to-amber-500',
        text: 'text-yellow-400',
        light: 'bg-yellow-400/10',
      },
      info: {
        bg: 'bg-gradient-to-r from-blue-400 to-cyan-500',
        text: 'text-blue-400',
        light: 'bg-blue-400/10',
      },
    },
    // Platform-specific colors
    platforms: {
      tiktok: 'from-black via-pink-600 to-cyan-500',
      instagram: 'from-purple-600 via-pink-500 to-orange-500',
      youtube: 'from-red-600 via-red-500 to-orange-500',
      twitter: 'from-blue-400 via-blue-500 to-blue-600',
      linkedin: 'from-blue-700 via-blue-600 to-blue-800',
      snapchat: 'from-yellow-300 via-yellow-400 to-yellow-500',
    }
  },
  effects: {
    glow: {
      purple: 'shadow-[0_0_50px_rgba(139,92,246,0.3)]',
      pink: 'shadow-[0_0_50px_rgba(236,72,153,0.3)]',
      blue: 'shadow-[0_0_50px_rgba(59,130,246,0.3)]',
      combined: 'shadow-[0_0_80px_rgba(139,92,246,0.2),0_0_40px_rgba(236,72,153,0.2)]',
    },
    animation: {
      float: 'animate-[float_6s_ease-in-out_infinite]',
      pulse: 'animate-pulse',
      spin: 'animate-spin',
      bounce: 'animate-bounce',
      gradient: 'animate-gradient-x',
    }
  }
};

// CSS animations to add to global styles
export const animations = `
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }
  
  @keyframes gradient-x {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }
  
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  
  @keyframes glow-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;