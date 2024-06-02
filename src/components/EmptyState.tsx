import {
  OpenDirectoryButton,
  OpenDirectoryButtonProps,
} from "./OpenDirectoryButton";

export const EmptyState = ({ onSelect }: OpenDirectoryButtonProps) => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-4 text-center">
      <img
        src="/moments.svg"
        alt="Empty state illustration"
        className="mb-4 w-32 h-32"
      />
      <h2 className="mb-2 text-xl font-semibold">No Directories Selected</h2>
      <p className="mb-4 text-gray-600">
        Please select a directory to get started.
      </p>
      <OpenDirectoryButton onSelect={onSelect} />
    </div>
  );
};
