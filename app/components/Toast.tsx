import { useEffect } from "react";

interface ToastProps {
  message: string;
  isVisible: boolean;
  onHide: () => void;
}

export default function Toast({ message, isVisible, onHide }: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onHide();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onHide]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-slate-700 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in-up">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
      {message}
    </div>
  );
}
