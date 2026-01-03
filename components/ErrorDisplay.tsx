'use client';

interface ErrorDisplayProps {
  title: string;
  message: string;
  buttonText: string;
  onButtonClick: () => void;
}

export default function ErrorDisplay({
  title,
  message,
  buttonText,
  onButtonClick,
}: ErrorDisplayProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="mb-4 text-gray-600">{message}</p>
      <button
        className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        onClick={onButtonClick}
      >
        {buttonText}
      </button>
    </div>
  );
}
