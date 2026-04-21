import { 
  Bot, 
  Cpu, 
  Zap, 
  Sparkles, 
  Ghost, 
  Smile, 
  Terminal, 
  Code, 
  Database 
} from "lucide-react";

interface AgentAvatarProps {
  id: number;
  name?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const AgentAvatar = ({ id, name, className = "", size = "md" }: AgentAvatarProps) => {
  const icons = [Bot, Cpu, Zap, Sparkles, Ghost, Smile, Terminal, Code, Database];
  const gradients = [
    "from-blue-500 to-indigo-600 shadow-blue-500/20",
    "from-purple-500 to-pink-600 shadow-purple-500/20",
    "from-emerald-500 to-teal-600 shadow-emerald-500/20",
    "from-orange-500 to-amber-600 shadow-orange-500/20",
    "from-rose-500 to-red-600 shadow-rose-500/20",
    "from-sky-500 to-cyan-600 shadow-sky-500/20",
  ];

  // Deterministic selection based on ID
  const iconIdx = id % icons.length;
  const gradeIdx = id % gradients.length;
  
  const Icon = icons[iconIdx];
  const gradient = gradients[gradeIdx];

  const sizeClasses = {
    sm: "h-8 w-8 rounded-lg",
    md: "h-10 w-10 rounded-xl",
    lg: "h-12 w-12 rounded-2xl",
  };

  const iconClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  return (
    <div className={`inline-flex items-center justify-center bg-gradient-to-br ${gradient} text-white shadow-lg shrink-0 ${sizeClasses[size]} ${className}`}>
      <Icon className={iconClasses[size]} />
    </div>
  );
};
