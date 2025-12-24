import { motion } from "framer-motion";

interface ProgressRingProps {
  val: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

const ProgressRing: React.FC<ProgressRingProps> = ({
  val,
  size = 48,
  strokeWidth = 4,
  color = "#22c55e",
}) => {
  const progress = Math.min(100, Math.max(0, val));

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress / 100);

  return (
    <motion.div
      className="relative inline-flex cursor-pointer"
      initial="rest"
      whileHover="hover"
    >
      <svg width={size} height={size}>
        {/* background */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeOpacity={0.7}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* animated ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          variants={{
            rest: { strokeDashoffset: circumference },
            hover: { strokeDashoffset: offset },
          }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </svg>

      <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold select-none">
        {progress}%
      </span>
    </motion.div>
  );
};

export default ProgressRing;
