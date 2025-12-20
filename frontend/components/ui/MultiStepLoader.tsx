import { motion, AnimatePresence } from "motion/react";

const CheckIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
};

const CheckFilled = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
        clipRule="evenodd"
      />
    </svg>
  );
};

type LoadingState = {
  text: string;
  description?: string;
};

const LoaderCore = ({
  loadingStates,
  value = 0,
  isDarkMode = false,
}: {
  loadingStates: LoadingState[];
  value?: number;
  isDarkMode?: boolean;
}) => {
  return (
    <div className="flex relative justify-start max-w-xl mx-auto flex-col mt-40">
      {loadingStates.map((loadingState, index) => {
        const distance = Math.abs(index - value);
        const opacity = Math.max(1 - distance * 0.2, 0);

        return (
          <motion.div
            key={index}
            className="text-left flex gap-2 mb-4"
            initial={{ opacity: 0, y: -(value * 40) }}
            animate={{ opacity: opacity, y: -(value * 40) }}
            transition={{ duration: 0.5 }}
          >
            <div>
              {index > value && (
                <CheckIcon 
                  className={isDarkMode ? "text-gray-600 w-6 h-6" : "text-gray-300 w-6 h-6"} 
                />
              )}
              {index <= value && (
                <CheckFilled
                  className={`w-6 h-6 ${
                    value === index 
                      ? "text-[hsl(var(--saffron))] opacity-100" 
                      : isDarkMode ? "text-gray-600" : "text-gray-300"
                  }`}
                />
              )}
            </div>
            <span
              className={`${
                value === index 
                  ? isDarkMode ? "text-white opacity-100" : "text-gray-900 opacity-100"
                  : isDarkMode ? "text-gray-600" : "text-gray-400"
              }`}
            >
              {loadingState.text}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
};

export const MultiStepLoader = ({
  loadingStates,
  loading,
  value,
  isDarkMode = false,
}: {
  loadingStates: LoadingState[];
  loading?: boolean;
  value?: number;
  isDarkMode?: boolean;
}) => {
  return (
    <AnimatePresence mode="wait">
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="w-full h-full fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-2xl"
        >
          <div className="h-96 relative">
            <LoaderCore value={value} loadingStates={loadingStates} isDarkMode={isDarkMode} />
          </div>

          <div 
            className={`inset-x-0 z-20 bottom-0 h-full absolute ${
              isDarkMode 
                ? "bg-gradient-to-t from-gray-900 [mask-image:radial-gradient(900px_at_center,transparent_30%,black)]" 
                : "bg-gradient-to-t from-white [mask-image:radial-gradient(900px_at_center,transparent_30%,white)]"
            }`} 
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};